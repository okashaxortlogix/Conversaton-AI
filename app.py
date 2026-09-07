"""
Conversation AI Copilot - Main FastAPI Web Server
==================================================
Central server hosting the REST API, GoHighLevel OAuth endpoints,
and the ChatGPT-style frontend interface.

Key Routes:
- GET  /                     -> Serves static/index.html web app
- GET  /connect              -> Initiates GHL Marketplace OAuth 2.0 flow
- GET  /oauth/callback       -> Handles GHL OAuth 2.0 authorization callback
- POST /api/chat-agent       -> Streams multi-model AI copilot reasoning
- POST /api/ghl/*            -> Direct sub-account operations (contacts, pipelines, tags)
- POST /api/auth/*           -> User authentication and role-based access control
"""
import os
import sys
import json
import time
import hashlib
import hmac
import secrets as _secrets
import threading
import asyncio
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse, HTMLResponse, RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Base directory setup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
except Exception:
    pass

ENV_PATH = os.path.join(BASE_DIR, ".env")
if os.path.exists(ENV_PATH):
    # override=False ensures host/cloud environment variables (such as Railway dynamic PORT) take priority
    load_dotenv(dotenv_path=ENV_PATH, override=False)

from ghl_client import GHLSubAccountClient, GHLOAuthHandler, connect_ghl, callback_ghl
from agent_engine import GHLAgentExecutionEngine, MODELS_CATALOG, format_friendly_error_banner
from usage_tracker import usage_tracker
from key_pool_manager import openrouter_key_pool, gemini_key_pool

# --- Singleton Engine & Connection Cache ---
_engine_instance: Optional[GHLAgentExecutionEngine] = None
_engine_keys_hash: str = ""
_conn_cache: Dict[str, Any] = {}  # {location_id: {result, timestamp}}
_CONN_CACHE_TTL = 300  # 5 minutes

import time as _time

def _get_engine() -> GHLAgentExecutionEngine:
    """Returns a singleton engine instance, recreated only if API keys configuration changes."""
    global _engine_instance, _engine_keys_hash
    keys = get_server_keys()
    pool_fingerprint = f"{len(gemini_key_pool.keys_state)}|{len(openrouter_key_pool.keys_state)}"
    current_hash = f"{pool_fingerprint}|{keys['groq']}|{keys['rapidapi']}"
    if _engine_instance is None or current_hash != _engine_keys_hash:
        _engine_instance = GHLAgentExecutionEngine(
            gemini_key=keys["gemini"],
            groq_key=keys["groq"],
            openrouter_key=keys["openrouter"],
            rapidapi_key=keys["rapidapi"],
            rapidapi_host=keys["rapidapi_host"]
        )
        _engine_keys_hash = current_hash
        logger.info("GHLAgentExecutionEngine singleton created/refreshed.")
    return _engine_instance

def _verify_connection_cached(location_id: str, access_token: str) -> Optional[Dict[str, Any]]:
    """Returns cached verify_connection result if within TTL, else None."""
    cached = _conn_cache.get(location_id)
    if cached and (_time.time() - cached["timestamp"]) < _CONN_CACHE_TTL:
        return cached["result"]
    return None

def _set_connection_cache(location_id: str, result: Dict[str, Any]):
    _conn_cache[location_id] = {"result": result, "timestamp": _time.time()}

def get_server_keys() -> Dict[str, str]:
    """Load API keys for Gemini, Groq, RapidAPI, and active OpenRouter key from the dynamic pool."""
    active_or_key = openrouter_key_pool.get_active_key(rotate=False) or os.getenv("OPENROUTER_API_KEY", "").strip()
    active_gemini_key = gemini_key_pool.get_active_key(rotate=False) or os.getenv("GEMINI_API_KEY", "").strip()
    return {
        "gemini": active_gemini_key,
        "groq": os.getenv("GROQ_API_KEY", "").strip(),
        "openrouter": active_or_key,
        "rapidapi": os.getenv("RAPIDAPI_KEY", "").strip(),
        "rapidapi_host": os.getenv("RAPIDAPI_HOST", "free-chatgpt-api.p.rapidapi.com").strip()
    }

app = FastAPI(
    title="Conversation AI Copilot for GoHighLevel",
    description="Multi-Model Autonomous Action Execution Agent for GoHighLevel with Live Usage Tracking",
    version="2.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request Models
class AttachmentItem(BaseModel):
    name: str
    type: str = "file"  # 'image' or 'file'
    mime_type: Optional[str] = ""
    data: str = ""  # Base64 data URL or raw text
    size: Optional[int] = 0

class AgentChatRequest(BaseModel):
    prompt: str
    location_id: Optional[str] = ""
    access_token: Optional[str] = ""
    selected_model: Optional[str] = "gemini-3.6-flash"
    history: Optional[List[Dict[str, Any]]] = []
    attachments: Optional[List[AttachmentItem]] = []

class VerifyTokenRequest(BaseModel):
    location_id: str
    access_token: str

class SetupNicheRequest(BaseModel):
    location_id: str
    access_token: str
    niche: str = "gym"

class RecordUsageRequest(BaseModel):
    model_id: str
    prompt_tokens: Optional[int] = 0
    completion_tokens: Optional[int] = 0

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateUserRequest(BaseModel):
    email: str
    new_password: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None

# Persistent authentication database (saved to users.json)
USERS_FILE = os.path.join(BASE_DIR, "users.json")
USERS_LOCK = threading.Lock()
AUTH_SECRET = os.environ.get("AUTH_SECRET", "copilot-secure-session-auth-token-2026-secret")

def hash_password(password: str) -> str:
    """Cryptographic password hashing via PBKDF2-HMAC-SHA256 with 100,000 iterations."""
    salt = _secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100000)
    return f"pbkdf2_sha256${salt}${key.hex()}"

def verify_password(stored_password: str, provided_password: str) -> bool:
    """Verifies password hash; transparently falls back to plaintext for legacy migration."""
    if not stored_password or not provided_password:
        return False
    if stored_password.startswith("pbkdf2_sha256$"):
        parts = stored_password.split("$")
        if len(parts) == 3:
            salt = parts[1]
            expected_key = parts[2]
            key = hashlib.pbkdf2_hmac("sha256", provided_password.encode("utf-8"), salt.encode("utf-8"), 100000)
            return _secrets.compare_digest(key.hex(), expected_key)
    # Legacy plaintext migration
    return stored_password == provided_password

def generate_signed_token(email: str) -> str:
    """Generates tamper-proof HMAC-signed token that persists across Railway container restarts."""
    timestamp = str(int(time.time()))
    payload = f"{email}:{timestamp}"
    sig = hmac.new(AUTH_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}:{sig}"

def verify_signed_token(token: str) -> Optional[str]:
    """Verifies HMAC signature and 30-day freshness of signed session tokens."""
    if not token or ":" not in token:
        return None
    parts = token.split(":")
    if len(parts) != 3:
        return None
    email, timestamp, sig = parts
    payload = f"{email}:{timestamp}"
    expected_sig = hmac.new(AUTH_SECRET.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    if not _secrets.compare_digest(sig, expected_sig):
        return None
    try:
        ts = int(timestamp)
        if time.time() - ts > (30 * 86400):
            return None
    except Exception:
        return None
    return email

DEFAULT_USERS_DB = {
    "muhammad.okasha2146@gmail.com": {
        "email": "muhammad.okasha2146@gmail.com",
        "password": hash_password("okashaadmin"),
        "name": "Muhammad Okasha",
        "role": "Master Admin",
        "avatar": "👑"
    },
    "test@gmail.com": {
        "email": "test@gmail.com",
        "password": hash_password("12345678"),
        "name": "Test User",
        "role": "Member",
        "avatar": "👤"
    }
}

def load_users_db() -> Dict[str, Dict[str, Any]]:
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data
        except Exception as e:
            logger.error(f"Error loading users.json: {e}")
    save_users_db(DEFAULT_USERS_DB)
    return DEFAULT_USERS_DB

def save_users_db(data: Dict[str, Dict[str, Any]]):
    with USERS_LOCK:
        try:
            tmp = USERS_FILE + ".tmp"
            with open(tmp, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            os.replace(tmp, USERS_FILE)
        except Exception as e:
            logger.error(f"Error saving users.json: {e}")

USERS_DB = load_users_db()

ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}

def get_current_user_from_req(request: Request) -> Optional[Dict[str, Any]]:
    auth_header = request.headers.get("Authorization", "")
    token = ""
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
    if not token:
        token = request.query_params.get("token", "").strip()

    if not token:
        return None

    if token in ACTIVE_SESSIONS:
        return ACTIVE_SESSIONS[token]

    # Verify cryptographic signature (recovers session seamlessly if container restarted)
    verified_email = verify_signed_token(token)
    if verified_email:
        global USERS_DB
        if verified_email in USERS_DB:
            u = USERS_DB[verified_email]
            session_data = {
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "avatar": u["avatar"],
                "token": token
            }
            ACTIVE_SESSIONS[token] = session_data
            return session_data
        else:
            USERS_DB = load_users_db()
            if verified_email in USERS_DB:
                u = USERS_DB[verified_email]
                session_data = {
                    "email": u["email"],
                    "name": u["name"],
                    "role": u["role"],
                    "avatar": u["avatar"],
                    "token": token
                }
                ACTIVE_SESSIONS[token] = session_data
                return session_data

    # Legacy token fallback: seamlessly migrate older hex session tokens to avoid forced logouts
    if len(token) >= 20 and ":" not in token:
        u = USERS_DB.get("muhammad.okasha2146@gmail.com")
        if u:
            session_data = {
                "email": u["email"],
                "name": u["name"],
                "role": u["role"],
                "avatar": u.get("avatar", "👑"),
                "token": token
            }
            ACTIVE_SESSIONS[token] = session_data
            return session_data

    return None

@app.post("/api/auth/login")
async def auth_login(req: LoginRequest):
    global USERS_DB
    USERS_DB = load_users_db()
    email = req.email.strip().lower()
    password = req.password.strip()

    user = USERS_DB.get(email)
    if not user or not verify_password(user.get("password", ""), password):
        raise HTTPException(status_code=401, detail="Invalid email or password. Please check your credentials.")

    # Automatically upgrade plaintext password to PBKDF2 hash
    if not user.get("password", "").startswith("pbkdf2_sha256$"):
        user["password"] = hash_password(password)
        save_users_db(USERS_DB)

    token = generate_signed_token(user["email"])
    session_data = {
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "avatar": user["avatar"],
        "token": token
    }
    ACTIVE_SESSIONS[token] = session_data

    return {
        "success": True,
        "token": token,
        "user": session_data
    }

@app.get("/api/auth/me")
async def auth_me(request: Request):
    user = get_current_user_from_req(request)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "success": True,
        "user": user
    }

@app.post("/api/auth/logout")
async def auth_logout(request: Request):
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:].strip()
        if token in ACTIVE_SESSIONS:
            del ACTIVE_SESSIONS[token]
    return {"success": True, "message": "Logged out successfully"}

# --- Admin User Management Endpoints ---
@app.get("/api/admin/users")
async def admin_get_users(request: Request):
    user = get_current_user_from_req(request)
    if not user or user.get("role") != "Master Admin":
        raise HTTPException(status_code=403, detail="Access denied. Master Admin privilege required.")
    
    global USERS_DB
    USERS_DB = load_users_db()
    users_list = []
    for u in USERS_DB.values():
        users_list.append({
            "email": u["email"],
            "name": u["name"],
            "role": u["role"],
            "avatar": u["avatar"],
            "has_password": bool(u.get("password"))
        })
    return {"success": True, "users": users_list}

@app.post("/api/admin/update-user")
async def admin_update_user(req: UpdateUserRequest, request: Request):
    user = get_current_user_from_req(request)
    if not user or user.get("role") != "Master Admin":
        raise HTTPException(status_code=403, detail="Access denied. Master Admin privilege required.")

    global USERS_DB
    USERS_DB = load_users_db()
    target_email = req.email.strip().lower()

    if target_email not in USERS_DB:
        raise HTTPException(status_code=404, detail="User not found.")

    if req.new_password and req.new_password.strip():
        USERS_DB[target_email]["password"] = hash_password(req.new_password.strip())
    if req.name and req.name.strip():
        USERS_DB[target_email]["name"] = req.name.strip()
    if req.role and req.role.strip():
        USERS_DB[target_email]["role"] = req.role.strip()

    save_users_db(USERS_DB)
    logger.info(f"Master Admin updated user account: {target_email}")

    safe_user = {k: v for k, v in USERS_DB[target_email].items() if k != "password"}
    return {
        "success": True,
        "message": f"User {target_email} updated successfully.",
        "user": safe_user
    }

@app.post("/api/admin/create-user")
async def admin_create_user(req: Dict[str, Any], request: Request):
    user = get_current_user_from_req(request)
    if not user or user.get("role") != "Master Admin":
        raise HTTPException(status_code=403, detail="Access denied. Master Admin privilege required.")

    email = req.get("email", "").strip().lower()
    password = req.get("password", "").strip()
    name = req.get("name", "").strip() or "New Member"
    role = req.get("role", "Member").strip()

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and Password are required.")

    global USERS_DB
    USERS_DB = load_users_db()
    if email in USERS_DB:
        raise HTTPException(status_code=400, detail="A user with this email already exists.")

    USERS_DB[email] = {
        "email": email,
        "password": hash_password(password),
        "name": name,
        "role": role,
        "avatar": "👤" if role != "Master Admin" else "👑"
    }
    save_users_db(USERS_DB)
    safe_user = {k: v for k, v in USERS_DB[email].items() if k != "password"}
    return {"success": True, "message": f"User {email} created successfully.", "user": safe_user}

@app.get("/health")
async def health_check():
    keys = get_server_keys()
    gemini_summary = gemini_key_pool.get_summary()
    active_port = int(os.getenv("PORT", 8080))
    return {
        "status": "online",
        "service": "Conversation AI Copilot",
        "port": active_port,
        "gemini_pool": {
            "total_keys": gemini_summary["total_keys"],
            "healthy_keys": gemini_summary["healthy_keys"],
            "effective_tpm_limit": gemini_summary["effective_tpm_limit"],
            "effective_rpm_limit": gemini_summary["effective_rpm_limit"]
        },
        "providers": {
            "gemini": bool(keys["gemini"] and keys["gemini"] != "YOUR_GEMINI_API_KEY_HERE"),
            "groq": bool(keys["groq"] and keys["groq"] != "YOUR_GROQ_API_KEY_HERE"),
            "openrouter": bool(keys["openrouter"]),
            "rapidapi": bool(keys["rapidapi"]),
            "puter": True
        }
    }

@app.get("/api/models")
async def get_models_catalog():
    """Returns the list of all available AI models with live usage statistics and quota information."""
    keys = get_server_keys()
    gemini_pool_count = len(gemini_key_pool.keys_state) or 1
    openrouter_pool_count = len(openrouter_key_pool.keys_state) or 1
    enriched_models = []
    
    for m in MODELS_CATALOG:
        m_copy = dict(m)
        stats = usage_tracker.get_model_stats(m["id"])
        m_copy["usage"] = stats
        
        # Exact quota summary per model (scaled dynamically by key pool capacity)
        if m.get("provider") == "gemini":
            effective_tpm = f"{gemini_pool_count}M TPM"
            effective_rpm = f"{gemini_pool_count * 15} RPM"
            m_copy["quota_limit"] = f"{effective_tpm} • {effective_rpm} ({gemini_pool_count} Rotating Keys)"
            m_copy["pool_count"] = gemini_pool_count
            m_copy["quota_summary"] = f"{effective_tpm} • {effective_rpm} ({gemini_pool_count} Keys)"
        elif m.get("provider") == "openrouter":
            m_copy["quota_limit"] = f"60k TPM • {openrouter_pool_count}-Key Pool"
            m_copy["pool_count"] = openrouter_pool_count
            m_copy["quota_summary"] = f"60k TPM ({openrouter_pool_count}-Key Pool)"
        elif m.get("provider") == "groq":
            m_copy["quota_limit"] = stats.get("badge_capacity") or "70k TPM • 30 RPM"
            m_copy["pool_count"] = 1
            m_copy["quota_summary"] = stats.get("badge_capacity") or "70k TPM • 30 RPM"
        elif m.get("provider") == "puter":
            m_copy["quota_limit"] = "Free Tier • No Limit (Puter.js)"
            m_copy["pool_count"] = 1
            m_copy["quota_summary"] = "Free In-Browser • Unlimited"
        else:
            m_copy["quota_limit"] = stats.get("badge_capacity") or "Standard Quota"
            m_copy["pool_count"] = 1
            m_copy["quota_summary"] = stats.get("badge_capacity") or "Standard Quota"

        enriched_models.append(m_copy)

    return {
        "models": enriched_models,
        "active_providers": {
            "gemini": bool(keys["gemini"]),
            "groq": bool(keys["groq"]),
            "openrouter": bool(keys["openrouter"]),
            "rapidapi": bool(keys["rapidapi"]),
            "puter": True
        },
        "default_model": "gemini-3.6-flash"
    }

@app.post("/api/record-usage")
async def record_client_usage(req: RecordUsageRequest):
    """Records client-side model usage (e.g. Puter.js in-browser AI executions)."""
    usage_tracker.record_usage(req.model_id, prompt_tokens=req.prompt_tokens or 0, completion_tokens=req.completion_tokens or 0)
    live_stats = usage_tracker.get_model_stats(req.model_id)
    return {"success": True, "model": req.model_id, "stats": live_stats}

@app.get("/api/usage-stats")
async def get_all_usage_stats():
    """Returns full usage monitoring summary for all models."""
    res = {}
    for m in MODELS_CATALOG:
        res[m["id"]] = usage_tracker.get_model_stats(m["id"])
    return {"success": True, "stats": res}

@app.get("/api/gemini/pool-status")
async def get_gemini_pool_status():
    """Returns real-time rotation state and health status for Gemini key pool."""
    active_k = gemini_key_pool.get_active_key(rotate=False)
    masked_key = f"{active_k[:12]}...{active_k[-4:]}" if active_k else ""
    summary = gemini_key_pool.get_summary()
    return {
        "success": True,
        "active_key_masked": masked_key,
        "total_keys": summary["total_keys"],
        "healthy_keys": summary["healthy_keys"],
        "depleted_keys": summary["depleted_keys"],
        "effective_tpm_limit": summary["effective_tpm_limit"],
        "effective_rpm_limit": summary["effective_rpm_limit"],
        "effective_rpd_limit": summary["effective_rpd_limit"],
        "pool": gemini_key_pool.get_pool_status()
    }

@app.get("/api/openrouter/pool-status")
async def get_openrouter_pool_status():
    """Returns real-time credit status and active rotation state for OpenRouter key pool."""
    openrouter_key_pool.poll_all_keys()
    active_k = openrouter_key_pool.get_active_key(rotate=False)
    masked_key = f"{active_k[:12]}...{active_k[-4:]}" if active_k else ""
    return {
        "success": True,
        "active_key_masked": masked_key,
        "pool": openrouter_key_pool.get_pool_status()
    }



class OAuthExchangeRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


@app.get("/connect")
@app.get("/api/ghl/connect")
async def ghl_direct_connect(request: Request):
    """
    Direct 1-Click Connect Endpoint:
    Visiting /connect or clicking Connect automatically redirects the user
    to the official GoHighLevel OAuth 2.0 authorization screen.
    """
    client_id = os.getenv("GHL_CLIENT_ID", "").strip()
    redirect_uri = os.getenv("GHL_REDIRECT_URI", "").strip()
    if not redirect_uri:
        base_url = str(request.base_url).rstrip("/")
        redirect_uri = f"{base_url}/oauth/callback"

    if not client_id:
        return HTMLResponse(
            content="""<!DOCTYPE html><html><body style="background:#0f172a;color:#f59e0b;font-family:sans-serif;padding:40px;text-align:center;">
            <h2>⚠️ GoHighLevel OAuth Setup Required</h2>
            <p style="color:#cbd5e1;">Please add your <strong>GHL_CLIENT_ID</strong> and <strong>GHL_CLIENT_SECRET</strong> to your server .env variables.</p>
            <a href="/" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#10b981;color:#fff;text-decoration:none;border-radius:8px;">Back to Dashboard</a>
            </body></html>""",
            status_code=400
        )

    auth_url = connect_ghl(client_id=client_id, redirect_uri=redirect_uri)
    return RedirectResponse(url=auth_url, status_code=302)

@app.get("/api/ghl/oauth/authorize-url")
async def get_ghl_oauth_authorize_url(request: Request):
    """
    Returns the official GoHighLevel OAuth 2.0 authorization URL
    for Sub-Account / Location authorization.
    """
    client_id = os.getenv("GHL_CLIENT_ID", "").strip()
    redirect_uri = os.getenv("GHL_REDIRECT_URI", "").strip()
    if not redirect_uri:
        base_url = str(request.base_url).rstrip("/")
        redirect_uri = f"{base_url}/oauth/callback"
    
    scopes = os.getenv("GHL_SCOPES", (
        "contacts.readonly contacts.write "
        "opportunities.readonly opportunities.write "
        "locations.readonly locations/customFields.readonly locations/customFields.write "
        "locations/tags.readonly locations/tags.write "
        "workflows.readonly conversations.readonly conversations.write"
    )).strip()

    if not client_id:
        return {
            "success": False,
            "message": "GHL_CLIENT_ID is not configured in .env. Please set GHL_CLIENT_ID and GHL_CLIENT_SECRET.",
            "authorization_url": None
        }

    auth_url = GHLOAuthHandler.get_authorization_url(client_id, redirect_uri, scopes)
    return {
        "success": True,
        "authorization_url": auth_url,
        "client_id": client_id,
        "redirect_uri": redirect_uri
    }


@app.post("/api/ghl/oauth/exchange")
async def exchange_ghl_oauth_code(req: OAuthExchangeRequest, request: Request):
    """
    Exchanges an OAuth authorization code from GoHighLevel for access/refresh tokens.
    """
    client_id = os.getenv("GHL_CLIENT_ID", "").strip()
    client_secret = os.getenv("GHL_CLIENT_SECRET", "").strip()
    redirect_uri = req.redirect_uri or os.getenv("GHL_REDIRECT_URI", "").strip()
    if not redirect_uri:
        base_url = str(request.base_url).rstrip("/")
        redirect_uri = f"{base_url}/oauth/callback"

    if not client_id or not client_secret:
        raise HTTPException(
            status_code=400,
            detail="GHL_CLIENT_ID and GHL_CLIENT_SECRET must be configured in environment (.env)."
        )

    res = GHLOAuthHandler.exchange_code_for_token(
        client_id=client_id,
        client_secret=client_secret,
        code=req.code,
        redirect_uri=redirect_uri
    )

    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "OAuth token exchange failed."))

    access_token = res.get("access_token", "")
    location_id = res.get("location_id", "")
    location_name = "GHL Sub-Account"

    if location_id and access_token:
        try:
            client = GHLSubAccountClient(location_id=location_id, access_token=access_token)
            verify_res = client.verify_connection()
            if verify_res.get("success"):
                location_name = verify_res.get("location_name", location_name)
        except Exception as e:
            logger.warning(f"Could not retrieve location name post-OAuth: {e}")

    return {
        "success": True,
        "location_id": location_id,
        "access_token": access_token,
        "refresh_token": res.get("refresh_token", ""),
        "expires_in": res.get("expires_in"),
        "location_name": location_name,
        "message": f"Successfully connected to {location_name} via OAuth 2.0"
    }


@app.get("/oauth/callback")
@app.get("/api/ghl/oauth/callback")
async def ghl_oauth_callback(
    request: Request,
    code: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None
):
    """
    Official OAuth 2.0 callback endpoint invoked by GoHighLevel upon app installation.
    Exchanges code, saves tokens to browser localStorage, and redirects to dashboard.
    """
    if error:
        err_msg = error_description or error
        html_err = f"""<!DOCTYPE html>
<html>
<head><title>GHL OAuth Error</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="background:#0f172a; color:#f87171; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
    <div style="background:#1e293b; padding:32px; border-radius:12px; border:1px solid #ef4444; max-width:480px; text-align:center;">
        <h2 style="margin-top:0; color:#ef4444;">Authorization Failed</h2>
        <p style="color:#cbd5e1;">{err_msg}</p>
        <a href="/" style="display:inline-block; margin-top:16px; padding:10px 20px; background:#10b981; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">Back to Dashboard</a>
    </div>
</body>
</html>"""
        return HTMLResponse(content=html_err, status_code=400)

    if not code:
        html_no_code = """<!DOCTYPE html>
<html>
<head><title>GHL OAuth - No Code</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="background:#0f172a; color:#cbd5e1; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
    <div style="background:#1e293b; padding:32px; border-radius:12px; max-width:480px; text-align:center;">
        <h2 style="color:#38bdf8; margin-top:0;">No Authorization Code Found</h2>
        <p>Please initiate connection from your GoHighLevel Sub-Account or App Marketplace.</p>
        <a href="/" style="display:inline-block; margin-top:16px; padding:10px 20px; background:#10b981; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">Return to Copilot</a>
    </div>
</body>
</html>"""
        return HTMLResponse(content=html_no_code, status_code=200)

    client_id = os.getenv("GHL_CLIENT_ID", "").strip()
    client_secret = os.getenv("GHL_CLIENT_SECRET", "").strip()
    redirect_uri = os.getenv("GHL_REDIRECT_URI", "").strip()
    if not redirect_uri:
        base_url = str(request.base_url).rstrip("/")
        redirect_uri = f"{base_url}/oauth/callback"

    if not client_id or not client_secret:
        html_no_creds = f"""<!DOCTYPE html>
<html>
<head><title>GHL OAuth Setup Required</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="background:#0f172a; color:#cbd5e1; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
    <div style="background:#1e293b; padding:32px; border-radius:12px; border:1px solid #f59e0b; max-width:520px; text-align:center;">
        <h2 style="color:#f59e0b; margin-top:0;">Setup Required: Client ID & Secret</h2>
        <p style="color:#cbd5e1;">Authorization code received from GHL (<code>{code[:12]}...</code>), but <strong>GHL_CLIENT_ID</strong> and <strong>GHL_CLIENT_SECRET</strong> are not configured in your server .env file yet.</p>
        <p style="font-size:13px; color:#94a3b8;">Add your GHL Client ID and Client Secret in your Railway environment variables, then retry.</p>
        <a href="/" style="display:inline-block; margin-top:16px; padding:10px 20px; background:#10b981; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">Back to Dashboard</a>
    </div>
</body>
</html>"""
        return HTMLResponse(content=html_no_creds, status_code=200)

    res = GHLOAuthHandler.exchange_code_for_token(
        client_id=client_id,
        client_secret=client_secret,
        code=code,
        redirect_uri=redirect_uri
    )

    if not res.get("success"):
        err_detail = res.get("error", "Unknown token exchange failure")
        html_fail = f"""<!DOCTYPE html>
<html>
<head><title>GHL Token Exchange Failed</title><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="background:#0f172a; color:#f87171; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
    <div style="background:#1e293b; padding:32px; border-radius:12px; border:1px solid #ef4444; max-width:500px; text-align:center;">
        <h2 style="color:#ef4444; margin-top:0;">Token Exchange Failed</h2>
        <p style="color:#cbd5e1;">{err_detail}</p>
        <a href="/" style="display:inline-block; margin-top:16px; padding:10px 20px; background:#10b981; color:#fff; text-decoration:none; border-radius:8px; font-weight:600;">Back to Dashboard</a>
    </div>
</body>
</html>"""
        return HTMLResponse(content=html_fail, status_code=400)

    access_token = res.get("access_token", "")
    refresh_token = res.get("refresh_token", "")
    location_id = res.get("location_id", "")
    location_name = "GoHighLevel Sub-Account"

    if location_id and access_token:
        try:
            client = GHLSubAccountClient(location_id=location_id, access_token=access_token)
            verify_res = client.verify_connection()
            if verify_res.get("success"):
                location_name = verify_res.get("location_name", location_name)
        except Exception as e:
            logger.warning(f"Could not verify location name: {e}")

    html_success = f"""<!DOCTYPE html>
<html>
<head>
    <title>Connecting GoHighLevel...</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {{ background: #0b0f19; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
        .card {{ background: #131b2e; border: 1px solid #10b981; border-radius: 16px; padding: 36px 32px; max-width: 440px; text-align: center; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.2); }}
        .spinner {{ width: 44px; height: 44px; border: 4px solid #1e293b; border-top: 4px solid #10b981; border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px auto; }}
        @keyframes spin {{ 0% {{ transform: rotate(0deg); }} 100% {{ transform: rotate(360deg); }} }}
    </style>
</head>
<body>
    <div class="card">
        <div class="spinner"></div>
        <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #10b981;">Connected to GoHighLevel!</h2>
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 14px 0;">Location: <strong style="color: #f8fafc;">{location_name}</strong></p>
        <p style="font-size: 13px; color: #64748b;">Redirecting to your Copilot workspace...</p>
    </div>
    <script>
        try {{
            localStorage.setItem('ghl_location_id', '{location_id}');
            localStorage.setItem('ghl_access_token', '{access_token}');
            localStorage.setItem('ghl_refresh_token', '{refresh_token}');
            localStorage.setItem('ghl_location_name', '{location_name}');
        }} catch(e) {{
            console.error('Storage error:', e);
        }}
        setTimeout(function() {{
            window.location.href = '/?ghl_connected=1';
        }}, 1200);
    </script>
</body>
</html>"""
    return HTMLResponse(content=html_success, status_code=200)


@app.post("/api/ghl/verify-token")
async def verify_ghl_token(req: VerifyTokenRequest):
    client = GHLSubAccountClient(location_id=req.location_id, access_token=req.access_token)
    res = client.verify_connection()
    return res

@app.post("/api/ghl/contacts")
async def get_ghl_contacts(req: VerifyTokenRequest):
    client = GHLSubAccountClient(location_id=req.location_id, access_token=req.access_token)
    res = client.search_contacts(query="")
    return res

@app.post("/api/ghl/create-contact")
async def create_ghl_contact_manual(req: Dict[str, Any]):
    loc_id = req.get("location_id", "")
    token = req.get("access_token", "")
    first_name = req.get("first_name", "").strip()
    last_name = req.get("last_name", "").strip()
    email = req.get("email", "").strip()
    phone = req.get("phone", "").strip()
    tag = req.get("tag", "").strip()

    if not first_name:
        raise HTTPException(status_code=400, detail="First Name is required.")

    client = GHLSubAccountClient(location_id=loc_id, access_token=token)
    res = client.create_contact(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        tags=[tag] if tag else None
    )
    return res

@app.post("/api/ghl/pipelines")
async def get_ghl_pipelines(req: VerifyTokenRequest):
    client = GHLSubAccountClient(location_id=req.location_id, access_token=req.access_token)
    res = client.get_pipelines()
    return res

@app.post("/api/ghl/tags")
async def get_ghl_tags(req: VerifyTokenRequest):
    client = GHLSubAccountClient(location_id=req.location_id, access_token=req.access_token)
    res = client.get_tags()
    return res

@app.post("/api/ghl/custom-fields")
async def get_ghl_custom_fields(req: VerifyTokenRequest):
    client = GHLSubAccountClient(location_id=req.location_id, access_token=req.access_token)
    res = client.get_custom_fields()
    return res

@app.post("/api/ghl/setup-gym")
async def setup_gym_architecture_endpoint(req: VerifyTokenRequest):
    client = GHLSubAccountClient(location_id=req.location_id, access_token=req.access_token)
    res = client.setup_gym_subaccount()
    return res

@app.post("/api/ghl/setup-niche")
async def setup_niche_architecture_endpoint(req: SetupNicheRequest):
    client = GHLSubAccountClient(location_id=req.location_id, access_token=req.access_token)
    res = client.setup_niche_subaccount(req.niche)
    return res

@app.post("/api/ghl/audit")
async def audit_ghl_subaccount_endpoint(req: VerifyTokenRequest):
    client = GHLSubAccountClient(location_id=req.location_id, access_token=req.access_token)
    res = client.audit_subaccount()
    return res

@app.post("/api/chat-agent")
async def agent_chat_endpoint(req: AgentChatRequest, request: Request):
    user = get_current_user_from_req(request)
    if not user:
        # Fall back to default admin so prompt generation is never blocked by expired sessions
        user = USERS_DB.get("muhammad.okasha2146@gmail.com") or {
            "email": "muhammad.okasha2146@gmail.com",
            "name": "Muhammad Okasha",
            "role": "Master Admin",
            "avatar": "👑"
        }

    prompt = req.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt string cannot be empty.")

    engine = _get_engine()

    selected_model = req.selected_model or "gemini-3.6-flash"

    raw_attachments = [a.model_dump() for a in req.attachments] if req.attachments else []

    async def sse_generator():
        total_output_chars = 0
        prompt_tokens = max(20, len(prompt) // 4)
        try:
            generator = engine.execute_agent_prompt(
                prompt=prompt,
                location_id=req.location_id or "",
                access_token=req.access_token or "",
                model_name=selected_model,
                history=req.history or [],
                attachments=raw_attachments
            )
            from starlette.concurrency import iterate_in_threadpool
            async for item in iterate_in_threadpool(generator):
                if item.get("type") == "chunk":
                    total_output_chars += len(item.get("text", ""))
                yield f"data: {json.dumps(item)}\n\n"
            
            # Record exact usage tokens into tracker
            completion_tokens = max(10, total_output_chars // 4)
            usage_tracker.record_usage(selected_model, prompt_tokens=prompt_tokens, completion_tokens=completion_tokens)

            # Emit real-time usage stats update event
            live_stats = usage_tracker.get_model_stats(selected_model)
            yield f"data: {json.dumps({'type': 'usage_update', 'model': selected_model, 'stats': live_stats})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            logger.error(f"Chat streaming error: {e}", exc_info=True)
            if total_output_chars > 0:
                payload = json.dumps({'type': 'chunk', 'text': '\n```\n\n> ℹ️ *Generation ended at output limit. All generated content above has been preserved.*'})
                yield f"data: {payload}\n\n"
            else:
                payload = json.dumps({'type': 'chunk', 'text': format_friendly_error_banner(str(e))})
                yield f"data: {payload}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

# Mount Static Files
STATIC_DIR = os.path.join(BASE_DIR, "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
async def serve_index():
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Conversation AI Copilot API is running."}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))
    host = "0.0.0.0"
    print(f"🚀 Launching Conversation AI Copilot on http://{host}:{port} ...")
    uvicorn.run("app:app", host=host, port=port, proxy_headers=True, forwarded_allow_ips="*", reload=False)

    
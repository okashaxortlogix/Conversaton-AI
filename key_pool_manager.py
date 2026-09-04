"""
Key Pool Manager for OpenRouter, Gemini, and AI Providers.
Provides intelligent key discovery (single/multi/numbered env vars), credit tracking,
true round-robin key rotation across requests to maximize token & rate limits,
instant failover on quota exhaustion (429/402), and automatic cooldown recovery.
"""

import os
import re
import time
import json
import logging
import threading
import requests
from typing import List, Dict, Any, Optional

logger = logging.getLogger("key_pool_manager")
logger.setLevel(logging.INFO)


def _natural_sort_key(s: str):
    """Natural sort key helper to sort GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_API_KEY_10 cleanly."""
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', s)]


def collect_gemini_keys() -> List[str]:
    """
    Intelligently discovers and parses all Google Gemini API keys from environment variables.
    Handles all Railway / Docker / local configurations:
      1. GEMINI_API_KEYS (comma, semicolon, newline, pipe separated, or JSON array)
      2. GEMINI_API_KEY (single key or delimited list)
      3. GEMINI_KEYS, GEMINI_KEY, GOOGLE_API_KEYS, GOOGLE_API_KEY, GOOGLE_KEYS
      4. Numbered / suffix variables: GEMINI_API_KEY_1, GEMINI_API_KEY_2, GEMINI_KEY_01, GOOGLE_API_KEY_1, etc.
      5. Any env variable matching regex r'^(GEMINI|GOOGLE).*(API_)?KEY'
    Strips quotes/backticks/whitespace, rejects dummy placeholders, and validates key format.
    """
    keys: List[str] = []
    seen = set()

    # Discover all matching environment variable names
    candidate_var_names = []
    for var_name in sorted(os.environ.keys(), key=_natural_sort_key):
        upper = var_name.upper()
        if re.search(r'^(GEMINI|GOOGLE).*(API_)?KEY', upper):
            candidate_var_names.append(var_name)

    # Priority order: standard pool variables first, then specific numbered/named variables
    priority = [
        'GEMINI_API_KEYS', 'GEMINI_API_KEY', 'GEMINI_KEYS', 'GEMINI_KEY',
        'GOOGLE_API_KEYS', 'GOOGLE_API_KEY', 'GOOGLE_KEYS'
    ]
    ordered_vars = [v for v in priority if v in os.environ] + [v for v in candidate_var_names if v not in priority]

    for var in ordered_vars:
        val = os.environ.get(var, "").strip()
        if not val:
            continue

        # Check for JSON array format e.g. ["key1", "key2"]
        if val.startswith("[") and val.endswith("]"):
            try:
                parsed_list = json.loads(val)
                if isinstance(parsed_list, list):
                    for item in parsed_list:
                        clean = str(item).strip().strip("'\"`")
                        if _is_valid_gemini_key(clean, seen):
                            seen.add(clean)
                            keys.append(clean)
                    continue
            except Exception:
                pass

        # Split on commas, semicolons, newlines, pipes
        parts = re.split(r'[\r\n,;|]+', val)
        for p in parts:
            clean = p.strip().strip("'\"`")
            if _is_valid_gemini_key(clean, seen):
                seen.add(clean)
                keys.append(clean)

    logger.info(f"collect_gemini_keys discovered {len(keys)} unique valid Gemini key(s).")
    return keys


def _is_valid_gemini_key(k: str, seen_set: set) -> bool:
    """Validates that a string is a legitimate Gemini/Google API key and not already seen or a dummy value."""
    if not k or len(k) < 20:
        return False
    if k in seen_set:
        return False
    lower = k.lower()
    if any(placeholder in lower for placeholder in [
        "your_gemini_api_key_here", "placeholder", "undefined", "null", "none", "xxxx"
    ]):
        return False
    # Standard Google AI Studio keys start with 'AIzaSy' or 'AQ.' or are standard length alphanumeric keys
    if k.startswith("AIzaSy") or k.startswith("AQ.") or len(k) >= 30:
        return True
    return False


def collect_openrouter_keys() -> List[str]:
    """
    Intelligently discovers and parses all OpenRouter API keys from environment variables.
    Handles OPENROUTER_API_KEYS, OPENROUTER_API_KEY, OPENROUTER_API_KEY_1, etc.
    """
    keys: List[str] = []
    seen = set()

    candidate_vars = []
    for var_name in sorted(os.environ.keys(), key=_natural_sort_key):
        if "OPENROUTER" in var_name.upper() and "KEY" in var_name.upper():
            candidate_vars.append(var_name)

    priority = ['OPENROUTER_API_KEYS', 'OPENROUTER_API_KEY', 'OPENROUTER_KEYS']
    ordered_vars = [v for v in priority if v in os.environ] + [v for v in candidate_vars if v not in priority]

    for var in ordered_vars:
        val = os.environ.get(var, "").strip()
        if not val:
            continue
        parts = re.split(r'[\r\n,;|]+', val)
        for p in parts:
            clean = p.strip().strip("'\"`")
            if clean and clean not in seen and clean.startswith("sk-or-v1-"):
                seen.add(clean)
                keys.append(clean)

    logger.info(f"collect_openrouter_keys discovered {len(keys)} unique OpenRouter key(s).")
    return keys


class OpenRouterKeyPool:
    """
    Manages a pool of OpenRouter API keys with auto-polling, credit monitoring,
    round-robin load distribution, and automatic shifting to healthy keys.
    """
    def __init__(self, keys: Optional[List[str]] = None):
        self._lock = threading.Lock()
        self.keys_state: List[Dict[str, Any]] = []
        self._current_index = 0
        raw_keys = keys if keys is not None else collect_openrouter_keys()
        self.set_keys(raw_keys)

    def set_keys(self, raw_keys: List[str]):
        """Initializes or updates the pool with a list of API keys."""
        with self._lock:
            seen = set()
            clean_keys = []
            for k in raw_keys:
                k_clean = k.strip()
                if k_clean and k_clean not in seen and k_clean.startswith("sk-or-v1-"):
                    seen.add(k_clean)
                    clean_keys.append(k_clean)

            self.keys_state = []
            for k in clean_keys:
                self.keys_state.append({
                    "key": k,
                    "masked": f"{k[:16]}...{k[-4:]}",
                    "is_active": True,
                    "is_depleted": False,
                    "total_credits": 0.0,
                    "total_usage": 0.0,
                    "remaining_credits": 0.0,
                    "last_status_code": 200,
                    "last_error": "",
                    "last_checked": 0,
                    "success_count": 0,
                    "failure_count": 0
                })
            
            self._current_index = 0
            logger.info(f"OpenRouterKeyPool initialized with {len(self.keys_state)} keys.")

    def reload_from_env(self):
        """Refreshes keys from environment while preserving existing usage statistics."""
        fresh_keys = collect_openrouter_keys()
        with self._lock:
            existing_stats = {e["key"]: e for e in self.keys_state}
            new_state = []
            for k in fresh_keys:
                if k in existing_stats:
                    new_state.append(existing_stats[k])
                else:
                    new_state.append({
                        "key": k,
                        "masked": f"{k[:16]}...{k[-4:]}",
                        "is_active": True,
                        "is_depleted": False,
                        "total_credits": 0.0,
                        "total_usage": 0.0,
                        "remaining_credits": 0.0,
                        "last_status_code": 200,
                        "last_error": "",
                        "last_checked": 0,
                        "success_count": 0,
                        "failure_count": 0
                    })
            self.keys_state = new_state
            if self._current_index >= len(self.keys_state):
                self._current_index = 0

    def get_active_key(self, rotate: bool = True) -> Optional[str]:
        """Returns the currently active, healthy API key from the pool with optional round-robin advance."""
        with self._lock:
            if not self.keys_state:
                return None
            
            n = len(self.keys_state)
            for i in range(n):
                idx = (self._current_index + i) % n
                entry = self.keys_state[idx]
                if entry["is_active"] and not entry["is_depleted"]:
                    if rotate:
                        self._current_index = (idx + 1) % n
                    else:
                        self._current_index = idx
                    return entry["key"]
            
            logger.warning("All OpenRouter keys in pool were marked depleted. Resetting pool for fresh retry...")
            for entry in self.keys_state:
                entry["is_depleted"] = False
            
            chosen = self.keys_state[0]["key"]
            self._current_index = 1 % n if rotate else 0
            return chosen

    def mark_key_depleted(self, key: str, status_code: int = 402, error_msg: str = ""):
        """Marks a specific key as depleted or rate-limited, and shifts to next key."""
        with self._lock:
            for entry in self.keys_state:
                if entry["key"] == key:
                    entry["is_depleted"] = True
                    entry["last_status_code"] = status_code
                    entry["last_error"] = error_msg
                    entry["failure_count"] += 1
                    logger.warning(
                        f"OpenRouter Key {entry['masked']} marked DEPLETED (Status {status_code}: {error_msg}). "
                        f"Shifting to next available key in pool."
                    )
            
            n = len(self.keys_state)
            for i in range(1, n + 1):
                idx = (self._current_index + i) % n
                if not self.keys_state[idx]["is_depleted"]:
                    self._current_index = idx
                    logger.info(f"OpenRouterKeyPool shifted to key: {self.keys_state[idx]['masked']}")
                    return

    def record_success(self, key: str):
        """Records a successful API call for the given key."""
        with self._lock:
            for entry in self.keys_state:
                if entry["key"] == key:
                    entry["success_count"] += 1
                    entry["is_depleted"] = False
                    entry["last_error"] = ""
                    entry["last_status_code"] = 200

    def poll_key_credits(self, key_entry: Dict[str, Any]) -> Dict[str, Any]:
        """Polls OpenRouter /api/v1/credits to fetch live balance."""
        key = key_entry["key"]
        headers = {"Authorization": f"Bearer {key}"}
        try:
            resp = requests.get("https://openrouter.ai/api/v1/credits", headers=headers, timeout=6)
            if resp.status_code == 200:
                data = resp.json().get("data", {})
                total_credits = float(data.get("total_credits", 0.0) or 0.0)
                total_usage = float(data.get("total_usage", 0.0) or 0.0)
                remaining = max(0.0, total_credits - total_usage) if total_credits > 0 else 0.0
                
                key_entry["total_credits"] = total_credits
                key_entry["total_usage"] = total_usage
                key_entry["remaining_credits"] = remaining
                key_entry["last_checked"] = time.time()
                key_entry["last_status_code"] = 200
                
                if total_credits > 0 and remaining <= 0.001:
                    key_entry["is_depleted"] = True
                else:
                    key_entry["is_depleted"] = False
                
                return {"success": True, "remaining": remaining, "usage": total_usage}
            elif resp.status_code in [401, 402, 429]:
                key_entry["is_depleted"] = True
                key_entry["last_status_code"] = resp.status_code
                key_entry["last_error"] = f"HTTP {resp.status_code}"
                return {"success": False, "status_code": resp.status_code}
        except Exception as e:
            logger.debug(f"Polling error for key {key_entry['masked']}: {e}")
        return {"success": False}

    def poll_all_keys(self):
        """Polls and updates status for all keys in the pool."""
        with self._lock:
            entries = list(self.keys_state)
        for entry in entries:
            self.poll_key_credits(entry)

    def get_pool_status(self) -> List[Dict[str, Any]]:
        """Returns public status summary of all keys in the pool."""
        with self._lock:
            summary = []
            for idx, entry in enumerate(self.keys_state):
                summary.append({
                    "index": idx,
                    "masked_key": entry["masked"],
                    "is_current": (idx == self._current_index),
                    "is_active": entry["is_active"],
                    "is_depleted": entry["is_depleted"],
                    "total_usage": round(entry["total_usage"], 4),
                    "total_credits": round(entry["total_credits"], 4),
                    "remaining_credits": round(entry["remaining_credits"], 4),
                    "last_status_code": entry["last_status_code"],
                    "success_count": entry["success_count"],
                    "failure_count": entry["failure_count"]
                })
            return summary


class GeminiKeyPool:
    """
    High-Throughput Pool Manager for Google Gemini API keys.
    Provides:
      - Multi-key discovery from environment variables (comma/newline/JSON or numbered keys)
      - Fair round-robin rotation across requests to multiply TPM / RPM capacity
      - Seamless automatic shift/failover on 429 quota exhaustion
      - 65-second automatic cooldown recovery (aligns with Gemini per-minute RPM window)
      - Real-time health statistics and monitoring summary
    """
    def __init__(self, keys: Optional[List[str]] = None):
        self._lock = threading.Lock()
        self.keys_state: List[Dict[str, Any]] = []
        self._current_index = 0
        raw_keys = keys if keys is not None else collect_gemini_keys()
        self.set_keys(raw_keys)

    def set_keys(self, raw_keys: List[str]):
        """Initializes or updates the pool with a list of Gemini API keys."""
        with self._lock:
            seen = set()
            clean_keys = []
            for k in raw_keys:
                k_clean = k.strip().strip("'\"`")
                if _is_valid_gemini_key(k_clean, seen):
                    seen.add(k_clean)
                    clean_keys.append(k_clean)

            self.keys_state = []
            for k in clean_keys:
                self.keys_state.append({
                    "key": k,
                    "masked": f"{k[:12]}...{k[-4:]}",
                    "is_active": True,
                    "is_depleted": False,
                    "depleted_at": 0.0,
                    "last_status_code": 200,
                    "last_error": "",
                    "success_count": 0,
                    "failure_count": 0
                })
            
            self._current_index = 0
            logger.info(f"GeminiKeyPool initialized with {len(self.keys_state)} active rotating keys.")

    def reload_from_env(self):
        """Refreshes keys from environment while preserving existing health states."""
        fresh_keys = collect_gemini_keys()
        with self._lock:
            existing_stats = {e["key"]: e for e in self.keys_state}
            new_state = []
            for k in fresh_keys:
                if k in existing_stats:
                    new_state.append(existing_stats[k])
                else:
                    new_state.append({
                        "key": k,
                        "masked": f"{k[:12]}...{k[-4:]}",
                        "is_active": True,
                        "is_depleted": False,
                        "depleted_at": 0.0,
                        "last_status_code": 200,
                        "last_error": "",
                        "success_count": 0,
                        "failure_count": 0
                    })
            self.keys_state = new_state
            if self._current_index >= len(self.keys_state):
                self._current_index = 0
            logger.info(f"GeminiKeyPool reloaded from environment: {len(self.keys_state)} total keys.")

    def get_active_key(self, rotate: bool = True) -> Optional[str]:
        """
        Returns the next healthy Gemini key from the pool.
        When rotate=True, advances the pointer so subsequent requests hit subsequent keys (Round-Robin).
        Auto-recovers rate-limited keys once their 65-second cooldown expires.
        """
        with self._lock:
            if not self.keys_state:
                return None

            now = time.time()
            n = len(self.keys_state)

            # Auto-recover keys depleted more than 65 seconds ago (Gemini RPM cooldown window)
            for entry in self.keys_state:
                if entry["is_depleted"] and entry.get("depleted_at", 0) > 0:
                    elapsed = now - entry["depleted_at"]
                    if elapsed > 65:
                        entry["is_depleted"] = False
                        entry["depleted_at"] = 0.0
                        entry["last_error"] = ""
                        logger.info(f"Gemini key {entry['masked']} auto-recovered after {elapsed:.0f}s cooldown.")

            # Find the next healthy, non-depleted key starting at _current_index
            for i in range(n):
                idx = (self._current_index + i) % n
                entry = self.keys_state[idx]
                if entry["is_active"] and not entry["is_depleted"]:
                    if rotate:
                        # Advance pointer to the next key for subsequent requests (fair round-robin)
                        self._current_index = (idx + 1) % n
                    else:
                        self._current_index = idx
                    return entry["key"]

            # If all keys were marked depleted, reset the pool so requests can retry
            logger.warning("All Gemini keys in pool were marked depleted. Resetting pool for fresh attempt...")
            for entry in self.keys_state:
                entry["is_depleted"] = False
                entry["depleted_at"] = 0.0

            chosen = self.keys_state[0]["key"]
            self._current_index = 1 % n if rotate else 0
            return chosen

    def mark_key_depleted(self, key: str, status_code: int = 429, error_msg: str = ""):
        """
        Marks a specific Gemini key as depleted/rate-limited and shifts the pointer to the next key.
        Records depleted_at timestamp so it auto-recovers after 65 seconds.
        """
        with self._lock:
            for entry in self.keys_state:
                if entry["key"] == key:
                    entry["is_depleted"] = True
                    entry["depleted_at"] = time.time()
                    entry["last_status_code"] = status_code
                    entry["last_error"] = error_msg
                    entry["failure_count"] += 1
                    logger.warning(
                        f"Gemini Key {entry['masked']} marked DEPLETED (Status {status_code}: {error_msg}). "
                        f"Shifting to next available key in pool."
                    )

            n = len(self.keys_state)
            for i in range(1, n + 1):
                idx = (self._current_index + i) % n
                if not self.keys_state[idx]["is_depleted"]:
                    self._current_index = idx
                    logger.info(f"GeminiKeyPool shifted pointer to key: {self.keys_state[idx]['masked']}")
                    return

    def record_success(self, key: str):
        """Records a successful API call for the given Gemini key."""
        with self._lock:
            for entry in self.keys_state:
                if entry["key"] == key:
                    entry["success_count"] += 1
                    entry["is_depleted"] = False
                    entry["last_error"] = ""
                    entry["last_status_code"] = 200

    def get_pool_status(self) -> List[Dict[str, Any]]:
        """Returns public status summary of all keys in the pool."""
        with self._lock:
            now = time.time()
            summary = []
            for idx, entry in enumerate(self.keys_state):
                cooldown_remaining = 0
                if entry["is_depleted"] and entry.get("depleted_at", 0) > 0:
                    cooldown_remaining = max(0, int(65 - (now - entry["depleted_at"])))

                summary.append({
                    "index": idx,
                    "masked_key": entry["masked"],
                    "is_current": (idx == self._current_index),
                    "is_active": entry["is_active"],
                    "is_depleted": entry["is_depleted"],
                    "cooldown_remaining": cooldown_remaining,
                    "last_status_code": entry["last_status_code"],
                    "success_count": entry["success_count"],
                    "failure_count": entry["failure_count"]
                })
            return summary

    def get_summary(self) -> Dict[str, Any]:
        """Returns high-level aggregate metrics for the pool."""
        with self._lock:
            total = len(self.keys_state)
            healthy = sum(1 for e in self.keys_state if e["is_active"] and not e["is_depleted"])
            depleted = total - healthy
            active_key_masked = ""
            if self.keys_state:
                curr = self.keys_state[self._current_index % total]
                active_key_masked = curr["masked"]

            return {
                "total_keys": total,
                "healthy_keys": healthy,
                "depleted_keys": depleted,
                "active_key_masked": active_key_masked,
                "effective_tpm_limit": total * 1_000_000,
                "effective_rpm_limit": total * 15,
                "effective_rpd_limit": total * 1500
            }


def _init_default_openrouter_pool() -> OpenRouterKeyPool:
    return OpenRouterKeyPool()


def _init_default_gemini_pool() -> GeminiKeyPool:
    return GeminiKeyPool()


# Global singleton instances loaded dynamically from environment
openrouter_key_pool = _init_default_openrouter_pool()
gemini_key_pool = _init_default_gemini_pool()

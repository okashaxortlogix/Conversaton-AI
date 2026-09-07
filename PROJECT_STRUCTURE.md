# 🗺️ Project Architecture & File Directory Guide
## Conversation AI Copilot for GoHighLevel (GHL)

This document provides a clean, comprehensive map of every file and folder in this repository. Use this reference to quickly understand what each file does.

---

## 📂 Master Directory Map

```text
Conversation AI Copilot/
├── 🚀 Core Backend & Execution
│   ├── app.py                      # Main FastAPI application server & REST API endpoints
│   ├── agent_engine.py             # Multi-model AI reasoning engine, prompt routing & tools
│   ├── ghl_client.py               # GoHighLevel REST API v2 SDK & OAuth 2.0 connect/callback
│   ├── key_pool_manager.py         # Multi-key rotation, health checks & rate limit resiliency
│   ├── usage_tracker.py            # AI token consumption & daily quota tracking
│   ├── portfolio_knowledge_base.py # Vector RAG retrieval engine for agency intelligence
│   ├── niche_architectures.py      # CRM schemas for 5 industries (Gym, Real Estate, MedSpa, Solar, Coaching)
│   └── gym_architecture.py         # Dedicated blueprint for fitness sub-account setups
│
├── 🎨 Frontend Web Application (static/)
│   ├── static/index.html           # Main single-page web interface (AskAI ChatGPT-style UI)
│   ├── static/style.css            # Modern dark-mode styling with glassmorphism & tokens
│   └── static/app.js               # Client-side chat logic, modal controls, voice & OAuth handlers
│
├── 🏪 Marketplace & App Store Assets (marketplace_assets/)
│   ├── app_logo.png                # Official 512x512 1:1 app icon (< 500KB)
│   ├── logo_vector.svg             # Scalable vector logo for HighLevel Marketplace
│   ├── preview_image_1.png         # 16:9 Real UI Screenshot 1: Copilot Workspace & API actions
│   ├── preview_image_2.png         # 16:9 Real UI Screenshot 2: Interactive Funnel Builder Wizard
│   └── GHL_MARKETPLACE_FORM_DATA.txt # Ready-to-copy taglines, descriptions & keyword specs
│
├── 📚 Documentation Hub (docs/)
│   ├── docs/API_REFERENCE.md       # Complete API contracts for all endpoints
│   ├── docs/ARCHITECTURE.md        # Technical architecture, multi-model fallback & RAG
│   ├── docs/GHL_INTEGRATION_GUIDE.md # GoHighLevel scopes, token types & action schemas
│   ├── docs/DEPLOYMENT_AND_CONFIG.md # Production Railway & cloud deployment instructions
│   └── docs/*.pdf & *.docx         # Full system specifications & client project scope documents
│
├── 🗄️ Knowledge Base & Databases
│   ├── ghl_chroma_db/              # Persistent ChromaDB vector database (chroma.sqlite3)
│   ├── data/                       # Pre-computed portfolio & knowledge vector embeddings
│   ├── users.json                  # User authentication database (PBKDF2 hashed passwords & RBAC)
│   └── model_usage.json            # Real-time token consumption logs per AI model
│
├── ⚙️ Configuration & Cloud Deployment
│   ├── .env                        # Local secret API keys (never committed to git)
│   ├── .env.example                # Template showing all required environment variables
│   ├── requirements.txt            # Python dependencies (FastAPI, Uvicorn, Requests, etc.)
│   ├── railway.json                # Cloud deployment settings for Railway.app
│   ├── Procfile                    # Web process launch command
│   ├── runtime.txt                 # Pinned Python version
│   └── .gitignore                  # Git exclusion rules for virtualenvs, keys & caches
│
└── 🛠️ Utility Scripts (scripts/)
    ├── scripts/generate_pdf_docs.py# Utility script to compile documentation into PDF
    └── scripts/make_simple_pdf.py  # Lightweight PDF generator script
```

---

## 🔍 Detailed File Explanations

### 1. Backend Core

#### `app.py`
* **Purpose:** The central entry point of the entire application.
* **Responsibilities:**
  * Configures the FastAPI app, CORS middleware, and static file hosting.
  * Provides user authentication (`/api/auth/login`, `/api/auth/me`).
  * Manages Master Admin user operations (`/api/admin/users`, `/api/admin/update-user`).
  * Handles GoHighLevel OAuth 2.0 flow:
    * `/connect`: 1-Click redirect to GoHighLevel OAuth permission screen.
    * `/oauth/callback`: Official callback endpoint that exchanges code for tokens and saves to browser.
  * Direct GHL action APIs (`/api/ghl/contacts`, `/api/ghl/pipelines`, `/api/ghl/tags`, `/api/ghl/audit`).
  * Streams conversational responses from the AI agent (`/api/chat-agent`).

#### `agent_engine.py`
* **Purpose:** The multi-model reasoning and execution brain.
* **Responsibilities:**
  * Coordinates between Google Gemini (Flash/Pro), Groq Cloud (LPU speed), OpenRouter, Puter, and RapidAPI.
  * Intelligently parses user natural language intents (e.g., "create a contact", "build a funnel", "audit account").
  * Executes live tool calls against GoHighLevel REST API.
  * Provides self-healing error recovery when an AI model rate limits or fails.

#### `ghl_client.py`
* **Purpose:** The dedicated GoHighLevel REST API SDK.
* **Responsibilities:**
  * Wrapper class `GHLSubAccountClient` with standard version header.
  * Methods to create/search contacts, pipelines, tags, custom fields, opportunities, tasks, and notes.
  * Contains `GHLOAuthHandler` for authorization URL generation and token exchange.
  * Standalone convenience functions: `connect_ghl()` and `callback_ghl()`.

#### `key_pool_manager.py`
* **Purpose:** Enterprise multi-key rotation manager.
* **Responsibilities:**
  * Balances load across multiple Gemini, Groq, and OpenRouter API keys.
  * Monitors requests per minute (RPM) and tokens per minute (TPM).
  * Automatically isolates keys that encounter quota exhaustion and cools them down.

#### `niche_architectures.py`
* **Purpose:** Industry-specific CRM blueprints.
* **Responsibilities:**
  * Pre-configured schemas for 5 key niches: Gyms, Real Estate, MedSpas, Solar, and Coaching.
  * Deploys complete sets of custom fields, tags, and pipeline stages in one command.

---

### 2. Frontend Interface (`static/`)

* **`static/index.html`**:
  * Modern single-page layout featuring a clean left sidebar with templates, GHL location status pill, chat message history, voice input button, and the **1-Click OAuth connection modal**.
* **`static/style.css`**:
  * Styled with a dark-mode palette (`#0b0f19`), glassmorphic panels, glowing status indicators, and responsive mobile drawer.
* **`static/app.js`**:
  * Handles chat state, real-time streaming UI, attachment previews, web speech voice recognition, and auto-detection of incoming OAuth callback codes (`?code=...` or `?ghl_connected=1`).

---

### 3. Marketplace Assets (`marketplace_assets/`)

* **`app_logo.png`**: Exactly 512x512 px (1:1 ratio, ~254 KB), compliant with GoHighLevel Marketplace rules.
* **`preview_image_1.png`**: Authentic 16:9 screenshot (960x540 px) of the live workspace dashboard.
* **`preview_image_2.png`**: Authentic 16:9 screenshot (960x540 px) of the multi-step Funnel Builder.
* **`GHL_MARKETPLACE_FORM_DATA.txt`**: Form-ready taglines, category recommendations, and search keywords.

---

## 🚀 Quick Commands

* **Run Locally:**
  ```bash
  python -m uvicorn app:app --host 127.0.0.1 --port 7861 --reload
  ```
* **Run with Cloud Configuration:**
  ```bash
  python -m uvicorn app:app --host 0.0.0.0 --port 8080
  ```

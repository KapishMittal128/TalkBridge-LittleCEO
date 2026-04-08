# Installed MCPs — Antigravity Global Stack

All MCPs below are pre-cached via npx and configured in `mcp_config.json`.

---

## FULLY READY (configured with API keys)

| MCP | Package | Status | Role |
|-----|---------|--------|------|
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | ✅ Ready | Read/write/edit files, inspect project structure |
| **Playwright** | `@playwright/mcp` | ✅ Ready | Browser automation, DOM inspection, website cloning, UI interaction |
| **Memory** | `@modelcontextprotocol/server-memory` | ✅ Ready | Knowledge graph persistence across sessions |
| **SQLite** | `mcp-sqlite` | ✅ Ready | Lightweight local database workflows |
| **GitHub** | `@modelcontextprotocol/server-github` | ✅ Ready | Repo management, commits, PR workflows, version control |
| **21st.dev Magic** | `@21st-dev/magic@latest` | ✅ Ready | AI-powered UI component selection and insertion |
| **Supabase** | `@supabase/mcp-server-supabase@latest` | ✅ Ready | Auth, database, storage backend |
| **Apify** | `@apify/actors-mcp-server` | ✅ Ready | Advanced web scraping and data extraction |
| **Figma** | `@yhy2001/figma-mcp-server` | ✅ Ready | Direct Figma design context extraction |
| **n8n** | `@nazcamedia/n8n-mcp-server` | ✅ Ready | Workflow automation triggering |
| **Sequential Thinking** | `@modelcontextprotocol/server-sequential-thinking` | ✅ Ready | Advanced step-by-step logic and problem breakdown |
| **Linear** | `@touchlab/linear-mcp-integration` | ✅ Ready | Autonomous project and backlog management |

---

## READY BUT NEEDS API KEY / TOKEN

| MCP | Package | Status | What's Needed |
|-----|---------|--------|---------------|
| **Postgres** | `@modelcontextprotocol/server-postgres` | ⏳ Needs connection string | PostgreSQL running locally or hosted |
| **Obsidian** | `@oleksandrkucherenko/mcp-obsidian` | ⏳ Pending Setup | Obsidian vault path and plugin configuration |

---

## NOT INSTALLED — DEFERRED

| MCP | Reason |
|-----|--------|
| **Vercel** | No standalone npm MCP client exists; deploy via CLI or dashboard |
| **Railway** | No stable MCP package; deploy via CLI |
| **Netlify** | No stable MCP package; deploy via CLI |
| **Notion** | Requires OAuth integration; setup separately when needed |
| **Google Drive** | Requires OAuth; setup separately when needed |
| **NotebookLM** | Requires browser-based OAuth/login flow; setup on demand |
| **Ollama** | No official npm MCP; use via API directly |
| **OpenRouter** | No standalone MCP; use via API directly |
| **OpenAI** | No standalone MCP; use via API directly |
| **Gemini** | No standalone MCP; use via API directly |
| **Docker** | Docker not installed on this machine |
| **Redis** | Redis not running locally; add when needed |
| **Mobbin** | No MCP available; use via Playwright for reference gathering |
| **Framer** | Use via Playwright for visual interaction |
| **Firebase** | No stable MCP; use Firebase CLI directly |
| **Vector DB** | Requires external service; defer until needed |

---

**Total Configured:** 13 MCPs in `mcp_config.json`
**Fully Ready:** 11
**Needs Credentials:** 2

# MCP Setup Checklist — External Credentials Required

Complete each item below to activate the corresponding MCP.
After obtaining each credential, update `mcp_config.json` by replacing the placeholder value.

---

## 1. PostgreSQL Connection String

**Service:** Local Postgres or hosted (Neon, RDS, etc.)
**What to do:**
1. Get the connection string from your local DB or hosted provider dashboard
2. Format: `postgresql://user:password@host:port/database`

**Where to put it:**
In `mcp_config.json` → `postgres` → `env` → `POSTGRES_CONNECTION_STRING`

**Why needed:** Enables direct SQL queries, schema inspection, and database management.

---

## 2. Obsidian Vault & API Key

**(We will handle this one later, per your request)**

**Service:** Local Obsidian App
**What to do:**
1. Install the "Local REST API" community plugin in Obsidian
2. Enable it and copy the API key
3. Provide the absolute path to your Obsidian vault

**Where to put it:**
In `mcp_config.json` → `obsidian`

**Why needed:** Allows the OS to read/write directly to your personal knowledge base.

---

## Quick Reference: Services to Visit

| # | Service | URL | What to Get |
|---|---------|-----|-------------|
| 1 | **PostgreSQL** | Local or hosted provider | Connection String |
| 2 | **Obsidian** | Local App | Vault Path & API Key |

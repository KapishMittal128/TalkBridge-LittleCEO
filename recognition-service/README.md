# TalkBridge Recognition Service

Phase 1 scaffold of the FastAPI audio recognition backend.

## Phase Status
- **Phase 1** (current): Stub endpoints — returns placeholder responses only
- **Phase 4**: Real feature extraction + user-specific classification
- **Phase 5**: Correction feedback loop
- **Phase 6**: Production deployment

## Requirements
- Python 3.11+
- pip

## Setup

```bash
# Create virtual environment
python -m venv .venv

# Activate (Windows)
.venv\Scripts\activate

# Activate (Mac/Linux)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Run (Development)

```bash
uvicorn main:app --reload --port 8000
```

## Endpoints

| Method | Route | Phase 1 | Phase 4 |
|--------|-------|---------|---------|
| GET | `/health` | Returns `{status: "ok"}` | Same |
| POST | `/train-sample` | Acknowledges receipt | Extracts + stores audio features |
| POST | `/recognize` | Returns null prediction | Runs user-specific classification |
| POST | `/correction` | Logs correction | Feeds retraining signal |

## API Docs

When running locally, interactive docs available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

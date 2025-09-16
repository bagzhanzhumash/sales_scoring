# Repository Guidelines

## Project Structure & Module Organization
The FastAPI service lives in `app/`, with entrypoints in `main.py` and `run.py`. API routes reside under `app/api/` (see `transcription.py` for Whisper and `summarization.py` for Ollama), while shared logic sits in `whisper_service.py`, `summarization_service.py`, `utils.py`, and `models.py`. Configuration defaults are defined in `app/config.py` and read from `.env` when present. Support scripts at the repository root include `install.sh` for dependency setup, `docker-compose.yml` for containerized runs, and `example_usage.py` for API call snippets. Keep large model artifacts out of version control; store only lightweight configs inside `app/models/`.

## Build, Test, and Development Commands
Create and activate a Python 3.10 virtualenv, then run `pip install -r requirements.txt` from the `backend/` root. Start the API for local development with `python run.py` (honors env vars and optional hot reload via `RELOAD=true`). For minimal manual runs, `python -m app.main` launches the service with default settings, and `uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` enables live code updates. Use `docker compose up --build` to reproduce production parity. Smoke-test the deployment by hitting `curl http://localhost:8000/api/v1/health` for Whisper and `curl http://localhost:8000/api/v1/summarize/health` once `ollama pull gemma3:27b` has been executed locally; `python example_usage.py` still prints transcription curl recipes.

## Coding Style & Naming Conventions
Follow PEP 8 with 4-space indentation, type hints on public functions, and descriptive docstrings mirroring the current codebase. Use snake_case for modules and functions, PascalCase for Pydantic models, and uppercase for constants and env keys. Centralize configuration through `Settings` in `app/config.py`; avoid duplicating literals elsewhere. Prefer FastAPI dependency injection and the existing logging setup (`logging.basicConfig`) over ad-hoc prints, and keep HTTP integrations (Whisper or Ollama) inside their dedicated service classes.

## Testing Guidelines
Automated tests are not yet checked in—when adding features, place pytest suites under a new `tests/` package and keep fixtures small. Until pytest coverage is in place, rely on request-level checks: `curl` the `/api/v1/transcribe` endpoints with sample media and verify structured JSON responses, and post JSON bodies to `/api/v1/summarize` to confirm concise summaries and fallback errors. Document any large manual QA scripts in the PR description.

## Commit & Pull Request Guidelines
Write imperative, scope-focused commit messages (e.g., `Add URL transcription validation`). Each PR should summarize changes, link tracker tickets, list commands executed (install, run, smoke tests), and attach API logs or curl transcripts when modifying transcription or summarization logic. Request review from teammates familiar with the affected module and ensure new env keys or config flags are reflected in `app/config.py` and this guide.

## Configuration Notes
Core runtime settings are controlled via `.env` variables such as `HOST`, `PORT`, `MODEL_SIZE`, and `DEVICE`, with summarization values like `OLLAMA_BASE_URL`, `SUMMARIZATION_MODEL`, and `SUMMARIZATION_MAX_TOKENS` alongside them—everything surfaces through `Settings`. Update defaults in one place (`app/config.py`) and document non-obvious overrides in the README. Clean up any temporary files created under `/tmp/speech_recognition` after batch transcription experiments.

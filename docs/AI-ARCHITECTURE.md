# MedBridge India - AI Architecture

## Overview

The SAFE Healthcare AI Assistant provides a conversational interface for customers to interact with the MedBridge India platform.
Safety and determinism are prioritized over open-ended generation.

## Core Principles

1.  **Deterministic Tool Layer**: Data fetching and filtering are executed through deterministic Python functions (`apps/api/app/ai/tools/`), not by the LLM itself. The LLM acts as an orchestrator/formatter.
2.  **No Direct Database Access**: The LLM cannot query Firestore directly. It can only call predefined tools.
3.  **Read-Only Operations**: The AI is restricted to read-only operations for provider data and case status. It cannot write or modify healthcare data.
4.  **No Medical Advice**: The system explicitly detects and blocks high-risk medical inquiries, redirecting users to seek professional help.
5.  **Optional LLM Dependency**: The system is designed with a `FallbackProvider` to ensure core functionality (search, case status, quote requests) works even if the local Ollama LLM is unavailable or unconfigured.

## Architecture Components

*   **`orchestrator.py`**: The central entry point for chat requests. It manages conversation state, delegates to the `safety.py` and `intent.py` modules, and routes requests to the active `LLMProvider`.
*   **`intent.py`**: Classifies user messages into specific intents (e.g., `PROVIDER_SEARCH`, `CASE_STATUS`, `HIGH_RISK_MEDICAL`) using keyword/regex heuristics before any LLM processing.
*   **`safety.py`**: Analyzes messages for prompt injection attempts or malicious content, logging events to the `aiSafetyEvents` Firestore collection.
*   **`llm_provider.py`**: Defines the `LLMProvider` interface. Contains `OllamaProvider` (for local LLM integration) and `FallbackProvider` (a robust, deterministic backup).
*   **`tools/`**: A suite of modular, read-only Python scripts (e.g., `search_providers.py`, `get_case_status.py`) that query the established MedBridge database.

## Security & Data Flow

1.  **Authentication**: The `/api/v1/ai/chat` endpoint mandates valid Firebase Auth tokens. The user identity is extracted securely on the backend, not trusted from the client payload.
2.  **State Management**: Conversation history is persisted securely in the `aiConversations` and `aiMessages` Firestore collections, accessible only to the authenticated user via Firestore Security Rules.
3.  **Data Segregation**: AI tools only interact with `PUBLISHED` canonical provider data, ensuring unverified or conflicting information is never exposed to the user.

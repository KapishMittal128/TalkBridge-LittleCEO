# TECH_STACK.md — TalkBridge

## 1. Purpose

This document defines the **authoritative technology stack, implementation boundaries, platform choices, service architecture, and technical constraints** for TalkBridge MVP.

This file exists to prevent:

* stack drift
* tool sprawl
* unnecessary abstraction
* infrastructure overengineering
* “AI dev guessing”

This is a **build constraint file**, not a brainstorming file.

If a framework, service, library, or architecture decision is not explicitly justified by MVP needs, it should not be introduced.

If implementation conflicts with this file:
**this file wins**.

---

# 2. Core Technical Philosophy

TalkBridge must be built under these non-negotiable principles.

---

## 2.1 MVP First

The stack must optimize for:

* shipping a usable MVP fast
* iteration speed
* maintainability
* practical reliability

It must **not** optimize for theoretical hyperscale.

---

## 2.2 Simplicity Over Technical Vanity

Avoid unnecessary complexity in:

* infra
* backend abstraction
* deployment
* AI orchestration
* service topology
* build tooling

If a simpler architecture works, use it.

---

## 2.3 Reliability Over Novelty

Use boring, proven tools where possible.

Do not choose technologies because they are fashionable.

---

## 2.4 Mobile-First Reality

TalkBridge is a real assistive communication product.

It must be built for **mobile-first daily use**, not web-first experimentation.

---

## 2.5 User-Specific Recognition First

The technical system must optimize for:

# **recognizing one user’s trained sound library**

It must NOT optimize for:

* universal speech understanding
* generic voice AI
* language-model theater

That is a different product.

---

# 3. Delivery Target

## 3.1 Primary Platform

TalkBridge MVP must be built as a:

# **mobile-first Android app**

---

## 3.2 Platform Priority

1. **Android first**
2. iOS second (only after MVP validation)

---

## 3.3 Why Android First

Android is the correct MVP target because it offers:

* lower device barrier
* broader practical accessibility
* faster MVP iteration
* easier initial deployment/testing
* better fit for real-world use conditions

---

## 3.4 Hard Rule

Do NOT optimize for polished dual-platform perfection in V1 if it slows shipping.

Ship one good MVP first.

---

# 4. Frontend Stack

This section is strict.

---

# 4.1 Frontend Framework

## Required Stack

Use:

# **React Native + Expo**

This is the canonical frontend app stack.

---

## Why This Is Locked

This gives:

* fast mobile iteration
* strong AI-assisted build compatibility
* good mobile UX flexibility
* easier Android-first deployment
* acceptable path to iOS later
* enough ecosystem support for audio workflows

---

## Do NOT Use

* Flutter
* native Android + native iOS split
* PWA-first “mobile” compromise
* Ionic / Capacitor-style fake-native approach

Those are not the MVP path.

---

# 4.2 Frontend Language

## Required

Use:

# **TypeScript**

---

## Hard Rule

Do NOT build production MVP code in plain JavaScript.

---

## Why

TypeScript is required for:

* safer component contracts
* cleaner state/data handling
* better AI code generation reliability
* less structural slop during iteration

---

# 4.3 Styling System

## Required Styling Approach

Use:

# **NativeWind + design-token-driven component styling**

This is the canonical UI styling layer.

---

## Why

This supports:

* consistency
* speed
* design token enforcement
* easier system-wide changes
* better alignment with `DESIGN_SYSTEM.md`

---

## Hard Rules

Do NOT:

* scatter raw inline styles everywhere
* build a component system with no token discipline
* mix 4 different styling patterns
* treat every screen like a one-off design experiment

---

## Allowed Exception

If NativeWind causes a real implementation blocker, use a **single consistent token-based styling approach** across the app.

But do **not** mix styling systems casually.

---

# 4.4 Frontend State Management

## Required

Use:

# **Zustand**

This is the canonical app state layer.

---

## Why

Zustand is correct for MVP because it is:

* lightweight
* simple
* sufficient
* easy to reason about
* compatible with React Native without Redux bloat

---

## Do NOT Use

* Redux
* MobX
* XState (for whole-app state)
* over-abstracted store architecture

Not for MVP.

---

## State Domains That Must Exist

The app must maintain clean state for:

* auth/session state
* user profile
* categories
* sound cards
* current recognition state
* current UI mode (`idle`, `listening`, `processing`, `result`)
* recents / favorites
* settings
* onboarding progress

---

# 4.5 Navigation

## Required

Use:

# **React Navigation**

---

## Required Navigation Types

The app must support:

* bottom tabs
* stack navigation
* modal presentation

---

## Hard Rule

Do NOT invent custom navigation architecture unless absolutely necessary.

Use the standard pattern cleanly.

---

# 5. Audio Stack

This is one of the most critical technical layers in the product.

If recording and playback are unstable, the product is broken.

---

# 5.1 Recording Layer

## Primary Choice

Use:

# **Expo AV**

for MVP recording and playback.

---

## Hard Rule

Start with Expo AV.
Do NOT prematurely swap libraries before proving it is insufficient.

---

## Expo AV Must Support

* training sample recording
* live recognition recording
* microphone permission handling
* local temporary file creation
* playback for verification where needed

---

## Escalation Rule

Only replace Expo AV if it fails one of the following in actual implementation:

* recording reliability
* file access reliability
* latency constraints
* Android stability
* microphone behavior correctness

If it works, keep it.

---

# 5.2 Playback Layer

## Required

Use the same core audio layer for:

* replaying training samples (if exposed)
* playback of relevant recorded sounds
* audio preview behavior where applicable

Keep the audio layer unified where possible.

---

# 5.3 Text-to-Speech (TTS)

## Required

Use:

# **native device TTS via React Native-compatible TTS library**

---

## Why

This is the correct MVP choice because it is:

* simple
* low-cost
* fast enough
* good enough for practical use

---

## TTS Must Support

* quick playback
* replay
* output language handling
* enable/disable setting

---

## Do NOT Use

* cloud voice generation
* custom neural voices
* voice cloning
* expensive TTS APIs

That is feature cosplay, not MVP.

---

# 6. Recognition / AI Stack

This section must stay brutally disciplined.

This is where weak builders usually overcomplicate the product.

Do not do that.

---

# 6.1 MVP Recognition Strategy

## Required Recognition Model Type

TalkBridge MVP must use:

# **user-specific audio similarity / classification**

It must NOT use:

* generic speech-to-text as the primary recognition engine
* universal impaired-speech recognition
* LLM-based “interpretation”
* giant end-to-end speech transformer stacks

---

## Recognition Goal

The recognition system only needs to answer:

> “Which trained sound card does this new sound most likely match?”

That is the actual problem.

Solve that.
Do not hallucinate a harder one.

---

# 6.2 Canonical Recognition Pipeline

The MVP recognition pipeline must follow this structure:

1. **audio preprocessing**
2. **feature extraction / embedding generation**
3. **user-specific candidate matching**
4. **confidence scoring**
5. **top-N candidate return**

That is the official pipeline.

Do NOT build AI architecture outside this flow unless absolutely required.

---

# 6.3 Recognition Service Language

## Required

Use:

# **Python**

This is the canonical recognition service language.

---

## Why

Python is the correct choice for:

* audio processing
* ML experimentation
* inference logic
* future recognition iteration
* practical implementation speed

---

# 6.4 Recognition Tooling

## Canonical Tooling

Use:

* **Python**
* **Librosa**
* **NumPy**
* **scikit-learn**

### Optional only if truly needed:

* **PyTorch**

---

## Hard Rule

Do NOT introduce PyTorch unless the recognition path actually requires it.

The default MVP assumption should be:

# **you can probably solve V1 without heavy deep learning**

That is good news, not a limitation.

---

# 6.5 Recommended MVP Recognition Method

## Canonical V1 Path

Use:

# **feature-vector / embedding-based nearest-match classification**

Recommended V1 logic:

* extract audio features from each training sample
* compare live input to stored user-specific examples
* compute nearest candidate(s)
* return:

  * top prediction
  * confidence score
  * optional top-N alternatives

---

## Recommended V1 Feature Strategy

Start with:

* MFCC-based features
* spectral features
* lightweight similarity scoring

Only escalate if needed.

---

## Hard Rule

Do NOT start by building a giant “ML system.”

Start by building a **working personalized matcher**.

That is the correct technical move.

---

# 6.6 Confidence Scoring (Mandatory)

This is mandatory.

The recognition service must always return:

* predicted sound card
* confidence score
* confidence bucket
* optional top candidate list

---

## Why This Is Mandatory

The frontend product flow depends on it for:

* high-confidence auto output
* medium-confidence candidate selection
* low-confidence retry / fallback behavior

Without confidence logic, the UX breaks.

So confidence output is not optional.

---

# 7. Backend Architecture

TalkBridge does not need a “startup backend system” in MVP.

It needs a clean, minimal service architecture.

---

# 7.1 Canonical Backend Shape

The MVP backend must use:

## Layer A — App Data Layer

For:

* auth
* profiles
* categories
* sound cards
* history
* settings
* storage metadata

## Layer B — Recognition Service Layer

For:

* audio processing
* training sample handling
* recognition inference
* confidence scoring
* correction ingestion if needed

That is the whole backend shape.

Do NOT split this into more architecture unless forced.

---

# 7.2 Required Backend Platform

## Required

Use:

# **Supabase**

for app backend and storage.

---

## Supabase Must Be Used For

* authentication
* Postgres database
* storage
* row-level security
* app data access

---

## Why Supabase Is Locked

Supabase is the correct MVP backend because it gives:

* relational data
* auth
* storage
* security primitives
* fast iteration
* clean mobile compatibility

---

## Do NOT Use

* Firebase as the main stack
* custom Node backend for everything
* microservices
* Docker-heavy architecture
* distributed backend patterns

Not for MVP.

---

# 7.3 API Strategy

## Canonical API Split

### Use Supabase Directly For:

* auth
* profiles
* categories
* sound cards
* settings
* history
* standard user-owned CRUD

### Use Thin Python API For:

* training uploads
* recognition requests
* correction ingestion
* model / sample processing logic

This is the correct split.

---

## Hard Rule

Do NOT put all app logic into a custom backend if Supabase already handles it cleanly.

That is wasted complexity.

---

# 8. Recognition Service

This is the dedicated inference/service layer.

---

# 8.1 Recognition Service Framework

## Required

Use:

# **FastAPI**

This is the canonical recognition service framework.

---

## Do NOT Use

* Flask (unless there is a very specific blocker)
* Django
* serverless spaghetti for inference routing

FastAPI is the correct MVP choice.

---

# 8.2 Recognition Service Responsibilities

The FastAPI service is responsible for:

* accepting training sample uploads / references
* processing recognition requests
* computing candidate matches
* returning confidence-aware results
* ingesting correction-related updates if needed
* exposing only the minimum necessary inference endpoints

---

## Hard Rule

This service is for **recognition logic**, not for becoming a second product backend.

Keep it narrow.

---

# 8.3 Canonical MVP Endpoints (Conceptual)

The recognition service should conceptually support:

* `POST /train-sample`
* `POST /recognize`
* `POST /correction`
* optional `POST /recompute-card-profile`

Only add endpoints that directly support the MVP loop.

---

# 9. Database Layer

## Required

Use:

# **Supabase Postgres**

This is the canonical relational data layer.

---

## Why

TalkBridge needs structured relational storage for:

* users/profiles
* categories
* sound cards
* samples
* recognition events
* corrections
* history
* settings

This is relational product data.
Use relational storage.

---

## Important Rule

The schema itself is governed by:

# `DATABASE_SCHEMA.md`

Do NOT let implementation invent schema outside that file.

---

# 10. File / Audio Storage

Audio is core product data.

It must be stored cleanly and securely.

---

# 10.1 Required Storage Layer

## Required

Use:

# **Supabase Storage**

---

## Audio That Must Be Stored

* training audio samples
* recognition input audio (if retained)
* optional processed audio references if required later

---

## Storage Rules

Audio storage must support:

* user-specific isolation
* secure access
* predictable path structure
* clean delete / replace behavior

---

## Hard Rule

Do NOT rely on:

* random local temp files as primary truth
* unsynced folder chaos
* ad-hoc file naming
* public-open audio access

That is how you lose data and privacy.

---

# 11. Authentication

Authentication must exist, but it must not become a friction machine.

---

# 11.1 Required Auth Strategy

## Required

Use:

# **Supabase Auth**

---

## MVP Auth Method

Use:

# **Email + password**

This is the canonical MVP auth method.

---

## Optional Later

* magic link
* phone auth

These are not required for V1.

---

## Do NOT Build

* OAuth overload
* Google/Apple auth complexity first
* multi-role enterprise auth
* org/workspace permission systems

That is scope drift.

---

# 12. Offline / Connectivity Strategy

This is product-critical.

TalkBridge must remain useful under weak or failed internet conditions.

---

# 12.1 MVP Offline Principle

The app must support:

# **partial offline usability**

even if full offline recognition is not implemented in V1.

---

## 12.2 Offline MVP Must Preserve

If internet is weak or unavailable, the user must still be able to:

* open the app
* access saved sound cards
* browse categories
* use manual fallback communication
* access emergency communication
* use cached settings / profile basics

That is mandatory.

---

## 12.3 Offline MVP May Delay

The MVP may postpone:

* full offline inference
* full local model execution
* full sync engine complexity
* offline conflict resolution engine

Those are not V1 blockers.

---

## Hard Rule

The app must **not** become useless just because cloud recognition is unavailable.

If recognition fails, fallback must still work.

---

# 13. Local Device Storage

The app needs lightweight local persistence.

---

# 13.1 Required Local Storage

## Required

Use:

# **AsyncStorage**

for MVP local persistence.

---

## Optional Later

* **MMKV** only if performance actually demands it

Do NOT start with MMKV unless necessary.

---

## Local Data That Must Be Cached

Store locally at minimum:

* onboarding state
* settings
* categories
* sound card metadata
* favorites / recents
* minimal profile state
* enough app data for partial offline usability

---

## Hard Rule

Do NOT try to build a giant local-first sync engine in V1.

Cache what matters. Ship the product.

---

# 14. Analytics / Product Instrumentation

The app must collect enough data to improve the product.

But not surveillance junk.

---

# 14.1 Canonical MVP Analytics Tool

## Required

Use:

# **PostHog**

for MVP product analytics.

---

## Why

PostHog is sufficient for:

* funnel visibility
* onboarding drop-off
* recognition usage
* correction behavior
* product loop learning

---

## Must Track At Minimum

* onboarding completion
* sound card creation count
* training completion
* recognition attempts
* confidence bucket distribution
* correction frequency
* fallback usage frequency
* category usage
* emergency usage

---

## Hard Rule

Track product behavior, not creepy over-collection.

---

# 15. Error Logging / Monitoring

This is mandatory.

Audio products fail in messy ways.
You need visibility.

---

# 15.1 Canonical Monitoring Tool

## Required

Use:

# **Sentry**

---

## Must Capture

* app crashes
* recording failures
* playback failures
* microphone permission issues
* runtime exceptions
* inference request failures
* failed recognition API responses

---

## Hard Rule

Do NOT ship an audio-heavy assistive app without crash/error monitoring.

That would be reckless.

---

# 16. Testing Strategy

The MVP does not need enterprise QA theater.

But it absolutely needs enough testing to avoid obvious breakage.

---

# 16.1 Frontend Testing

## Required Minimum

The frontend must be tested for:

* onboarding flow
* training flow
* live recognition UI flow
* confidence result handling
* correction flow
* manual fallback flow
* emergency flow

---

## Required Test Types

At minimum:

* manual device testing on Android
* component-level testing for critical UI
* core interaction sanity tests

---

# 16.2 Backend / Recognition Testing

## Required

The recognition/backend layer must validate:

* upload handling
* audio processing behavior
* response format correctness
* confidence output presence
* candidate result formatting
* correction endpoint behavior

---

## Hard Rule

Do NOT ship the recognition layer unless it reliably returns the shape the frontend expects.

A “working model” with broken integration is still broken.

---

# 17. Deployment Strategy

Deployment must be simple and practical.

Not “impressive.”

---

# 17.1 Mobile Delivery

## Required

Use:

# **Expo EAS Build**

for app build and delivery.

This is the canonical mobile delivery path.

---

# 17.2 Recognition Service Deployment

## Required

Deploy the FastAPI recognition service using one of:

* **Railway**
* **Render**

Choose one.
Do not build infra complexity.

---

## Hard Rule

Do NOT use:

* Kubernetes
* ECS complexity
* self-hosted infra theater
* distributed service nonsense

That is not MVP work.

---

# 18. Security and Privacy Constraints

TalkBridge stores highly personal communication data.

That means privacy is a baseline requirement.

---

# 18.1 Required Privacy Practices

The stack must enforce:

* secure authentication
* private user-owned data access
* secure audio storage
* row-level access control
* no public access to private recordings
* minimal exposure of raw audio and recognition data

---

## Hard Rule

User vocal recordings must be treated as sensitive personal communication data.

Not as disposable app assets.

---

# 19. Technical Hard Rules

These are non-negotiable.

---

## The MVP must NOT:

* depend on giant cloud AI pipelines
* require GPU infra by default
* require internet for all basic communication behavior
* split into too many services
* use infra that needs DevOps babysitting
* optimize for scale before proving usefulness
* become an AI architecture vanity project

---

## The MVP must:

* be simple to build
* be simple to test
* be simple to ship
* support user-specific sound recognition
* support fallback when recognition fails
* remain practical under imperfect conditions

---

# 20. Canonical Stack Summary

## Frontend

* React Native
* Expo
* TypeScript
* NativeWind
* React Navigation
* Zustand

---

## Audio / Speech

* Expo AV
* native TTS integration

---

## Backend / Data

* Supabase Auth
* Supabase Postgres
* Supabase Storage

---

## Recognition / AI

* Python
* FastAPI
* Librosa
* NumPy
* scikit-learn
* optional PyTorch only if required

---

## Local Storage

* AsyncStorage
* optional MMKV later only if needed

---

## Analytics / Monitoring

* PostHog
* Sentry

---

## Deployment

* Expo EAS Build
* Railway or Render

---

# 21. Final Technical Direction

TalkBridge MVP must be built as a:

# **mobile-first, Android-first, user-specific audio-recognition communication app**

using a stack that is:

* simple
* reliable
* fast to ship
* fast to iterate
* resistant to technical overengineering

The stack exists to serve the product.

The stack must never become the product.
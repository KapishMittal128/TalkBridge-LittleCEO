# EXECUTION_PLAN.md — TalkBridge

## 1. Purpose

This document defines the **authoritative build order, execution rules, completion gates, sequencing discipline, and phase-control logic** for TalkBridge MVP.

This file exists to ensure:

* development happens in the correct order
* the AI does not build out of sequence
* product-critical value is built before polish
* no fake progress is accepted
* validation happens early
* the MVP is built as a usable product, not a pile of partial features

This is **not** a vague roadmap.

This is a:

# **build-order and execution-control file**

If a task is not aligned with this document’s current phase and rules:
**it should not be worked on yet**.

If implementation conflicts with this file:
**this file wins**.

---

# 2. Core Execution Philosophy

TalkBridge must be built under these non-negotiable principles.

---

## 2.1 Build Core Value First

The app must prove its communication value before anything else.

If the user cannot communicate better, the build is failing.

---

## 2.2 Build the Smallest Useful Product

Do not build the “full vision.”

Build the **smallest version that is genuinely useful**.

---

## 2.3 Reliability Before Expansion

A smaller reliable app is more valuable than a broader unstable one.

---

## 2.4 Product Loop Before Optimization

The product loop must work before:

* performance tuning
* feature expansion
* UI polish
* “AI upgrades”
* future-proofing

---

## 2.5 No Cosmetic Progress

Do not confuse:

* animation
* polish
* extra screens
* visual complexity
* AI theatrics

with actual product progress.

A pretty broken app is still broken.

---

## 2.6 No Mega-Building

The app must not be built in giant uncontrolled “full product” passes.

Work must happen in:

# **controlled execution units**

Build one meaningful thing at a time.

---

# 3. Canonical MVP Build Goal

The MVP build goal is:

# **Create a usable mobile app that allows a user to train custom vocal sounds and use them to communicate meaningfully in daily life.**

That is the only build goal.

If a task does not directly support that goal, it is likely not worth doing in MVP.

---

# 4. Canonical Build Order

TalkBridge MVP must be built in **6 mandatory phases**:

1. **Foundation Setup**
2. **Core Data and UI Skeleton**
3. **Sound Card Training System**
4. **Live Recognition System**
5. **Correction + Fallback + Usage Reliability**
6. **Stabilization + Testing + MVP Lock**

This order is mandatory.

Do NOT skip forward.
Do NOT partially build future phases early.

---

# 5. Global Execution Rules

These rules apply across all phases.

These are mandatory.

---

# 5.1 One Active Phase Rule

At any given time, the build must have:

# **one active phase only**

Do not mix Phase 2 + Phase 4 + Phase 6 work in the same uncontrolled build pass.

---

# 5.2 No Forward Leakage Rule

Do NOT build future-phase logic early “just because it’s convenient.”

Examples of forbidden leakage:

* adding correction scaffolding during Phase 2
* building confidence branching before recognition exists
* adding polish systems before core flows work
* building analytics dashboards before communication works

If a future system is not needed for the current phase to function, do not build it yet.

---

# 5.3 Completion Means Working, Not Existing

A phase is **not complete** because:

* files exist
* screens exist
* endpoints exist
* placeholders exist

A phase is complete only if:

# **the intended user-facing or system-facing behavior actually works**

This rule is critical.

---

# 5.4 Build Small, Validate Fast

Within each phase:

* build one flow or subsystem
* validate it
* stabilize it
* then continue

Do not stack five unfinished systems and call it momentum.

That is how weak products are born.

---

# 5.5 No Hidden Dependency Chaos

Do not build a phase in a way that creates:

* invisible coupling
* fragile state assumptions
* future-phase dependency traps
* backend/frontend mismatch

Every phase must leave the system cleaner, not more tangled.

---

# 6. Execution Unit Rule

All work must happen in controlled execution units.

This is mandatory.

---

## 6.1 Definition of an Execution Unit

An execution unit is:

# **one buildable, testable, meaningful piece of progress**

Examples:

* auth flow working
* sound card CRUD working
* sample recording flow working
* recognition request returning valid result
* correction flow working

Bad execution unit:

> “Build most of the app”

That is not an execution unit.
That is chaos.

---

## 6.2 Hard Rule

Each execution unit must end with:

* visible output
* working behavior
* verifiable completion

If it cannot be verified, it is not done.

---

# 7. Required Pre-Work Rule (Before Every Major Build Step)

Before every major build step, the system must re-check:

* `PRD.md`
* `APP_FLOW.md`
* `TECH_STACK.md`
* `DATABASE_SCHEMA.md`
* `EXECUTION_PLAN.md`

And if the task is UI-heavy, also re-check:

* `DESIGN_SYSTEM.md`

Do NOT rely on memory alone.

This is mandatory to prevent drift.

---

# 8. Phase 1 — Foundation Setup

## Objective

Establish the project foundation and technical scaffolding cleanly.

This phase exists to create a **stable base**, not to create fake progress.

---

# 8.1 Phase 1 Success Definition

Phase 1 is successful only if the app is:

* bootable
* connected
* structurally ready
* stable enough to build on

Nothing more.

---

# 8.2 Required Deliverables

### Project Setup

* initialize Expo app
* configure TypeScript
* configure navigation
* configure Zustand
* configure NativeWind / token styling base
* configure environment variables
* connect Supabase project
* scaffold FastAPI recognition service

### Core Infrastructure

* app boots cleanly
* auth connection works
* navigation works
* local persistence works
* backend connectivity works
* microphone permission request works

---

# 8.3 What Must Be Built in Phase 1

### Frontend

* app shell
* navigation shell
* screen placeholders for major routes
* theme / token foundation
* base layout primitives

### Backend / Services

* Supabase client integration
* auth wiring
* storage wiring
* recognition API skeleton

### Local Device

* microphone permission flow
* AsyncStorage wiring

---

# 8.4 What Must NOT Be Built in Phase 1

Do NOT build yet:

* final UI polish
* recognition logic
* sound training UX
* correction logic
* analytics layer
* candidate ranking UI
* history logic
* performance tuning
* post-MVP features

This phase is scaffolding only.

---

# 8.5 Phase 1 Exit Criteria

Phase 1 is complete only when all of the following are true:

* app launches without structural errors
* navigation is stable
* auth works end-to-end
* Supabase connectivity works
* local storage works
* microphone permission flow works
* project structure is clean enough to continue

If any of these are unstable:
do not proceed.

---

# 9. Phase 2 — Core Data and UI Skeleton

## Objective

Build the structural app shell, user journey skeleton, and core product surfaces **without recognition intelligence yet**.

This phase exists to make the app feel like a real product skeleton.

---

# 9.1 Phase 2 Success Definition

Phase 2 is successful only if a user can move through the app and the core product surfaces exist in usable structural form.

This is not the “smart” phase.
This is the “shape of the product” phase.

---

# 9.2 Required Deliverables

### Required Screens / States

* Welcome / Intro
* User Type Selection
* Language Selection
* Quick Start Setup
* Home
* Categories
* Add Sound Card
* Sound Card Detail
* History
* Settings
* Emergency Access

### Required Core Data Behavior

* profile creation
* category seeding
* sound card CRUD
* settings persistence
* basic local cache hydration

---

# 9.3 What Must Be Built in Phase 2

### Frontend

* screen routing
* reusable UI primitives
* sound card list / detail UI
* category UI
* empty states
* home layout
* settings shell

### Backend / Data

* profiles integration
* categories integration
* sound_cards CRUD
* settings CRUD
* local cache wiring

---

# 9.4 What Must NOT Be Built in Phase 2

Do NOT build yet:

* recognition pipeline
* confidence logic
* candidate ranking
* correction system
* model scoring behavior
* analytics dashboards
* future AI features

This phase is structural only.

---

# 9.5 Phase 2 Exit Criteria

Phase 2 is complete only when:

* onboarding path exists structurally
* user can create and view sound cards
* categories work
* settings persist
* home feels coherent
* navigation makes sense
* the app already resembles the intended product

If the app still feels like disconnected screens, Phase 2 is not done.

---

# 10. Phase 3 — Sound Card Training System

## Objective

Build the user-specific training loop that allows the product to learn meaningful sounds.

This is one of the most important phases in the entire build.

If this phase is weak, the whole product becomes fake.

---

# 10.1 Phase 3 Success Definition

Phase 3 is successful only if the user can create a usable sound card with multiple associated audio examples.

This phase must make “training” real.

---

# 10.2 Required Deliverables

### Training System Must Support

* create a sound card
* record multiple samples
* save and upload samples
* attach samples to the correct sound card
* track sample count
* mark sound card readiness

---

# 10.3 What Must Be Built in Phase 3

### Frontend

* recording UI
* repeated sample capture flow
* sample progress UI
* retry / success states
* training completion state

### Backend / Storage

* sound sample metadata persistence
* secure audio upload flow
* sample count tracking
* readiness logic

### Recognition Service Prep

* sample ingestion endpoint
* preprocessing hook
* feature extraction scaffolding

---

# 10.4 What Must NOT Be Built in Phase 3

Do NOT build yet:

* live recognition flow
* confidence result UI
* candidate selection UI
* correction loop
* advanced analytics
* post-MVP AI features

This phase is training input only.

---

# 10.5 Phase 3 Exit Criteria

Phase 3 is complete only when:

* a user can create a sound card
* a user can record multiple samples
* samples are stored correctly
* sample count is correct
* readiness logic works
* the setup can end with usable training data

If training still feels clunky or fake, Phase 3 is not done.

---

# 11. Phase 4 — Live Recognition System

## Objective

Build the real-time recognition loop that makes TalkBridge actually useful.

This is where the product either becomes real or exposes itself as a toy.

---

# 11.1 Phase 4 Success Definition

Phase 4 is successful only if a user can produce a trained sound and receive a confidence-aware usable result.

This is the first true “TalkBridge moment.”

---

# 11.2 Required Deliverables

### Recognition Must Support

* live audio input
* recognition request
* matching against trained sound cards
* top prediction
* confidence score
* candidate list when needed

---

# 11.3 What Must Be Built in Phase 4

### Frontend

* Record / Speak primary action
* listening state
* processing state
* result state
* confidence-aware UI branching

### Recognition Service

* live recognition endpoint
* user-specific matching logic
* confidence bucket output
* candidate ranking output

### Backend / Data

* recognition event logging
* candidate logging
* result persistence where needed

---

# 11.4 Required Recognition UX Behaviors

### High Confidence

* direct result display
* optional auto TTS

### Medium Confidence

* top candidate selection UI

### Low Confidence

* retry prompt
* fallback suggestion

These are mandatory.
Without them, Phase 4 is incomplete.

---

# 11.5 What Must NOT Be Built in Phase 4

Do NOT build:

* sentence generation
* predictive language intelligence
* AI chat layers
* recommendation engines
* emotional inference
* “smart assistant” behavior

That is not the product.

---

# 11.6 Phase 4 Exit Criteria

Phase 4 is complete only when:

* a trained sound can be recognized
* a usable result is returned
* confidence branching works correctly
* recognition feels fast enough for actual use
* the user can experience the core TalkBridge value

If the app still feels like a demo, Phase 4 is not done.

---

# 12. Phase 5 — Correction, Fallback, and Usage Reliability

## Objective

Make the product trustworthy, recoverable, and usable even when recognition is imperfect.

This phase turns the app from a demo into a usable tool.

Without this phase, the product is fragile.

---

# 12.1 Phase 5 Success Definition

Phase 5 is successful only if the app remains useful when recognition is wrong, uncertain, or unavailable.

That is what makes it a real assistive product.

---

# 12.2 Required Deliverables

### Must Support

* correction of wrong predictions
* manual fallback communication
* favorites / recents
* usage history
* emergency quick access

---

# 12.3 What Must Be Built in Phase 5

### Frontend

* correction flow
* fallback category access
* favorites UI
* history screen
* emergency flow

### Backend / Data

* correction records
* usage history records
* favorites persistence
* recognition event updates

### Recognition Improvement Hooks

* correction-aware update hooks
* future improvement scaffolding

---

# 12.4 Why This Phase Matters

If the app only works when recognition is perfect, it will fail in real life.

This phase makes the product usable when:

* the user is tired
* the environment is noisy
* recognition is uncertain
* urgency is high
* internet is weak or unavailable

This is not optional polish.
This is trust infrastructure.

---

# 12.5 Phase 5 Exit Criteria

Phase 5 is complete only when:

* wrong predictions can be corrected quickly
* manual fallback works smoothly
* recent/frequent communication is accessible
* emergency communication is fast
* the app remains useful even when recognition fails

If the app is still brittle, Phase 5 is not done.

---

# 13. Phase 6 — Stabilization, Testing, and MVP Lock

## Objective

Stabilize the MVP, remove obvious weaknesses, and stop feature creep.

This is where you stop building fantasies and start killing weaknesses.

---

# 13.1 Phase 6 Success Definition

Phase 6 is successful only if the app can be used from setup to real communication without major breakage.

This is the “make it trustworthy” phase.

---

# 13.2 Required Deliverables

### Stabilization Must Include

* bug fixing
* crash fixing
* audio reliability improvements
* state consistency fixes
* navigation cleanup
* edge-case handling
* empty state polish
* error state polish

---

# 13.3 Required Testing Areas

The following must be tested thoroughly:

* onboarding completion
* sound card creation
* repeated sample recording
* recognition flow
* confidence branching
* correction flow
* fallback flow
* history behavior
* settings persistence
* emergency flow

---

# 13.4 Required Real-Use Testing

The product must be tested in non-ideal conditions.

### Test Conditions Must Include

* moderate background noise
* repeated usage sessions
* interrupted setup
* weak connectivity
* failed recognition
* short patience / quick-use conditions

If it only works in ideal dev conditions, it is not ready.

---

# 13.5 MVP Lock Rule

Once the core loop works reliably:

# **stop adding features**

Before adding anything new, ask:

Does this directly improve:

* training
* recognition
* correction
* communication speed
* trust
* fallback reliability

If not, it likely does not belong in MVP.

---

# 13.6 Phase 6 Exit Criteria

Phase 6 is complete only when:

* the core product loop is stable
* setup → training → recognition → correction works end-to-end
* obvious failure states are handled
* the app is usable enough for real-world MVP testing

Only then is the MVP considered build-complete.

---

# 14. Build Priority Rules

These rules apply at all times.

---

# 14.1 Always Build in This Order

### Priority Order

1. Product-critical logic
2. User trust and clarity
3. Reliability and fallback
4. Data integrity
5. Polish

This order must never be reversed.

---

# 14.2 Never Prioritize These Early

Do NOT prioritize early:

* animation polish
* “smart AI” extras
* visual gimmicks
* advanced personalization layers
* monetization systems
* collaboration systems
* growth features
* admin surfaces

These are distractions unless the core loop already works.

---

# 15. AI Build Control Rules

Because this product may be built with AI assistance, these rules are mandatory.

---

# 15.1 AI Must Not Freestyle Product Decisions

The AI must not:

* invent new flows
* add speculative features
* add extra roles or user types
* redesign core product logic
* replace the stack arbitrarily
* introduce infrastructure not justified by MVP

---

# 15.2 AI Must Build Sequentially

The AI must always work in the current phase only.

It must not:

* jump ahead
* partially build future systems
* leave current phase half-working while moving on

---

# 15.3 AI Must Verify Before Advancing

Before moving to the next phase, the AI must verify:

* required deliverables are complete
* exit criteria are satisfied
* current phase is stable enough to build on

If not, it must stay in the current phase.

This is mandatory.

---

# 16. Practical Build Sequence (Inside the Phases)

This is the recommended implementation order inside the full execution plan.

---

## Step 1

Project setup + app shell

## Step 2

Navigation + auth + profile setup

## Step 3

Core screens + categories + sound card CRUD

## Step 4

Audio recording + sample storage

## Step 5

Training flow completion

## Step 6

Recognition API + live recognition UI

## Step 7

Confidence handling + output display

## Step 8

Correction flow + fallback mode

## Step 9

History + favorites + emergency

## Step 10

Testing + stabilization + MVP lock

This is the correct practical build order.

Do not improvise a different one without reason.

---

# 17. Completion Integrity Rule

A task or phase may only be marked complete if:

* the code exists
* the flow works
* the UI behavior works
* the data behavior works
* the output can be verified

If a feature is only “mostly there,” it is not complete.

Do not lie to yourself with checkbox theater.

---

# 18. Final Execution Principle

TalkBridge must be built like a:

# **serious assistive communication product**

not like a demo, not like a hackathon app, and not like a startup pitch prop.

That means:

* build the smallest useful thing
* make it work
* make it trustworthy
* make it resilient
* stop pretending more features means more value

The MVP succeeds only if the user can genuinely communicate better with it.

That is the only score that matters.
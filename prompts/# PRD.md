# PRD.md — TalkBridge

## 1. Product Name

# TalkBridge

---

# 2. Product Definition

TalkBridge is a **personalized assistive communication mobile app** that learns a user’s unique vocal sounds and translates them into understandable text and optional speech output.

It is built for users who can produce **intentional, repeatable vocalizations**, but whose communication is not easily understood by unfamiliar listeners.

TalkBridge is:

* **not** generic speech-to-text
* **not** a tap-only AAC board
* **not** a speech therapy platform
* **not** a medical diagnosis tool

TalkBridge is a:

# **user-specific sound-to-meaning communication system**

That is the product.

---

# 3. Core Product Thesis

## Primary Thesis

If a user can produce a vocal sound consistently enough to attach meaning to it, TalkBridge should be able to learn and recognize it.

The system does **not** need to understand “correct speech.”
It needs to understand:

> **what this user means when they make this sound**

## Secondary Thesis

The best version of this product is not the one with the most AI.

It is the one that is:

* fastest to use
* easiest to trust
* easiest to train
* easiest to rely on daily

---

# 4. Problem Statement

Many people can think clearly, communicate intentionally, and produce meaningful vocal sounds, but are not easily understood through conventional speech.

This creates a real-world communication gap between:

## what the user means

and

## what other people understand

Current alternatives often fail because they are:

* too slow
* too rigid
* too typing-heavy
* too dependent on standard speech
* too hard to use under stress
* too dependent on family interpretation

TalkBridge exists to close that gap.

---

# 5. Product Vision

## Vision Statement

TalkBridge helps users turn their own vocal sounds into understandable communication.

## Long-Term Vision

TalkBridge should help users communicate:

* faster
* more naturally
* more independently
* with less frustration
* with less dependence on interpretation by others

## Product Experience Goal

TalkBridge should feel like:

* a communication bridge
* a translator
* a voice extension
* a practical daily-use tool

It must **not** feel like:

* a toy
* a childlike game
* a hospital utility
* a research prototype
* an “AI experiment”

---

# 6. Target Users

## 6.1 Primary User

A primary user is someone who:

* can produce repeatable vocal sounds, tones, approximated words, or utterances
* has difficulty being understood through conventional speech
* communicates intentionally
* needs a faster method than repeated failed speech or constant typing

### Example fit

The user may consistently say:

* “duk” for water
* a repeated sound for “help”
* a non-standard vocalization for “pain”
* an approximated phrase only family currently understands

---

## 6.2 Secondary User

The secondary user is a support person such as:

* caregiver
* parent
* sibling
* therapist
* aide
* teacher
* partner

They may assist with:

* setup
* training
* labeling
* correction
* organization

But the app must still feel like it belongs to the **primary user**, not the caregiver.

---

# 7. Who This Product Is NOT For

TalkBridge is not initially for:

* users who cannot produce repeatable vocalizations at all
* users whose sounds are too inconsistent to map meaning reliably
* users who only need a generic text-to-speech board
* users expecting universal zero-training speech recognition
* users looking for a full therapy / clinical platform

This product must stay narrow enough to actually work.

---

# 8. Core User Jobs To Be Done

TalkBridge must help users do the following reliably.

## Functional Jobs

* communicate basic needs quickly
* express urgency or discomfort
* say yes / no / help / stop reliably
* refer to important people or actions
* communicate without typing everything
* be understood by unfamiliar listeners

## Emotional Jobs

* feel heard
* feel less frustrated
* feel less trapped
* feel more independent
* feel more confident communicating

## Social Jobs

* communicate more clearly in:

  * home
  * school
  * clinic
  * public settings
  * transport
  * emergencies
  * daily interactions

---

# 9. Product Positioning

## Positioning Statement

TalkBridge is a personalized communication app for users whose vocal communication is meaningful but not easily understood.

## Core Positioning Angle

TalkBridge does **not** ask:

> “Can the user speak more normally?”

TalkBridge asks:

> “Can we learn how this user already communicates?”

That is the correct positioning.

---

# 10. Product Goals

## Primary Goal

Enable a user to create and use a personalized vocal communication system that helps them express frequent real-world meanings faster and more reliably than typing or repeating misunderstood speech.

## Secondary Goals

* reduce communication friction
* reduce communication fatigue
* increase daily communication confidence
* increase communication independence
* improve recognition over time through correction and repetition

---

# 11. Non-Goals (Strict)

These are **explicitly out of scope** for V1.

Do NOT build them.

TalkBridge is not trying to:

* solve all accessibility communication problems
* replace speech therapy
* perform universal impaired-speech recognition
* support full natural conversation generation
* diagnose speech conditions
* infer hidden intent from random sound
* become a medical records or therapy platform
* become a social network
* become a caregiver admin system
* become a general “AI assistant”

If the build drifts into these, it is failing.

---

# 12. Core Product Promise

TalkBridge must reliably allow the user to:

1. create custom sound-to-meaning mappings
2. train those mappings with repeated examples
3. use those sounds in real communication
4. receive understandable text and/or spoken output
5. improve recognition quality through correction over time

If the product cannot do these five things well, it is not succeeding.

---

# 13. MVP Definition

## MVP Objective

The MVP must prove one thing:

# **A user can train and use a personalized sound library that is useful in real life.**

That is the only thing the MVP needs to prove.

---

## MVP Scope (Strict)

The MVP must include:

* onboarding
* user profile creation
* sound card creation
* multiple training samples per sound
* labeled sound cards
* category organization
* personal sound library
* live sound recognition
* confidence-based prediction handling
* readable text output
* text-to-speech output
* correction loop
* manual fallback mode
* favorites / high-frequency access

Everything else is optional or out of scope.

---

# 14. MVP Success Criteria

The MVP is successful only if it proves most or all of the following.

## Usability Success

* user or caregiver can complete setup without confusion
* first usable sound cards can be created quickly
* daily use does not feel exhausting

## Communication Success

* user can reliably trigger core meanings
* app output is understandable to others
* app is usable in actual daily interactions

## Product Success

* user chooses the app over typing for at least some repeated communication tasks
* user continues using the app after initial setup
* correction improves future predictions meaningfully

If the app looks impressive but fails these, it has failed.

---

# 15. MVP Failure Conditions

The MVP should be considered unsuccessful if any of the following are consistently true:

* users abandon setup before creating a usable sound library
* recognition is too inconsistent to trust
* using the app is slower than typing or tapping
* predictions are too confusing to correct
* the app requires too much caregiver intervention for normal use
* users do not return after setup
* the product is “interesting” but not genuinely useful

These are product-killing failures.

---

# 16. Core Use Cases

These are the MVP-critical use cases.

---

## Use Case A — Basic Needs Communication

The user wants to communicate:

* water
* food
* toilet
* tired
* pain
* help

### Required Product Behavior

The user produces a trained sound.
TalkBridge recognizes it and outputs the intended meaning quickly.

---

## Use Case B — Frequent Daily Communication

The user wants to communicate:

* yes
* no
* stop
* come here
* call mom
* go outside
* not okay

### Required Product Behavior

These high-frequency meanings must be accessible and recognizable with very low friction.

---

## Use Case C — Emergency Communication

The user needs to urgently communicate:

* help
* pain
* emergency
* stop
* not okay

### Required Product Behavior

These meanings must be accessible faster than normal flows and must not require deep navigation.

---

## Use Case D — Caregiver Setup and Assistance

A caregiver needs to:

* create sound cards
* label meanings
* organize categories
* help improve recognition quality

### Required Product Behavior

This must be easy without making the product feel caregiver-owned.

---

## Use Case E — Recognition Correction

The app predicts incorrectly.

### Required Product Behavior

The user or caregiver must be able to correct the output quickly so the system improves over time.

Correction must feel simple, not punishing.

---

# 17. Product Principles

These principles govern every product decision.

## Principle 1 — Personalization First

The app must adapt to the user’s communication patterns.

## Principle 2 — Speed Over Feature Count

If a feature slows daily use, it is likely a bad feature.

## Principle 3 — Reliability Over “AI Magic”

False intelligence is worse than simple clarity.

## Principle 4 — Dignity Over Infantilization

The product must feel respectful and non-patronizing.

## Principle 5 — Fallback Always Exists

The app must remain useful when recognition is uncertain or fails.

## Principle 6 — Low Cognitive Load

The product must remain usable under stress, fatigue, urgency, and communication frustration.

---

# 18. UX Requirements

The product must be designed around these realities:

* users may have short setup tolerance
* users may fatigue quickly
* users may use the app in noisy environments
* users may need immediate communication under stress
* users may need help during setup but independence during use
* users must always understand what the app is doing

The app must avoid increasing:

* uncertainty
* delay
* confusion
* embarrassment
* over-navigation
* correction fatigue

---

# 19. Functional Requirements (MVP)

These are the MVP-critical functional requirements.

---

## 19.1 User Profile Setup

The app must allow a user or caregiver to:

* create a user profile
* choose output language
* begin communication setup

### Rules

* must be simple
* must not require unnecessary profile complexity
* must not ask for irrelevant data early

---

## 19.2 Sound Card Creation

The app must allow creation of a **Sound Card**.

Each Sound Card must include:

* label / meaning
* category
* multiple recorded audio examples
* optional icon
* required recognition metadata

Examples:

* Water
* Help
* Pain
* Call Mom

---

## 19.3 Repeated Training Samples

Each sound card must support multiple recordings of the same intended sound.

### Reason

The system must learn variation within the same user’s vocalization.

---

## 19.4 Personal Sound Library

The app must maintain a structured library of trained sounds.

It must be:

* organized by category
* easy to browse
* easy to edit
* easy to use manually if needed

---

## 19.5 Live Recognition

The app must allow the user to produce a trained sound and receive a predicted meaning.

### Requirements

* fast input flow
* fast recognition response
* clearly shown result
* confidence-aware behavior

---

## 19.6 Confidence-Based Recognition Handling

The app must behave differently depending on uncertainty level.

### High Confidence

* auto-display predicted meaning
* optionally auto-speak it

### Medium Confidence

* show top possible matches
* allow quick selection

### Low Confidence

* do not guess aggressively
* ask retry or use manual fallback

This behavior is mandatory.

Bad confidence handling destroys trust.

---

## 19.7 Text Output

Recognized meanings must be shown as large, readable text.

The output must be immediately understandable to:

* user
* caregiver
* nearby listener

---

## 19.8 Speech Output

Recognized meanings must optionally be spoken aloud via text-to-speech.

It must be:

* clear
* immediate
* replayable

---

## 19.9 Correction Loop

The app must support correction of wrong predictions.

Correction must allow:

* choosing the correct meaning
* reinforcing the intended mapping
* improving future recognition

Correction must be:

* fast
* low-friction
* obvious

---

## 19.10 Manual Fallback Mode

The app must allow the user to manually tap saved sound cards if live recognition fails.

This is not optional.

---

## 19.11 Category-Based Communication Access

The app must organize communication into usable categories.

### Minimum categories

* Basic Needs
* Feelings
* People
* Emergency
* Daily Actions

---

## 19.12 Favorites / High-Frequency Access

The app must support fast access to commonly used communication items.

Examples:

* favorites
* recents
* pinned cards

This is important for daily speed.

---

# 20. Post-MVP Features (Do Not Build Yet)

These are intentionally out of scope.

Do NOT build them in V1.

* advanced sentence grammar generation
* free-form language modeling
* therapist dashboards
* admin portals
* medical records features
* gesture / camera input
* emotion inference
* social sharing
* family collaboration systems
* universal speech recognition across all users
* complex cloud inference orchestration
* unrelated AI assistant features

If the build includes these, it is drifting.

---

# 21. Accessibility Requirements

TalkBridge must be accessible by default.

### Minimum requirements

* large readable typography
* large touch targets
* simple screen hierarchy
* minimal required typing
* low visual clutter
* clear feedback states
* high legibility
* clear action labels
* reliable fallback when recognition fails

Accessibility is not optional.
It is a product baseline.

---

# 22. Trust & Safety Requirements

Because the product is used for real communication, trust is critical.

## The app must:

* avoid deceptive confidence
* avoid fake certainty
* show clear system state
* avoid hidden failures
* never silently mislead the user
* prioritize privacy of user vocal recordings

## The app must NOT:

* pretend it understood when it did not
* hide low-confidence behavior
* create unclear output states

---

# 23. Product Constraints

The product must be useful under non-ideal conditions.

Constraints include:

* short setup tolerance
* caregiver involvement
* noisy environments
* communication under urgency or stress
* imperfect recognition early on
* usefulness before “perfect AI”

The product must not rely on ideal conditions to feel useful.

---

# 24. Product-Level Data Requirements

The product must support storage of at minimum:

* user profiles
* sound card labels
* categories
* multiple audio samples per sound card
* recognition attempts
* confidence results
* correction events
* usage frequency
* favorites / recents

Exact data structure belongs in `DATABASE_SCHEMA.md`.

---

# 25. Build Validation Questions

The final built app must answer these questions positively:

1. Can a user create meaningful sound cards without frustration?
2. Can the app recognize those sounds reliably enough to be useful?
3. Can the user communicate faster than typing or repeated failed speech?
4. Can the app remain useful when recognition is uncertain?
5. Does the app improve over time instead of feeling static?

If the product cannot answer these positively, it is not ready.

---

# 26. Launch Scope for V1

V1 must focus only on:

* personalized sound training
* custom sound dictionary
* live recognition
* confidence handling
* text output
* speech output
* correction loop
* manual fallback
* essential categories
* high-frequency access

That is enough.

Anything outside this scope is a distraction unless it directly improves reliability or usability.

---

# 27. Final Product Definition

# TalkBridge is a personalized assistive communication app that learns a user’s unique vocal sounds and translates them into understandable text and optional speech, allowing them to communicate faster, more clearly, and more independently in everyday life.

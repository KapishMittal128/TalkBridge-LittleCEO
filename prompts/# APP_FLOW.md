# APP_FLOW.md — TalkBridge

## 1. Purpose

This document defines the **exact behavioral flow, screen logic, navigation rules, state transitions, and interaction sequence** for TalkBridge.

This file is not optional guidance.

It is the **behavioral source of truth** for how the product should function.

If a build, design, or implementation decision conflicts with this file:
**this file wins**.

---

# 2. Core Behavioral Objective

TalkBridge must allow a user to:

# **communicate meaning as quickly and reliably as possible using their own trained vocal sounds**

The product flow must optimize for:

* low friction
* low cognitive load
* low hesitation
* fast access
* fast correction
* predictable behavior
* usefulness even when recognition is imperfect

The app must never make the user feel:

* lost
* trapped
* confused
* overburdened
* forced into unnecessary steps
* unsure what the system is doing

If the app causes uncertainty during communication, the flow has failed.

---

# 3. Core Product Loop (Primary Loop)

The entire app must reinforce this loop:

# **Train → Use → Correct → Improve**

This is the primary loop of the product.

Every major flow in the app must support at least one part of this loop.

If a feature does not strengthen this loop, it does not belong in MVP.

---

# 4. Core App Modes

TalkBridge operates in **4 behavioral modes**.

These are not necessarily separate tabs, but they are the primary operational states of the product.

---

## 4.1 Onboarding Mode

Used for:

* first launch
* initial setup
* first useful communication creation

---

## 4.2 Training Mode

Used for:

* creating sound cards
* adding samples
* improving existing cards

---

## 4.3 Live Communication Mode

Used for:

* real-time sound recognition
* fast communication
* output delivery

---

## 4.4 Correction / Improvement Mode

Used for:

* fixing wrong predictions
* reinforcing correct meanings
* improving reliability over time

---

# 5. Flow Priority Hierarchy

This hierarchy is critical.

If there is ever a design or implementation tradeoff, preserve this order:

## Highest Priority

1. Live Communication
2. Emergency Access
3. Fast Correction
4. Manual Fallback
5. Training
6. History / Secondary Review
7. Settings

If the app is polished but slow in live communication, it has failed.

---

# 6. Navigation Model

## Primary Navigation Pattern

The app must use a **simple bottom navigation system** with a maximum of 5 primary tabs.

### Required Tabs

1. **Home**
2. **Categories**
3. **Add**
4. **History**
5. **Settings**

This must remain simple.

Do NOT introduce:

* nested sub-navigation hell
* multiple hidden menus
* complex drawer-first navigation
* dashboard-style command surfaces

The app should be understandable in under 10 seconds.

---

# 7. Canonical Screen Inventory (MVP)

These are the required MVP screens / screen-states.

Do NOT invent unnecessary extras.

---

## 7.1 Core Screens

1. Splash / Launch
2. Welcome / Intro
3. User Type Selection
4. Language Selection
5. Quick Start Setup
6. Sound Card Training
7. Setup Completion
8. Home
9. Live Recognition State
10. Prediction Result State
11. Categories
12. Category Detail
13. Add Sound Card
14. Sound Card Detail / Edit
15. Correction
16. History
17. Settings
18. Caregiver Assistance
19. Emergency Quick Access

---

## 7.2 Important Interpretation Rule

Some of these should be implemented as **screen states / modal flows / layered interactions**, not necessarily fully separate pages.

Examples:

* Live Recognition
* Prediction Result
* Correction
* Emergency Quick Access

Do NOT over-route the app unnecessarily.

Prefer:

* simple state transitions
* lightweight transitions
* fewer navigation hops

---

# 8. App Entry Logic

---

## 8.1 Launch Decision Rule

When the app opens:

### If first-time user:

Go to → Welcome / Intro

### If returning user with completed setup:

Go to → Home

### If returning user with incomplete setup:

Resume → setup progress

The app must not dump users into a dead or confusing state.

---

# 9. First-Time User Flow

This is the onboarding path.

Its only purpose is to get the user to a **working communication state as fast as possible**.

It is not a place to explain everything.

---

## Onboarding Sequence

### Step 1

Splash / Launch

### Step 2

Welcome / Intro

### Step 3

User Type Selection

### Step 4

Language Selection

### Step 5

Quick Start Setup

### Step 6

Train Essential Sound Cards

### Step 7

Setup Completion

### Step 8

Enter Home

If onboarding feels long, it is wrong.

---

# 10. Splash / Launch Flow

## Purpose

* initialize app
* load user state
* route correctly

## Rules

* must be fast
* must not become a branding vanity screen
* should transition within ~1–2 seconds unless actual loading requires more

## Must Not

* show decorative intro animation
* block user unnecessarily
* introduce product explanation here

---

# 11. Welcome / Intro Flow

## Purpose

Make the product immediately understandable.

The user must understand in one glance:

> “This app helps you teach your sounds so others can understand you.”

---

## Required UI

* app name
* short plain-language explanation
* primary CTA: **Start Setup**
* optional CTA: **Already Set Up**

---

## Must Avoid

* technical AI wording
* medical framing
* feature overload
* onboarding essay screens

This screen must reduce hesitation, not create it.

---

# 12. User Type Selection Flow

## Purpose

Determine setup framing.

### Options

1. **I am the user**
2. **I am helping someone**

---

## Why This Exists

This changes:

* wording tone
* setup framing
* edit expectations
* caregiver assistance affordances

---

## Rules

* must be simple
* must not permanently lock the app into one mode
* must be changeable later in settings

---

# 13. Language Selection Flow

## Purpose

Choose the output language for:

* displayed communication text
* text-to-speech output

---

## Rules

* must be quick
* must not ask for excessive locale complexity
* must remain editable later

---

## UX Requirement

Language selection must not feel like “app configuration.”
It should feel like a quick personalization step.

---

# 14. Quick Start Setup Flow

This is one of the highest-leverage flows in the entire app.

If this flow is weak, users will abandon before value appears.

---

## 14.1 Quick Start Goal

The user must reach a **useful first communication state** as fast as possible.

The app must not ask them to build their full vocabulary on day one.

---

## 14.2 MVP Setup Strategy

The app must start with **5 essential starter meanings**:

1. Water
2. Food
3. Toilet
4. Help
5. Pain

These exist to create immediate practical value.

---

## 14.3 Setup UX Rules

The setup flow must:

* feel guided
* feel short
* feel encouraging
* feel useful quickly

It must NOT feel like:

* account setup bureaucracy
* a long form
* a technical training workflow
* a burden

---

## 14.4 Required Setup Structure

Prefer:

* one card at a time
* clear progress
* obvious next action
* no dashboard overload

The user must never ask:

> “How much more do I have to do before this works?”

---

# 15. Sound Card Training Flow

This is the core creation loop of the product.

It must be extremely simple.

---

## 15.1 Flow Goal

Allow the user to attach one meaning to one repeatable vocal sound.

Example:
Meaning = **Water**

The user records the sound they use for “Water” several times.

---

## 15.2 Training Sequence

### Step 1 — Show Meaning

Display:

* target meaning
* optional icon
* optional context hint

### Step 2 — Record Sample

User taps large record button and produces their sound.

### Step 3 — Save Sample

System captures and stores the sample.

### Step 4 — Repeat

User records additional examples of the same meaning.

### Step 5 — Mark Ready

Once enough usable examples exist, the sound card becomes usable.

---

## 15.3 MVP Training Minimum

Each sound card must support:

# **3–5 usable recordings minimum**

This is mandatory in MVP.

Anything lower is too brittle.

---

## 15.4 Training UX Rules

The training flow must:

* use one clear action at a time
* show progress visibly
* confirm sample capture
* allow retry when needed
* avoid hidden state changes

---

## 15.5 Training Must NOT Require

* long typing
* advanced settings
* waveform editing
* technical understanding
* manual file handling

This is a communication tool, not audio software.

---

# 16. Setup Completion Flow

## Purpose

Signal clearly that the app is now useful.

The user must leave this screen feeling:

> “I can use this now.”

---

## Required UI

* short success confirmation
* CTA: **Try Talking**
* CTA: **Add More Sounds Later**

---

## Must Avoid

* fake celebration
* gamified nonsense
* long next-step explanations

This is a transition into use, not a reward screen.

---

# 17. Home Flow (Primary Daily Screen)

This is the most important screen in the product.

It must optimize for:

# **speed, confidence, and repeat daily use**

If the Home screen is weak, the app is weak.

---

## 17.1 Home Screen Must Provide Immediate Access To

* live recognition
* favorites / high-frequency phrases
* categories
* emergency communication
* last communication output

---

## 17.2 Home Layout Priority

### A. Primary Live Action

Large, visually dominant **Record / Speak** action

### B. High-Frequency Access

Favorites / recent phrases / pinned items

### C. Category Shortcuts

* Basic Needs
* Feelings
* People
* Emergency
* Daily Actions

### D. Last Output Display

Most recent recognized or selected meaning

### E. Emergency Shortcut

Always visible and quickly reachable

---

## 17.3 Home UX Hard Rules

### Must Prioritize

* one-tap recognition access
* obvious hierarchy
* low clutter
* large touch targets
* visual calm

### Must NOT Become

* a feed
* an analytics dashboard
* a control panel
* a widget graveyard

If too many things compete visually, the screen has failed.

---

# 18. Live Recognition Flow (Most Critical Real-Time Flow)

This is the most important real-time product behavior.

If this feels unreliable, confusing, or slow:
the product fails.

---

## 18.1 Trigger

User taps the large **Record / Speak** button from Home.

---

## 18.2 Immediate System Response

The app must **instantly** enter a visible **Listening** state.

---

## 18.3 Listening State Must Show

* active mic state
* clear visual listening feedback
* optional prompt if helpful

The user must never wonder:

> “Is it listening?”

That is unacceptable UX.

---

## 18.4 Capture Rule

The system captures the user’s vocal sound and immediately transitions to processing.

No dead intermediate state.

---

# 19. Processing Flow

## Purpose

Show that the system is actively working.

---

## Required Processing Behavior

The app must show:

* clear processing feedback
* short loading state
* stable visual continuity

---

## Must Avoid

* frozen-feeling screen
* dead silence
* ambiguous loading
* long unexplained delay

The user must always know:

> “The app heard me and is trying to understand.”

---

# 20. Prediction Result Logic (Trust-Critical)

This is a trust-critical flow.

It must behave according to confidence level.

This is non-negotiable.

---

## 20.1 Required Confidence States

1. **High Confidence**
2. **Medium Confidence**
3. **Low Confidence**

These must drive different behavior.

Do NOT collapse them into one generic result screen.

---

# 21. High Confidence Flow

## Trigger

The system strongly believes one meaning is correct.

---

## Required Behavior

The app should:

* display the meaning clearly
* optionally auto-speak it
* allow replay
* allow correction

---

## UX Goal

This flow should feel:

* fast
* confident
* calm
* low-friction

---

## Example

User produces trained sound for water
Output:

> “I want water.”

---

# 22. Medium Confidence Flow

## Trigger

The system is uncertain between a few likely meanings.

---

## Required Behavior

The app must show:

* top 2–3 likely matches
* large tappable choices
* optional replay

---

## Example

Possible matches:

* Water
* Juice
* Toilet

User taps intended meaning.

---

## Why This Matters

This preserves trust while keeping communication fast.

Do NOT auto-speak medium-confidence guesses without confirmation.

---

# 23. Low Confidence Flow

## Trigger

The system cannot confidently map the sound.

---

## Required Behavior

The app must NOT pretend it understood.

It must show:

* “Didn’t understand” or equivalent
* Retry action
* Manual fallback action
* optional “add more training” prompt

---

## Absolute Hard Rule

The app must never output random guesses as if they are correct.

That would permanently damage trust.

---

# 24. Final Output Flow

Once a meaning is confirmed or selected, the app must output it clearly.

---

## Required Output Behavior

The output must be shown as:

* large readable text
* optionally spoken aloud
* replayable if relevant

---

## Output UI Must Include

* final meaning
* replay action
* correction action
* return/home action

---

## Output Must Be Readable To

* the user
* a nearby person
* a caregiver
* a stranger in a real interaction

This is communication, not just UI display.

---

# 25. Text-to-Speech Flow

## Required TTS Behavior

When enabled, the app must:

* speak quickly
* speak clearly
* support replay
* support mute / disable in settings

---

## UX Rule

TTS must feel useful, not intrusive.

Do not overplay or force sound unexpectedly.

---

# 26. Correction Flow (Mandatory Improvement Loop)

This is one of the most important loops in the product.

If correction is tedious, the system will not improve enough to stay useful.

---

## 26.1 Correction Trigger Sources

Correction must be possible from:

* wrong high-confidence result
* medium-confidence choice flow
* low-confidence recovery
* history
* sound card detail

---

## 26.2 Correction Sequence

### Step 1

User or caregiver taps **Wrong? / Correct**

### Step 2

User selects intended meaning

### Step 3

System logs:

* original prediction
* corrected meaning
* audio reference
* confidence state

### Step 4

Optional prompt:

> “Add another sample for better recognition?”

### Step 5

Return quickly to communication flow

---

## 26.3 Correction UX Rules

Correction must be:

* fast
* low-effort
* non-technical
* non-punitive
* emotionally lightweight

Correction must not feel like:

> “Now I have to train the AI again.”

That is terrible product behavior.

---

# 27. Manual Fallback Flow (Mandatory Safety Net)

This is mandatory.

The app must remain useful even when recognition fails.

---

## 27.1 Fallback Access Points

The user must always be able to manually access meanings through:

* Home
* Categories
* Favorites
* Emergency access

---

## 27.2 Fallback Sequence

1. User opens category / favorites / emergency
2. User taps intended sound card / phrase
3. App displays and optionally speaks it

---

## Why This Is Core

Manual fallback is not a backup gimmick.

It is a trust-preserving product pillar.

If recognition is imperfect but fallback is strong, the product still works.

---

# 28. Categories Flow

The app must support structured browsing of the communication library.

---

## 28.1 Categories Screen Purpose

Allow the user to access saved communication by grouped meaning.

---

## 28.2 Required MVP Categories

* Basic Needs
* Feelings
* People
* Emergency
* Daily Actions

---

## 28.3 Categories Screen Rules

Must be:

* easy to scan
* easy to tap
* visually simple
* low-density

---

## 28.4 Category Detail Behavior

Each category screen must allow:

* tap to output
* tap to edit (if allowed)
* optional quick actions

Do NOT overcomplicate this into file-manager behavior.

---

# 29. Add Sound Card Flow

Users and caregivers must be able to grow the communication system over time.

---

## 29.1 Add Entry Points

Must be accessible from:

* Home
* Categories
* Add tab
* relevant contextual actions

---

## 29.2 Add Sound Card Sequence

### Step 1

Choose or enter meaning

### Step 2

Choose category

### Step 3

Record multiple examples

### Step 4

Save card

### Step 5

Card becomes usable immediately

---

## 29.3 Add Flow Rules

This flow must feel:

* lightweight
* fast
* repeatable
* non-bureaucratic

Do NOT turn adding communication into a heavy admin task.

---

# 30. Sound Card Detail / Edit Flow

Each sound card must support maintenance and improvement.

---

## 30.1 Sound Card Detail Must Show

* label / meaning
* category
* sample count
* last used
* optional quality / readiness signal
* edit actions

---

## 30.2 Edit Actions Must Support

* rename meaning
* change category
* add more training samples
* delete card
* optional sample playback

This is necessary for real product upkeep.

---

# 31. History Flow

History exists for practical review, not analytics theater.

---

## 31.1 History Must Support

* reviewing recent outputs
* repeating recent communication
* seeing recent corrections
* spotting weak phrases

---

## 31.2 Hard Rule

Do NOT turn History into:

* analytics dashboard
* charts page
* performance metrics vanity screen

This is a utility surface, not a product flex surface.

---

# 32. Settings Flow

Settings must remain minimal and practical.

---

## 32.1 Settings Must Include

* output language
* speech on/off
* caregiver assistance access
* profile basics
* accessibility preferences
* reset / data controls (if included)

---

## 32.2 Must Avoid

* model jargon
* advanced technical settings
* “AI tuning” nonsense
* settings clutter

---

# 33. Caregiver Assistance Flow

This must exist because it reflects real usage.

But it must not dominate product identity.

---

## Caregiver Assistance Must Allow

* adding/editing sound cards
* helping with setup
* improving training
* assisting correction
* organizing categories

---

## Hard Rule

The app must still feel like it belongs to the user, not the helper.

That distinction matters.

---

# 34. Emergency Flow (High Priority Path)

This is a critical usability path.

It must be fast, obvious, and always accessible.

---

## 34.1 Emergency Access Requirements

Emergency communication must be reachable from:

* Home
* Categories
* other quick access surfaces if appropriate

---

## 34.2 Required Emergency Items

* Help
* Pain
* Stop
* Emergency
* Not Okay

---

## 34.3 Emergency Interaction Rules

Emergency actions must:

* require minimal taps
* use large targets
* output immediately
* avoid confirmation delays

This path must optimize for urgency, not elegance.

---

# 35. Empty States

The app must behave clearly when data is sparse or absent.

---

## Required Empty States

### No Sound Cards Yet

> “Add your first sound.”

### No History Yet

> “Your recent communication will appear here.”

### No Favorites Yet

> “Pin your most-used sounds for faster access.”

---

## Hard Rule

Empty states must guide action.

They must not sit there like dead screens.

---

# 36. Error State Rules

The app must handle failure clearly and calmly.

---

## Required Error Types

* recording failure
* recognition failure
* save failure
* playback failure

---

## Error UX Rules

Errors must:

* explain simply
* suggest the next action
* avoid technical jargon
* never trap the user

This app must fail gracefully.

---

# 37. Visible System States (Mandatory)

The user must always know what the app is doing.

This is mandatory.

---

## Required Visible States

* Ready
* Listening
* Processing
* Predicted
* Needs Confirmation
* Didn’t Understand
* Saved
* Error

If the app has hidden internal state, the UX is weak.

---

# 38. UX Performance Expectations

From the user’s perspective, the app must feel:

* fast to open
* fast to record
* fast to respond
* fast to retry
* light to navigate

The app must not feel:

* sluggish
* bloated
* animation-heavy
* over-layered

This is especially important because users may rely on it under urgency or stress.

---

# 39. UX Hard Rules (Non-Negotiable)

## The app must NOT:

* hide the main communication action
* force unnecessary taps
* force typing for common communication
* auto-guess aggressively at low confidence
* bury emergency actions
* overcomplicate setup
* overload Home
* behave inconsistently across flows

---

## The app must:

* make the main action obvious
* support fast recovery
* preserve trust
* remain useful even when recognition is imperfect

---

# 40. Final Canonical User Journey

The intended MVP journey is:

1. User opens app
2. User completes fast guided setup
3. User trains essential sound cards
4. User enters Home
5. User uses live recognition or manual fallback
6. App outputs understandable communication
7. User or caregiver corrects if needed
8. System improves over time

That is the product.

Everything in the MVP must support this journey directly.

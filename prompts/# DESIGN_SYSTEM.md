# DESIGN_SYSTEM.md — TalkBridge

## 1. Purpose of This Document

This document defines the **complete UI system, interaction rules, accessibility standards, component behavior, visual tokens, and product feel** for TalkBridge.

This is **not** a moodboard.
This is **not** a vague inspiration file.
This is a **build-enforceable design system**.

All UI, UX, layout, component, and interaction decisions must follow this document.

If there is a conflict between “what looks cool” and this document:
**this document wins**.

---

# 2. Product Context

TalkBridge is a **communication assistance tool** used in situations where speed, clarity, trust, and low-friction interaction matter more than visual novelty.

It is designed for users who may be interacting under:

* communication difficulty
* time pressure
* stress
* low patience
* motor/cognitive fatigue

This means the design must behave like a **high-trust assistive tool**, not like a trendy consumer app.

---

# 3. Core Design Philosophy

TalkBridge must prioritize:

1. **clarity over creativity**
2. **speed over decoration**
3. **trust over “wow factor”**
4. **usability over cleverness**
5. **accessibility over minimalism**
6. **consistency over experimentation**

If a UI decision improves aesthetics but reduces clarity:
**reject it**.

---

# 4. Brand Identity

## 4.1 Brand Meaning

**TalkBridge = A bridge between intent and understanding**

The product should emotionally communicate:

* support
* calm
* dignity
* clarity
* reliability
* independence

---

## 4.2 Emotional Tone

The app must feel:

* calm
* respectful
* supportive
* human
* dependable
* unobtrusive

---

## 4.3 Emotional Tone Must NOT Be

The app must NOT feel:

* childish
* playful-for-the-sake-of-playfulness
* robotic
* coldly clinical
* startup-hype driven
* flashy
* “AI gimmick” oriented

If the tone is wrong, trust collapses.

---

# 5. Visual Style Direction

## 5.1 Overall Style

The visual style should feel like:

* a calm medical-adjacent consumer app
* a high-trust accessibility-first mobile product
* a modern but restrained assistive tool

### It should resemble:

* clean health / accessibility apps
* Apple Health / Calm / modern assistive utility vibes
* not social media
* not crypto dashboard
* not startup landing-page theatre

---

## 5.2 Surface Feel

UI should feel:

* soft
* breathable
* lightly elevated
* clean
* low-clutter
* touch-friendly

Avoid:

* glassmorphism overload
* dark-neon gradients
* over-rounded toy UI
* hyper-dense enterprise layout

---

# 6. Design Tokens

These tokens must be used consistently across the product.

---

## 6.1 Color Palette

### Primary

Use for:

* main CTA
* active state
* key highlights
* focus state

**Recommended Direction:**

* calm teal-blue family

### Final Suggested Token Set

* `primary-50` → `#ECFEFF`
* `primary-100` → `#CFFAFE`
* `primary-200` → `#A5F3FC`
* `primary-300` → `#67E8F9`
* `primary-400` → `#22D3EE`
* `primary-500` → `#06B6D4`
* `primary-600` → `#0891B2`
* `primary-700` → `#0E7490`

### Usage Rule

Use `primary-500` / `primary-600` for primary actions.
Do NOT oversaturate the entire UI with primary color.

---

## 6.2 Neutral Palette

Use for:

* backgrounds
* cards
* borders
* muted text
* layout structure

### Suggested Tokens

* `neutral-0` → `#FFFFFF`
* `neutral-50` → `#F8FAFC`
* `neutral-100` → `#F1F5F9`
* `neutral-200` → `#E2E8F0`
* `neutral-300` → `#CBD5E1`
* `neutral-500` → `#64748B`
* `neutral-700` → `#334155`
* `neutral-900` → `#0F172A`

### Usage Rule

The UI should be mostly built from neutral surfaces, with primary color used intentionally.

---

## 6.3 State Colors

### Success

* `#16A34A`

### Error

* `#DC2626`

### Warning

* `#D97706`

### Info

* `#2563EB`

### Usage Rule

State colors are for:

* feedback
* confidence
* result indicators
* alerts

Do NOT use them decoratively.

---

# 7. Typography System

Typography must optimize for **speed and readability**, not aesthetic novelty.

---

## 7.1 Font Family

Use:

* `Inter`
* `SF Pro Text` (if platform-native)
* fallback: clean sans-serif

Do NOT use decorative fonts.

---

## 7.2 Type Scale

Use this exact hierarchy:

### Display / Screen Title

* `32px`
* `700`
* line height `40px`

### Section Heading

* `24px`
* `700`
* line height `32px`

### Card / Component Heading

* `20px`
* `600`
* line height `28px`

### Body Large

* `18px`
* `500`
* line height `28px`

### Body Default

* `16px`
* `400 / 500`
* line height `24px`

### Label / Helper

* `14px`
* `500`
* line height `20px`

### Micro / Meta

* `12px`
* `500`
* line height `16px`

---

## 7.3 Typography Rules

* Body text must almost never go below `16px`
* Action labels must be readable at a glance
* Avoid ultra-light font weights
* Text hierarchy must be obvious without relying on color

---

# 8. Spacing System

Use a strict spacing scale.

Do NOT freestyle spacing.

### Spacing Tokens

* `4`
* `8`
* `12`
* `16`
* `20`
* `24`
* `32`
* `40`
* `48`
* `64`

---

## 8.1 Spacing Rules

### Use `8–16px` for:

* small internal spacing
* icon gaps
* button padding

### Use `20–24px` for:

* card internal spacing
* grouped sections

### Use `32–48px` for:

* screen-level section separation

### Use `64px` max for:

* hero or major vertical separation

Do NOT create random one-off spacing.

---

# 9. Radius, Borders, and Elevation

---

## 9.1 Border Radius

Use consistent radii:

* `8px` → small controls
* `12px` → cards / inputs
* `16px` → large touch cards / major surfaces
* `999px` → pill buttons / circular controls only

Avoid excessive toy-like roundness.

---

## 9.2 Border Style

Use subtle borders:

* default border → `1px solid neutral-200`
* active border → `1px solid primary-500`
* destructive border → `1px solid error`

---

## 9.3 Shadow / Elevation

Use soft shadows only when needed.

### Card Shadow

* low blur
* subtle opacity
* should feel calm, not floating aggressively

Avoid:

* huge shadows
* glassy blur
* “dribbble” effects

---

# 10. Layout System

---

## 10.1 Screen Structure

Every screen should follow this layout logic:

### Top

* screen title / state / context

### Middle

* primary interaction or content zone

### Bottom

* secondary actions / support / navigation

Do NOT scatter important actions randomly.

---

## 10.2 Screen Density

Each screen should support:

* quick scanning
* one obvious primary action
* low cognitive load

Avoid:

* dashboards with 10 cards at once
* nested interactions
* buried actions
* visual overload

---

## 10.3 Width / Padding Rules

### Mobile Screen Padding

* horizontal padding: `20px`
* vertical section spacing: `24–32px`

### Card Padding

* `16–20px`

### Touch-heavy zones

* leave extra breathing room

---

# 11. Accessibility Rules (Non-Negotiable)

TalkBridge is accessibility-first.

These rules are mandatory.

---

## 11.1 Touch Targets

### Minimum:

* `48x48dp`

### Preferred:

* `56–64dp`

Critical actions (record / confirm / speak):
must feel **large and unmistakable**.

---

## 11.2 Contrast

Text/background combinations must remain highly readable.

Do NOT use:

* light gray on white
* aesthetic low-contrast muted text
* washed-out buttons

---

## 11.3 Action Simplicity

Each screen should have:

* one primary action
* max one or two secondary actions in immediate focus

Do NOT make the user decode what matters.

---

## 11.4 State Visibility

The user must always know:

* what the app is doing
* whether it is listening
* whether it is processing
* what it understood
* what to do next

This is one of the most important design requirements.

---

# 12. Core Component System

These are the canonical TalkBridge components.

Do NOT invent random UI primitives unless needed.

---

## 12.1 Primary Button

Used for:

* start recording
* confirm output
* continue main flow

### Requirements

* high contrast
* large touch target
* strong label clarity
* obvious visual priority

### Style

* filled
* primary color
* medium/large radius
* 16–18px label

---

## 12.2 Secondary Button

Used for:

* retry
* edit
* navigate secondary paths

### Style

* outline or soft surface
* clearly lower priority than primary

---

## 12.3 Tertiary Text Action

Used for:

* dismiss
* skip
* less-critical actions

Must still remain tappable and readable.

---

## 12.4 Record Button (Critical Component)

This is the most important UI element in the product.

It must be:

* large
* centrally dominant
* visually unmistakable
* consistent across all relevant screens

### Size

Recommended:

* `72–96px` circular or pill-like control

### States

Must visually distinguish:

#### Idle

* ready to tap

#### Listening

* active recording state
* obvious visual change

#### Processing

* disabled input + visible progress state

#### Error / Retry

* clearly recoverable state

This component must never be hard to find.

---

## 12.5 Sound Card

Represents a communication unit / saved sample / item.

Must include:

* label
* optional category
* optional icon
* tap state
* selected state

### Style

* clean bordered or softly elevated card
* easy to scan
* generous spacing

---

## 12.6 Category Card

Represents a cluster of communication meanings.

Must be:

* large
* easy to tap
* instantly scannable

Do NOT make category selection dense or tiny.

---

## 12.7 Output Display

Used to show recognized meaning or translated communication.

Must be:

* large
* centered or visually dominant
* readable from a slight distance
* emotionally calm

This is not “normal body text.”
It should feel important.

---

## 12.8 Feedback Indicator

Used for:

* listening
* processing
* confidence
* retry / uncertainty

Must be:

* immediate
* visible
* unmissable

---

## 12.9 Confidence Indicator

If confidence / certainty is shown, it must be:

* understandable
* calm
* non-technical

### Good:

* “Seems right”
* “Not fully sure”

### Bad:

* “Confidence: 0.71”

Never expose raw model language to users.

---

# 13. Interaction Design Rules

---

## 13.1 Tap Feedback

Every tap must feel acknowledged.

Use:

* subtle scale
* opacity change
* haptic where appropriate

No dead-feeling controls.

---

## 13.2 Recording Flow

When user taps record:

### UI must immediately:

* visually switch state
* show that the app is actively listening
* reduce ambiguity instantly

Do NOT leave the user wondering whether recording started.

---

## 13.3 Processing Flow

When processing:

* show progress or state clearly
* keep screen stable
* do not freeze visually
* do not over-animate

---

## 13.4 Result Flow

When result appears:

* it must be obvious
* it must be readable
* next action must be clear

The user should never think:

> “Okay… now what?”

---

## 13.5 Correction Flow

Correction must be:

* fast
* obvious
* low-friction
* one-step if possible

Do NOT bury correction in modals or settings.

---

# 14. Motion System

Motion is allowed only when it improves clarity.

---

## 14.1 Motion Philosophy

Motion should communicate:

* state change
* action acknowledgement
* transition continuity

Not:

* personality
* flair
* visual flexing

---

## 14.2 Allowed Motion

Use only:

* tap feedback
* state fades
* subtle card transitions
* short loading state transitions
* light scale or opacity transitions

---

## 14.3 Forbidden Motion

Do NOT use:

* long hero animations
* decorative parallax
* bouncing interfaces
* flashy screen transitions
* dramatic loaders
* animation delays for “feel”

This is not a portfolio app.

---

## 14.4 Timing Rules

### Recommended durations

* micro interactions: `100–150ms`
* screen transitions: `180–240ms`
* state transitions: `150–220ms`

If animation slows the user down, it is wrong.

---

# 15. Sound and Haptics

---

## 15.1 Audio Feedback

Optional only.

Use only for:

* recording start
* recording stop
* success confirmation

Must be:

* subtle
* calm
* non-intrusive

Never rely on sound alone.

---

## 15.2 Haptics

Use light haptics for:

* record start
* record stop
* confirm actions
* successful completion

Avoid excessive vibration.

---

# 16. State Design System

The app must visually distinguish system states clearly.

This is mandatory.

---

## Required UI States

Every critical flow must support visible versions of:

* Idle
* Listening
* Processing
* Result (high confidence)
* Result (needs confirmation)
* Retry Needed
* Error
* Empty

Each state must have:

* different text
* different visual cues
* different next-step affordance

States must not look interchangeable.

---

# 17. Error Design Rules

Errors must be:

* calm
* specific
* recoverable
* non-technical

---

## Good Examples

* “Couldn’t hear clearly. Try again.”
* “That didn’t save. Try once more.”
* “Recording stopped too early.”

---

## Bad Examples

* “Audio capture exception”
* “Classification inference failed”
* “Unexpected runtime error”

The app must never talk like an engineer.

---

# 18. Empty State Rules

Empty states must guide action.

They must not feel dead.

---

## Examples

### No sounds saved

“Add your first sound”

### No recent history

“Your recent communication will appear here”

### No result yet

“Record to see the result here”

Every empty state should tell the user what to do next.

---

# 19. Trust Design Rules

Trust is a core design requirement.

The UI must never fake certainty.

---

## Must Do

* show uncertainty honestly
* allow correction
* show what the app understood
* make retry easy
* keep behavior predictable

---

## Must NOT

* pretend confidence
* hide failure
* output random dramatic claims
* behave inconsistently across similar actions

If the system is uncertain, the UI must communicate that safely.

---

# 20. Strict Anti-Patterns (Forbidden)

The app must NOT include:

* tiny buttons
* cluttered dashboards
* hidden primary actions
* nested multi-step flows
* gamification
* playful reward mechanics
* “AI assistant chat” UI as the main interaction
* trendy over-designed startup visuals
* icon-only controls without labels
* low-contrast minimalist UI
* overly dense settings screens

These are anti-TalkBridge patterns.

---

# 21. Screen-Level Design Rule

Every screen must pass this test:

### Within 3 seconds, the user must know:

* where they are
* what the app is doing
* what the main action is
* what to do next

If not, the screen has failed.

---

# 22. Final Design Principle

TalkBridge must feel like:

> **A calm, reliable communication tool that helps someone be understood quickly and confidently.**

It must NOT feel like:

* an experiment
* a toy
* a trend-driven AI app
* a flashy startup prototype

---

# 23. Design Success Criteria

The design is successful only if:

* the main action is always obvious
* the UI feels calm and trustworthy
* accessibility is preserved under stress
* users can recover from mistakes quickly
* the app feels consistent across all screens
* users can operate it without needing explanation

If it looks polished but fails these:
**the design has failed**
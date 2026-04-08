# DATABASE_SCHEMA.md — TalkBridge

## 1. Purpose

This document defines the **authoritative MVP database schema** for TalkBridge.

It exists to ensure:

* the product stores the right data
* the Train → Use → Correct → Improve loop is fully supported
* the AI / developer does **not invent schema decisions mid-build**
* recognition remains traceable
* user data remains private and structurally consistent

This file defines:

* what entities exist
* what each entity is responsible for
* how entities relate
* what must be enforced at the database level
* what must NOT be overbuilt

This is the **source of truth for data architecture**.

If implementation conflicts with this document:
**this document wins**.

---

# 2. Database Design Philosophy

The TalkBridge schema must follow these non-negotiable principles.

---

## 2.1 User-Specific First

All communication data is **personal to one user**.

This is not a global speech-recognition product.

The schema must assume:

> **one user has their own sound dictionary, their own training data, and their own recognition history**

All product-critical data must remain scoped to the owning user.

---

## 2.2 Product Loop First

The schema must directly support:

# **Train → Use → Correct → Improve**

If a table or field does not support this loop or the MVP product experience, it should not exist.

---

## 2.3 Traceability Over Magic

The system must always be able to answer:

* what sound was recorded?
* what did the system predict?
* what did the user actually mean?
* was the system corrected?
* is recognition getting better?

If the schema cannot answer those questions cleanly, it is wrong.

---

## 2.4 No Premature Platform Thinking

Do NOT build for:

* therapist organizations
* enterprise accounts
* multi-tenant workspaces
* care teams
* family workspaces
* admin dashboards
* speculative AI pipelines
* abstract event-unification fantasies

This is MVP, not startup schizophrenia.

---

## 2.5 Database Integrity Over App Assumptions

Critical correctness must be enforced in the database where possible.

Do NOT rely only on frontend or app logic for:

* ownership
* uniqueness
* relation validity
* cascade behavior
* enum consistency
* duplicate prevention

If the database can prevent bad state, it should.

---

# 3. MVP Core Entities

These are the only core MVP entities allowed.

1. `profiles`
2. `categories`
3. `sound_cards`
4. `sound_samples`
5. `recognition_events`
6. `recognition_candidates`
7. `corrections`
8. `usage_history`
9. `settings`

Optional / conditional:
10. `favorites` (**only if ordered pinning is required**)

---

## Important Rule

### Do NOT create extra product entities unless they are explicitly required.

No speculative junk like:

* `sessions`
* `organizations`
* `trainings`
* `audio_jobs`
* `ml_models`
* `pipelines`
* `analytics_dashboards`

If you need internal infra tables later, that is separate.
They are **not part of MVP product schema authority**.

---

# 4. Root Identity Model

## 4.1 Auth Model Rule

TalkBridge assumes authentication is handled externally (e.g. Supabase Auth).

Therefore:

* auth identity lives in the auth system
* product data references the auth user ID
* **do NOT recreate a separate full users table unless the platform requires it**

### MVP Recommendation

Use:

* auth provider user ID as the root identity
* `profiles.user_id` as the primary product anchor

---

## 4.2 Important Implementation Rule

### Preferred MVP Pattern:

Use `profiles` as the root app-owned identity table.

This is cleaner than duplicating auth user data.

So unless there is a strong technical reason otherwise:

## DO NOT create a separate `users` table in MVP

This avoids pointless duplication.

---

# 5. Canonical Tables

---

# 5.1 `profiles`

## Purpose

Stores the product-level user profile.

This is the root user-owned entity for all TalkBridge data.

---

## Required Fields

| Field                | Type        | Required | Notes                          |
| -------------------- | ----------- | -------: | ------------------------------ |
| id                   | uuid        |      yes | Primary key                    |
| user_id              | uuid        |      yes | Auth provider user id (unique) |
| display_name         | text        |      yes | User-facing name               |
| user_type            | enum        |      yes | `self`, `caregiver_assisted`   |
| output_language      | text        |      yes | Language for text/TTS          |
| onboarding_completed | boolean     |      yes | Setup completed or not         |
| onboarding_step      | text        |       no | Resume point if interrupted    |
| created_at           | timestamptz |      yes | Creation timestamp             |
| updated_at           | timestamptz |      yes | Last update timestamp          |

---

## Required Constraints

* `id` = primary key
* `user_id` = unique
* one auth user must map to exactly one profile

---

## Rules

* This table is the root owner of product data.
* `user_type` changes UI guidance, not permissions architecture.
* `output_language` should match product output behavior.
* `onboarding_step` exists only for resume UX, not workflow complexity.

---

# 5.2 `settings`

## Purpose

Stores user-level app preferences separate from identity/profile state.

---

## Required Fields

| Field                  | Type        | Required | Notes                   |
| ---------------------- | ----------- | -------: | ----------------------- |
| id                     | uuid        |      yes | Primary key             |
| profile_id             | uuid        |      yes | FK → profiles.id        |
| speech_enabled         | boolean     |      yes | TTS on/off              |
| preferred_voice        | text        |       no | Optional voice setting  |
| output_language        | text        |      yes | Current output language |
| haptics_enabled        | boolean     |      yes | Haptics toggle          |
| caregiver_mode_enabled | boolean     |      yes | UI assistance mode      |
| created_at             | timestamptz |      yes | Creation timestamp      |
| updated_at             | timestamptz |      yes | Last update timestamp   |

---

## Required Constraints

* `profile_id` must be unique
* one profile → one settings row

---

## Rules

* Keep this table minimal.
* Do not turn this into a junk drawer of feature flags.
* If a setting is not actively used in MVP, it should not exist.

---

# 5.3 `categories`

## Purpose

Groups communication meanings into structured sections.

---

## Required Fields

| Field      | Type        | Required | Notes                   |
| ---------- | ----------- | -------: | ----------------------- |
| id         | uuid        |      yes | Primary key             |
| profile_id | uuid        |      yes | FK → profiles.id        |
| name       | text        |      yes | Category label          |
| slug       | text        |      yes | Stable internal key     |
| icon_name  | text        |       no | Optional UI icon key    |
| sort_order | integer     |      yes | Display order           |
| is_default | boolean     |      yes | Starter category or not |
| created_at | timestamptz |      yes | Creation timestamp      |
| updated_at | timestamptz |      yes | Last update timestamp   |

---

## Required Constraints

* `id` = primary key
* unique (`profile_id`, `slug`)

---

## MVP Default Categories

Every new profile must receive:

* Basic Needs
* Feelings
* People
* Emergency
* Daily Actions

---

## Rules

* Categories are profile-owned.
* Slugs must be stable and unique per profile.
* Categories are not global shared content.

---

# 5.4 `sound_cards`

## Purpose

Represents one communication meaning that can be trained and used.

This is one of the most important entities in the product.

A sound card maps:

# **meaning ↔ trained user vocal pattern**

---

## Required Fields

| Field            | Type        | Required | Notes                                  |
| ---------------- | ----------- | -------: | -------------------------------------- |
| id               | uuid        |      yes | Primary key                            |
| profile_id       | uuid        |      yes | FK → profiles.id                       |
| category_id      | uuid        |      yes | FK → categories.id                     |
| label            | text        |      yes | Human-readable label                   |
| normalized_label | text        |      yes | Stable normalized form                 |
| phrase_output    | text        |      yes | Final spoken/displayed output          |
| icon_name        | text        |       no | Optional UI icon                       |
| is_favorite      | boolean     |      yes | Quick-access flag                      |
| is_emergency     | boolean     |      yes | Emergency priority flag                |
| is_active        | boolean     |      yes | Eligible for active recognition        |
| training_status  | enum        |      yes | `draft`, `ready`, `needs_more_samples` |
| sample_count     | integer     |      yes | Count of usable samples                |
| usage_count      | integer     |      yes | Communication usage count              |
| last_used_at     | timestamptz |       no | Last communication timestamp           |
| created_at       | timestamptz |      yes | Creation timestamp                     |
| updated_at       | timestamptz |      yes | Last update timestamp                  |

---

## Required Constraints

* `id` = primary key
* `sample_count >= 0`
* `usage_count >= 0`
* unique (`profile_id`, `normalized_label`) **recommended**
* foreign key ownership must remain consistent

---

## Rules

* Every sound card belongs to exactly one profile.
* Every sound card belongs to exactly one category.
* `phrase_output` is what gets displayed/spoken.
* `training_status` controls recognition readiness.
* `is_active = false` means do not include in live recognition.
* `sample_count` must reflect usable sample count, not total junk recordings.

---

## Important Hard Rule

A sound card must **not** be treated as recognition-ready if it has too few usable samples.

### MVP Recommendation

A sound card should usually require:

# **minimum 3 usable samples**

before `training_status = ready`

Do not fake readiness.

---

# 5.5 `sound_samples`

## Purpose

Stores each training recording associated with a sound card.

This is the raw supervised training material of the product.

---

## Required Fields

| Field                | Type        | Required | Notes                                   |
| -------------------- | ----------- | -------: | --------------------------------------- |
| id                   | uuid        |      yes | Primary key                             |
| profile_id           | uuid        |      yes | FK → profiles.id                        |
| sound_card_id        | uuid        |      yes | FK → sound_cards.id                     |
| audio_file_path      | text        |      yes | Storage path to uploaded/recorded audio |
| duration_ms          | integer     |       no | Recording duration                      |
| sample_order         | integer     |      yes | Order within card training set          |
| recording_context    | text        |       no | Optional note                           |
| is_usable            | boolean     |      yes | Quality-approved or not                 |
| quality_score        | numeric     |       no | Optional internal quality metric        |
| embedding_vector_ref | text        |       no | Optional embedding pointer              |
| created_at           | timestamptz |      yes | Creation timestamp                      |

---

## Required Constraints

* `id` = primary key
* unique (`sound_card_id`, `sample_order`) **recommended**
* `duration_ms >= 0` if present

---

## Rules

* A sound card must support multiple samples.
* `is_usable = false` means excluded from active recognition.
* Do NOT collapse this into one “main audio” field on `sound_cards`.
  That would be amateur nonsense.

---

# 5.6 `recognition_events`

## Purpose

Stores every live recognition attempt.

This table is critical for:

* product traceability
* correction loop
* trust analysis
* confidence handling
* performance monitoring
* future recognition improvement

---

## Required Fields

| Field                        | Type        | Required | Notes                                                |
| ---------------------------- | ----------- | -------: | ---------------------------------------------------- |
| id                           | uuid        |      yes | Primary key                                          |
| profile_id                   | uuid        |      yes | FK → profiles.id                                     |
| input_audio_path             | text        |      yes | Storage path to recognition input                    |
| predicted_sound_card_id      | uuid        |       no | FK → sound_cards.id                                  |
| confidence_score             | numeric     |       no | Raw top score                                        |
| confidence_bucket            | enum        |      yes | `high`, `medium`, `low`, `none`                      |
| recognition_status           | enum        |      yes | `matched`, `needs_confirmation`, `no_match`, `error` |
| final_selected_sound_card_id | uuid        |       no | Final chosen meaning                                 |
| was_auto_output              | boolean     |      yes | Whether result was auto-shown/spoken                 |
| was_corrected                | boolean     |      yes | Whether user/caregiver corrected                     |
| processing_time_ms           | integer     |       no | Inference latency                                    |
| created_at                   | timestamptz |      yes | Event timestamp                                      |

---

## Required Constraints

* `id` = primary key
* `processing_time_ms >= 0` if present

---

## Rules

* Every live recognition attempt must create a row.
* This table must exist even when there is no confident match.
* `predicted_sound_card_id` and `final_selected_sound_card_id` may differ.
* This table must not be skipped “for speed.”
  That would cripple the product loop.

---

# 5.7 `recognition_candidates`

## Purpose

Stores alternative candidate meanings shown during medium-confidence recognition.

This exists because “top guesses” must be traceable.

---

## Required Fields

| Field                | Type        | Required | Notes                        |
| -------------------- | ----------- | -------: | ---------------------------- |
| id                   | uuid        |      yes | Primary key                  |
| recognition_event_id | uuid        |      yes | FK → recognition_events.id   |
| sound_card_id        | uuid        |      yes | FK → sound_cards.id          |
| rank_position        | integer     |      yes | 1, 2, 3                      |
| candidate_score      | numeric     |      yes | Candidate similarity / score |
| created_at           | timestamptz |      yes | Timestamp                    |

---

## Required Constraints

* `id` = primary key
* unique (`recognition_event_id`, `rank_position`)
* unique (`recognition_event_id`, `sound_card_id`) **recommended**

---

## Rules

* Only create rows when candidate selection is relevant.
* Candidate ordering matters.
* This table exists to preserve medium-confidence behavior cleanly.

---

# 5.8 `corrections`

## Purpose

Stores explicit correction events.

This is one of the most important learning tables in the product.

---

## Required Fields

| Field                            | Type        | Required | Notes                                                        |
| -------------------------------- | ----------- | -------: | ------------------------------------------------------------ |
| id                               | uuid        |      yes | Primary key                                                  |
| profile_id                       | uuid        |      yes | FK → profiles.id                                             |
| recognition_event_id             | uuid        |      yes | FK → recognition_events.id                                   |
| original_predicted_sound_card_id | uuid        |       no | FK → sound_cards.id                                          |
| corrected_sound_card_id          | uuid        |      yes | FK → sound_cards.id                                          |
| correction_type                  | enum        |      yes | `wrong_prediction`, `candidate_selection`, `manual_override` |
| correction_source                | enum        |      yes | `user`, `caregiver`, `system_prompted`                       |
| created_at                       | timestamptz |      yes | Timestamp                                                    |

---

## Required Constraints

* `id` = primary key
* one meaningful correction row per correction action
* `recognition_event_id` should usually have at most one primary correction row in MVP

---

## Rules

* Corrections must preserve history.
* Do NOT overwrite recognition history silently.
* This table is essential to the Improve part of the product loop.

---

# 5.9 `usage_history`

## Purpose

Stores user-facing communication output history.

This is different from recognition logs.

Why it exists:

* not every output comes from live recognition
* manual taps matter
* emergency taps matter
* user-visible history should be queryable cleanly

---

## Required Fields

| Field                | Type        | Required | Notes                                                                |
| -------------------- | ----------- | -------: | -------------------------------------------------------------------- |
| id                   | uuid        |      yes | Primary key                                                          |
| profile_id           | uuid        |      yes | FK → profiles.id                                                     |
| sound_card_id        | uuid        |       no | FK → sound_cards.id if applicable                                    |
| source_type          | enum        |      yes | `live_recognition`, `manual_tap`, `candidate_selection`, `emergency` |
| output_text          | text        |      yes | Final communicated output                                            |
| was_spoken           | boolean     |      yes | Whether TTS was used                                                 |
| recognition_event_id | uuid        |       no | FK → recognition_events.id if applicable                             |
| created_at           | timestamptz |      yes | Timestamp                                                            |

---

## Required Constraints

* `id` = primary key

---

## Rules

* Every successful communication output should create a row.
* This powers recents/history.
* This must support both recognition-based and manual outputs.

---

# 5.10 `favorites` (Optional)

## Purpose

Stores ordered pinned favorites if the product needs explicit ordering.

---

## Important Rule

### DO NOT use both of these unless there is a real reason:

* `sound_cards.is_favorite`
* `favorites` table

That is redundant schema stupidity.

Choose one.

---

## MVP Recommendation

### If you only need:

* simple favorite toggle

Use:

* `sound_cards.is_favorite`

### If you need:

* ordered favorites / pin positions

Use:

* separate `favorites` table
* and remove `is_favorite` from `sound_cards`

---

## If Using `favorites`, Required Fields

| Field         | Type        | Required | Notes               |
| ------------- | ----------- | -------: | ------------------- |
| id            | uuid        |      yes | Primary key         |
| profile_id    | uuid        |      yes | FK → profiles.id    |
| sound_card_id | uuid        |      yes | FK → sound_cards.id |
| sort_order    | integer     |      yes | Order in favorites  |
| created_at    | timestamptz |      yes | Timestamp           |

---

## Required Constraints

* unique (`profile_id`, `sound_card_id`)
* unique (`profile_id`, `sort_order`) **recommended**

---

# 6. Relationship Summary

---

## One Profile Has:

* one settings row
* many categories
* many sound cards
* many sound samples
* many recognition events
* many corrections
* many usage history entries

---

## One Category Has:

* many sound cards

---

## One Sound Card Has:

* many sound samples
* many usage history rows
* may appear in recognition events
* may appear in recognition candidates
* may appear in corrections

---

## One Recognition Event Has:

* zero or one predicted sound card
* zero or one final selected sound card
* zero or many recognition candidates
* zero or one correction

---

# 7. Recognition Data Flow Mapping

This section exists to keep schema aligned with product behavior.

---

# 7.1 Training Flow

### When user creates a sound card:

Create:

* `sound_cards`

### When user records training samples:

Create:

* `sound_samples`

### When system determines readiness:

Update:

* `sound_cards.training_status`
* `sound_cards.sample_count`

---

# 7.2 Live Recognition Flow

### When user attempts recognition:

Create:

* `recognition_events`

### If medium-confidence candidates are shown:

Create:

* `recognition_candidates`

### If communication is output:

Create:

* `usage_history`

---

# 7.3 Correction Flow

### When prediction is corrected:

Create:

* `corrections`

### Also update:

* `recognition_events.was_corrected`
* `recognition_events.final_selected_sound_card_id`

This is how the schema supports actual improvement.

---

# 8. Required Enums

These values must be standardized.

Do NOT invent string variants during development.

---

## 8.1 `user_type`

Allowed:

* `self`
* `caregiver_assisted`

---

## 8.2 `training_status`

Allowed:

* `draft`
* `ready`
* `needs_more_samples`

---

## 8.3 `confidence_bucket`

Allowed:

* `high`
* `medium`
* `low`
* `none`

---

## 8.4 `recognition_status`

Allowed:

* `matched`
* `needs_confirmation`
* `no_match`
* `error`

---

## 8.5 `correction_type`

Allowed:

* `wrong_prediction`
* `candidate_selection`
* `manual_override`

---

## 8.6 `correction_source`

Allowed:

* `user`
* `caregiver`
* `system_prompted`

---

## 8.7 `source_type`

Allowed:

* `live_recognition`
* `manual_tap`
* `candidate_selection`
* `emergency`

---

# 9. Ownership, Privacy, and Security Rules

This is not optional.

TalkBridge stores highly personal communication data.

That means the schema must be designed for privacy from day one.

---

## Mandatory Rules

* every user-owned record must resolve back to exactly one `profile_id`
* data must never be globally readable
* audio references must remain user-scoped
* recognition history must remain private
* correction history must remain private
* user sound libraries are private communication data

---

## Implementation Rule

If using Supabase/Postgres:

# enforce row-level security (RLS)

This is not a “nice later improvement.”
It is a baseline requirement.

---

# 10. Local vs Remote Data Rules

---

## 10.1 Must Exist Remotely

These should be persisted in backend/database:

* profiles
* settings
* categories
* sound_cards
* sound_samples metadata
* recognition_events
* recognition_candidates
* corrections
* usage_history
* favorites (if used)

---

## 10.2 Must Be Cached Locally

These should be locally cached for speed / partial offline usability:

* categories
* sound_cards
* settings
* recent usage history
* onboarding state
* favorites / recents

---

## 10.3 Audio File Rule

### Recommended Strategy

* raw audio files stored in secure remote storage
* temporary working audio may exist locally
* optional local recent cache only if needed for UX/performance

### Hard Rule

Do NOT make local-only audio the primary source of truth.

That’s a sync nightmare waiting to happen.

---

# 11. Required Database Constraints and Indexing Rules

This section is mandatory because schema without query discipline is fake architecture.

---

## 11.1 Must Have Foreign Keys

Every relational dependency must use real foreign keys.

No fake string references.

---

## 11.2 Must Have Ownership Indexes

Index at minimum:

* `categories.profile_id`
* `sound_cards.profile_id`
* `sound_samples.profile_id`
* `sound_samples.sound_card_id`
* `recognition_events.profile_id`
* `recognition_candidates.recognition_event_id`
* `corrections.profile_id`
* `usage_history.profile_id`

---

## 11.3 Recommended Query Indexes

Also strongly consider indexes for:

* `sound_cards.category_id`
* `sound_cards.is_active`
* `sound_cards.is_emergency`
* `sound_cards.is_favorite` (if using boolean favorite model)
* `recognition_events.created_at`
* `usage_history.created_at`

---

## 11.4 Must Enforce Uniqueness Where Needed

At minimum, enforce:

* one profile per auth user
* one settings row per profile
* category slug uniqueness per profile
* no duplicate favorite rows (if favorites table exists)

---

# 12. Delete / Cascade Rules

This is where bad schemas quietly die.

You need explicit deletion behavior.

---

## 12.1 Profile Deletion

If a profile is deleted, all owned product data must be deleted or archived intentionally.

### MVP Recommendation

Use cascading deletes for:

* settings
* categories
* sound_cards
* sound_samples
* recognition_events
* recognition_candidates
* corrections
* usage_history
* favorites (if used)

---

## 12.2 Category Deletion

If a category is deleted:

### Do NOT silently orphan sound cards.

Choose one strategy:

1. prevent delete if cards exist
   OR
2. move cards to fallback category

### MVP Recommendation

Prevent deletion if sound cards still exist.

Cleaner and safer.

---

## 12.3 Sound Card Deletion

If a sound card is deleted:

* associated training samples should be deleted
* recognition/correction/history references must be handled intentionally

### MVP Recommendation

Use soft-delete only if needed later.
Otherwise, hard delete is acceptable for MVP **if history handling remains sane**.

---

# 13. MVP Simplification Rules

Simplification is allowed only if it reduces complexity **without damaging the product loop**.

---

## Allowed Simplifications

### 13.1 Favorites

Use:

* `sound_cards.is_favorite`

instead of a separate `favorites` table
**if ordering is not required**

---

### 13.2 Settings Merge

You may merge:

* `profiles`
* `settings`

only if implementation simplicity truly benefits and the schema remains clean.

### Recommendation

Keep them separate if manageable.

---

### 13.3 Usage History Derivation

You may partially derive `usage_history` from successful recognition events **only if**:

* manual taps are still tracked
* emergency taps are still tracked
* the user-facing history remains correct

---

# 14. Hard Anti-Patterns (Forbidden)

The MVP schema must NOT:

* collapse everything into one giant generic `events` table
* duplicate auth identity data unnecessarily
* store one audio sample per meaning only
* mix product data with infra concerns
* create speculative enterprise abstractions
* use both boolean favorites and favorites table redundantly
* hide recognition behavior from logs
* rely on app-only ownership validation
* omit RLS / ownership protection

If you do these, you are building technical debt, not a product.

---

# 15. Final Schema Success Test

The schema is correct only if it cleanly supports this truth:

> The app can remember what this specific user means when they make a sound, recognize it later, log what happened, allow correction, and improve over time.

If the schema supports that cleanly, it is good.

If it cannot do that without hacks, it is wrong.
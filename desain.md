# Komplekku — Design System & UI/UX Specification

**Version:** 1.0
**Status:** Production-ready reference for design + AI development agents
**Scope:** Full product design system — tokens, components, screen-by-screen spec

> This document is the single source of truth for how Komplekku looks, behaves, and feels. Every screen, component, and interaction built for Komplekku must trace back to a rule defined here. If a decision isn't covered, default to the philosophy in §1–2, not to marketplace-app convention.

---

## 1. Design Vision & Product Personality

### 1.1 What Komplekku is
Komplekku is the digital layer of a residential complex (perumahan/apartemen/cluster): a **verified-resident marketplace + community feed + neighbor-to-neighbor chat**, with a lightweight admin layer for the complex management. It is not a public marketplace clone — it is a **private, trusted neighborhood** made digital.

### 1.2 Personality
If Komplekku were a person, it would be: a calm, well-dressed neighbor who happens to run the local community board — helpful, precise, never loud, never salesy. Warm but not chatty. Confident but not flashy.

| Trait | Means | Does not mean |
|---|---|---|
| **Premium** | Restraint, precision, quality imagery, considered spacing | Gold/black luxury clichés, ornamentation |
| **Minimal** | One primary action per screen, generous negative space | Empty or under-featured |
| **Elegant** | Refined type, subtle motion, quiet color | Decorative flourishes |
| **Calm** | Muted palette, soft contrast, slow reveal animations | Sluggish, unresponsive |
| **Trustworthy** | Verification is visible, real-name/real-unit signals, consistent iconography | Badges everywhere, gamified trust score |
| **Spacious** | 8pt rhythm, breathing room around content | Wasted scroll, low information density |
| **Modern** | Contemporary type + layout grammar (2025–26 SaaS/property app standard) | Trend-chasing (no neumorphism, no skeuomorphism) |
| **Human** | Real photography, first names, neighborly copy tone | Corporate/legal tone, stock-photo gloss |

### 1.3 Reference coordinates (for calibration, not cloning)
- **Structure & density:** Linear, Stripe Dashboard, Notion
- **Property/listing card language:** Airbnb (spacious card, photo-forward, trust cues under price)
- **Marketplace trust UI:** Carousell's simplicity, without Carousell's visual noise
- **Community/feed rhythm:** Nextdoor's *intent*, none of Nextdoor's dated visual execution

### 1.4 Non-negotiable exclusions
Explicitly forbidden anywhere in the product:
- Shopee/Tokopedia-style dense grid, flash-sale banners, countdown timers, red/orange saturation
- Gradient blobs, glassmorphism, neumorphism
- Heavy drop shadows (`0 8px 24px rgba(0,0,0,.25)`-class shadows are banned — see §7)
- More than one accent color per screen
- Icons mixed from more than one icon family
- Cards nested inside cards inside cards
- Decoration with no semantic function (no random dividers, no filler illustrations, no confetti unless tied to a specific success moment defined in §28)

---

## 2. Brand Direction

### 2.1 Brand attributes
- **Name lockup:** "Komplekku" set in the Display typeface (see §4), sentence case, never all-caps in-product (all-caps reads as generic SaaS logo cliché).
- **Voice tone anchor:** "Your complex, organized." Calm authority, never exclamation-heavy.
- **Metaphor:** A well-kept courtyard — everything has a place, sightlines are clear, nothing is cluttered.

### 2.2 Logo & mark usage (spec for implementers)
- Wordmark: Display typeface, weight 600, tracking -1%.
- Mark (icon-only, for app icon / favicon / avatar fallback): an abstracted rooftop/gate motif in a single stroke weight, monochrome (`--color-primary-600` on `--color-surface-0`, or reversed).
- Minimum clear space around mark = height of the mark itself.
- Never place mark on a busy photo without a scrim (`--overlay-scrim-40`).

### 2.3 Multi-tenant branding
Each complex (tenant) gets a constrained brand slot layered on top of the core system — see §37 for the full token contract. The core Komplekku visual language (type, spacing, shadow, motion, iconography) is **never** overridden by tenant branding; only the accent hue and complex logo/name are tenant-controlled.

---

## 3. Color System

Base palette is a **warm, desaturated neutral** foundation with a single confident brand hue. No gradients in UI chrome. Colors are defined as design tokens with numeric scale `50` (lightest) → `900` (darkest), consistent with Tailwind-style scales for direct implementation.

### 3.1 Primary — "Pine" (trust, growth, calm)
A deep, desaturated green-teal. Used for primary actions, active nav states, links, verified badges.

| Token | Hex | Usage |
|---|---|---|
| `--color-primary-50` | `#F1F6F4` | subtle tinted backgrounds (e.g. verified banner bg) |
| `--color-primary-100` | `#DCEAE4` | hover bg on light surfaces |
| `--color-primary-200` | `#B8D5CA` | disabled-state fill, chart series |
| `--color-primary-300` | `#8CBAA9` | secondary icon fill |
| `--color-primary-400` | `#5F9C87` | — |
| `--color-primary-500` | `#3D7D69` | secondary emphasis text/icon |
| `--color-primary-600` | `#28624F` | **primary brand color** — buttons, links, active states |
| `--color-primary-700` | `#1E4D3E` | button hover/pressed |
| `--color-primary-800` | `#173D31` | high-contrast text-on-tint |
| `--color-primary-900` | `#102A22` | darkest, used sparingly (dark-mode surfaces) |

### 3.2 Secondary — "Clay" (community, warmth)
A muted terracotta used *only* in the community/social context (post reactions, community tags) to visually separate "marketplace" from "community" without introducing a second loud color.

| Token | Hex | Usage |
|---|---|---|
| `--color-secondary-50` | `#FBF3EE` | community section tint bg |
| `--color-secondary-200` | `#EBCBB8` | community tag bg |
| `--color-secondary-500` | `#C97F55` | community icon accents |
| `--color-secondary-600` | `#AD6540` | community active state |
| `--color-secondary-700` | `#8A4F32` | text-on-tint |

### 3.3 Accent — "Amber" (single CTA-reinforcement accent, used sparingly)
Reserved **exclusively** for high-value, rare moments: new-listing highlight ring, "boosted" marketplace items, admin critical alerts requiring action (not errors — see semantic red for errors). Never used for standard buttons.

| Token | Hex | Usage |
|---|---|---|
| `--color-accent-100` | `#FBEEC9` | highlight bg |
| `--color-accent-500` | `#D9A441` | boosted-listing ring, star rating fill |
| `--color-accent-700` | `#A9791F` | text-on-tint |

### 3.4 Neutral — "Stone" (the workhorse scale — 80% of the UI)
Warm-toned gray, never pure `#000`/`#FFF` in body use.

| Token | Hex | Usage |
|---|---|---|
| `--color-stone-0` (surface) | `#FFFFFF` | cards, sheets, modals |
| `--color-stone-25` (app bg) | `#FAF9F7` | screen background |
| `--color-stone-50` | `#F4F2EF` | subtle section bg, input fill |
| `--color-stone-100` | `#E9E6E1` | dividers, hairline borders |
| `--color-stone-200` | `#D9D4CC` | disabled borders |
| `--color-stone-300` | `#BFB9AE` | placeholder text, disabled text |
| `--color-stone-400` | `#9C958A` | icon default (inactive) |
| `--color-stone-500` | `#7D766A` | secondary text |
| `--color-stone-600` | `#5E594F` | body text |
| `--color-stone-700` | `#443F37` | headings (light mode) |
| `--color-stone-800` | `#2E2A24` | high-emphasis headings |
| `--color-stone-900` | `#1C1915` | near-black, dark-mode bg |

### 3.5 Semantic
| Token | Hex | Usage |
|---|---|---|
| `--color-success-50/500/700` | `#EEF6EE / #3F8C4D / #2A5F34` | success toast, in-stock, "verified" checkmark bg option |
| `--color-warning-50/500/700` | `#FBF3E4 / #C98A2E / #8F5F19` | pending verification, low stock, soft warnings |
| `--color-error-50/500/700` | `#FBEEEC / #C4523F / #8E3A2B` | destructive actions, validation errors, rejected status |
| `--color-info-50/500/700` | `#EEF3F8 / #3E6FA8 / #2A4C74` | informational banners, system notices |

**Rule:** semantic colors are reserved for status communication only — never repurposed as decorative accents.

### 3.6 Elevation-neutral overlays
- `--overlay-scrim-20/40/60` — black at 20/40/60% opacity, used only over photography (image overlays for legibility), never over flat UI.
- `--overlay-focus-ring` — `--color-primary-600` at 100%, 2px, 2px offset. Every interactive element gets this on keyboard focus (§31).

### 3.7 Color usage ratio (per screen, guiding rule)
- 70% neutral (`stone-0/25/50/100`)
- 20% primary (pine) — nav, primary CTA, links, active states
- 5% secondary (clay) — community context only
- 5% semantic + accent combined

---

## 4. Typography System

### 4.1 Typeface pairing
- **Display / Headings:** `Fraunces` (variable, optical size aware) — a soft-serif with warmth, used for H1–H3, hero moments, empty-state headlines, onboarding. This is what makes Komplekku feel premium/editorial instead of generic SaaS.
- **UI / Body:** `Inter` (or `Public Sans` as fallback) — for all body copy, labels, buttons, form fields, data-dense UI (marketplace grid, chat, admin tables).
- **Numeric/Mono (optional, admin only):** `IBM Plex Mono` for transaction IDs, timestamps in admin tables.

Rationale: mixing one warm serif (identity, trust, editorial calm) with one clean grotesk (functional clarity) avoids the "template SaaS" look of all-Inter products while staying legible at small sizes on mobile.

### 4.2 Type scale (mobile-first, fluid via `clamp()`)

| Token | Typeface | Size (mobile→desktop) | Weight | Line-height | Usage |
|---|---|---|---|---|---|
| `--text-display-l` | Fraunces | `clamp(32px, 6vw, 48px)` | 600 | 1.1 | Onboarding hero, empty-state hero |
| `--text-display-m` | Fraunces | `clamp(26px, 5vw, 36px)` | 600 | 1.15 | Screen hero headers (rare) |
| `--text-h1` | Fraunces | `clamp(22px, 4vw, 28px)` | 600 | 1.2 | Screen title |
| `--text-h2` | Fraunces | `20px` | 600 | 1.25 | Section header |
| `--text-h3` | Inter | `17px` | 600 | 1.3 | Card title, list-item title |
| `--text-body-l` | Inter | `16px` | 400 | 1.5 | Primary body copy |
| `--text-body-m` | Inter | `14px` | 400 | 1.5 | Secondary body, descriptions |
| `--text-body-s` | Inter | `13px` | 400 | 1.45 | Meta text, timestamps, captions |
| `--text-label` | Inter | `13px` | 600 | 1.2 | Form labels, tags, button text |
| `--text-overline` | Inter | `11px` | 600, uppercase, tracking +6% | 1.2 | Category eyebrow, section kicker |
| `--text-numeric-price` | Inter | `18px` | 700 | 1.2 | Price display, tabular-nums |

### 4.3 Rules
- Never more than **2 weights** of Fraunces in one screen (600 default, 500 for large display only).
- Body text color defaults to `--color-stone-600`; headings to `--color-stone-800`.
- Line length: cap body text at `65ch` max on tablet/desktop (readability).
- No justified text, no letter-spacing on body copy.
- Indonesian-language UI: allow slightly looser line-height (+0.05) for diacritics/descenders comfort — apply `1.55` to `--text-body-l` when locale = `id`.

---

## 5. Spacing System

8pt base grid. All spacing, padding, and sizing values are multiples of `4px`, with `8px` as the primary rhythm unit.

| Token | Value | Typical use |
|---|---|---|
| `--space-0` | 0 | — |
| `--space-1` | 4px | icon-to-label gap, tight inline gaps |
| `--space-2` | 8px | chip padding, tight stack |
| `--space-3` | 12px | input internal padding, small card padding |
| `--space-4` | 16px | standard card padding, screen horizontal margin (mobile) |
| `--space-5` | 20px | section internal spacing |
| `--space-6` | 24px | spacing between unrelated components |
| `--space-8` | 32px | section-to-section spacing |
| `--space-10` | 40px | major section breaks |
| `--space-12` | 48px | screen-top hero spacing |
| `--space-16` | 64px | desktop section breaks |
| `--space-20` | 80px | desktop hero spacing |

**Screen margin rule:** mobile horizontal margin = `--space-4` (16px); tablet = `--space-6` (24px); desktop content column = centered, max-width `--container-lg` (1120px) with `--space-8` gutter.

---

## 6. Border Radius

Soft but restrained — premium products use *consistent*, moderate radii, not maximal pill-everything or sharp-everything.

| Token | Value | Usage |
|---|---|---|
| `--radius-xs` | 6px | chips, tags, small badges |
| `--radius-sm` | 10px | buttons, inputs, small cards |
| `--radius-md` | 14px | standard cards (listing card, post card) |
| `--radius-lg` | 20px | modals, bottom sheets, large image cards |
| `--radius-xl` | 28px | hero cards, onboarding illustration frames |
| `--radius-full` | 999px | avatars, pill buttons, status dots |

**Rule:** never mix more than 2 radius tokens within a single component hierarchy (e.g. a card at `--radius-md` containing a button at `--radius-sm` — never `--radius-xl` nested inside `--radius-xs`).

---

## 7. Shadow / Elevation

Shadows are used to indicate **stacking order**, not decoration. Komplekku uses soft, low-opacity, warm-tinted shadows — never harsh black drop shadows.

| Token | Value | Usage |
|---|---|---|
| `--elevation-0` | none, `1px solid var(--color-stone-100)` border only | Cards at rest on `stone-25` bg |
| `--elevation-1` | `0 1px 2px rgba(28,25,21,0.04), 0 1px 1px rgba(28,25,21,0.03)` | Slightly raised card / list item hover |
| `--elevation-2` | `0 2px 8px rgba(28,25,21,0.06)` | Dropdown, popover, floating action button |
| `--elevation-3` | `0 8px 24px rgba(28,25,21,0.08)` | Modal, bottom sheet |
| `--elevation-4` | `0 16px 40px rgba(28,25,21,0.10)` | Full-screen overlay dialogs (rare) |

**Rule:** default resting state for cards is **border, not shadow** (`--elevation-0`). Shadow is reserved for elements that are *temporarily* elevated above the content plane (sheets, menus, modals) — this is what separates Komplekku from generic "everything has a shadow" marketplace UI.

---

## 8. Iconography

- **Single icon family:** [Phosphor Icons](https://phosphoricons.com), **Regular** weight for default state, **Fill/Duotone** only for active/selected nav states. No mixing with Feather, Font Awesome, Material, or emoji-as-icon (emoji permitted only in chat reactions, §18).
- **Stroke width:** 1.5px equivalent at 24px frame.
- **Sizes:** `16px` (inline with text), `20px` (default UI icon), `24px` (nav bar, prominent actions), `32px` (empty-state illustrations, onboarding).
- **Color:** icons inherit `currentColor`; default inactive = `--color-stone-400`, active/selected = `--color-primary-600`.
- Icons never carry meaning alone in critical actions — always paired with a text label (accessibility, §31).

---

## 9. Grid & Responsive Layout

### 9.1 Breakpoints
| Token | Range | Target |
|---|---|---|
| `--bp-mobile` | 0–599px | Primary target (mobile-first, §10) |
| `--bp-tablet` | 600–1023px | 2-column adaptation |
| `--bp-desktop` | 1024–1439px | Full nav rail, multi-column |
| `--bp-wide` | 1440px+ | Max-width content column, extra whitespace, never full-bleed content |

### 9.2 Grid
- Mobile: single column, 4pt gutter margins at `--space-4`.
- Tablet: 8-column grid, `--space-5` gutters.
- Desktop: 12-column grid, `--space-6` gutters, content max-width `1120px` centered; marketplace grid uses a **2–3 column** card grid (never 4+ — density kills the premium feel), community feed stays **single-column, max-width 640px** even on desktop (feed content should read like a curated stream, not a dashboard).

### 9.3 Safe areas
All screens respect `env(safe-area-inset-*)` for notch/home-indicator devices; bottom tab bar padding-bottom includes safe-area inset.

---

## 10. Mobile-First Principles

1. **Design at 375px width first.** Every component spec below states mobile layout as primary; desktop is an *adaptation*, not a separate design.
2. **One primary action visible without scrolling** on every screen (sticky CTA where needed — see §12 Product Detail).
3. **Thumb-reach priority:** primary actions live in the bottom half of the screen (bottom tab bar, sticky bottom CTA, bottom sheets over modals) — see §29.
4. **Progressive disclosure:** secondary/tertiary actions collapse into overflow menus (`⋯`) or bottom sheets rather than crowding the main view.
5. **Native gestures respected:** swipe-back, pull-to-refresh, swipe-to-dismiss on sheets — all standard OS gestures work; Komplekku never fights the platform.
6. **Tap targets:** minimum 44×44px, spacing between adjacent targets minimum 8px.

---

## 11. Navigation Architecture

### 11.1 Information architecture (resident app)
```
Bottom Tab Bar (mobile) / Left Nav Rail (desktop)
├── Home              (icon: House)
├── Marketplace        (icon: Storefront)
├── Community          (icon: UsersThree)      ← includes feed + create-post entry
├── Chat               (icon: ChatCircle)       [badge: unread count]
└── Profile            (icon: UserCircle)
```
- 5 destinations max on mobile tab bar — never more (crowded tab bars read as generic).
- "Create" (listing or post) is **not** a 6th tab — it's a contextual FAB (§29) scoped to Marketplace/Community, or a `+` in the relevant section header, avoiding the "central plus tab" cliché unless usability testing on the real product later dictates otherwise.
- Active tab: icon switches Regular → Fill, label color → `--color-primary-600`, a 2px top indicator bar in `--color-primary-600` (subtle, not a pill background).
- Tab bar: `--color-stone-0` bg, `1px solid --color-stone-100` top border, height 56px + safe-area inset, `--elevation-1` optional (soft) only if content scrolls beneath it.

### 11.2 Secondary navigation
- **Marketplace, Community:** top app bar with segmented control for sub-filters (e.g. "All / Selling / Wanted" in marketplace), search icon top-right.
- **Screen-level back navigation:** standard iOS/Android back chevron/arrow top-left, 44px tap target, paired with screen title in `--text-h3`.
- **Admin dashboard (desktop-first):** persistent left sidebar nav (240px, collapsible to 72px icon rail), not a tab bar — see §23.

### 11.3 Nav-to-screen map
Every tab is a stack navigator; deep links (e.g. tapping a listing from a push notification) push directly into the relevant stack while keeping tab bar context intact.

---

## 12. Home Screen

**Purpose:** Orient the resident in 3 seconds — what's new in the complex, quick access to marketplace/community, and personal essentials (announcements, active chats).

**Hierarchy (top → bottom):**
1. Top bar: complex name/logo (tenant-branded, §37) + notification bell (badge) + avatar
2. Greeting block: `"Selamat pagi, {FirstName}"` in `--text-h2` (Fraunces) — human, not corporate
3. Admin announcement banner (if active) — `--color-info-50` bg, dismissible, only shown when management has an active announcement
4. Quick actions row: horizontally scrollable chip row — "Jual barang", "Cari tetangga", "Lapor masalah" — icon + label chips, `--radius-full`, `--color-stone-50` bg
5. "Terbaru di Marketplace" — horizontal scroll of 4–5 listing cards (compact variant, §13.3), "Lihat semua →" link
6. "Aktivitas Komunitas" — 2–3 latest community posts (compact card, text-forward, no full image bleed)
7. Bottom tab bar

**Layout/spacing:** Screen bg `--color-stone-25`. Section vertical rhythm `--space-8` between blocks. Section headers `--text-overline` kicker + `--text-h3` title + optional "Lihat semua" trailing link (`--text-label`, `--color-primary-600`).

**Components used:** `AppBar`, `AnnouncementBanner`, `ChipScroll`, `ListingCard/compact`, `PostCard/compact`, `TabBar`.

**CTA:** none singular — home is a hub, not a conversion screen. Each section's "Lihat semua" is the CTA.

**Interaction:** pull-to-refresh reloads announcement + latest content; horizontal scrolls use momentum with edge fade (4px gradient mask, not a hard cut).

**States:** loading = skeleton (§26); empty marketplace/community sections collapse gracefully with a light empty-state row rather than showing an empty section header (never show a header with nothing under it).

**Responsive:** desktop home becomes a 2-column layout — main feed left (640px), sidebar right (320px: announcement + quick actions + "top sellers this week").

---

## 13. Marketplace

### 13.1 Purpose
Browse and search resident-to-resident listings inside the verified complex; the core trust promise is "everyone here is your actual neighbor."

### 13.2 Layout (list/browse screen)
- Top app bar: "Marketplace" title, search icon (expands to full search bar on tap), filter icon (opens bottom sheet).
- Segmented control below app bar: `Semua / Dijual / Dicari / Jasa` (`--radius-full` segmented pill, active segment `--color-stone-800` bg + white text, inactive transparent).
- Category chip scroll (horizontal): icon + label chips, same visual language as Home quick actions but marketplace-category-specific.
- Grid: mobile = 2-column card grid, gutter `--space-3`; tablet = 3-column; desktop = 3-column within 1120px container (never 4 — see §9.2).
- Floating "+ Jual" FAB, bottom-right, thumb reach, `--color-primary-600` bg, white icon+label, `--elevation-2`.

### 13.3 Listing card (grid variant)
- Image: 1:1 aspect, `--radius-md` top corners only (card is a single rounded rect, image clipped to it), lazy-loaded with a `--color-stone-100` blur-up placeholder.
- Badge overlay (top-left of image, only if applicable): "Baru" (new, `--color-accent-500` bg) or "Terjual" (sold, `--overlay-scrim-60` full-image dim + centered label).
- Below image (padding `--space-3`): title (`--text-h3`, 1-line truncate), price (`--text-numeric-price`, `--color-stone-800`), meta row (`--text-body-s`, `--color-stone-500`): unit block/distance + relative time ("Blok C · 2 hari lalu").
- Seller trust row (compact): 16px avatar + verified check icon if resident-verified (see §36) — no star rating clutter at grid-card level, ratings live on product detail only.

### 13.4 Search & filter
- Filter bottom sheet (§29): price range (dual slider), category, block/cluster proximity, condition (baru/bekas), sort (terbaru/termurah/termahal/terdekat).
- Empty search result: illustrated empty state (§25) with a "reset filter" secondary button.

### 13.5 States
- Loading: skeleton grid (§26), 6 placeholder cards.
- Error (network): inline error state (§27) replacing the grid, retry button.
- Empty category: empty state with category-specific copy ("Belum ada barang di kategori ini").

---

## 14. Product Detail

**Purpose:** Convert browsing into a chat-initiated transaction (Komplekku does not process payments in-app — the CTA is "chat with seller," not "buy now," reflecting the neighbor-to-neighbor trust model).

**Layout (mobile, scroll):**
1. Image gallery — full-bleed, swipeable, dot indicator, tap to full-screen zoom viewer.
2. Sticky top bar over image: back button + share + save/bookmark (scrim-backed circular buttons, `--overlay-scrim-40` bg, appears once scrolled past gallery).
3. Content sheet (rises with `--radius-xl` top corners over the gallery, `--color-stone-0` bg):
   - Title `--text-h1`, price `--text-display-m`-scale but Inter (numeric, not serif)
   - Meta row: category tag, condition tag, posted time
   - Seller card: avatar (48px), name, unit/block, verified badge (§36), resident-since date, "Lihat profil →"
   - Description: `--text-body-l`, `--color-stone-600`, expandable if >4 lines ("Baca selengkapnya")
   - Location context: block/cluster + approximate distance (never exact home address for privacy — see §36 privacy note)
   - Related listings: horizontal scroll, compact cards
4. Sticky bottom CTA bar: `--elevation-3`, `--color-stone-0` bg, `1px solid stone-100` top border — primary button **"Chat Penjual"** full-width minus a secondary icon-button for "Tawar harga" (offer) if seller enabled offers.

**Typography:** price uses tabular numerals, always formatted `Rp 150.000` (period thousands separator, Indonesian convention).

**Interaction:** image gallery pinch-to-zoom; save/bookmark toggles with a quick scale+fill micro-interaction (§30); "Chat Penjual" pushes into Chat stack with a pre-filled context card (listing thumbnail attached to the first message).

**States:** sold listings show a persistent scrim ribbon on gallery + CTA bar changes to disabled "Barang Terjual" state (`--color-stone-200` bg, `--color-stone-400` text, non-interactive).

**Responsive:** desktop = 2-column (gallery left 60%, sticky content card right 40%, no bottom sticky bar needed — CTA lives in the right column, naturally in view).

---

## 15. Create Listing

**Purpose:** Fast, low-friction listing creation — target under 90 seconds for a simple item.

**Flow (stepper, not a single long form):**
1. **Photos** — grid uploader, first photo = cover (drag to reorder), min 1 / max 8, `--radius-sm` tiles with `+` add tile in same grid.
2. **Details** — title (single line input, char counter 60 max), category (bottom-sheet picker with search), condition (segmented: Baru/Seperti Baru/Bekas), price (numeric keypad input, auto-formatted with thousand separators), description (multiline, placeholder guidance text).
3. **Review** — live preview rendered as the actual `ListingCard` + detail summary, so the seller sees exactly what buyers will see (no surprises = trust).

**Layout:** top progress indicator (3 dots or thin progress bar, `--color-primary-600` fill), each step full-screen, "Lanjut" primary button sticky bottom, "Kembali" as text link top-left (not a full button — de-emphasized).

**Validation:** inline, on-blur, never on-submit-only. Error text `--text-body-s` in `--color-error-500` directly under the field, field border switches to `--color-error-500`.

**Micro-copy tone:** encouraging, plain: "Tambahkan minimal 1 foto biar tetangga makin yakin" — not generic "This field is required."

**Post-submit:** success state (§28) with two next actions: "Lihat listing" / "Buat listing lain".

---

## 16. Community Feed

**Purpose:** Lightweight neighborhood social feed — announcements, questions, recommendations, lost & found. Text-forward, calmer visual rhythm than the marketplace grid.

**Layout:** single column, max-width 640px even on desktop, centered. Top: segmented filter (`Semua / Pengumuman / Diskusi / Hilang & Ditemukan`), then a "Apa yang terjadi di komplek?" composer entry point (tap → pushes to Create Post, §17) styled as a flat input-like row, not a floating card.

**Post card (feed variant):**
- Header row: avatar (36px) + name + block + relative time; overflow menu (⋯) far right for report/hide.
- Body: text (`--text-body-l`, max 4 lines then "Baca selengkapnya"), optional single image or 2×2 image grid (never a carousel in-feed — keep feed scroll predictable), optional category tag chip (`--color-secondary-*` per §3.2).
- Footer action row: Like (heart, outline→fill with subtle scale pop), Comment (count), Share — all `--text-body-s` + icon 18px, `--color-stone-500` default, `--color-secondary-600` on active like.
- Divider between posts: `1px solid --color-stone-100`, full-bleed to card edges, `--space-5` vertical padding — no card shadow between posts (flat, editorial list, not stacked cards — reinforces "calm").

**Interaction:** double-tap image to like (with heart burst micro-interaction, subtle, single pulse, 300ms); comment tap opens comments as a bottom sheet (not a new screen) for quick reply.

**States:** pinned admin announcements get a `--color-info-50` bg tint on the whole card + a pin icon in the header, always sorted to top regardless of chronology.

---

## 17. Create Post

**Purpose:** Frictionless posting — text-first, photo-optional.

**Layout:** modal-style full-screen sheet (slides up), top bar: "Batal" (left, text) / "Posting" (right, primary text button, disabled until min content present) / centered title "Buat Postingan".
- Author row (avatar + name + block) for context/accountability — always visible, non-editable (identity is fixed to the verified resident, reinforcing trust — no anonymous posting).
- Large borderless textarea, placeholder "Apa yang ingin kamu bagikan ke tetangga?", auto-grows.
- Category selector: horizontal chip row (Pengumuman/Diskusi/Jual-Beli redirect notice/Hilang & Ditemukan), single-select.
- Attach row (bottom, above keyboard): photo icon (multi-select up to 4), location-tag icon (optional, block-level only).

**Validation:** "Posting" button enables once textarea has ≥1 character or ≥1 photo attached.

**Special case:** if user selects a category that implies marketplace intent, show an inline nudge: "Ingin menjual barang? Buat listing di Marketplace →" linking to §15 — keeps feed and marketplace content cleanly separated.

---

## 18. Chat

**Purpose:** Direct, contextual messaging tied to listings or general neighbor contact — the trust-closing mechanism of the whole product.

**Chat list layout:** standard list, each row: avatar (44px, with online-dot if applicable), name + block (`--text-h3`/`--text-body-s`), last message preview (`--text-body-m`, truncated, `--color-stone-500`, bold+`--color-stone-800` if unread), timestamp + unread count badge (`--color-primary-600` pill) top-right.

**Conversation screen:**
- Top bar: back + avatar + name/block (tap → seller/resident profile) + overflow (report/block).
- If chat originated from a listing: persistent **context card** pinned under the top bar — compact listing thumbnail + title + price + "Lihat listing" — collapsible on scroll to a thin strip.
- Message bubbles: sent = `--color-primary-600` bg, white text, `--radius-md` with the bottom-right corner squared (`--radius-xs`) for directional affordance; received = `--color-stone-100` bg, `--color-stone-800` text, mirrored corner treatment. Max bubble width 75% of screen.
- Timestamps: grouped, shown only when >5 min gap or on tap-to-reveal per bubble.
- System messages (e.g. "Barang ini sudah ditandai terjual"): centered, `--text-body-s`, `--color-stone-500`, no bubble.
- Composer: bottom bar, `+` attach (photo, offer/price-proposal card, location), text input (`--radius-full`, `--color-stone-50` fill), send button (circular, `--color-primary-600`, disabled/gray until text present).
- Quick-reply chips (only in first 1–2 exchanges with a new contact): "Masih ada?", "Bisa COD?", "Nego bisa?" — reduces friction to first message, disappears after first real exchange.

**States:** typing indicator (3-dot, `--color-stone-400`); message failed-to-send shows a small red retry icon inline, never a full-screen error.

---

## 19. Profile

**Purpose:** Identity, trust signals, and self-management hub.

**Layout (own profile):**
1. Header: avatar (80px, tap to edit), name (`--text-h1`), unit/block + "Resident since {year}" (`--text-body-s`, `--color-stone-500`), verified badge inline with name if verified.
2. Stat row (flat, no card): Listings sold count / Rating avg / Posts count — three columns, number `--text-h2` + label `--text-body-s` beneath, separated by hairline dividers not boxes.
3. Action row: "Edit Profil" (secondary button, full-width on mobile).
4. Tabbed content: `Listing Aktif / Terjual / Postingan / Ulasan` (segmented tabs under header, sticky on scroll).
5. Settings entry (list rows, chevron-right): Notifikasi, Privasi, Bahasa, Bantuan, Keluar (destructive, `--color-error-600` text, no icon fill, positioned last with extra top margin for separation).

**Other-resident profile (read-only variant):** same layout minus Settings; adds "Chat" primary CTA button directly under header; reviews tab shows written reviews from other residents (§36).

---

## 20. Notifications

**Purpose:** Single inbox for all system, chat, marketplace, and community signals — scannable, grouped, never overwhelming.

**Layout:** top bar "Notifikasi" + "Tandai semua dibaca" text action (top-right, `--text-body-s`, `--color-primary-600`). List grouped by relative date header (`Hari ini / Kemarin / Minggu ini / Lebih lama`, `--text-overline` sticky section headers).

**Notification row:** leading icon in a tinted circle keyed to type (chat=`--color-primary-50`/primary icon, marketplace=`--color-accent-100`/accent icon, community=`--color-secondary-50`/secondary icon, system/admin=`--color-info-50`/info icon) — this color-coding is the *only* place semantic-adjacent tinting is used decoratively, and it's functional (fast type recognition), not arbitrary. Title (`--text-body-l`, bold if unread) + body preview (`--text-body-m`, `--color-stone-500`, 1 line) + timestamp. Unread = subtle `--color-primary-50` row bg + a small left-edge `--color-primary-600` 3px bar.

**Interaction:** tap → deep-links to the relevant screen with context; swipe-to-dismiss (mobile) removes from list without marking read elsewhere.

**Empty state:** calm illustration + "Belum ada notifikasi baru".

---

## 21. Authentication / Onboarding

**Purpose:** Establish trust *before* asking for anything — this is a gated community app, so onboarding must feel like an invitation, not a generic signup form.

**Flow:**
1. **Welcome screen** — Display-large headline (Fraunces): "Komplekmu, kini digital." Subtext, single illustration (line-art style, complex/gate motif matching the mark, §2.2), two buttons: primary "Masuk" (if returning), secondary text-link "Daftar sebagai warga baru".
2. **Phone/email entry** — single field, large touch target, OTP-based auth (no password field by default — reduces friction; password/email optional secondary method in settings later).
3. **OTP verification** — 6-box code input, auto-advance, resend timer (`--text-body-s` countdown → becomes tappable link at 0:00).
4. **Profile setup** — name, avatar (optional, default to initials avatar in `--color-primary-100` bg + `--color-primary-700` initials text if skipped), unit/block selection (searchable list, grouped by cluster).
5. **Resident verification prompt** — see §22 (can be deferred, but gated features stay locked with a persistent soft prompt until complete).

**Layout rule:** one primary decision per onboarding screen; progress dots at top (not a numbered stepper — keeps it feeling light, not bureaucratic); back navigation always available except on Welcome.

---

## 22. Resident Verification

**Purpose:** The core trust mechanism of the entire product — must feel secure and reassuring, not bureaucratic or invasive.

**Layout:**
- Explanatory screen first: icon (shield/checkmark motif, `--color-primary-600`), headline "Verifikasi tempat tinggal kamu", 2–3 line explanation of *why* (unlocks marketplace selling + community posting + builds trust with neighbors) and *what happens to the data* (privacy reassurance line, `--text-body-s`, `--color-stone-500`).
- Method selection (card-list, single-select): "Verifikasi oleh Admin Komplek" (upload proof: KTP + bukti kepemilikan/sewa, reviewed manually) — this is the only method in v1 given the admin-moderated model.
- Upload step: two document-capture tiles (camera or gallery), each with a small "contoh yang benar" helper thumbnail link.
- Submitted state: status card "Menunggu verifikasi" (`--color-warning-50` bg, clock icon) shown persistently on Profile + as a banner on Home until resolved.
- Approved: success toast + verified badge appears immediately across profile/listings; rejected: notification with reason + re-submit CTA (never a dead end).

**Copy tone:** reassuring, transparent about data use — never legalistic.

---

## 23. Admin Dashboard

**Purpose:** Desktop-first operational console for complex management staff — density and efficiency now outweigh "spacious," but the visual language (type, color, radius) stays consistent with the resident app so it never feels like a bolted-on separate product.

**Layout:** persistent left sidebar (240px expanded / 72px icon-only collapsed) — sections: `Overview, Warga (Residents), Verifikasi, Marketplace, Komunitas, Moderasi, Pengumuman, Pengaturan`. Top bar: search (global admin search), admin avatar/menu.

**Overview screen:** KPI card row (4 cards: Total Warga Terverifikasi / Listing Aktif / Laporan Menunggu / Postingan Hari Ini) — flat stat cards, `--elevation-0` (border only), number `--text-display-m` Inter (not Fraunces — admin context is data-first, functional), label `--text-body-s` above in `--text-overline` style, trend delta (small, green/red arrow + %) beneath.
Below: two-column — recent activity log (left, 60%) + pending actions queue (right, 40%, this is the actionable "inbox" — verification requests + reports needing action, sorted oldest-first).

**Data tables (Warga, Marketplace, etc.):** standard admin table pattern — sticky header row (`--color-stone-50` bg, `--text-label` uppercase-off, `--color-stone-500`), row height 56px, hover row `--color-stone-25` bg, row-level actions revealed on hover (right-aligned icon buttons) rather than always-visible clutter. Bulk-select checkbox column + bulk action bar (appears above table when ≥1 selected).

**Status pills (used throughout admin):** `--radius-xs`, `--text-body-s` bold, tinted bg per semantic token — Terverifikasi=success, Menunggu=warning, Ditolak=error, Aktif=primary-tint, Nonaktif=neutral (stone-100/stone-500).

---

## 24. Admin Moderation

**Purpose:** Fast, low-friction review of flagged content (posts, listings, reports) and verification submissions — this is the highest-frequency admin task, so it's optimized for speed.

**Layout:** queue-based, single-item focus pattern (not a table for this specific flow) — left panel = scrollable queue list (compact rows: type icon, reporter, reason, timestamp), right panel = full detail of selected item (the actual post/listing/document rendered as it appears to residents, plus report metadata: reason category, reporter, report count if multiple).
Action bar (bottom of detail panel, sticky): `Setujui` (primary, success-tinted) / `Tolak` (secondary, error-tinted outline) / `Hapus Konten` (destructive text link, requires confirm modal) — for verification docs specifically, add a zoom/lightbox view of uploaded documents.

**Keyboard shortcuts (admin power-user affordance):** `A` approve, `R` reject, `↓/↑` navigate queue — listed in a small `?` shortcuts helper, since admins process these repetitively.

**Resolved items:** move out of queue immediately with a brief inline confirmation (not a full page reload), queue count badge updates live.

---

## 25. Empty States

**Principle:** every empty state explains *why* it's empty and gives one clear next action — never a bare "No data" message.

**Anatomy:** centered column, icon or simple line illustration (single color, `--color-stone-300`, 64–96px, matching the mark's linework style — no cartoon mascots, no stock illustration packs), headline (`--text-h3`, `--color-stone-700`), supporting text (`--text-body-m`, `--color-stone-500`, 1–2 lines), optional single CTA button.

**Contextual copy examples:**
- Empty marketplace category: "Belum ada barang di kategori ini" + "Jadi yang pertama jual di sini" (secondary button → Create Listing)
- Empty chat list: "Belum ada percakapan" + "Mulai chat dari halaman Marketplace atau Komunitas"
- Empty search results: "Tidak ditemukan hasil untuk '{query}'" + "Coba kata kunci lain" (no button, just text guidance)
- Empty notifications: no CTA needed, purely informational

---

## 26. Loading / Skeleton States

**Principle:** skeletons mirror the exact final layout (no generic spinners for list/grid content — spinners only for full-screen initial app load and button-level inline actions).

**Skeleton style:** `--color-stone-100` base with a subtle shimmer sweep (`--color-stone-50` highlight band, 1.4s ease-in-out loop, left→right) — shimmer is subtle (low contrast) to stay "calm," not the harsh high-contrast shimmer common in generic templates.

**Component-level skeletons:**
- `ListingCard` skeleton: gray image block (1:1) + 2 text bars (title width 80%, price width 40%).
- `PostCard` skeleton: circle avatar + 2 text bars (name/time) + 3 full-width text bars (body) + optional image block.
- Table row skeleton: uniform gray bars per column, staggered widths for a natural feel.

**Button loading state:** label replaced by a small inline spinner (16px, `currentColor`), button width preserved (no layout shift), disabled interaction during load.

**Full-screen initial load:** centered Komplekku mark, subtle breathing opacity pulse (0.6↔1.0, 1.2s ease-in-out) — no generic spinner on the splash screen.

---

## 27. Error States

**Principle:** errors are calm and actionable, never alarming red-screen panic.

**Inline field error:** border → `--color-error-500`, helper text below in `--color-error-600`, small warning-circle icon prefix.

**Section/list-level error** (e.g. failed to load marketplace grid): same anatomy as Empty State but icon = warning-circle in `--color-error-500`, headline "Gagal memuat data", body = plain-language reason if known else generic, primary button "Coba lagi".

**Toast-level error** (e.g. failed to send message): see §29 Toast spec, `--color-error-50` bg variant.

**Full-page error (500-class, e.g. app crash boundary):** centered illustration (calm, not a "broken robot" cliché — a simple line-art "path interrupted" motif), headline "Ada yang tidak beres", body reassurance + "Kembali ke Beranda" button.

**Form submit error (e.g. server rejects a listing submission):** non-blocking inline banner at top of the form (`--color-error-50` bg, `--radius-sm`, dismissible), specific field errors also highlighted individually — never only a generic top banner with no field-level detail.

---

## 28. Success States

**Principle:** success is quiet and confirmatory, with rare, deliberate delight moments reserved for genuinely significant actions (not every button tap).

**Standard success:** toast notification (§29), `--color-success-50` bg, checkmark-circle icon, auto-dismiss 3s.

**Significant success moments (get a dedicated full-screen or sheet confirmation with subtle celebratory motion — used only for):**
- First listing published ("Listing pertamamu sudah tayang!")
- Resident verification approved
- First successful transaction marked complete (seller marks item sold via chat)

Anatomy: centered icon in a tinted circle with a single soft scale+fade-in entrance (no confetti, no particle bursts — reserve any particle-style celebration, if ever used, exclusively for verification-approved, and even then keep it to a brief, low-density, muted-palette burst, not a generic bright confetti canvas), headline, 2 action buttons (primary next-step + secondary "back to home").

**Inline micro-success:** e.g. "Tersimpan" checkmark flash next to a saved field, bookmark icon fill animation (§30) — no toast needed for these, the component's own state change *is* the feedback.

---

## 29. Toast / Modal / Bottom-Sheet Behavior

### 29.1 Toast
- Position: top of screen (below status bar/app bar), mobile; top-right, desktop.
- Anatomy: icon + message (`--text-body-m`) + optional single text action (e.g. "Urungkan"), `--radius-sm`, `--elevation-2`, max-width 360px on desktop, full-width minus margins on mobile.
- Duration: 3s default, 5s if it contains an action, errors persist until dismissed or 6s.
- Stacking: max 1 visible at a time; new toast replaces/queues rather than stacking multiple simultaneously (avoids visual noise).

### 29.2 Modal (desktop-preferred) vs Bottom Sheet (mobile-preferred)
**Rule:** on mobile, any "modal-class" interaction (confirmations, pickers, filters, comments) renders as a **bottom sheet**, not a centered modal — this is the single biggest differentiator from generic desktop-ported UI. Centered modals are reserved for destructive confirmations only, even on mobile (e.g. "Hapus listing ini?") because those need to interrupt, not flow.

**Bottom sheet spec:** `--radius-lg` top corners, drag handle (4px bar, `--color-stone-200`, centered, `--space-2` from top), `--elevation-3`, scrim `--overlay-scrim-40` behind, swipe-down-to-dismiss + tap-scrim-to-dismiss, content max-height 90vh with internal scroll if needed, snap points (peek/half/full) for content-heavy sheets like filters or comments.

**Modal spec (destructive confirm only):** centered, `--radius-lg`, `--elevation-4`, max-width 400px, icon (warning, `--color-error-500`) + headline + body + 2 buttons (destructive primary right, cancel secondary/text left) — button order follows platform convention (confirm on the right).

---

## 30. Micro-interactions & Animation

**Principle:** motion clarifies state change and guides attention — it never performs for its own sake. Default easing `cubic-bezier(0.4, 0, 0.2, 1)` (standard ease-out), default duration `200ms` for UI transitions, `300–400ms` for sheet/modal entrances, `1.2–1.4s` for ambient loops (shimmer, pulse).

| Interaction | Spec |
|---|---|
| Button press | scale to `0.97`, 100ms, on `pointerdown`; release springs back |
| Like/heart toggle | icon scale `1 → 1.3 → 1`, 300ms, fill-color transition simultaneous |
| Bookmark toggle | fill sweep from center, 250ms |
| Sheet enter/exit | translateY from 100% with ease-out on enter (320ms), ease-in on exit (240ms), scrim fades concurrently |
| Tab switch (segmented control) | active pill/underline slides via `transform: translateX`, 220ms, not a hard cut |
| Card tap (navigigate) | subtle `0.98` scale + opacity `0.9` on press, releases into the push-navigation transition |
| List item entrance (feed load) | staggered fade+translateY(8px), 40ms stagger per item, capped at first 6 items (avoid long waits for the rest) |
| Success checkmark | draw-on stroke animation (SVG path, 400ms) for the significant-success moments only (§28) |
| Toast enter/exit | slide+fade from top, 250ms enter / 200ms exit |
| Page transition | standard platform push/pop (iOS slide, Android/web fade+slight-slide) — no custom page transitions that fight OS conventions |

**Reduced motion:** respect `prefers-reduced-motion` — all transform-based motion collapses to opacity-only cross-fades at 100ms.

---

## 31. Accessibility

- **Contrast:** all text meets WCAG AA minimum (4.5:1 body, 3:1 large text/18px+bold); `--color-stone-500` on `--color-stone-0` verified at 4.6:1 — do not introduce lighter grays for body text.
- **Tap targets:** 44×44px minimum, 8px minimum spacing between adjacent targets (§10.6).
- **Focus states:** every interactive element has a visible `--overlay-focus-ring` on keyboard focus (2px, `--color-primary-600`, 2px offset) — never `outline: none` without a replacement.
- **Icon-only buttons:** always carry an `aria-label`/accessible name matching the visible tooltip or context.
- **Forms:** every input has a visible, associated `<label>` (not placeholder-as-label); error messages are programmatically associated (`aria-describedby`) and announced.
- **Color independence:** status is never communicated by color alone — pair with icon and/or text label (e.g. verified badge = icon + "Terverifikasi" text available to screen readers even if visually just an icon).
- **Motion:** respects `prefers-reduced-motion` (§30).
- **Dynamic type:** layout tolerates up to 130% text scaling without clipping (test H1–H3 and buttons specifically).
- **Language:** primary locale Indonesian; all ARIA labels and alt text authored in-locale, not machine-translated afterthoughts.

---

## 32. Component Library

Naming convention: `PascalCase` component name + `/variant` where relevant. This is the canonical component inventory implementers should build against.

| Component | Variants |
|---|---|
| `Button` | `/primary`, `/secondary`, `/outline`, `/text`, `/destructive` × sizes `sm/md/lg` × icon-leading/trailing/icon-only |
| `Input` | `/text`, `/textarea`, `/numeric`, `/otp`, `/search` |
| `Select` | `/dropdown` (desktop), `/bottomsheet-picker` (mobile) |
| `Chip` | `/filter` (togglable), `/tag` (static), `/category` (icon+label) |
| `Badge` | `/status` (pill, semantic-tinted), `/count` (numeric, circular) |
| `Avatar` | `/photo`, `/initials-fallback` × sizes `xs(24) sm(32) md(44) lg(80)` |
| `Card` | `ListingCard/grid`, `ListingCard/compact`, `PostCard/feed`, `PostCard/compact`, `StatCard` (admin) |
| `AppBar` | `/default`, `/search-expanded`, `/scrolled` (scrim state over image) |
| `TabBar` | bottom nav, 5-item max |
| `SegmentedControl` | pill-style, 2–4 segments |
| `Sheet` | `/action` (menu), `/filter`, `/comments`, `/picker` |
| `Modal` | `/confirm-destructive` only |
| `Toast` | `/success`, `/error`, `/info` |
| `EmptyState` | configurable icon/headline/body/CTA |
| `Skeleton` | `/card`, `/row`, `/text-line` |
| `Banner` | `/announcement`, `/verification-pending`, `/info` |
| `VerifiedBadge` | icon+label, tooltip on hover/tap explaining meaning |
| `RatingStars` | read-only display + input variant (profile reviews) |
| `MessageBubble` | `/sent`, `/received`, `/system` |
| `DataTable` | admin only, sortable header, row actions |
| `StatusPill` | admin, semantic-tinted per §23 |

Each component's states are defined uniformly in §33.

---

## 33. Component States

Every interactive component must define and visually distinguish these states:

| State | Visual treatment |
|---|---|
| **Default** | Base tokens per component spec |
| **Hover** (desktop/pointer) | Background shifts one step darker in its tint scale (e.g. `stone-0→stone-25`, `primary-600→primary-700`), 150ms transition |
| **Pressed/Active** | Scale `0.97` (buttons/cards) or bg shifts two steps darker, no shadow increase |
| **Focus (keyboard)** | `--overlay-focus-ring` visible, no removal of hover styling |
| **Disabled** | Opacity `0.5` OR explicit `stone-200` bg / `stone-400` text (never both opacity+color-shift stacked), cursor `not-allowed`, no hover/press response |
| **Loading** | Inline spinner replacing label (buttons) or skeleton replacing content (cards/lists); component retains its layout footprint (no shift) |
| **Error** | `--color-error-500` border/text per §27, icon prefix where applicable |
| **Selected/Active (toggle, tab, chip)** | Fill/border switches to `--color-primary-600` family, icon switches Regular→Fill (Phosphor) |
| **Empty (data components)** | Falls through to `EmptyState` component, §25 |

---

## 34. UX Writing / Tone

- **Language:** Bahasa Indonesia primary, informal-respectful register ("kamu", not "Anda"; not slang-heavy either — the tone of a considerate neighbor, not a startup app).
- **Sentence style:** short, direct, verb-first for actions ("Tambahkan foto", not "Foto dapat ditambahkan di sini").
- **Error copy:** explain what happened + what to do, never blame the user, never raw technical/API error text surfaced to residents.
- **Empty/zero states:** always paired with a next step, written as encouragement not deficiency ("Belum ada" not "Kosong" / "Tidak ada data").
- **Confirmations for destructive actions:** state the consequence plainly ("Listing ini akan dihapus permanen dan tidak bisa dikembalikan").
- **Notifications:** lead with the actor and action ("Budi mengirim pesan tentang 'Sepeda Anak'") not generic ("Anda memiliki pesan baru").
- **Admin-facing copy:** slightly more formal/operational register than resident-facing copy — admins are staff, not neighbors, in tone.

---

## 35. Image / Avatar Guidelines

- **Listing photos:** 1:1 primary thumbnail crop everywhere in grids/cards; original aspect preserved in the full gallery view. Minimum acceptable resolution enforced at upload (reject <600px). Auto-compress on upload; display via responsive `srcset`.
- **Avatars:** always cropped to circle (`--radius-full`), 1:1 source. Fallback = initials on a deterministic tinted background drawn from `--color-primary-100`/`--color-secondary-100`/`--color-accent-100` (rotate by user ID hash) with matching `-700` text — never a generic gray silhouette icon (feels colder/less human).
- **Community post images:** preserve original aspect ratio up to a max height cap in-feed (prevents one tall photo dominating the scroll); 2×2 grid crop only when ≥2 images attached.
- **Empty-state / onboarding illustrations:** single-color line art matching the brand mark's stroke language (§2.2) — never mixed illustration styles, never stock photography for these.
- **Verification documents:** never displayed to any user except the reviewing admin (and the owning resident on their own submission), always behind the moderation-panel lightbox (§24), never cached in resident-facing views.
- **Loading:** blur-up placeholder (dominant-color or low-res blur) for all photographic content, never a blank white/gray box with no transition.

---

## 36. Marketplace Trust / Reputation UI

**Principle:** trust signals are visible but restrained — one clear badge, not a gamified score wall.

- **Verified Resident Badge:** small filled-checkmark icon (`--color-primary-600`) directly adjacent to name, everywhere a resident's identity appears (listing card, post, chat, profile). Tap/hover reveals a tooltip: "Terverifikasi sebagai warga [Unit/Blok]".
- **Rating:** 5-star average shown only on **profile** and **product detail seller card** (not on grid cards, to avoid visual noise at scale) — star icon `--color-accent-500` fill, numeric average + review count in parentheses, e.g. `★ 4.8 (23 ulasan)`.
- **Reviews:** left only by residents with a completed chat-confirmed transaction (prevents fake reviews); review card = avatar+name+block, star rating, short text, relative date — no reply/argument threads (keeps it calm, disputes go through admin moderation instead).
- **Transaction confirmation flow:** after a chat exchange, either party can tap "Tandai selesai" in the chat context card, which prompts the counterpart to confirm and optionally leave a rating — this is what unlocks the review, not a self-declared "5 items sold" vanity counter.
- **No public "response rate/response time" stats in v1** — avoids pressure/gamification that doesn't fit the calm personality; revisit only if data shows it's needed for trust, not for engagement-goosing.
- **Report/flag affordance:** available on every listing/post/profile via overflow menu, low-visual-weight (icon+text in overflow, not a persistent red flag icon) — accessible but not alarming.

---

## 37. Multi-Tenant / Community Branding

Each residential complex (tenant) using Komplekku gets a **constrained** brand layer — never a full re-skin, to preserve product consistency and Komplekku's own brand equity across complexes.

**Tenant-controllable tokens:**
```
--tenant-logo-url
--tenant-name
--tenant-accent-hue      // maps to a curated set of pre-approved accent hues
                          // (a small palette of Pine-compatible alternates:
                          // e.g. Slate Blue #3D5A80, Muted Plum #6B4E71,
                          // Warm Olive #6B7A4F — all pre-tuned for the same
                          // 600-step contrast/warmth as default Pine)
```
**Tenant-controlled surfaces:** top app bar logo slot, welcome/onboarding hero, push notification icon.
**Never tenant-controlled:** typography, spacing, radius, shadow, iconography, motion, core neutral palette, component structure — the "Komplekku-ness" of the product is structural, not skinnable.

**Rationale:** this mirrors how Stripe/Linear-class B2B SaaS allow light white-labeling of chrome without letting tenants break the underlying design system integrity.

---

## 38. Dark Mode Strategy

Dark mode is **supported but secondary** (system-preference-driven, not a prominent toggle in v1) — the product's premium/editorial warmth is calibrated primarily for light mode, but dark mode must not feel like a naive inversion.

**Approach:** dedicated dark token set (not `filter: invert`):

| Token | Light | Dark |
|---|---|---|
| `--color-surface-app-bg` | `stone-25` `#FAF9F7` | `stone-900` `#1C1915` |
| `--color-surface-card` | `stone-0` `#FFFFFF` | `#242019` (slightly lifted from bg) |
| `--color-text-heading` | `stone-800` | `stone-50` `#F4F2EF` |
| `--color-text-body` | `stone-600` | `stone-200` `#D9D4CC` |
| `--color-primary-600` (brand) | `#28624F` | `#5F9C87` (lightened for dark-bg contrast, i.e. primary-400) |
| `--color-border` | `stone-100` | `#3A342C` |
| Shadows | soft warm-black per §7 | replaced by `1px solid border` only — shadows read poorly on dark, elevation communicated via bg-lightness steps instead |

**Rule:** never pure black (`#000`) backgrounds — maintain the warm undertone in dark mode too. Images/photography are never dimmed/filtered in dark mode (only chrome around them adapts).

---

## 39. Design Tokens (Implementation Format)

CSS custom properties, ready to drop into a global stylesheet or Tailwind theme extension:

```css
:root {
  /* Color — Primary (Pine) */
  --color-primary-50:  #F1F6F4;
  --color-primary-100: #DCEAE4;
  --color-primary-200: #B8D5CA;
  --color-primary-300: #8CBAA9;
  --color-primary-400: #5F9C87;
  --color-primary-500: #3D7D69;
  --color-primary-600: #28624F;
  --color-primary-700: #1E4D3E;
  --color-primary-800: #173D31;
  --color-primary-900: #102A22;

  /* Color — Secondary (Clay) */
  --color-secondary-50:  #FBF3EE;
  --color-secondary-200: #EBCBB8;
  --color-secondary-500: #C97F55;
  --color-secondary-600: #AD6540;
  --color-secondary-700: #8A4F32;

  /* Color — Accent (Amber) */
  --color-accent-100: #FBEEC9;
  --color-accent-500: #D9A441;
  --color-accent-700: #A9791F;

  /* Color — Neutral (Stone) */
  --color-stone-0:   #FFFFFF;
  --color-stone-25:  #FAF9F7;
  --color-stone-50:  #F4F2EF;
  --color-stone-100: #E9E6E1;
  --color-stone-200: #D9D4CC;
  --color-stone-300: #BFB9AE;
  --color-stone-400: #9C958A;
  --color-stone-500: #7D766A;
  --color-stone-600: #5E594F;
  --color-stone-700: #443F37;
  --color-stone-800: #2E2A24;
  --color-stone-900: #1C1915;

  /* Semantic */
  --color-success-50: #EEF6EE; --color-success-500: #3F8C4D; --color-success-700: #2A5F34;
  --color-warning-50: #FBF3E4; --color-warning-500: #C98A2E; --color-warning-700: #8F5F19;
  --color-error-50:   #FBEEEC; --color-error-500: #C4523F; --color-error-700: #8E3A2B;
  --color-info-50:    #EEF3F8; --color-info-500: #3E6FA8; --color-info-700: #2A4C74;

  /* Typography */
  --font-display: "Fraunces", ui-serif, Georgia, serif;
  --font-ui: "Inter", "Public Sans", -apple-system, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  --text-display-l: clamp(32px, 6vw, 48px);
  --text-display-m: clamp(26px, 5vw, 36px);
  --text-h1: clamp(22px, 4vw, 28px);
  --text-h2: 20px;
  --text-h3: 17px;
  --text-body-l: 16px;
  --text-body-m: 14px;
  --text-body-s: 13px;
  --text-label: 13px;
  --text-overline: 11px;

  /* Spacing */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px;
  --space-12: 48px; --space-16: 64px; --space-20: 80px;

  /* Radius */
  --radius-xs: 6px; --radius-sm: 10px; --radius-md: 14px;
  --radius-lg: 20px; --radius-xl: 28px; --radius-full: 999px;

  /* Elevation */
  --elevation-1: 0 1px 2px rgba(28,25,21,0.04), 0 1px 1px rgba(28,25,21,0.03);
  --elevation-2: 0 2px 8px rgba(28,25,21,0.06);
  --elevation-3: 0 8px 24px rgba(28,25,21,0.08);
  --elevation-4: 0 16px 40px rgba(28,25,21,0.10);

  /* Motion */
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-sheet: 320ms;

  /* Breakpoints (reference — used in JS/media queries, not inherited via var()) */
  --bp-tablet: 600px;
  --bp-desktop: 1024px;
  --bp-wide: 1440px;
}

[data-theme="dark"] {
  --color-surface-app-bg: #1C1915;
  --color-surface-card: #242019;
  --color-text-heading: #F4F2EF;
  --color-text-body: #D9D4CC;
  --color-primary-600: #5F9C87;
  --color-border: #3A342C;
}
```

**Naming convention for implementers:** `--{category}-{name}-{scale}`. Never hard-code hex values in component code — always reference tokens, so tenant theming (§37) and dark mode (§38) resolve correctly at the CSS custom-property layer.

---

## 40. Screen-by-Screen Implementation Specification (Consolidated Reference)

This section is a consolidated build checklist per screen, cross-referencing the detailed specs above (§12–24) for quick AI-agent implementation scoping. Each entry: **Route → Primary components → Key states to implement first.**

| # | Screen | Route (suggested) | Primary components | Must-implement states |
|---|---|---|---|---|
| 1 | Home | `/home` | AppBar, AnnouncementBanner, ChipScroll, ListingCard/compact, PostCard/compact | loading skeleton, empty sections, pull-to-refresh |
| 2 | Marketplace Browse | `/marketplace` | AppBar/search, SegmentedControl, ChipScroll, ListingCard/grid, FAB | loading grid, empty filtered, error/retry |
| 3 | Product Detail | `/marketplace/:id` | Gallery, Card/seller, sticky CTA bar | sold/disabled CTA, save toggle |
| 4 | Create Listing | `/marketplace/create` (stepper) | stepper shell, photo uploader, form inputs, review preview | inline validation, submit loading, success |
| 5 | Community Feed | `/community` | SegmentedControl, PostCard/feed, composer entry | loading skeleton, empty, pinned-announcement variant |
| 6 | Create Post | `/community/create` (sheet) | full-screen sheet, chip category select, attach row | disabled-until-valid submit button |
| 7 | Chat List | `/chat` | list row w/ unread badge | empty state, loading skeleton |
| 8 | Conversation | `/chat/:id` | MessageBubble, context card, composer, quick-replies | typing indicator, failed-send retry |
| 9 | Profile (own) | `/profile` | header, stat row, tabs, settings list | edit mode, verification-pending banner |
| 10 | Profile (other) | `/profile/:id` | read-only variant + Chat CTA | — |
| 11 | Notifications | `/notifications` | grouped list, type-tinted icon | empty, mark-all-read |
| 12 | Auth — Welcome | `/auth` | hero, 2 buttons | — |
| 13 | Auth — OTP | `/auth/otp` | 6-box input, resend timer | error (wrong code), resend-available |
| 14 | Profile Setup | `/auth/setup` | avatar picker, unit/block search-select | — |
| 15 | Resident Verification | `/verify` | explanatory screen, upload tiles, status card | pending, approved, rejected+resubmit |
| 16 | Admin Overview | `/admin` | sidebar, KPI StatCard row, activity log, pending queue | loading, empty pending queue |
| 17 | Admin Residents/Marketplace/Community tables | `/admin/:section` | DataTable, StatusPill, bulk action bar | empty, bulk-selected |
| 18 | Admin Moderation | `/admin/moderation` | queue list + detail panel, action bar | resolved-item transition, doc lightbox |

**Build order recommendation for an AI coding agent:** tokens (§39) → core components (§32–33) → Home + Marketplace browse + Product Detail (highest-traffic loop) → Create Listing → Community Feed + Create Post → Chat → Profile + Auth/Verification → Admin (separate app shell, can be parallelized once resident app components are stable).

---

## 41. Do & Don't

| ✅ Do | ❌ Don't |
|---|---|
| Use border (`--elevation-0`) as the default card resting state | Add a shadow to every card by default |
| One accent color moment per screen (amber = rare highlight) | Use amber/accent as a general-purpose button color |
| Bottom sheets for mobile pickers/filters/confirmations | Centered modals for routine mobile interactions |
| Real first names + unit/block for identity | Anonymous handles or generic "User123" |
| Serif (Fraunces) for headings/hero moments only | Serif body text or serif in dense UI (tables, forms) |
| 2–3 column marketplace grid, generous card padding | 4+ column dense grid chasing "more items visible" |
| Skeletons that mirror final layout | Generic centered spinners for list/grid loads |
| Status communicated by color + icon + text together | Color-only status indicators |
| Single icon family (Phosphor), consistent weight | Mixed icon sets or emoji-as-UI-icon |
| Calm, single-pulse success moments for major milestones only | Confetti/celebration on every minor action |
| Tenant branding limited to logo + curated accent hue | Full re-skin per tenant (different fonts/spacing/radius) |
| Copy that explains + offers next step | Bare "Error" / "No data" with no guidance |

---

## 42. Premium UI Quality Checklist

Before any screen ships, verify against this checklist:

- [ ] Uses only tokens defined in §39 — zero hard-coded hex/px values in component code
- [ ] Passes the "one primary action" test — a first-time user can identify the single most important thing to do on this screen within 3 seconds
- [ ] Whitespace rhythm follows the 8pt scale (§5) with no ad-hoc spacing values
- [ ] No more than 2 border-radius tokens nested in one component tree (§6)
- [ ] No card uses a heavier shadow than `--elevation-2` unless it is a modal/sheet actively overlaying content (§7)
- [ ] All photography uses blur-up loading, no flash-in of raw images (§35)
- [ ] Every status/badge pairs color with icon and/or text — verified via a grayscale screenshot test (if it's unreadable in grayscale, it fails)
- [ ] Empty, loading, and error states are designed and implemented for every data-driven screen — not just the "happy path"
- [ ] Mobile layout was designed first; desktop is a verified adaptation, not an afterthought stretch
- [ ] Motion respects `prefers-reduced-motion` and no animation exceeds 400ms for UI (non-ambient) transitions
- [ ] Copy reviewed against §34 tone guide — no raw technical error strings surfaced to residents
- [ ] Contrast-checked against WCAG AA for all text/background pairs actually used (§31)
- [ ] Screen was compared side-by-side against a Shopee/Tokopedia reference and visually reads as *categorically different* — denser grid, louder color, heavier shadow, or gamified badges anywhere means it fails this check
- [ ] Tenant-branding hooks (§37) don't leak into anything outside the approved surface list
- [ ] Dark mode variant checked for warm-neutral (no pure black) and shadow-to-border substitution (§38)

---

*End of DESIGN.md — Komplekku Design System v1.0*

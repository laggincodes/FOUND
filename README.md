# Use It First

> **See what you have. Use what matters first.**

Use It First is a household food-intelligence web application designed to help people understand what food they already have, decide what needs attention, find something to cook, and keep their pantry updated as food is used.

---

## Product Loop

```text
Add Food
   ↓
Track Pantry
   ↓
Use First
   ↓
Find a Meal
   ↓
Cook / Use
   ↓
Update Pantry
   ↓
Track Impact
```

---

## Core Features

### 1. My Pantry (`/pantry`)
Track household food inventory in your Kitchen Larder.
* **Views**: Toggle between visual **Grid** and high-density **List** views.
* **Search & Filters**: Instant multi-attribute search and tabs (`All`, `Use First`, `Use Soon`, `Safe for now`, `Opened Packages`, `Recently Added`).
* **Sorting**: Sort by Urgency, Date proximity, Alphabetical, or Recently added.
* **Actions**: Inline quick-edit, slide-over drawer editing, delete confirmation, and *"Mark as used"*.
* **Empty State**: *"Your pantry is waiting."* with demo data restore action.

### 2. Use First (`/priority`)
Deterministic prioritization engine grouping inventory into three actionable tiers:
* **USE FIRST**: Terracotta (`#97472E`). Immediate attention (wilting greens, approaching dates, opened perishables).
* **USE SOON**: Amber (`#664500`). Items worth planning around this week.
* **SAFE FOR NOW**: Deep green (`#32533C`). Shelf-stable pantry staples.
* **Transparent Rationale**: Every prioritized item displays plain-language reasons without false food-safety guarantees.

### 3. What Can I Eat? (`/recipes`)
Pantry-aware recipe matching that answers *"What can I make with what I already have?"*
* **Dynamic Ranking**: Recipes ranked primarily by the number of priority ingredients they rescue.
* **Recipe Details** ([`/recipes/palak-paneer`](/recipes/palak-paneer)): Step-by-step instructions with clear `AVAILABLE` vs `MISSING` ingredient badges.
* **Recipe Completion**: *"Mark ingredients as used"* reduces pantry stock, clears depleted items, updates impact metrics, and provides toast confirmation.

### 4. Add Food (`/add`, `/add/manual`, `/scan`)
* **Manual Add**: Clean validated form with field-level checks (*"Please enter a food name."*, *"Expiry date cannot be before purchase date."*).
* **Pantry Scanner**: Photo capture with pre-configured sample images, honest processing state (*"Looking for recognizable food items…"*, no pseudo-scientific claims), and an editable verification table at `/scan/results`.
* **Quick Add**: 1-click logging for household staples (Spinach, Milk, Paneer, Tomatoes, Bread, Eggs, Yogurt, Coriander).

### 5. My Impact (`/impact`)
Measures actual household food-rescue activity:
* Food items used on time
* Homecooked meals prepared
* Estimated grocery value retained (in ₹)
* Weekly kitchen utilization (in kg)
* Immutable activity timeline of cooking and pantry events

---

## Design System (Stitch)

* **Typography**: **Newsreader** for headlines, editorial statements, and recipe titles; **Plus Jakarta Sans** for navigation, buttons, forms, and functional UI.
* **Palette**:
  * Background & Surface: `#FAF9FC`
  * Primary Green: `#32533C` (active navigation, primary buttons, safe inventory)
  * Secondary Terracotta: `#97472E` (`USE FIRST` urgent attention)
  * Tertiary Amber: `#664500` (`USE SOON` caution)
  * Surface Containers: `#EEEDF1`, `#F4F3F7`, `#E9E7EB`, `#E3E2E6`
  * Outline: `#727972`, `#C2C8C0`
* **Border Radii**: Restrained radii (`0.125rem` to `0.75rem`).
* **Brand Mark**: Minimal pantry jar / hourglass silhouette.

---

## Main Routes

| Route | Purpose |
| :--- | :--- |
| `/` | Dashboard: Hero (*"Use what you have. First."*), Quick Add, Needs your attention, What could you make?, This week at home |
| `/pantry` | Kitchen Larder inventory with Grid/List view toggle, search, filter, and drawer editing |
| `/add` | Add food gateway (Scan vs Manual) |
| `/add/manual` | Validated manual entry form |
| `/scan` | Photo scanner with sample images and honest detection states |
| `/scan/results` | Candidate review and batch-confirmation table |
| `/priority` | Central *Use First* planning board with plain-language explanations |
| `/recipes` | Pantry-connected recipe catalog (*What Can I Eat?*) |
| `/recipes/[slug]` | Recipe detail (including `/recipes/palak-paneer`) with *"Mark as used"* |
| `/impact` | Household impact metrics and activity timeline |
| `/about` | Philosophy, core loop, and grounded principles |
| `/404` | Custom 404 (*"Looks like this ingredient went missing"*) |

---

## REST API Endpoints (`/api/`)

* `GET /api/pantry` & `POST /api/pantry`: Query and create inventory items.
* `GET /api/recipes`: Fetch recipe catalog.
* `GET /api/priority`: Query inventory categorized by priority tiers.
* `GET /api/impact` & `POST /api/impact`: Query metrics or dispatch usage events.
* `POST /api/scan`: Pluggable image scanner endpoint.

---

## Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run linting check
npm run lint

# Production build
npm run build
```

---

## Core Product Questions Answered

* **What do I have?** $\longrightarrow$ Visible in **My Pantry** with instant search, location tags, and quantities.
* **What needs attention?** $\longrightarrow$ Highlighted in **Needs your attention** and **Use First** with plain-language explanations.
* **What can I make?** $\longrightarrow$ Recommended in **What Can I Eat?** prioritizing meals that rescue urgent ingredients.
* **What did I use?** $\longrightarrow$ Captured when you mark items as used after cooking.
* **What difference did that make?** $\longrightarrow$ Calculated in **My Impact** showing food saved, meals cooked, and estimated value retained.

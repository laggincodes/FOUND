# FOUND

> **Before you buy it. Find what you already have.**

FOUND is a student-first personal resource app designed to solve everyday over-purchasing and forgotten items. Whether checking for spare notebooks, phone chargers, toiletries, or groceries before shopping, FOUND gives students instant clarity with intelligent decision badges (`WAIT`, `USE FIRST`, `ALREADY HAVE`, `NOT FOUND`), unified search across durable goods and food pantries, and real-time impact tracking.

---

## The FOUND Loop

```text
Check FOUND ("Do I have this?")
        ↓
    Decision
┌───────┴───────┐
│               │
WAIT / USE      BUY
(In Inventory)  (Add to Grocery List)
│               │
Use / Deplete   Purchase & Move to Pantry/Inventory
└───────┬───────┘
        ↓
Track Impact (Money Saved & Waste Prevented)
```

---

## Core Features

### 1. Unified Search (`/`)
* **Instant Decision Badges**:
  * **`WAIT`**: You already have unused/spare quantity in stock (e.g. 2 unused notebooks in drawer backup).
  * **`USE FIRST`**: Item is in stock and needs immediate attention or is expiring soon.
  * **`ALREADY HAVE`**: Sufficient inventory in active use or storage.
  * **`NOT FOUND`**: Item not in inventory; 1-click addition to grocery checklist.
* **Bought-Ahead Intelligence**: Surfaces historical price and purchase date so you don't re-buy surplus items.

### 2. Personal Inventory & Shelves (`/inventory`)
* **Durable Goods Tracking**: Track notebooks, stationery, electronics, cables, toiletries, lab gear, and dorm essentials.
* **Location Management**: Know exactly where things are stored (Desk Drawer, Backpack, Shelf, Closet, Bathroom Caddy).
* **State Tracking**: Distinguishes items in active use from backup/unused stock.

### 3. Food Pantry (`/pantry`)
* **Urgency Tiers**: `USE FIRST`, `USE SOON`, and `SAFE FOR NOW` based on real shelf-life and opened dates.
* **Dual Views**: High-density Grid and List layouts with quick status editing and depletion logging.

### 4. Smart Grocery List (`/grocery`)
* **Item Checklist**: Sorted by Priority (`HIGH`, `MEDIUM`, `LOW`) with quantities and store departments.
* **Move to Pantry/Inventory**: Checked items automatically transfer to your active inventory with one tap.

### 5. My Impact (`/impact`)
* **Student Savings**: Measures estimated ₹ saved by avoiding unnecessary duplicate purchases.
* **Diverted Waste**: Tracks food items eaten on time and durable goods kept in active circulation.
* **Activity History**: Complete log of items used, found, and purchased.

---

## Tech Stack

* **Framework**: Next.js 14 (App Router)
* **Language**: TypeScript
* **Styling**: Tailwind CSS (Warm off-white `#FBFBFA`, Matte Forest `#1B3D2F`, Editorial Typography)
* **Icons**: Lucide React
* **State Management**: React Context with LocalStorage persistence

---

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run linting check
npm run lint

# Run verification suite
npx tsx scripts/test_found_mvp.ts

# Production build
npm run build
```

---

## Repository

* **GitHub**: [https://github.com/laggincodes/FOUND.git](https://github.com/laggincodes/FOUND.git)

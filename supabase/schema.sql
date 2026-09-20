-- =========================================================================
-- FOUND: SUPABASE DATABASE SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- "Before you buy it. Find what you already have."
-- =========================================================================

-- 1. Profiles Table (linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  first_name TEXT,
  household_name TEXT,
  household_size INTEGER DEFAULT 1,
  preferred_units TEXT DEFAULT 'metric',
  preferred_categories TEXT[] DEFAULT '{}',
  dietary_preferences TEXT[] DEFAULT '{}',
  disliked_foods TEXT[] DEFAULT '{}',
  favorite_foods TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Pantry Food Items
CREATE TABLE IF NOT EXISTS public.pantry_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id TEXT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'pcs',
  storage_location TEXT NOT NULL DEFAULT 'Fridge',
  opened BOOLEAN DEFAULT FALSE,
  opened_date DATE,
  purchase_date DATE,
  best_before DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Durable Personal Inventory Items (Notebooks, Electronics, Cables, etc.)
CREATE TABLE IF NOT EXISTS public.durable_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  location TEXT,
  purchase_date DATE,
  purchase_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Smart Grocery Items
CREATE TABLE IF NOT EXISTS public.grocery_items (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id TEXT,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'pcs',
  category TEXT DEFAULT 'Produce',
  checked BOOLEAN DEFAULT FALSE,
  source TEXT DEFAULT 'manual',
  recipe_id TEXT,
  recipe_name TEXT,
  notes TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  checked_at TIMESTAMPTZ
);

-- 5. Purchase History
CREATE TABLE IF NOT EXISTS public.purchase_history (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_id TEXT,
  name TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT,
  category TEXT,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_price NUMERIC,
  source TEXT DEFAULT 'manual'
);

-- 6. Usage & Impact Events
CREATE TABLE IF NOT EXISTS public.usage_events (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  food_item_id TEXT NOT NULL,
  food_name TEXT NOT NULL,
  recipe_id TEXT,
  recipe_name TEXT,
  quantity_used NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estimated_weight_grams NUMERIC DEFAULT 0,
  estimated_value_inr NUMERIC DEFAULT 0,
  was_priority_item BOOLEAN DEFAULT FALSE
);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: User A can NEVER view or mutate User B's records
-- =========================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.durable_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_events ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Pantry Items Policies
DROP POLICY IF EXISTS "Users can view own pantry" ON public.pantry_items;
CREATE POLICY "Users can view own pantry" ON public.pantry_items FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own pantry" ON public.pantry_items;
CREATE POLICY "Users can insert own pantry" ON public.pantry_items FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own pantry" ON public.pantry_items;
CREATE POLICY "Users can update own pantry" ON public.pantry_items FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own pantry" ON public.pantry_items;
CREATE POLICY "Users can delete own pantry" ON public.pantry_items FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Durable Items Policies
DROP POLICY IF EXISTS "Users can view own durables" ON public.durable_items;
CREATE POLICY "Users can view own durables" ON public.durable_items FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own durables" ON public.durable_items;
CREATE POLICY "Users can insert own durables" ON public.durable_items FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own durables" ON public.durable_items;
CREATE POLICY "Users can update own durables" ON public.durable_items FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own durables" ON public.durable_items;
CREATE POLICY "Users can delete own durables" ON public.durable_items FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Grocery Items Policies
DROP POLICY IF EXISTS "Users can view own groceries" ON public.grocery_items;
CREATE POLICY "Users can view own groceries" ON public.grocery_items FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own groceries" ON public.grocery_items;
CREATE POLICY "Users can insert own groceries" ON public.grocery_items FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own groceries" ON public.grocery_items;
CREATE POLICY "Users can update own groceries" ON public.grocery_items FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own groceries" ON public.grocery_items;
CREATE POLICY "Users can delete own groceries" ON public.grocery_items FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Purchase History Policies
DROP POLICY IF EXISTS "Users can view own purchase history" ON public.purchase_history;
CREATE POLICY "Users can view own purchase history" ON public.purchase_history FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own purchase history" ON public.purchase_history;
CREATE POLICY "Users can insert own purchase history" ON public.purchase_history FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own purchase history" ON public.purchase_history;
CREATE POLICY "Users can update own purchase history" ON public.purchase_history FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own purchase history" ON public.purchase_history;
CREATE POLICY "Users can delete own purchase history" ON public.purchase_history FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Usage Events Policies
DROP POLICY IF EXISTS "Users can view own usage events" ON public.usage_events;
CREATE POLICY "Users can view own usage events" ON public.usage_events FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert own usage events" ON public.usage_events;
CREATE POLICY "Users can insert own usage events" ON public.usage_events FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own usage events" ON public.usage_events;
CREATE POLICY "Users can update own usage events" ON public.usage_events FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own usage events" ON public.usage_events;
CREATE POLICY "Users can delete own usage events" ON public.usage_events FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- =========================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
-- =========================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, household_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'household_name', split_part(NEW.email, '@', 1) || '''s Home')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

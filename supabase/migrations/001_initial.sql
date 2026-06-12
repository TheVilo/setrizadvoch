-- ============================================
-- AkcioJedálniček — Databázová schéma (opravená)
-- ============================================

-- 1. INGREDIENTS
create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  canonical_name text not null unique,
  category text,
  unit text,
  kcal_per_100g numeric,
  protein_g_per_100g numeric,
  carbs_g_per_100g numeric,
  fat_g_per_100g numeric,
  avg_price_eur numeric,
  aliases text[]
);

-- 2. SALE_ITEMS
create table if not exists sale_items (
  id uuid primary key default gen_random_uuid(),
  chain text not null check (chain in ('lidl','kaufland','tesco','billa')),
  raw_name text not null,
  ingredient_id uuid references ingredients(id),
  sale_price numeric not null,
  base_price numeric not null,
  discount_pct numeric generated always as (round(((base_price - sale_price) / base_price * 100)::numeric, 1)) stored,
  unit text,
  valid_from date not null,
  valid_to date not null,
  scraped_at timestamptz default now()
);

alter table sale_items enable row level security;
create policy "read sale_items" on sale_items for select using (auth.role() = 'authenticated');
create policy "insert sale_items" on sale_items for insert with check (auth.role() = 'authenticated');

-- 3. PROFILES
create table if not exists profiles (
  id uuid references auth.users primary key,
  email text not null,
  tier text not null default 'free' check (tier in ('free', 'premium', 'family')),
  family_id uuid,
  preferences jsonb default '{"diet":[],"allergies":[],"default_persons":2,"favorite_store":"lidl"}',
  savings_total_eur numeric default 0,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
create policy "own profile select" on profiles for select using (auth.uid() = id);
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id);

-- 4. RECIPES
create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meal_type text not null check (meal_type in ('ranajky','obed','vecera','snack')),
  servings_base int not null default 2,
  instructions text[] not null default '{}',
  dietary_tags text[] default '{}',
  est_cost_eur numeric,
  est_savings_eur numeric,
  nutrition jsonb,
  source text default 'ai',
  used_sale_items uuid[],
  popularity int default 0,
  rating_sum int default 0,
  rating_count int default 0,
  created_at timestamptz default now()
);

alter table recipes enable row level security;
create policy "read recipes" on recipes for select using (auth.role() = 'authenticated');
create policy "insert recipes" on recipes for insert with check (auth.role() = 'authenticated');
create policy "update recipes" on recipes for update using (auth.role() = 'authenticated');

-- 5. RECIPE_INGREDIENTS
create table if not exists recipe_ingredients (
  recipe_id uuid references recipes(id) on delete cascade,
  ingredient_id uuid references ingredients(id),
  canonical_name text not null,
  qty numeric not null,
  unit text,
  on_sale boolean default false,
  sale_price numeric,
  base_price numeric,
  primary key (recipe_id, canonical_name)
);

alter table recipe_ingredients enable row level security;
create policy "read recipe_ingredients" on recipe_ingredients for select using (auth.role() = 'authenticated');
create policy "insert recipe_ingredients" on recipe_ingredients for insert with check (auth.role() = 'authenticated');

-- 6. MEAL_PLANS
create table if not exists meal_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  store text not null default 'lidl',
  days int not null check (days between 1 and 5),
  persons int not null default 2,
  total_cost_eur numeric,
  total_savings_eur numeric,
  status text default 'active',
  created_at timestamptz default now()
);

alter table meal_plans enable row level security;
create policy "own meal_plans" on meal_plans for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 7. PLAN_SLOTS
create table if not exists plan_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references meal_plans(id) on delete cascade,
  day_number int not null,
  meal_type text not null,
  recipe_id uuid references recipes(id)
);

alter table plan_slots enable row level security;
create policy "own plan_slots" on plan_slots for all
  using (exists (select 1 from meal_plans where id = plan_id and user_id = auth.uid()))
  with check (exists (select 1 from meal_plans where id = plan_id and user_id = auth.uid()));

-- 8. SAVED_ITEMS
create table if not exists saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  item_type text check (item_type in ('recipe','plan')),
  item_id uuid not null,
  saved_at timestamptz default now(),
  unique(user_id, item_type, item_id)
);

alter table saved_items enable row level security;
create policy "own saved_items" on saved_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 9. REROLL_USAGE
create table if not exists reroll_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  family_id uuid,
  used_date date not null default current_date,
  count int default 0,
  unique(user_id, used_date)
);

alter table reroll_usage enable row level security;
create policy "own reroll_usage" on reroll_usage for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

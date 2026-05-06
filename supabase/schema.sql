-- ════════════════════════════════════════════════════════════════════════
-- FinanceFlow — Schema completo
-- Cole isso inteiro no Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════════

-- ─── HOUSEHOLDS (você + namorada compartilham um) ─────────────────────────
create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Casa',
  created_at timestamptz default now()
);

-- ─── PROFILES (vincula auth.users → household) ───────────────────────────
-- Cada pessoa que loga vira um "membro" do household
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  household_id uuid not null references households(id) on delete cascade,
  display_name text not null,
  color text not null default '#0ea5e9',
  avatar text not null default 'U',
  created_at timestamptz default now()
);
create index on profiles(household_id);

-- ─── CARDS ────────────────────────────────────────────────────────────────
create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  bank text not null,
  last_four_digits text not null,
  type text not null check (type in ('credit', 'debit')),
  network text not null,
  card_limit numeric,
  closing_day int,
  due_day int,
  color text not null,
  created_at timestamptz default now()
);
create index on cards(household_id);

-- ─── BANK ACCOUNTS ────────────────────────────────────────────────────────
create table if not exists bank_accounts (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  bank text not null,
  type text not null check (type in ('checking', 'savings', 'investment')),
  balance numeric not null default 0,
  color text not null,
  created_at timestamptz default now()
);
create index on bank_accounts(household_id);

-- ─── TRANSACTIONS ─────────────────────────────────────────────────────────
create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  card_id uuid references cards(id) on delete set null,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  payment_method text not null check (payment_method in ('credit','debit','pix','cash')),
  description text not null,
  amount numeric not null,
  date date not null,
  category text not null,
  installment_total int,
  installment_current int,
  installment_amount numeric,
  is_recurring boolean default false,
  note text,
  created_at timestamptz default now()
);
create index on transactions(household_id, date desc);

-- ─── INCOMES ──────────────────────────────────────────────────────────────
create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  description text not null,
  amount numeric not null,
  date date not null,
  category text not null,
  is_recurring boolean default false,
  status text not null check (status in ('received','pending')),
  note text,
  created_at timestamptz default now()
);
create index on incomes(household_id, date desc);

-- ─── BILLS (contas fixas / templates recorrentes) ─────────────────────────
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  card_id uuid references cards(id) on delete set null,
  name text not null,
  amount numeric not null,
  due_day int not null,
  category text not null,
  is_active boolean default true,
  note text,
  created_at timestamptz default now()
);
create index on bills(household_id);

-- ─── BILL PAYMENTS (uma conta paga por mês) ───────────────────────────────
create table if not exists bill_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  bill_id uuid not null references bills(id) on delete cascade,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  month_key text not null,         -- 'yyyy-MM'
  amount numeric not null,
  is_paid boolean default false,
  paid_date date,
  note text,
  created_at timestamptz default now(),
  unique(bill_id, month_key)
);
create index on bill_payments(household_id, month_key);

-- ─── INVOICE PAYMENTS (fatura de cartão por mês) ──────────────────────────
create table if not exists invoice_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  month_key text not null,
  amount numeric not null,
  is_paid boolean default false,
  paid_date date,
  note text,
  created_at timestamptz default now(),
  unique(card_id, month_key)
);
create index on invoice_payments(household_id, month_key);

-- ─── BOLETOS (boletos avulsos) ────────────────────────────────────────────
create table if not exists boletos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  bank_account_id uuid references bank_accounts(id) on delete set null,
  description text not null,
  amount numeric not null,
  due_date date not null,
  barcode text,
  is_paid boolean default false,
  paid_date date,
  note text,
  created_at timestamptz default now()
);
create index on boletos(household_id, due_date);

-- ════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- Cada usuário só vê dados do household ao qual pertence.
-- ════════════════════════════════════════════════════════════════════════

alter table households       enable row level security;
alter table profiles         enable row level security;
alter table cards            enable row level security;
alter table bank_accounts    enable row level security;
alter table transactions     enable row level security;
alter table incomes          enable row level security;
alter table bills            enable row level security;
alter table bill_payments    enable row level security;
alter table invoice_payments enable row level security;
alter table boletos          enable row level security;

-- helper: pega o household_id do usuário logado
create or replace function current_household_id()
returns uuid
language sql stable security definer
as $$
  select household_id from profiles where id = auth.uid()
$$;

-- profiles
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select
  using (household_id = current_household_id());
drop policy if exists profiles_update_self on profiles;
create policy profiles_update_self on profiles for update
  using (id = auth.uid());

-- households
drop policy if exists households_select on households;
create policy households_select on households for select
  using (id = current_household_id());
drop policy if exists households_update on households;
create policy households_update on households for update
  using (id = current_household_id());

-- macro: aplica policies CRUD em uma tabela baseado em household_id
do $$
declare
  t text;
  tables text[] := array[
    'cards', 'bank_accounts', 'transactions', 'incomes',
    'bills', 'bill_payments', 'invoice_payments', 'boletos'
  ];
begin
  foreach t in array tables loop
    execute format('drop policy if exists %I_all on %I', t, t);
    execute format(
      'create policy %I_all on %I for all
         using (household_id = current_household_id())
         with check (household_id = current_household_id())',
      t, t
    );
  end loop;
end $$;

-- ════════════════════════════════════════════════════════════════════════
-- TRIGGER: ao criar usuário no Auth, cria profile + household se não tem
-- ════════════════════════════════════════════════════════════════════════

create or replace function handle_new_user()
returns trigger
language plpgsql security definer
as $$
declare
  new_household_id uuid;
  invite_household uuid;
begin
  -- Se o metadata trouxe um household_id (convite), usa ele.
  -- Senão, cria um household novo.
  invite_household := nullif(new.raw_user_meta_data->>'household_id', '')::uuid;

  if invite_household is not null then
    new_household_id := invite_household;
  else
    insert into households (name) values (
      coalesce(new.raw_user_meta_data->>'household_name', 'Minha Casa')
    ) returning id into new_household_id;
  end if;

  insert into profiles (id, household_id, display_name, color, avatar)
  values (
    new.id,
    new_household_id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'color', '#0ea5e9'),
    coalesce(new.raw_user_meta_data->>'avatar', upper(left(new.email, 1)))
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

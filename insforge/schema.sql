-- ZAV Interior & Clean · Insforge tables
-- Run in Insforge SQL console (https://insforge.renace.tech)

create table if not exists zav_quotes (
  id text primary key,
  created_at timestamptz,
  service text,
  size text,
  frequency text,
  name text,
  phone text,
  email text,
  zip text,
  notes text,
  locale text,
  status text default 'new',
  completed_at timestamptz,
  invoice_id text
);

create table if not exists zav_invoices (
  id text primary key,
  quote_id text,
  number text,
  created_at timestamptz,
  status text,
  client_name text,
  client_email text,
  client_phone text,
  client_address text,
  service text,
  description text,
  amount numeric,
  tax numeric,
  total numeric,
  currency text,
  notes text,
  billing_snapshot jsonb,
  recurring boolean default false,
  frequency text default 'once',
  series_id text,
  cycle integer default 1,
  period_start timestamptz,
  period_end timestamptz,
  next_invoice_at timestamptz,
  parent_invoice_id text
);

create table if not exists zav_billing (
  id text primary key,
  business_name text,
  legal_name text,
  email text,
  phone text,
  address text,
  city text,
  tax_id text,
  website text,
  invoice_prefix text,
  default_tax_rate numeric,
  currency text,
  notes text,
  updated_at timestamptz
);

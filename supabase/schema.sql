create extension if not exists pgcrypto;
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text default '',
  courses text default '',
  schedule text default '',
  location text default '',
  capacity integer not null default 0,
  active boolean not null default true,
  image text default '',
  organizer text default 'AFA Escola Sant Salvador',
  organizer_logo text default '',
  price numeric(10,2) not null default 0,
  member_price numeric(10,2) not null default 0,
  second_child_discount numeric(10,2) not null default 0,
  third_child_discount numeric(10,2) not null default 0,
  extra_first_month numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists registrations (id uuid primary key default gen_random_uuid(), code text unique not null, status text not null default 'en revisió', course text, group_name text, activity_id uuid references activities(id), activity_name text not null, student_name text not null, birth_date date, allergies text, nese text, nese_detail text, representative_name text not null, dni text, phone text, email text, address text, city text, postal_code text, authorized_people jsonb not null default '[]', emergency_contacts jsonb not null default '[]', base_amount numeric(10,2) not null default 0, discount_amount numeric(10,2) not null default 0, complements_amount numeric(10,2) not null default 0, total_amount numeric(10,2) not null default 0, paid_amount numeric(10,2) not null default 0, payment_method text, payment_date date, is_member boolean not null default false, registered_children_count integer not null default 1, child_order integer not null default 1, member_discount_amount numeric(10,2) not null default 0, sibling_discount_amount numeric(10,2) not null default 0, discount_label text default '', image_consent boolean, rules_accepted boolean, outing_accepted boolean, data_info_accepted boolean, emergency_accepted boolean, place text, signature_data text, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists enrollments (id uuid primary key default gen_random_uuid(), registration_id uuid not null references registrations(id) on delete cascade, activity_id uuid references activities(id), status text not null default 'pendent', enrolled_at timestamptz, start_date date, end_date date, created_at timestamptz not null default now());
create table if not exists monthly_fees (id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references enrollments(id) on delete cascade, month date not null, amount numeric(10,2) not null, discount numeric(10,2) not null default 0, total numeric(10,2) not null, due_date date, status text not null default 'pendent', paid_at timestamptz, unique(enrollment_id, month));
create table if not exists payments (id uuid primary key default gen_random_uuid(), registration_id uuid references registrations(id), enrollment_id uuid references enrollments(id), fee_id uuid references monthly_fees(id), amount numeric(10,2) not null, method text, reference text, paid_at timestamptz not null default now(), notes text);
create table if not exists receipts (id uuid primary key default gen_random_uuid(), payment_id uuid references payments(id) on delete set null, registration_id uuid references registrations(id) on delete set null, receipt_number text unique not null, document_path text, amount numeric(10,2) not null, issued_at timestamptz not null default now());
create table if not exists place_movements (id uuid primary key default gen_random_uuid(), activity_id uuid references activities(id), registration_id uuid references registrations(id), movement_type text not null, from_status text, to_status text, quantity integer not null default 1, reason text, created_at timestamptz not null default now());
create table if not exists documents (id uuid primary key default gen_random_uuid(), registration_id uuid references registrations(id) on delete cascade, activity_id uuid references activities(id), type text not null, title text not null, storage_path text, created_at timestamptz not null default now());
create table if not exists communications (id uuid primary key default gen_random_uuid(), registration_id uuid references registrations(id) on delete cascade, channel text not null, recipient text, subject text, body text, status text not null default 'pendent', sent_at timestamptz);
alter table activities add column if not exists vacancies_open boolean not null default true;
alter table activities add column if not exists capacity_override integer;
alter table activities add column if not exists image text default '';
alter table activities add column if not exists organizer text default 'AFA Escola Sant Salvador';
alter table activities add column if not exists organizer_logo text default '';
alter table activities add column if not exists price numeric(10,2) not null default 0;
alter table activities add column if not exists member_price numeric(10,2) not null default 0;
alter table activities add column if not exists second_child_discount numeric(10,2) not null default 0;
alter table activities add column if not exists third_child_discount numeric(10,2) not null default 0;
alter table activities add column if not exists extra_first_month numeric(10,2) not null default 0;
alter table registrations add column if not exists special_tariff_enabled boolean not null default false;
alter table registrations add column if not exists special_tariff_amount numeric(10,2);
alter table registrations add column if not exists special_tariff_label text default '';
alter table registrations add column if not exists legal_acceptances jsonb not null default '{}'::jsonb;
alter table registrations add column if not exists start_month text;
alter table registrations add column if not exists course text;
alter table registrations add column if not exists group_name text;
alter table registrations add column if not exists activity_id uuid references activities(id);
alter table registrations add column if not exists birth_date date;
alter table registrations add column if not exists allergies text;
alter table registrations add column if not exists nese text;
alter table registrations add column if not exists nese_detail text;
alter table registrations add column if not exists dni text;
alter table registrations add column if not exists phone text;
alter table registrations add column if not exists email text;
alter table registrations add column if not exists address text;
alter table registrations add column if not exists city text;
alter table registrations add column if not exists postal_code text;
alter table registrations add column if not exists authorized_people jsonb not null default '[]'::jsonb;
alter table registrations add column if not exists emergency_contacts jsonb not null default '[]'::jsonb;
alter table registrations add column if not exists base_amount numeric(10,2) not null default 0;
alter table registrations add column if not exists discount_amount numeric(10,2) not null default 0;
alter table registrations add column if not exists complements_amount numeric(10,2) not null default 0;
alter table registrations add column if not exists total_amount numeric(10,2) not null default 0;
alter table registrations add column if not exists paid_amount numeric(10,2) not null default 0;
alter table registrations add column if not exists payment_method text;
alter table registrations add column if not exists payment_date date;
alter table registrations add column if not exists is_member boolean not null default false;
alter table registrations add column if not exists registered_children_count integer not null default 1;
alter table registrations add column if not exists child_order integer not null default 1;
alter table registrations add column if not exists member_discount_amount numeric(10,2) not null default 0;
alter table registrations add column if not exists sibling_discount_amount numeric(10,2) not null default 0;
alter table registrations add column if not exists discount_label text default '';
alter table registrations add column if not exists image_consent boolean;
alter table registrations add column if not exists rules_accepted boolean;
alter table registrations add column if not exists outing_accepted boolean;
alter table registrations add column if not exists data_info_accepted boolean;
alter table registrations add column if not exists emergency_accepted boolean;
alter table registrations add column if not exists place text;
alter table registrations add column if not exists signature_data text;
alter table registrations add column if not exists updated_at timestamptz not null default now();

create index if not exists activities_slug_idx on activities(slug);
create index if not exists registrations_code_idx on registrations(code);
create index if not exists registrations_activity_idx on registrations(activity_id);
create index if not exists registrations_payment_date_idx on registrations(payment_date);
create index if not exists monthly_fees_month_idx on monthly_fees(month);
create index if not exists place_movements_activity_idx on place_movements(activity_id);
-- Public reads/writes are intentionally NOT exposed through anon policies. The application routes use the server-only service role.
-- Before production, add your preferred RLS policies and admin authentication layer.

-- Run this in Supabase: Project → SQL Editor → New query

create table if not exists ad_banners (
  id text primary key,
  advertiser_name text not null,
  image text,
  link_url text,
  active boolean default true,
  sort_order integer default 0
);

alter table ad_banners enable row level security;

-- Anyone (including logged-out visitors) can read active ads,
-- so paid banners show up on the site.
create policy "Public read access on ad_banners"
  on ad_banners for select
  using (true);

-- Only logged-in admins can add, edit, or delete ad banners.
create policy "Authenticated write access on ad_banners"
  on ad_banners for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

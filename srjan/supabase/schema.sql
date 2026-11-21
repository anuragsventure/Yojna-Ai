-- Srjan database. Run this whole file once in Supabase: SQL Editor > New query > paste > Run.
-- Before running, replace ADMIN_EMAIL_HERE (appears 5 times) with the email address you will use to sign in as admin.

create table if not exists exhibitions (
  id uuid primary key,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  featured boolean not null default false,
  kind text not null default 'exhibition' check (kind in ('exhibition','showcase')),
  wing text not null default 'Art' check (wing in ('Art','Spaces','Design')),
  credits text check (char_length(credits) <= 800),
  title text not null check (char_length(title) between 3 and 120),
  statement text not null check (char_length(statement) <= 3000),
  category text,
  start_date date, end_date date,
  host_name text not null check (char_length(host_name) between 2 and 120),
  host_city text, host_country text,
  host_bio text check (char_length(host_bio) <= 1500),
  host_links text,
  portrait_path text,
  promo_ok boolean not null default false,
  rights_version text not null,
  rights_accepted_at timestamptz not null default now(),
  admin_note text,
  created_at timestamptz not null default now(),
  approved_at timestamptz
);

create table if not exists exhibition_private (
  exhibition_id uuid primary key references exhibitions(id) on delete cascade,
  email text not null, phone text
);

create table if not exists artworks (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid not null references exhibitions(id) on delete cascade,
  sort int not null default 0,
  title text not null check (char_length(title) between 1 and 160),
  year text, medium text, dimensions text,
  description text check (char_length(description) <= 1500),
  credit text,
  for_sale boolean not null default false,
  price numeric, currency text,
  image_path text not null, thumb_path text not null
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  exhibition_id uuid, artwork_id uuid,
  exhibition_title text, work_title text,
  name text not null, email text not null, message text,
  created_at timestamptz not null default now()
);

alter table exhibitions enable row level security;
alter table exhibition_private enable row level security;
alter table artworks enable row level security;
alter table enquiries enable row level security;

-- Public can read approved exhibitions and their artworks only.
create policy "public reads approved exhibitions" on exhibitions for select using (status = 'approved');
create policy "public reads approved artworks" on artworks for select using (exists (select 1 from exhibitions e where e.id = exhibition_id and e.status = 'approved'));

-- Only the admin can do everything.
create policy "admin all exhibitions" on exhibitions for all using ((auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE') with check ((auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE');
create policy "admin all private" on exhibition_private for all using ((auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE') with check ((auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE');
create policy "admin all artworks" on artworks for all using ((auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE') with check ((auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE');
create policy "admin reads enquiries" on enquiries for select using ((auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE');

-- Visitors submit only through these two functions. Submissions always start as pending.
create or replace function submit_exhibition(p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare w jsonb; eid uuid := (p->>'id')::uuid;
begin
  if coalesce((p->>'rights_accepted')::boolean, false) is not true then raise exception 'Rights must be accepted'; end if;
  if jsonb_array_length(p->'works') < 1 or jsonb_array_length(p->'works') > 12 then raise exception 'Between 1 and 12 works required'; end if;
  if coalesce(p->>'kind','exhibition') = 'showcase' and jsonb_array_length(p->'works') > 6 then raise exception 'Up to 6 works for a feature request'; end if;
  insert into exhibitions (id,kind,wing,credits,status,featured,title,statement,category,start_date,end_date,host_name,host_city,host_country,host_bio,host_links,portrait_path,promo_ok,rights_version)
  values (eid,case when p->>'kind'='showcase' then 'showcase' else 'exhibition' end,case when p->>'wing' in ('Spaces','Design') then p->>'wing' else 'Art' end,left(p->>'credits',800),'pending',false,p->>'title',p->>'statement',p->>'category',nullif(p->>'start_date','')::date,nullif(p->>'end_date','')::date,p->>'host_name',p->>'host_city',p->>'host_country',p->>'host_bio',p->>'host_links',p->>'portrait_path',coalesce((p->>'promo_ok')::boolean,false),coalesce(p->>'rights_version','v1'));
  insert into exhibition_private (exhibition_id,email,phone) values (eid,p->>'email',p->>'phone');
  for w in select * from jsonb_array_elements(p->'works') loop
    insert into artworks (exhibition_id,sort,title,year,medium,dimensions,description,credit,for_sale,price,currency,image_path,thumb_path)
    values (eid,(w->>'sort')::int,w->>'title',w->>'year',w->>'medium',w->>'dimensions',w->>'description',left(w->>'credit',120),coalesce((w->>'for_sale')::boolean,false),nullif(w->>'price','')::numeric,w->>'currency',w->>'image_path',w->>'thumb_path');
  end loop;
  return eid;
end $$;

create or replace function submit_enquiry(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into enquiries (exhibition_id,artwork_id,exhibition_title,work_title,name,email,message)
  values (nullif(p->>'exhibitionId','')::uuid, nullif(p->>'workId','')::uuid, p->>'exhibitionTitle', p->>'workTitle', p->>'name', p->>'email', left(p->>'message',2000));
end $$;

grant execute on function submit_exhibition(jsonb) to anon, authenticated;
grant execute on function submit_enquiry(jsonb) to anon, authenticated;

-- Image storage: public read, anyone can upload (images only, 6 MB max), only admin can delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('artworks','artworks',true,6291456,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "public read artworks bucket" on storage.objects for select using (bucket_id = 'artworks');
create policy "anyone uploads artworks" on storage.objects for insert with check (bucket_id = 'artworks');
create policy "admin deletes artworks" on storage.objects for delete using (bucket_id = 'artworks' and (auth.jwt() ->> 'email') = 'ADMIN_EMAIL_HERE');

-- Visitor counter: one row, incremented once per browser session.
create table if not exists site_stats (id text primary key, visits bigint not null default 0);
insert into site_stats (id, visits) values ('site', 0) on conflict (id) do nothing;
alter table site_stats enable row level security;
create or replace function bump_visit() returns bigint language sql security definer set search_path = public as $$
  update site_stats set visits = visits + 1 where id = 'site' returning visits; $$;
create or replace function get_visits() returns bigint language sql security definer set search_path = public as $$
  select visits from site_stats where id = 'site'; $$;
grant execute on function bump_visit() to anon, authenticated;
grant execute on function get_visits() to anon, authenticated;

-- If you ran an earlier version of this file, run this line once:
alter table exhibitions add column if not exists kind text not null default 'exhibition' check (kind in ('exhibition','showcase'));

-- If you ran an earlier version of this file, run these lines once:
alter table exhibitions add column if not exists wing text not null default 'Art' check (wing in ('Art','Spaces','Design'));
alter table exhibitions add column if not exists credits text;
alter table artworks add column if not exists credit text;

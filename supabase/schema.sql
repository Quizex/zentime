create table if not exists zentime_state (
  space text primary key,
  events jsonb not null default '[]'::jsonb,
  categories jsonb not null default '[]'::jsonb,
  work_items jsonb not null default '[]'::jsonb,
  frequent_stats jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists zentime_state_updated_at_idx on zentime_state (updated_at);

create or replace function zentime_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists zentime_state_set_updated_at on zentime_state;
create trigger zentime_state_set_updated_at
before update on zentime_state
for each row
execute function zentime_set_updated_at();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'zentime_categories'
      and column_name = 'user_id'
      and data_type = 'text'
  ) then
    alter table zentime_categories rename to zentime_categories_legacy_text;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'zentime_work_items'
      and column_name = 'user_id'
      and data_type = 'text'
  ) then
    alter table zentime_work_items rename to zentime_work_items_legacy_text;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'zentime_frequent_stats'
      and column_name = 'user_id'
      and data_type = 'text'
  ) then
    alter table zentime_frequent_stats rename to zentime_frequent_stats_legacy_text;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'zentime_events'
      and column_name = 'user_id'
      and data_type = 'text'
  ) then
    alter table zentime_events rename to zentime_events_legacy_text;
  end if;
end;
$$;

create table if not exists zentime_categories (
  user_id uuid not null,
  id text not null,
  name text not null,
  color text not null,
  default_tags jsonb not null default '[]'::jsonb,
  default_metrics jsonb not null default '[]'::jsonb,
  select_options jsonb not null default '[]'::jsonb,
  highlight_pool jsonb not null default '[]'::jsonb,
  pain_point_pool jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists zentime_categories_user_idx on zentime_categories (user_id);

drop trigger if exists zentime_categories_set_updated_at on zentime_categories;
create trigger zentime_categories_set_updated_at
before update on zentime_categories
for each row
execute function zentime_set_updated_at();

create table if not exists zentime_work_items (
  user_id uuid not null,
  id text not null,
  name text not null,
  category_id text not null,
  default_tags jsonb not null default '[]'::jsonb,
  default_metrics jsonb not null default '[]'::jsonb,
  select_options jsonb not null default '[]'::jsonb,
  highlight_pool jsonb not null default '[]'::jsonb,
  pain_point_pool jsonb not null default '[]'::jsonb,
  description text,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists zentime_work_items_user_idx on zentime_work_items (user_id);
create index if not exists zentime_work_items_user_cat_idx on zentime_work_items (user_id, category_id);

drop trigger if exists zentime_work_items_set_updated_at on zentime_work_items;
create trigger zentime_work_items_set_updated_at
before update on zentime_work_items
for each row
execute function zentime_set_updated_at();

create table if not exists zentime_frequent_stats (
  user_id uuid not null,
  id text not null,
  name text not null,
  target_category_id text,
  target_item_id text,
  dimension text not null,
  field text not null,
  operator text not null,
  target_value jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists zentime_frequent_stats_user_idx on zentime_frequent_stats (user_id);

drop trigger if exists zentime_frequent_stats_set_updated_at on zentime_frequent_stats;
create trigger zentime_frequent_stats_set_updated_at
before update on zentime_frequent_stats
for each row
execute function zentime_set_updated_at();

create table if not exists zentime_events (
  user_id uuid not null,
  id text not null,
  title text not null,
  item_id text,
  category_id text not null,
  description text not null default '',
  reflection text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  pain_points jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  metrics jsonb not null default '[]'::jsonb,
  select_options jsonb not null default '[]'::jsonb,
  mood_rating integer not null default 0,
  completion_rating integer not null default 0,
  date text not null,
  start_time text not null,
  end_time text not null,
  duration integer not null default 0,
  created_at_ms bigint not null,
  is_high_priority boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists zentime_events_user_date_idx on zentime_events (user_id, date);
create index if not exists zentime_events_user_created_idx on zentime_events (user_id, created_at_ms desc);

drop trigger if exists zentime_events_set_updated_at on zentime_events;
create trigger zentime_events_set_updated_at
before update on zentime_events
for each row
execute function zentime_set_updated_at();

alter table if exists zentime_state disable row level security;

alter table zentime_categories enable row level security;
alter table zentime_work_items enable row level security;
alter table zentime_frequent_stats enable row level security;
alter table zentime_events enable row level security;

drop policy if exists zentime_categories_own on zentime_categories;
create policy zentime_categories_own on zentime_categories
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists zentime_work_items_own on zentime_work_items;
create policy zentime_work_items_own on zentime_work_items
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists zentime_frequent_stats_own on zentime_frequent_stats;
create policy zentime_frequent_stats_own on zentime_frequent_stats
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists zentime_events_own on zentime_events;
create policy zentime_events_own on zentime_events
for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

revoke all on table zentime_categories from anon;
revoke all on table zentime_work_items from anon;
revoke all on table zentime_frequent_stats from anon;
revoke all on table zentime_events from anon;

grant select, insert, update, delete on table zentime_categories to authenticated;
grant select, insert, update, delete on table zentime_work_items to authenticated;
grant select, insert, update, delete on table zentime_frequent_stats to authenticated;
grant select, insert, update, delete on table zentime_events to authenticated;
grant select, insert, update, delete on table zentime_state to anon, authenticated;

create or replace function zentime_replace_my_data(
  categories jsonb,
  work_items jsonb,
  frequent_stats jsonb,
  events jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- 先删除用户的所有记录，然后再插入新的记录
  delete from zentime_events where user_id = v_uid;
  delete from zentime_frequent_stats where user_id = v_uid;
  delete from zentime_work_items where user_id = v_uid;
  delete from zentime_categories where user_id = v_uid;

  insert into zentime_categories (
    user_id, id, name, color, default_tags, default_metrics, select_options, highlight_pool, pain_point_pool
  )
  select
    v_uid,
    c->>'id',
    coalesce(c->>'name',''),
    coalesce(c->>'color',''),
    coalesce(c->'defaultTags','[]'::jsonb),
    coalesce(c->'defaultMetrics','[]'::jsonb),
    coalesce(c->'selectOptions','[]'::jsonb),
    coalesce(c->'highlightPool','[]'::jsonb),
    coalesce(c->'painPointPool','[]'::jsonb)
  from jsonb_array_elements(coalesce(zentime_replace_my_data.categories,'[]'::jsonb)) as c;

  insert into zentime_work_items (
    user_id, id, name, category_id, default_tags, default_metrics, select_options, highlight_pool, pain_point_pool, description
  )
  select
    v_uid,
    i->>'id',
    coalesce(i->>'name',''),
    coalesce(i->>'categoryId',''),
    coalesce(i->'defaultTags','[]'::jsonb),
    coalesce(i->'defaultMetrics','[]'::jsonb),
    coalesce(i->'selectOptions','[]'::jsonb),
    coalesce(i->'highlightPool','[]'::jsonb),
    coalesce(i->'painPointPool','[]'::jsonb),
    i->>'description'
  from jsonb_array_elements(coalesce(zentime_replace_my_data.work_items,'[]'::jsonb)) as i;

  insert into zentime_frequent_stats (
    user_id, id, name, target_category_id, target_item_id, dimension, field, operator, target_value
  )
  select
    v_uid,
    fs->>'id',
    coalesce(fs->>'name',''),
    fs->>'targetCategoryId',
    fs->>'targetItemId',
    coalesce(fs->>'dimension',''),
    coalesce(fs->>'field',''),
    coalesce(fs->>'operator',''),
    coalesce(fs->'targetValue','null'::jsonb)
  from jsonb_array_elements(coalesce(zentime_replace_my_data.frequent_stats,'[]'::jsonb)) as fs;

  insert into zentime_events (
    user_id, id, title, item_id, category_id, description, reflection,
    highlights, pain_points, tags, metrics, select_options,
    mood_rating, completion_rating,
    date, start_time, end_time, duration, created_at_ms, is_high_priority
  )
  select
    v_uid,
    e->>'id',
    coalesce(e->>'title',''),
    e->>'itemId',
    coalesce(e->>'categoryId',''),
    coalesce(e->>'description',''),
    coalesce(e->>'reflection',''),
    coalesce(e->'highlights','[]'::jsonb),
    coalesce(e->'painPoints','[]'::jsonb),
    coalesce(e->'tags','[]'::jsonb),
    coalesce(e->'metrics','[]'::jsonb),
    coalesce(e->'selectOptions','[]'::jsonb),
    coalesce((e->>'moodRating')::int, 0),
    coalesce((e->>'completionRating')::int, 0),
    coalesce(e->>'date',''),
    coalesce(e->>'startTime',''),
    coalesce(e->>'endTime',''),
    coalesce((e->>'duration')::int, 0),
    coalesce((e->>'createdAt')::bigint, 0),
    coalesce((e->>'isHighPriority')::boolean, false)
  from jsonb_array_elements(coalesce(zentime_replace_my_data.events,'[]'::jsonb)) as e;
end;
$$;

revoke all on function zentime_replace_my_data(jsonb, jsonb, jsonb, jsonb) from public;
grant execute on function zentime_replace_my_data(jsonb, jsonb, jsonb, jsonb) to authenticated;

create or replace function zentime_migrate_state_to_my_tables(p_space text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  s record;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into s from zentime_state where space = p_space;
  if not found then
    return;
  end if;

  delete from zentime_events where user_id = v_uid;
  delete from zentime_frequent_stats where user_id = v_uid;
  delete from zentime_work_items where user_id = v_uid;
  delete from zentime_categories where user_id = v_uid;

  insert into zentime_categories (
    user_id, id, name, color, default_tags, default_metrics, select_options, highlight_pool, pain_point_pool
  )
  select
    v_uid,
    c->>'id',
    coalesce(c->>'name',''),
    coalesce(c->>'color',''),
    coalesce(c->'defaultTags','[]'::jsonb),
    coalesce(c->'defaultMetrics','[]'::jsonb),
    coalesce(c->'selectOptions','[]'::jsonb),
    coalesce(c->'highlightPool','[]'::jsonb),
    coalesce(c->'painPointPool','[]'::jsonb)
  from jsonb_array_elements(coalesce(s.categories,'[]'::jsonb)) as c;

  insert into zentime_work_items (
    user_id, id, name, category_id, default_tags, default_metrics, select_options, highlight_pool, pain_point_pool, description
  )
  select
    v_uid,
    i->>'id',
    coalesce(i->>'name',''),
    coalesce(i->>'categoryId',''),
    coalesce(i->'defaultTags','[]'::jsonb),
    coalesce(i->'defaultMetrics','[]'::jsonb),
    coalesce(i->'selectOptions','[]'::jsonb),
    coalesce(i->'highlightPool','[]'::jsonb),
    coalesce(i->'painPointPool','[]'::jsonb),
    i->>'description'
  from jsonb_array_elements(coalesce(s.work_items,'[]'::jsonb)) as i;

  insert into zentime_frequent_stats (
    user_id, id, name, target_category_id, target_item_id, dimension, field, operator, target_value
  )
  select
    v_uid,
    fs->>'id',
    coalesce(fs->>'name',''),
    fs->>'targetCategoryId',
    fs->>'targetItemId',
    coalesce(fs->>'dimension',''),
    coalesce(fs->>'field',''),
    coalesce(fs->>'operator',''),
    coalesce(fs->'targetValue','null'::jsonb)
  from jsonb_array_elements(coalesce(s.frequent_stats,'[]'::jsonb)) as fs;

  insert into zentime_events (
    user_id, id, title, item_id, category_id, description, reflection,
    highlights, pain_points, tags, metrics, select_options,
    mood_rating, completion_rating,
    date, start_time, end_time, duration, created_at_ms, is_high_priority
  )
  select
    v_uid,
    e->>'id',
    coalesce(e->>'title',''),
    e->>'itemId',
    coalesce(e->>'categoryId',''),
    coalesce(e->>'description',''),
    coalesce(e->>'reflection',''),
    coalesce(e->'highlights','[]'::jsonb),
    coalesce(e->'painPoints','[]'::jsonb),
    coalesce(e->'tags','[]'::jsonb),
    coalesce(e->'metrics','[]'::jsonb),
    coalesce(e->'selectOptions','[]'::jsonb),
    coalesce((e->>'moodRating')::int, 0),
    coalesce((e->>'completionRating')::int, 0),
    coalesce(e->>'date',''),
    coalesce(e->>'startTime',''),
    coalesce(e->>'endTime',''),
    coalesce((e->>'duration')::int, 0),
    coalesce((e->>'createdAt')::bigint, 0),
    coalesce((e->>'isHighPriority')::boolean, false)
  from jsonb_array_elements(coalesce(s.events,'[]'::jsonb)) as e;
end;
$$;

revoke all on function zentime_migrate_state_to_my_tables(text) from public;
grant execute on function zentime_migrate_state_to_my_tables(text) to authenticated;

-- 完整的 schema 更改，用于在 Supabase 仪表板中执行

-- 1. 添加 select_options 列到 zentime_categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'zentime_categories'
      AND column_name = 'select_options'
  ) THEN
    ALTER TABLE zentime_categories ADD COLUMN select_options jsonb not null default '[]'::jsonb;
  END IF;
END $$;

-- 2. 添加 select_options 列到 zentime_work_items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'zentime_work_items'
      AND column_name = 'select_options'
  ) THEN
    ALTER TABLE zentime_work_items ADD COLUMN select_options jsonb not null default '[]'::jsonb;
  END IF;
END $$;

-- 3. 添加 select_options 列到 zentime_events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'zentime_events'
      AND column_name = 'select_options'
  ) THEN
    ALTER TABLE zentime_events ADD COLUMN select_options jsonb not null default '[]'::jsonb;
  END IF;
END $$;

-- 4. 更新 zentime_replace_my_data 函数以使用 upsert 而不是 delete 和 insert
CREATE OR REPLACE FUNCTION zentime_replace_my_data(
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
  from jsonb_array_elements(coalesce(zentime_replace_my_data.categories,'[]'::jsonb)) as c
  on conflict (user_id, id) do update set
    name = excluded.name,
    color = excluded.color,
    default_tags = excluded.default_tags,
    default_metrics = excluded.default_metrics,
    select_options = excluded.select_options,
    highlight_pool = excluded.highlight_pool,
    pain_point_pool = excluded.pain_point_pool;

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
  from jsonb_array_elements(coalesce(zentime_replace_my_data.work_items,'[]'::jsonb)) as i
  on conflict (user_id, id) do update set
    name = excluded.name,
    category_id = excluded.category_id,
    default_tags = excluded.default_tags,
    default_metrics = excluded.default_metrics,
    select_options = excluded.select_options,
    highlight_pool = excluded.highlight_pool,
    pain_point_pool = excluded.pain_point_pool,
    description = excluded.description;

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
  from jsonb_array_elements(coalesce(zentime_replace_my_data.frequent_stats,'[]'::jsonb)) as fs
  on conflict (user_id, id) do update set
    name = excluded.name,
    target_category_id = excluded.target_category_id,
    target_item_id = excluded.target_item_id,
    dimension = excluded.dimension,
    field = excluded.field,
    operator = excluded.operator,
    target_value = excluded.target_value;

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
  from jsonb_array_elements(coalesce(zentime_replace_my_data.events,'[]'::jsonb)) as e
  on conflict (user_id, id) do update set
    title = excluded.title,
    item_id = excluded.item_id,
    category_id = excluded.category_id,
    description = excluded.description,
    reflection = excluded.reflection,
    highlights = excluded.highlights,
    pain_points = excluded.pain_points,
    tags = excluded.tags,
    metrics = excluded.metrics,
    select_options = excluded.select_options,
    mood_rating = excluded.mood_rating,
    completion_rating = excluded.completion_rating,
    date = excluded.date,
    start_time = excluded.start_time,
    end_time = excluded.end_time,
    duration = excluded.duration,
    created_at_ms = excluded.created_at_ms,
    is_high_priority = excluded.is_high_priority;
end;
$$;

-- 5. 更新 zentime_migrate_state_to_my_tables 函数以包含 select_options
CREATE OR REPLACE FUNCTION zentime_migrate_state_to_my_tables(p_space text)
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
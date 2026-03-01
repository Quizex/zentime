-- Fix delete sync by updating zentime_replace_my_data function

-- Update zentime_replace_my_data function to delete existing records before inserting
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
import { Category, EventEntry, FrequentStat, WorkItem } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_WORK_ITEMS } from '../constants';
import { requireSupabase } from './supabaseClient';

type DbCategoryRow = {
  user_id: string;
  id: string;
  name: string;
  color: string;
  default_tags: unknown;
  default_metrics: unknown;
  highlight_pool: unknown;
  pain_point_pool: unknown;
};

type DbWorkItemRow = {
  user_id: string;
  id: string;
  name: string;
  category_id: string;
  default_tags: unknown;
  default_metrics: unknown;
  highlight_pool: unknown;
  pain_point_pool: unknown;
  description: string | null;
};

type DbFrequentStatRow = {
  user_id: string;
  id: string;
  name: string;
  target_category_id: string | null;
  target_item_id: string | null;
  dimension: string;
  field: string;
  operator: string;
  target_value: unknown;
};

type DbEventRow = {
  user_id: string;
  id: string;
  title: string;
  item_id: string | null;
  category_id: string;
  description: string;
  reflection: string;
  highlights: unknown;
  pain_points: unknown;
  tags: unknown;
  metrics: unknown;
  mood_rating: number;
  completion_rating: number;
  date: string;
  start_time: string;
  end_time: string;
  duration: number;
  created_at_ms: number;
  is_high_priority: boolean;
};

export type UserData = {
  events: EventEntry[];
  categories: Category[];
  workItems: WorkItem[];
  frequentStats: FrequentStat[];
};

export type UserDataCounts = {
  events: number;
  categories: number;
  workItems: number;
  frequentStats: number;
};

const asArray = <T>(value: unknown, fallback: T[]): T[] => (Array.isArray(value) ? (value as T[]) : fallback);

const mapCategoryFromDb = (row: DbCategoryRow): Category => ({
  id: row.id,
  name: row.name,
  color: row.color,
  defaultTags: asArray<string>(row.default_tags, []),
  defaultMetrics: asArray<string>(row.default_metrics, []),
  highlightPool: asArray<any>(row.highlight_pool, []),
  painPointPool: asArray<any>(row.pain_point_pool, [])
});

const mapWorkItemFromDb = (row: DbWorkItemRow): WorkItem => ({
  id: row.id,
  name: row.name,
  categoryId: row.category_id,
  defaultTags: asArray<string>(row.default_tags, []),
  defaultMetrics: asArray<string>(row.default_metrics, []),
  highlightPool: asArray<any>(row.highlight_pool, []),
  painPointPool: asArray<any>(row.pain_point_pool, []),
  description: row.description ?? undefined
});

const mapFrequentStatFromDb = (row: DbFrequentStatRow): FrequentStat => ({
  id: row.id,
  name: row.name,
  targetCategoryId: row.target_category_id ?? undefined,
  targetItemId: row.target_item_id ?? undefined,
  dimension: row.dimension as any,
  field: row.field,
  operator: row.operator as any,
  targetValue: row.target_value as any
});

const mapEventFromDb = (row: DbEventRow): EventEntry => ({
  id: row.id,
  title: row.title,
  itemId: row.item_id ?? undefined,
  categoryId: row.category_id,
  description: row.description ?? '',
  reflection: row.reflection ?? '',
  highlights: asArray<string>(row.highlights, []),
  painPoints: asArray<string>(row.pain_points, []),
  tags: asArray<any>(row.tags, []),
  metrics: asArray<any>(row.metrics, []),
  moodRating: row.mood_rating ?? 0,
  completionRating: row.completion_rating ?? 0,
  date: row.date,
  startTime: row.start_time,
  endTime: row.end_time,
  duration: row.duration ?? 0,
  createdAt: row.created_at_ms,
  isHighPriority: !!row.is_high_priority
});

export async function loadUserData(userId: string): Promise<UserData> {
  const supabase = requireSupabase();
  const [catsRes, itemsRes, statsRes, eventsRes] = await Promise.all([
    supabase.from('zentime_categories').select('*').eq('user_id', userId),
    supabase.from('zentime_work_items').select('*').eq('user_id', userId),
    supabase.from('zentime_frequent_stats').select('*').eq('user_id', userId),
    supabase.from('zentime_events').select('*').eq('user_id', userId).order('created_at_ms', { ascending: false })
  ]);

  if (catsRes.error) throw catsRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (statsRes.error) throw statsRes.error;
  if (eventsRes.error) throw eventsRes.error;

  const categories =
    catsRes.data && catsRes.data.length > 0
      ? (catsRes.data as DbCategoryRow[]).map(mapCategoryFromDb)
      : DEFAULT_CATEGORIES;
  const workItems =
    itemsRes.data && itemsRes.data.length > 0
      ? (itemsRes.data as DbWorkItemRow[]).map(mapWorkItemFromDb)
      : DEFAULT_WORK_ITEMS;
  const frequentStats = (statsRes.data as DbFrequentStatRow[] | null)?.map(mapFrequentStatFromDb) ?? [];
  const events = (eventsRes.data as DbEventRow[] | null)?.map(mapEventFromDb) ?? [];

  return { events, categories, workItems, frequentStats };
}

export async function migrateStateToUserTables(space: string): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.rpc('zentime_migrate_state_to_my_tables', { p_space: space });
  if (error) throw error;
}

export async function replaceUserData(_userId: string, data: UserData): Promise<void> {
  const supabase = requireSupabase();
  const payload = {
    categories: data.categories,
    work_items: data.workItems,
    frequent_stats: data.frequentStats,
    events: data.events
  };
  const { error } = await supabase.rpc('zentime_replace_my_data', payload);
  if (error) throw error;
}

export async function getUserDataCounts(userId: string): Promise<UserDataCounts> {
  const supabase = requireSupabase();
  const [eventsRes, catsRes, itemsRes, statsRes] = await Promise.all([
    supabase.from('zentime_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('zentime_categories').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('zentime_work_items').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('zentime_frequent_stats').select('id', { count: 'exact', head: true }).eq('user_id', userId)
  ]);

  if (eventsRes.error) throw eventsRes.error;
  if (catsRes.error) throw catsRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (statsRes.error) throw statsRes.error;

  return {
    events: eventsRes.count ?? 0,
    categories: catsRes.count ?? 0,
    workItems: itemsRes.count ?? 0,
    frequentStats: statsRes.count ?? 0
  };
}

import { Category, EventEntry, FrequentStat, WorkItem } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_WORK_ITEMS } from '../constants';
import { requireSupabase } from './supabaseClient';

const TABLE = 'zentime_state';

export type SpaceState = {
  events: EventEntry[];
  categories: Category[];
  workItems: WorkItem[];
  frequentStats: FrequentStat[];
};

export type LoadSpaceStateResult = {
  state: SpaceState;
  isNew: boolean;
};

type SpaceStateRow = {
  space: string;
  events: unknown;
  categories: unknown;
  work_items: unknown;
  frequent_stats: unknown;
};

const toArray = <T>(value: unknown, fallback: T[]): T[] => {
  return Array.isArray(value) ? (value as T[]) : fallback;
};

export async function loadSpaceState(space: string): Promise<LoadSpaceStateResult> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select('space,events,categories,work_items,frequent_stats')
    .eq('space', space)
    .maybeSingle<SpaceStateRow>();

  if (error) throw error;

  if (!data) {
    const state: SpaceState = {
      events: [],
      categories: DEFAULT_CATEGORIES,
      workItems: DEFAULT_WORK_ITEMS,
      frequentStats: []
    };
    await upsertSpaceState(space, state);
    return { state, isNew: true };
  }

  return {
    state: {
      events: toArray<EventEntry>(data.events, []),
      categories: toArray<Category>(data.categories, DEFAULT_CATEGORIES),
      workItems: toArray<WorkItem>(data.work_items, DEFAULT_WORK_ITEMS),
      frequentStats: toArray<FrequentStat>(data.frequent_stats, [])
    },
    isNew: false
  };
}

export async function upsertSpaceState(space: string, state: SpaceState): Promise<void> {
  const supabase = requireSupabase();
  const { error } = await supabase.from(TABLE).upsert({
    space,
    events: state.events,
    categories: state.categories,
    work_items: state.workItems,
    frequent_stats: state.frequentStats,
    updated_at: new Date().toISOString()
  });

  if (error) throw error;
}

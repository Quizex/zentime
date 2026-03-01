
export interface TagStatus {
  name: string;
  status: number; // 1: positive, -1: negative, 0: neutral
}

export interface MetricValue {
  name: string;
  value: number;
}

export interface PoolItem {
  name: string;
  count: number;
}

export interface SelectOption {
  name: string;
  options: string[];
}

export interface WorkItem {
  id: string;
  name: string;
  categoryId: string;
  defaultTags: string[];
  defaultMetrics: string[];
  highlightPool: PoolItem[];
  painPointPool: PoolItem[];
  selectOptions: SelectOption[];
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  defaultTags: string[];
  defaultMetrics: string[];
  highlightPool: PoolItem[];
  painPointPool: PoolItem[];
  selectOptions: SelectOption[];
}

export interface EventEntry {
  id: string;
  title: string;
  itemId?: string;
  categoryId: string;
  description: string;
  reflection: string;
  highlights: string[];
  painPoints: string[];
  tags: TagStatus[];
  metrics: MetricValue[];
  selectOptions: { name: string; value: string }[];
  moodRating: number; 
  completionRating: number;
  date: string;
  startTime: string;
  endTime: string;
  duration: number;
  createdAt: number;
  isHighPriority: boolean;
}

export type StatDimension = 'time' | 'state' | 'metric';
export type StatOperator = 'gte' | 'lte' | 'eq';

export interface FrequentStat {
  id: string;
  name: string;
  targetCategoryId?: string;
  targetItemId?: string;
  dimension: StatDimension;
  field: string; // 'startTime' | 'endTime' | 'duration' | 'moodRating' | 'completionRating' | {metricName}
  operator: StatOperator;
  targetValue: string | number;
}

export type ViewType = 'timeline' | 'calendar' | 'stats' | 'management' | 'day-detail' | 'search';


import { Category, WorkItem } from './types';

// Fix: Convert string arrays to PoolItem[] to satisfy the interface definitions
export const DEFAULT_CATEGORIES: Category[] = [
  { 
    id: '1', name: '工作', color: '#8fb8ed', 
    defaultTags: ['高效', '专注'], 
    defaultMetrics: ['完成度', '压力感'],
    selectOptions: [],
    highlightPool: [{ name: '按时交付', count: 1 }, { name: '深度心流', count: 1 }],
    painPointPool: [{ name: '会议过多', count: 1 }, { name: '需求模糊', count: 1 }]
  },
  { 
    id: '2', name: '学习', color: '#c2eabd', 
    defaultTags: ['理解', '新知'], 
    defaultMetrics: ['专注度', '收获感'],
    selectOptions: [],
    highlightPool: [{ name: '举一反三', count: 1 }, { name: '笔记清晰', count: 1 }],
    painPointPool: [{ name: '手机分心', count: 1 }, { name: '基础不牢', count: 1 }]
  },
  { 
    id: '3', name: '运动', color: '#ffb7b2', 
    defaultTags: ['流汗', '坚持'], 
    defaultMetrics: ['疲劳度', '爽快感'],
    selectOptions: [],
    highlightPool: [{ name: '破纪录', count: 1 }, { name: '动作标准', count: 1 }],
    painPointPool: [{ name: '肌肉拉伤', count: 1 }, { name: '热身不足', count: 1 }]
  },
  { 
    id: '4', name: '休闲', color: '#ffdac1', 
    defaultTags: ['放松', '社交'], 
    defaultMetrics: ['愉悦度'],
    selectOptions: [],
    highlightPool: [{ name: '彻底放松', count: 1 }, { name: '愉快交流', count: 1 }],
    painPointPool: [{ name: '报复性熬夜', count: 1 }, { name: '过度沉溺', count: 1 }]
  },
];

// Fix: Convert string arrays to PoolItem[] for work item defaults
export const DEFAULT_WORK_ITEMS: WorkItem[] = [
  { 
    id: 'w1', name: '写代码', categoryId: '1', 
    defaultTags: ['高效', '逻辑'], 
    defaultMetrics: ['完成度', '心流'],
    selectOptions: [],
    highlightPool: [{ name: '重构优雅', count: 1 }, { name: '无Bug运行', count: 1 }],
    painPointPool: [{ name: '环境配置坑', count: 1 }, { name: '逻辑死循环', count: 1 }]
  },
  { 
    id: 'w2', name: '阅读', categoryId: '2', 
    defaultTags: ['深度', '思考'], 
    defaultMetrics: ['专注度'],
    selectOptions: [],
    highlightPool: [{ name: '产生共鸣', count: 1 }, { name: '完成章节', count: 1 }],
    painPointPool: [{ name: '困倦', count: 1 }, { name: '读不进去', count: 1 }]
  },
  { 
    id: 'w3', name: '跑步', categoryId: '3', 
    defaultTags: ['户外', '耐力'], 
    defaultMetrics: ['体能消耗'],
    selectOptions: [],
    highlightPool: [{ name: '配速稳定', count: 1 }],
    painPointPool: [{ name: '膝盖疼', count: 1 }]
  },
];

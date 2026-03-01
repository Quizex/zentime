import React, { useState, useMemo, useEffect } from 'react';
import { EventEntry, Category, WorkItem } from '../types';
import { Search, Calendar, Folder, Tag, LayoutGrid, BarChart3, FileText, Heart, X, Filter, RefreshCw } from 'lucide-react';

interface SearchViewProps {
  events: EventEntry[];
  categories: Category[];
  workItems: WorkItem[];
}

const SearchView: React.FC<SearchViewProps> = ({ events, categories, workItems }) => {
  // 搜索条件状态
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [categoryId, setCategoryId] = useState('');
  const [itemId, setItemId] = useState('');
  const [tagStatus, setTagStatus] = useState<string>('');
  const [tagType, setTagType] = useState<string>('');
  const [selectOption, setSelectOption] = useState({
    name: '',
    value: ''
  });
  const [metricFilter, setMetricFilter] = useState({
    name: '',
    operator: 'range', // range, gt, lt, eq
    value: '',
    min: '',
    max: ''
  });
  const [textSearch, setTextSearch] = useState({
    title: '',
    description: '',
    reflection: ''
  });

  // 所有可用的选择选项（与类别和事项相关联）
  const allSelectOptions = useMemo(() => {
    const options = new Set<string>();
    
    // 如果选择了事项，只显示该事项的选择选项
    if (itemId) {
      const item = workItems.find(i => i.id === itemId);
      if (item) {
        item.selectOptions.forEach(opt => options.add(opt.name));
      }
    }
    // 如果选择了类别但未选择事项，显示该类别的选择选项
    else if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        category.selectOptions.forEach(opt => options.add(opt.name));
      }
    }
    // 如果没有选择类别或事项，显示所有选择选项
    else {
      categories.forEach(cat => {
        cat.selectOptions.forEach(opt => options.add(opt.name));
      });
      workItems.forEach(item => {
        item.selectOptions.forEach(opt => options.add(opt.name));
      });
    }
    
    return Array.from(options);
  }, [categories, workItems, categoryId, itemId]);

  // 所有可用的指标（与类别和事项相关联）
  const allMetrics = useMemo(() => {
    const metrics = new Set<string>();
    
    // 如果选择了事项，只显示该事项的默认指标
    if (itemId) {
      const item = workItems.find(i => i.id === itemId);
      if (item) {
        item.defaultMetrics.forEach(metric => metrics.add(metric));
      }
    }
    // 如果选择了类别但未选择事项，显示该类别的默认指标
    else if (categoryId) {
      const category = categories.find(c => c.id === categoryId);
      if (category) {
        category.defaultMetrics.forEach(metric => metrics.add(metric));
      }
    }
    // 如果没有选择类别或事项，显示所有默认指标
    else {
      categories.forEach(cat => {
        cat.defaultMetrics.forEach(metric => metrics.add(metric));
      });
      workItems.forEach(item => {
        item.defaultMetrics.forEach(metric => metrics.add(metric));
      });
    }
    
    return Array.from(metrics);
  }, [categories, workItems, categoryId, itemId]);

  // 所有可用的标签类型（与类别和事项相关联）
  const allTagTypes = useMemo(() => {
    const tagTypes = new Set<string>();
    
    // 过滤事件：只包含与当前选择的类别和事项匹配的事件
    const filteredEvents = events.filter(event => {
      // 类别筛选
      if (categoryId && event.categoryId !== categoryId) {
        return false;
      }
      // 事项筛选
      if (itemId && event.itemId !== itemId) {
        return false;
      }
      return true;
    });
    
    // 从过滤后的事件中提取标签类型
    filteredEvents.forEach(event => {
      event.tags.forEach(tag => {
        tagTypes.add(tag.name);
      });
    });
    
    return Array.from(tagTypes);
  }, [events, categoryId, itemId]);

  // 筛选事件
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // 日期筛选
      if (dateRange.start) {
        if (event.date < dateRange.start) return false;
      }
      if (dateRange.end) {
        if (event.date > dateRange.end) return false;
      }

      // 类别筛选
      if (categoryId && event.categoryId !== categoryId) {
        return false;
      }

      // 事项筛选
      if (itemId && event.itemId !== itemId) {
        return false;
      }

      // 标签状态筛选
      if (tagStatus) {
        const status = parseInt(tagStatus);
        if (status === 0) {
          // 中立状态：没有任何标签
          if (event.tags && event.tags.length > 0) return false;
        } else {
          // 正面或负面状态：至少有一个匹配的标签
          const hasMatchingTag = event.tags.some(tag => tag.status === status);
          if (!hasMatchingTag) return false;
        }
      }

      // 标签类型筛选
      if (tagType) {
        const hasMatchingTagType = event.tags.some(tag => tag.name === tagType);
        if (!hasMatchingTagType) return false;
      }

      // 选择选项筛选
      if (selectOption.name && selectOption.value) {
        const hasMatchingOption = event.selectOptions.some(opt => 
          opt.name === selectOption.name && opt.value === selectOption.value
        );
        if (!hasMatchingOption) return false;
      }

      // 指标筛选
      if (metricFilter.name) {
        const metric = event.metrics.find(m => m.name === metricFilter.name);
        if (!metric) return false;
        
        if (metricFilter.operator === 'range') {
          if (metricFilter.min && metric.value < parseFloat(metricFilter.min)) return false;
          if (metricFilter.max && metric.value > parseFloat(metricFilter.max)) return false;
        } else if (metricFilter.operator === 'gt' && metricFilter.value) {
          if (metric.value <= parseFloat(metricFilter.value)) return false;
        } else if (metricFilter.operator === 'lt' && metricFilter.value) {
          if (metric.value >= parseFloat(metricFilter.value)) return false;
        } else if (metricFilter.operator === 'eq' && metricFilter.value) {
          if (metric.value !== parseFloat(metricFilter.value)) return false;
        }
      }

      // 文本搜索
      if (textSearch.title && !event.title.toLowerCase().includes(textSearch.title.toLowerCase())) {
        return false;
      }
      if (textSearch.description && !event.description.toLowerCase().includes(textSearch.description.toLowerCase())) {
        return false;
      }
      if (textSearch.reflection && !event.reflection.toLowerCase().includes(textSearch.reflection.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [events, dateRange, categoryId, itemId, tagStatus, tagType, selectOption, metricFilter, textSearch]);

  // 重置所有筛选条件
  const handleReset = () => {
    setDateRange({ start: '', end: '' });
    setCategoryId('');
    setItemId('');
    setTagStatus('');
    setTagType('');
    setSelectOption({ name: '', value: '' });
    setMetricFilter({ name: '', operator: 'range', value: '', min: '', max: '' });
    setTextSearch({ title: '', description: '', reflection: '' });
  };

  // 当类别变化时重置相关筛选条件
  useEffect(() => {
    if (categoryId) {
      setItemId('');
      setTagType('');
      setSelectOption({ name: '', value: '' });
      setMetricFilter({ name: '', operator: 'range', value: '', min: '', max: '' });
    }
  }, [categoryId]);

  // 当事项变化时重置相关筛选条件
  useEffect(() => {
    if (itemId) {
      setTagType('');
      setSelectOption({ name: '', value: '' });
      setMetricFilter({ name: '', operator: 'range', value: '', min: '', max: '' });
    }
  }, [itemId]);

  // 获取类别名称
  const getCategoryName = (id: string) => {
    const category = categories.find(c => c.id === id);
    return category ? category.name : '未知类别';
  };

  // 获取事项名称
  const getItemName = (id?: string) => {
    if (!id) return '手输事项';
    const item = workItems.find(i => i.id === id);
    return item ? item.name : '未知事项';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-300" /> 高级查询
          </h3>
          <button 
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-50 text-gray-500 rounded-xl text-[10px] font-black hover:bg-gray-100 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 重置筛选
          </button>
        </div>

        <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 日期范围 */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-200" /> 日期范围
              </label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  value={dateRange.start} 
                  onChange={e => setDateRange({ ...dateRange, start: e.target.value })} 
                  className="flex-1 bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
                />
                <input 
                  type="date" 
                  value={dateRange.end} 
                  onChange={e => setDateRange({ ...dateRange, end: e.target.value })} 
                  className="flex-1 bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
                />
              </div>
            </div>

            {/* 类别和事项 */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-indigo-200" /> 类别和事项
              </label>
              <select 
                value={categoryId} 
                onChange={e => {
                  setCategoryId(e.target.value);
                  setItemId(''); // 重置事项选择
                }} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              >
                <option value="">-- 选择类别 --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              <select 
                value={itemId} 
                onChange={e => setItemId(e.target.value)} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              >
                <option value="">-- 选择事项 --</option>
                {workItems
                  .filter(item => !categoryId || item.categoryId === categoryId)
                  .map(item => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))
                }
              </select>
            </div>

            {/* 标签状态 */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-200" /> 标签状态
              </label>
              <select 
                value={tagStatus} 
                onChange={e => setTagStatus(e.target.value)} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              >
                <option value="">-- 选择状态 --</option>
                <option value="1">正面</option>
                <option value="-1">负面</option>
                <option value="0">中立</option>
              </select>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-200" /> 标签类型
              </label>
              <select 
                value={tagType} 
                onChange={e => setTagType(e.target.value)} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              >
                <option value="">-- 选择标签类型 --</option>
                {allTagTypes.map(tagType => (
                  <option key={tagType} value={tagType}>{tagType}</option>
                ))}
              </select>
            </div>

            {/* 选择选项 */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-200" /> 选择选项
              </label>
              <select 
                value={selectOption.name} 
                onChange={e => setSelectOption({ name: e.target.value, value: '' })} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              >
                <option value="">-- 选择选项 --</option>
                {allSelectOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <select 
                value={selectOption.value} 
                onChange={e => setSelectOption({ ...selectOption, value: e.target.value })} 
                disabled={!selectOption.name}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              >
                <option value="">-- 选择值 --</option>
                {selectOption.name && (
                  (() => {
                    const relevantItems = [];
                    
                    // 如果选择了事项，只使用该事项的选择选项
                    if (itemId) {
                      const item = workItems.find(i => i.id === itemId);
                      if (item) relevantItems.push(item);
                    }
                    // 如果选择了类别但未选择事项，使用该类别的选择选项
                    else if (categoryId) {
                      const category = categories.find(c => c.id === categoryId);
                      if (category) relevantItems.push(category);
                    }
                    // 如果没有选择类别或事项，使用所有类别和事项的选择选项
                    else {
                      relevantItems.push(...categories, ...workItems);
                    }
                    
                    return relevantItems
                      .flatMap(item => item.selectOptions)
                      .filter(option => option.name === selectOption.name)
                      .flatMap(option => option.options)
                      .filter((value, index, self) => self.indexOf(value) === index)
                      .map(value => (
                        <option key={value} value={value}>{value}</option>
                      ));
                  })()
                )}
              </select>
            </div>

            {/* 核心指标 */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-200" /> 核心指标
              </label>
              <select 
                value={metricFilter.name} 
                onChange={e => setMetricFilter({ name: e.target.value, operator: 'range', value: '', min: '', max: '' })} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              >
                <option value="">-- 选择指标 --</option>
                {allMetrics.map(metric => (
                  <option key={metric} value={metric}>{metric}</option>
                ))}
              </select>
              <select 
                value={metricFilter.operator} 
                onChange={e => setMetricFilter({ ...metricFilter, operator: e.target.value, value: '', min: '', max: '' })} 
                disabled={!metricFilter.name}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              >
                <option value="range">范围</option>
                <option value="gt">大于</option>
                <option value="lt">小于</option>
                <option value="eq">等于</option>
              </select>
              {metricFilter.operator === 'range' ? (
                <div className="flex gap-2">
                  <input 
                    type="number" 
                    placeholder="最小值" 
                    value={metricFilter.min} 
                    onChange={e => setMetricFilter({ ...metricFilter, min: e.target.value })} 
                    className="flex-1 bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
                  />
                  <input 
                    type="number" 
                    placeholder="最大值" 
                    value={metricFilter.max} 
                    onChange={e => setMetricFilter({ ...metricFilter, max: e.target.value })} 
                    className="flex-1 bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
                  />
                </div>
              ) : (
                <input 
                  type="number" 
                  placeholder={metricFilter.operator === 'gt' ? '大于' : metricFilter.operator === 'lt' ? '小于' : '等于'} 
                  value={metricFilter.value} 
                  onChange={e => setMetricFilter({ ...metricFilter, value: e.target.value })} 
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
                />
              )}
            </div>

            {/* 文本搜索 */}
            <div className="space-y-3">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-200" /> 文本搜索
              </label>
              <input 
                type="text" 
                placeholder="事项标题" 
                value={textSearch.title} 
                onChange={e => setTextSearch({ ...textSearch, title: e.target.value })} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              />
              <input 
                type="text" 
                placeholder="深度刻录" 
                value={textSearch.description} 
                onChange={e => setTextSearch({ ...textSearch, description: e.target.value })} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              />
              <input 
                type="text" 
                placeholder="心得" 
                value={textSearch.reflection} 
                onChange={e => setTextSearch({ ...textSearch, reflection: e.target.value })} 
                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-2 rounded-xl text-xs font-black outline-none"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
            <Filter className="w-4 h-4 text-indigo-300" /> 搜索结果 ({filteredEvents.length})
          </h3>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-gray-300 text-sm font-bold">
            没有找到匹配的时光记录
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <div key={event.id} className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-lg font-black text-gray-700">{event.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{getCategoryName(event.categoryId)}</span>
                      <span>•</span>
                      <span>{getItemName(event.itemId)}</span>
                      <span>•</span>
                      <span>{event.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-indigo-400">
                      {event.startTime} - {event.endTime}
                    </div>
                    <div className="text-xs text-gray-400">
                      持续 {event.duration} 分钟
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div className="mb-3">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <FileText className="w-3 h-3 text-indigo-200" /> 深度刻录
                    </div>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </div>
                )}

                {event.reflection && (
                  <div className="mb-3">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Heart className="w-3 h-3 text-indigo-200" /> 心得
                    </div>
                    <p className="text-sm text-indigo-600 italic">{event.reflection}</p>
                  </div>
                )}

                {event.tags && event.tags.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <Tag className="w-3 h-3 text-indigo-200" /> 状态感知
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, idx) => (
                        <span 
                          key={idx} 
                          className={`px-3 py-1 rounded-xl text-[10px] font-black border-2 ${ 
                            tag.status === 1 ? 'bg-green-50 border-green-100 text-green-600' : 
                            tag.status === -1 ? 'bg-red-50 border-red-100 text-red-600' : 
                            'bg-gray-50 border-gray-50 text-gray-400'
                          }`}
                        >
                          {tag.status === 1 ? '✅' : tag.status === -1 ? '❌' : '⚪'} {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {event.selectOptions && event.selectOptions.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <LayoutGrid className="w-3 h-3 text-indigo-200" /> 选择选项
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.selectOptions.map((option, idx) => (
                        <span 
                          key={idx} 
                          className="px-3 py-1 rounded-xl text-[10px] font-black border-2 bg-indigo-50 border-indigo-100 text-indigo-600"
                        >
                          {option.name}: {option.value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {event.metrics && event.metrics.length > 0 && (
                  <div>
                    <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                      <BarChart3 className="w-3 h-3 text-indigo-200" /> 核心指标
                    </div>
                    <div className="space-y-2">
                      {event.metrics.map((metric, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <span className="text-xs font-black text-gray-500 w-24 truncate">{metric.name}</span>
                          <div className="flex-1 flex justify-between gap-1">
                            {[1, 2, 3, 4, 5].map(v => (
                              <div 
                                key={v} 
                                className={`flex-1 h-2 rounded-full transition-all ${v <= metric.value ? 'bg-indigo-400' : 'bg-gray-200'}`}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default SearchView;
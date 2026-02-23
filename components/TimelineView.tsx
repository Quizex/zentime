
import React, { useState } from 'react';
import { Edit2, Trash2, Clock, Star, AlertCircle, Quote, Tag, BarChart3, Plus, X, EyeOff, LayoutList, Sparkles } from 'lucide-react';
import { EventEntry, Category } from '../types';

interface TimelineViewProps {
  events: EventEntry[];
  onEdit: (event: EventEntry) => void;
  onDelete: (id: string) => void;
  categories: Category[];
}

const TimelineView: React.FC<TimelineViewProps> = ({ events, onEdit, onDelete, categories }) => {
  const [viewMode, setViewMode] = useState<'priority' | 'all'>('priority');

  const priorityEvents = events.filter(e => e.isHighPriority);
  const displayEvents = viewMode === 'priority' ? priorityEvents : events;

  if (displayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="bg-gray-50 p-8 rounded-full mb-6">
          {viewMode === 'priority' ? <Star className="w-12 h-12 text-amber-200" /> : <Clock className="w-12 h-12 text-indigo-200" />}
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">
          {viewMode === 'priority' ? '暂无重点时光' : '时光轴空空如也'}
        </h3>
        <p className="text-gray-400 max-w-xs mb-4 text-sm leading-relaxed">
          {viewMode === 'priority' 
            ? '标记为重点的时刻会出现在这里，镌刻下那些闪闪发光的瞬间。' 
            : '开始记录您的第一条时光吧，生活中的每一刻都值得被记述。'}
        </p>
        <div className="flex gap-4">
           <button 
            onClick={() => setViewMode(viewMode === 'priority' ? 'all' : 'priority')}
            className="text-indigo-400 font-bold text-sm hover:underline"
           >
             查看{viewMode === 'priority' ? '所有记录' : '重点时光'}
           </button>
        </div>
      </div>
    );
  }

  const groupEventsByDate = (eventList: EventEntry[]) => {
    return eventList.reduce((acc, event) => {
      if (!acc[event.date]) acc[event.date] = [];
      acc[event.date].push(event);
      return acc;
    }, {} as Record<string, EventEntry[]>);
  };

  const grouped = groupEventsByDate(displayEvents);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* 视图切换器 */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex p-1 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <button 
            onClick={() => setViewMode('priority')}
            className={`px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${viewMode === 'priority' ? 'bg-amber-50 text-amber-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Sparkles className="w-4 h-4" /> 禅定重点
          </button>
          <button 
            onClick={() => setViewMode('all')}
            className={`px-6 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${viewMode === 'all' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutList className="w-4 h-4" /> 完整刻录
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 py-1 bg-gray-50/50 w-fit rounded-lg border border-gray-100">
        {viewMode === 'priority' ? (
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
        ) : (
          <Clock className="w-3 h-3 text-indigo-400" />
        )}
        <span className={`text-[10px] font-black uppercase tracking-widest ${viewMode === 'priority' ? 'text-amber-600' : 'text-indigo-500'}`}>
          {viewMode === 'priority' ? '精选重点时光' : '全量活动记录'}
        </span>
      </div>

      {sortedDates.map(date => (
        <div key={date} className="relative">
          <div className="sticky top-0 bg-[#fdfaf6] py-3 z-10 flex items-center gap-2">
            <h3 className="text-xs md:text-base font-bold text-gray-400 bg-[#fdfaf6] pr-2 whitespace-nowrap tracking-wider">{date}</h3>
            <div className="h-[1px] flex-1 bg-gray-100"></div>
          </div>

          <div className="space-y-4 md:space-y-6 mt-2 pl-1 md:pl-4 border-l border-dashed border-gray-200">
            {grouped[date].map(event => {
              const category = categories.find(c => c.id === event.categoryId);
              const isPri = event.isHighPriority;
              return (
                <div key={event.id} className={`relative group bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] shadow-sm hover:shadow-md border transition-all ml-3 md:ml-4 ${isPri ? 'border-amber-100' : 'border-gray-50'}`}>
                  {/* 时间轴锚点 */}
                  <div className={`absolute -left-[19px] md:-left-[27px] top-7 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ring-4 ${isPri ? 'bg-amber-400 ring-amber-50' : 'bg-indigo-200 ring-indigo-50'}`}></div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="text-[9px] md:text-xs font-bold px-2 py-0.5 rounded-lg shrink-0" style={{ backgroundColor: (category?.color || '#eee') + '20', color: category?.color }}>{category?.name || '未分类'}</span>
                        <div className="flex items-center gap-1.5 text-gray-400 text-[10px] md:text-sm font-semibold tracking-tight">
                          <span className="text-[#4a4a4a]">{event.startTime} - {event.endTime}</span>
                          <span className="text-gray-200">|</span>
                          <span>{event.duration}m</span>
                        </div>
                      </div>
                      <div className="flex gap-0.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(event)} className="p-1 text-gray-300 hover:text-indigo-400 hover:bg-indigo-50 rounded-full transition-all"><Edit2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                        <button onClick={() => onDelete(event.id)} className="p-1 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-full transition-all"><Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" /></button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-[15px] md:text-lg font-black text-[#4a4a4a] leading-tight flex items-center gap-2">
                        {event.title}
                        {isPri && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      </h4>
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {event.tags.map((tag, idx) => (
                            <span key={idx} className={`text-[8px] md:text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                              tag.status === 'positive' ? 'bg-green-50 text-green-600 border border-green-100' : 
                              tag.status === 'negative' ? 'bg-red-50 text-red-600 border border-red-100' : 
                              'bg-gray-50 text-gray-400 border border-gray-100'
                            }`}>
                              {tag.status === 'positive' && <Plus className="w-2 h-2" />}
                              {tag.status === 'negative' && <X className="w-2 h-2" />}
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {(event.description || event.reflection) && (
                      <div className="space-y-2.5">
                        {event.description && <p className="text-[#6a6a6a] text-[11px] md:text-[13px] leading-relaxed whitespace-pre-wrap line-clamp-3 group-hover:line-clamp-none">{event.description}</p>}
                        {event.reflection && (
                          <div className="flex gap-2.5 items-start bg-indigo-50/20 p-3 rounded-2xl border-l-4 border-indigo-200">
                            <Quote className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-1" />
                            <p className="text-[10px] md:text-[13px] text-indigo-500 italic leading-relaxed font-medium">{event.reflection}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {(event.highlights?.length > 0 || event.painPoints?.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {event.highlights?.map(h => (
                          <span key={h} className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50">
                            <Star className="w-2.5 h-2.5 fill-current" /> {h}
                          </span>
                        ))}
                        {event.painPoints?.map(p => (
                          <span key={p} className="flex items-center gap-1 text-[9px] md:text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg border border-red-100/50">
                            <AlertCircle className="w-2.5 h-2.5" /> {p}
                          </span>
                        ))}
                      </div>
                    )}

                    {event.metrics.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-2 border-t border-gray-50">
                        {event.metrics.map(m => (
                          <div key={m.name} className="flex items-center gap-1.5">
                            <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-tight shrink-0">{m.name}</span>
                            <div className="flex gap-0.5">
                              {[1, 2, 3, 4, 5].map(v => (
                                <div key={v} className={`w-1.5 h-1.5 rounded-full transition-all ${v <= m.value ? 'bg-indigo-300' : 'bg-gray-100'}`}></div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineView;

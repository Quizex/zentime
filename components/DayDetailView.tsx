
import React, { useMemo } from 'react';
import { Clock, Star, Quote, PieChart as PieIcon, List as ListIcon, Zap, AlertCircle } from 'lucide-react';
import { EventEntry, Category } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DayDetailViewProps {
  date: string;
  events: EventEntry[];
  categories: Category[];
  onEditEvent: (e: EventEntry) => void;
}

const DayDetailView: React.FC<DayDetailViewProps> = ({ date, events, categories, onEditEvent }) => {
  const dayEvents = useMemo(() => 
    events.filter(e => e.date === date).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  [events, date]);

  const stats = useMemo(() => {
    // 独占时间计算（合并重叠时间段）
    const intervals = dayEvents.map(e => {
      const [sh, sm] = e.startTime.split(':').map(Number);
      const [eh, em] = e.endTime.split(':').map(Number);
      let start = sh * 60 + sm;
      let end = eh * 60 + em;
      if (end < start) end += 1440; // 跨天处理
      return { start, end };
    }).sort((a, b) => a.start - b.start);

    let merged = [];
    if (intervals.length > 0) {
      let current = intervals[0];
      for (let i = 1; i < intervals.length; i++) {
        if (intervals[i].start < current.end) {
          current.end = Math.max(current.end, intervals[i].end);
        } else {
          merged.push(current);
          current = intervals[i];
        }
      }
      merged.push(current);
    }
    const uniqueMinutes = merged.reduce((acc, curr) => acc + (curr.end - curr.start), 0);

    // 分类分布
    const categoryMins: Record<string, number> = {};
    dayEvents.forEach(e => {
      categoryMins[e.categoryId] = (categoryMins[e.categoryId] || 0) + e.duration;
    });

    const pieData = Object.entries(categoryMins).map(([catId, mins]) => ({
      name: categories.find(c => c.id === catId)?.name || '未知',
      value: mins,
      color: categories.find(c => c.id === catId)?.color || '#eee'
    }));

    return { uniqueMinutes, pieData };
  }, [dayEvents, categories]);

  if (dayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[40px] shadow-sm border border-gray-100">
        <Clock className="w-16 h-16 text-gray-200 mb-6" />
        <h3 className="text-xl font-bold text-gray-400">当日暂无记录</h3>
        <p className="text-gray-300 mt-2 text-sm">去时光轴添加一些记录吧</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 核心摘要卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-50 flex flex-col justify-center items-center text-center">
          <div className="p-4 bg-indigo-50 rounded-full mb-4">
            <Clock className="w-8 h-8 text-indigo-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">总记录时长</span>
          <div className="text-4xl font-black text-indigo-600">
            {Math.floor(stats.uniqueMinutes / 60)}<span className="text-base text-gray-400 ml-1">H</span> {stats.uniqueMinutes % 60}<span className="text-base text-gray-400 ml-1">M</span>
          </div>
          <p className="text-[10px] text-gray-300 mt-2 italic">* 已排除重复计算的重叠时间</p>
        </div>

        <div className="bg-white p-6 rounded-[40px] shadow-sm border border-gray-50 flex flex-col items-center">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
             <PieIcon className="w-3.5 h-3.5" /> 类型分布
          </h4>
          <div className="h-40 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.pieData} innerRadius="60%" outerRadius="80%" paddingAngle={4} dataKey="value">
                  {stats.pieData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#fdf3e7] p-8 rounded-[40px] shadow-sm border border-[#fef3c7] flex flex-col justify-center">
           <div className="flex items-center gap-3 mb-4">
             <div className="p-3 bg-white rounded-2xl shadow-sm"><Zap className="w-6 h-6 text-amber-500" /></div>
             <h4 className="text-lg font-black text-[#e67e22]">今日总结</h4>
           </div>
           <p className="text-sm text-[#92400e] leading-relaxed font-medium">
             今日共有 {dayEvents.length} 条时光刻印。
             心情平均指数：{(dayEvents.reduce((a,b) => a + b.moodRating, 0) / dayEvents.length).toFixed(1)} 分。
           </p>
        </div>
      </div>

      {/* 事件流 */}
      <div className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 ml-2 flex items-center gap-2">
          <ListIcon className="w-4 h-4" /> 全事项回顾
        </h3>
        <div className="space-y-4">
          {dayEvents.map(event => {
            const cat = categories.find(c => c.id === event.categoryId);
            return (
              <div key={event.id} onClick={() => onEditEvent(event)} className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start gap-6">
                 <div className="flex flex-col items-center shrink-0 w-16">
                    <span className="text-sm font-black text-gray-400">{event.startTime}</span>
                    <div className="w-px h-8 bg-gray-100 my-1"></div>
                    <span className="text-[10px] font-bold text-gray-300">{event.endTime}</span>
                 </div>
                 <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tight" style={{ backgroundColor: (cat?.color || '#eee') + '20', color: cat?.color }}>{cat?.name}</span>
                        <h4 className="text-base font-bold text-gray-700">{event.title}</h4>
                      </div>
                      <span className="text-lg">{event.moodRating >= 4 ? '✨' : ''}</span>
                    </div>
                    {event.description && <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{event.description}</p>}
                    <div className="flex flex-wrap gap-2">
                       {event.highlights.map(h => (
                         <span key={h} className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                           <Star className="w-2.5 h-2.5 fill-current" /> {h}
                         </span>
                       ))}
                       {event.painPoints.map(p => (
                         <span key={p} className="flex items-center gap-1 text-[9px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-lg">
                           <AlertCircle className="w-2.5 h-2.5" /> {p}
                         </span>
                       ))}
                    </div>
                 </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayDetailView;

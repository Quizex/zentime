
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { EventEntry, Category, FrequentStat, WorkItem } from '../types';
import { Plus, Trash2, TrendingUp, Target, Award, Info } from 'lucide-react';
import FrequentStatForm from './FrequentStatForm';

interface StatsDashboardProps {
  events: EventEntry[];
  categories: Category[];
  workItems: WorkItem[];
  frequentStats: FrequentStat[];
  setFrequentStats: React.Dispatch<React.SetStateAction<FrequentStat[]>>;
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ events, categories, frequentStats, setFrequentStats, workItems }) => {
  const [isAddingStat, setIsAddingStat] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deletingStatId, setDeletingStatId] = useState<string | null>(null);

  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingStatId(id);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deletingStatId) {
      setFrequentStats(prev => prev.filter(s => s.id !== deletingStatId));
    }
    setShowConfirmDialog(false);
    setDeletingStatId(null);
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setDeletingStatId(null);
  };

  const last7Days = useMemo(() => {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
  }, []);

  const statInsights = useMemo(() => {
    return frequentStats.map(stat => {
      const dailyData = last7Days.map(date => {
        const dayEvents = events.filter(e => 
          e.date === date && 
          (!stat.targetCategoryId || e.categoryId === stat.targetCategoryId) &&
          (!stat.targetItemId || e.itemId === stat.targetItemId)
        );

        let value = 0;
        let isMet = false;

        // 获取该字段的原始数值
        if (stat.dimension === 'time') {
          if (dayEvents.length > 0) {
            if (stat.field === 'startTime') {
              // 时间已经是24小时格式，直接比较
              const sorted = dayEvents.sort((a,b) => {
                const timeA = parseInt(a.startTime.replace(':', ''));
                const timeB = parseInt(b.startTime.replace(':', ''));
                return timeA - timeB;
              });
              const earliestEvent = sorted[0];
              value = parseInt(earliestEvent.startTime.replace(':', ''));
            } else if (stat.field === 'endTime') {
              // 时间已经是24小时格式，直接比较
              const sorted = dayEvents.sort((a,b) => {
                const timeA = parseInt(a.endTime.replace(':', ''));
                const timeB = parseInt(b.endTime.replace(':', ''));
                return timeB - timeA;
              });
              const latestEvent = sorted[0];
              value = parseInt(latestEvent.endTime.replace(':', ''));
            } else if (stat.field === 'duration') {
              value = dayEvents.reduce((acc, curr) => acc + curr.duration, 0);
            }
          } else {
            // 没记录时的默认值
            value = stat.field === 'duration' ? 0 : 2359;
          }
        } else if (stat.dimension === 'state') {
          const field = stat.field as 'moodRating' | 'completionRating';
          const total = dayEvents.reduce((acc, curr) => acc + curr[field], 0);
          value = dayEvents.length > 0 ? total / dayEvents.length : 0;
        } else if (stat.dimension === 'metric') {
          const metricVals = dayEvents.flatMap(e => e.metrics.filter(m => m.name === stat.field).map(m => m.value));
          value = metricVals.length > 0 ? metricVals.reduce((a,b) => a + b, 0) / metricVals.length : 0;
        }

        // 判定是否达标
        let targetValNum = typeof stat.targetValue === 'string' && stat.targetValue.includes(':') 
          ? parseInt(stat.targetValue.replace(':', '')) 
          : Number(stat.targetValue);

        // 处理目标时间可能在第二天的情况
        // 如果目标时间小于 12:00，可能是第二天的时间，加上 2400
        if (typeof stat.targetValue === 'string' && stat.targetValue.includes(':') && targetValNum < 1200) {
          targetValNum += 2400;
        }

        if (stat.operator === 'gte') isMet = value >= targetValNum;
        else if (stat.operator === 'lte') isMet = value <= targetValNum;
        else if (stat.operator === 'eq') isMet = value === targetValNum;

        return { date, value, isMet };
      });

      const todayData = dailyData[dailyData.length - 1];
      const metCount = dailyData.filter(d => d.isMet).length;
      
      // 排名逻辑：如果目标是“小于等于”（如早起时间），则数值越小排名越高；
      // 如果目标是“大于等于”（如专注度、时长），则数值越大排名越高。
      const sortedForRank = [...dailyData].sort((a, b) => {
        if (stat.operator === 'lte') return a.value - b.value;
        return b.value - a.value;
      });
      const rank = sortedForRank.findIndex(d => d.date === todayData.date) + 1;

      return {
        ...stat,
        dailyData,
        achievementRate: Math.round((metCount / 7) * 100),
        todayRank: rank,
        isTodayMet: todayData.isMet
      };
    });
  }, [events, frequentStats, last7Days]);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20">
      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-300" /> 我的常统计 (近7日回顾)
          </h3>
          <button onClick={() => setIsAddingStat(true)} className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-indigo-500 rounded-xl text-[10px] font-black hover:bg-indigo-100 transition-all">
            <Plus className="w-3.5 h-3.5" /> 新增常统计
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statInsights.length === 0 ? (
             <div className="md:col-span-2 py-12 border-2 border-dashed border-gray-100 rounded-[40px] flex flex-col items-center justify-center text-gray-300 text-sm font-bold">
                自定义你的理想指标，追踪每日细微进步
             </div>
          ) : (
            statInsights.map(insight => (
              <div key={insight.id} className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <Award className={`absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.03] transition-transform group-hover:scale-110 ${insight.isTodayMet ? 'text-green-500' : 'text-gray-400'}`} />
                
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-xl font-black text-gray-700">{insight.name}</h4>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md">
                      目标: {insight.operator === 'gte' ? '≥' : insight.operator === 'lte' ? '≤' : '='} {insight.targetValue}
                    </span>
                  </div>
                  <button onClick={(e) => handleDeleteClick(insight.id, e)} className="p-2 text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <span className="text-[9px] font-black text-gray-300 block mb-1 uppercase tracking-tighter">7日达成率</span>
                    <div className="text-2xl font-black text-indigo-400">{insight.achievementRate}%</div>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-black text-gray-300 block mb-1 uppercase tracking-tighter">当日效果排名</span>
                    <div className="text-2xl font-black text-amber-400">{insight.todayRank}<span className="text-xs text-gray-300 ml-0.5">/7</span></div>
                  </div>
                  <div className="text-center">
                    <span className="text-[9px] font-black text-gray-300 block mb-1 uppercase tracking-tighter">当日目标状态</span>
                    <div className={`text-[10px] font-black mt-2 inline-block px-3 py-1 rounded-full ${insight.isTodayMet ? 'bg-green-50 text-green-500' : 'bg-red-50 text-red-400'}`}>
                      {insight.isTodayMet ? '已达标' : '未达成'}
                    </div>
                  </div>
                </div>

                <div className="h-24 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={insight.dailyData}>
                      <Line type="monotone" dataKey="value" stroke={insight.isTodayMet ? "#b5ead7" : "#cbd5e1"} strokeWidth={3} dot={{ fill: insight.isTodayMet ? "#b5ead7" : "#cbd5e1", r: 4 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                        labelFormatter={(v, payload) => payload[0]?.payload?.date || ''}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="pt-12 border-t border-gray-100 space-y-8">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-300" /> 基础时光透视
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-50">
              <h4 className="text-base font-black text-gray-600 mb-6">全分类时间占比</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categories.map(c => ({ name: c.name, value: events.filter(e => e.categoryId === c.id).reduce((a,b) => a+b.duration, 0), color: c.color })).filter(d => d.value > 0)} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value">
                      {categories.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-indigo-50/20 p-10 rounded-[40px] shadow-sm border border-indigo-50 flex flex-col justify-center">
               <Info className="w-10 h-10 text-indigo-300 mb-6" />
               <h4 className="text-xl font-black text-indigo-600 mb-3">多维度分析</h4>
               <p className="text-sm text-indigo-400 leading-relaxed font-medium">
                 通过建立“常统计”，你可以观察特定事项（如睡眠、运动、深度学习）的长期趋势。
                 达标度能直观反馈习惯养成的情况，而排名则能激励你在表现欠佳的日子里重新找回状态。
               </p>
            </div>
        </div>
      </section>

      {isAddingStat && (
        <FrequentStatForm 
          onClose={() => setIsAddingStat(false)} 
          onSubmit={(stat) => {
            setFrequentStats(prev => [...prev, { ...stat, id: crypto.randomUUID() }]);
            setIsAddingStat(false);
          }} 
          categories={categories}
          workItems={workItems}
        />
      )}

      {/* 确认删除对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">确认删除</h3>
            <p className="text-gray-500 mb-6">
              确定要删除这条常统计吗？此操作不可撤销。
            </p>
            <div className="flex gap-4">
              <button 
                onClick={handleCancelDelete}
                className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-6 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsDashboard;

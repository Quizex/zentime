
import React, { useState, useEffect, useMemo } from 'react';
import { X, Clock, Plus, Star, Heart, MessageSquare, Sparkles, Zap, AlertCircle, Tag, BarChart3, LayoutGrid, Calendar as CalendarIcon } from 'lucide-react';
import { EventEntry, Category, WorkItem, TagStatus, MetricValue, PoolItem } from '../types';

interface EventFormProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
  editingEvent: EventEntry | null;
  categories: Category[];
  workItems: WorkItem[];
  onJumpToManage: () => void;
}

const TimeInput24h: React.FC<{
  label: string;
  value: string;
  isNextDay: boolean;
  onTimeChange: (val: string) => void;
  onDayToggle: () => void;
  isActive: boolean;
}> = ({ label, value, isNextDay, onTimeChange, onDayToggle, isActive }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9:]/g, '');
    if (val.length === 2 && !val.includes(':')) val += ':';
    if (val.length > 5) val = val.slice(0, 5);
    onTimeChange(val);
  };

  const handleBlur = () => {
    let [h, m] = value.split(':');
    h = (h || '00').padStart(2, '0');
    m = (m || '00').padStart(2, '0');
    if (parseInt(h) > 23) h = '23';
    if (parseInt(m) > 59) m = '59';
    onTimeChange(`${h}:${m}`);
  };

  return (
    <div className={`p-2 rounded-xl border-2 transition-all flex flex-col ${isActive ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-50 bg-gray-50/30'}`}>
      <div className="flex justify-between items-center mb-0.5">
        <label className="text-[8px] md:text-[9px] text-gray-400 uppercase font-bold">{label}</label>
        <button 
          type="button" 
          onClick={onDayToggle}
          className={`text-[8px] px-1.5 py-0.5 rounded-md font-black transition-all ${isNextDay ? 'bg-indigo-400 text-white shadow-sm' : 'bg-gray-100 text-gray-300'}`}
        >
          {isNextDay ? '明日' : '当日'}
        </button>
      </div>
      <input 
        type="text" 
        value={value} 
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder="HH:mm"
        className="w-full bg-transparent font-black outline-none text-xs md:text-sm text-[#4a4a4a]"
      />
    </div>
  );
};

const EventForm: React.FC<EventFormProps> = ({ onClose, onSubmit, editingEvent, categories, workItems, onJumpToManage }) => {
  const getToday = () => new Date().toISOString().split('T')[0];
  const formatTime = (d: Date) => {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  };
  
  const [useItem, setUseItem] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    itemId: '',
    categoryId: categories[0]?.id || '',
    description: '',
    reflection: '',
    highlights: [] as string[],
    painPoints: [] as string[],
    date: getToday(),
    startTime: formatTime(new Date()),
    endTime: formatTime(new Date(Date.now() + 60 * 60 * 1000)),
    startNextDay: false,
    endNextDay: false,
    duration: 60,
    tags: [] as TagStatus[],
    metrics: [] as MetricValue[],
    moodRating: 3,
    completionRating: 3,
    isHighPriority: false,
  });

  const [newHighlight, setNewHighlight] = useState('');
  const [newPainPoint, setNewPainPoint] = useState('');
  const [sessionNewPoolItems, setSessionNewPoolItems] = useState<{highlights: string[], painPoints: string[]}>({ highlights: [], painPoints: [] });
  const [lastModifiedFields, setLastModifiedFields] = useState<('start' | 'end' | 'duration')[]>(['start', 'duration']);

  useEffect(() => {
    if (editingEvent) {
      setFormData({
        ...editingEvent,
        itemId: editingEvent.itemId || '',
        painPoints: editingEvent.painPoints || [],
        startNextDay: false,
        endNextDay: (editingEvent.duration >= 1440 || (parseMins(editingEvent.endTime) < parseMins(editingEvent.startTime))),
        isHighPriority: editingEvent.isHighPriority || false
      });
      setUseItem(!!editingEvent.itemId);
    }
  }, [editingEvent]);

  useEffect(() => {
    if (editingEvent) return;
    const item = workItems.find(i => i.id === formData.itemId);
    const category = categories.find(c => c.id === formData.categoryId);
    
    let defaultTags: string[] = [];
    let defaultMetrics: string[] = [];
    
    if (useItem && item) {
      defaultTags = item.defaultTags || [];
      defaultMetrics = item.defaultMetrics || [];
      setFormData(prev => ({ ...prev, title: item.name, categoryId: item.categoryId }));
    } else if (category) {
      defaultTags = category.defaultTags || [];
      defaultMetrics = category.defaultMetrics || [];
    }

    setFormData(prev => ({
      ...prev,
      tags: defaultTags.map(t => ({ name: t, status: 'neutral' })),
      metrics: defaultMetrics.map(m => ({ name: m, value: 3 })),
      highlights: [],
      painPoints: []
    }));
  }, [formData.itemId, formData.categoryId, useItem, workItems, categories, editingEvent]);

  function parseMins(timeStr: string) {
    const [h, m] = timeStr.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  function formatMins(totalMins: number) {
    const h = Math.floor((totalMins % 1440 + 1440) % 1440 / 60);
    const m = (totalMins % 60 + 60) % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  const handleTimeUpdate = (field: 'start' | 'end' | 'duration' | 'startDay' | 'endDay', val?: any) => {
    let nextData = { ...formData };
    if (field === 'start') nextData.startTime = val;
    if (field === 'end') nextData.endTime = val;
    if (field === 'duration') nextData.duration = parseInt(val) || 0;
    if (field === 'startDay') nextData.startNextDay = !nextData.startNextDay;
    if (field === 'endDay') nextData.endNextDay = !nextData.endNextDay;

    const modField = (field === 'startDay' || field === 'start') ? 'start' : (field === 'endDay' || field === 'end' ? 'end' : 'duration');
    const newLastModified = [modField as any, ...lastModifiedFields.filter(f => f !== modField)].slice(0, 2);
    setLastModifiedFields(newLastModified);

    const startAbs = parseMins(nextData.startTime) + (nextData.startNextDay ? 1440 : 0);
    const endAbs = parseMins(nextData.endTime) + (nextData.endNextDay ? 1440 : 0);
    
    if (newLastModified.includes('start') && newLastModified.includes('duration')) {
      const newEndAbs = startAbs + nextData.duration;
      nextData.endTime = formatMins(newEndAbs);
      nextData.endNextDay = newEndAbs >= 1440;
    } else if (newLastModified.includes('start') && newLastModified.includes('end')) {
      let diff = endAbs - startAbs;
      if (diff < 0) {
        nextData.endNextDay = true;
        diff = (parseMins(nextData.endTime) + 1440) - startAbs;
      }
      nextData.duration = diff;
    } else if (newLastModified.includes('end') && newLastModified.includes('duration')) {
      let newStartAbs = endAbs - nextData.duration;
      if (newStartAbs < 0) newStartAbs = 0; 
      nextData.startTime = formatMins(newStartAbs);
      nextData.startNextDay = newStartAbs >= 1440;
    }
    setFormData(nextData);
  };

  const togglePointSelection = (type: 'highlight' | 'pain', name: string) => {
    const key = type === 'highlight' ? 'highlights' : 'painPoints';
    setFormData(prev => ({
      ...prev,
      [key]: prev[key as 'highlights' | 'painPoints'].includes(name)
        ? prev[key as 'highlights' | 'painPoints'].filter(n => n !== name)
        : [...prev[key as 'highlights' | 'painPoints'], name]
    }));
  };

  const handleAddNewPoint = (type: 'highlight' | 'pain', name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSessionNewPoolItems(prev => ({
      ...prev,
      [type === 'highlight' ? 'highlights' : 'painPoints']: [...new Set([...prev[type === 'highlight' ? 'highlights' : 'painPoints'], trimmed])]
    }));
    const key = type === 'highlight' ? 'highlights' : 'painPoints';
    setFormData(prev => ({
      ...prev,
      [key]: [...new Set([...prev[key as 'highlights' | 'painPoints'], trimmed])]
    }));
    if (type === 'highlight') setNewHighlight('');
    else setNewPainPoint('');
  };

  const currentItem = workItems.find(i => i.id === formData.itemId);
  const currentCategory = categories.find(c => c.id === formData.categoryId);
  
  const mergedHighlightPool = useMemo(() => {
    const base = (useItem && currentItem) ? currentItem.highlightPool : (currentCategory?.highlightPool || []);
    const combined = [...base];
    sessionNewPoolItems.highlights.forEach(h => {
      if (!combined.some(b => b.name === h)) combined.push({ name: h, count: 0 });
    });
    return combined;
  }, [currentItem, currentCategory, useItem, sessionNewPoolItems.highlights]);

  const mergedPainPointPool = useMemo(() => {
    const base = (useItem && currentItem) ? currentItem.painPointPool : (currentCategory?.painPointPool || []);
    const combined = [...base];
    sessionNewPoolItems.painPoints.forEach(p => {
      if (!combined.some(b => b.name === p)) combined.push({ name: p, count: 0 });
    });
    return combined;
  }, [currentItem, currentCategory, useItem, sessionNewPoolItems.painPoints]);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white rounded-t-[32px] md:rounded-[40px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col h-[94vh] md:max-h-[85vh] animate-in slide-in-from-bottom duration-300 text-[#4a4a4a]">
        <div className="p-4 md:p-6 border-b border-gray-50 flex justify-between items-center bg-[#fdfaf6]">
          <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            {editingEvent ? '时光修正' : '刻录时光'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <form className="flex-1 overflow-y-auto p-5 md:p-10 space-y-8 custom-scrollbar bg-white">
          {/* 重点标记 - 新增 */}
          <section className="flex items-center justify-between p-4 bg-amber-50/50 rounded-2xl border border-amber-100 shadow-sm">
            <div className="flex items-center gap-3">
              <Star className={`w-5 h-5 ${formData.isHighPriority ? 'text-amber-500 fill-amber-500' : 'text-gray-300'}`} />
              <div className="flex flex-col">
                <span className="text-sm font-black text-amber-800">标记为重点时光</span>
                <span className="text-[10px] text-amber-600/70 font-bold uppercase tracking-tight">重点事件将在时光轴显现</span>
              </div>
            </div>
            <button 
              type="button" 
              onClick={() => setFormData(prev => ({ ...prev, isHighPriority: !prev.isHighPriority }))}
              className={`w-12 h-6 rounded-full relative transition-all ${formData.isHighPriority ? 'bg-amber-400' : 'bg-gray-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${formData.isHighPriority ? 'left-7' : 'left-1'}`} />
            </button>
          </section>

          <section className="space-y-3">
            <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5 text-indigo-200"/> 确认日期</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setFormData({...formData, date: getToday()})} className={`px-4 py-2 rounded-xl text-xs font-bold border-2 transition-all ${formData.date === getToday() ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-transparent text-gray-400'}`}>今天</button>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-gray-50 border-2 border-transparent focus:border-indigo-100 px-3 py-1.5 rounded-xl text-xs font-black outline-none" />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><LayoutGrid className="w-3.5 h-3.5 text-indigo-200"/> 事项类别</label>
              <button type="button" onClick={onJumpToManage} className="text-[10px] md:text-xs text-indigo-400 font-bold hover:underline">库管理</button>
            </div>
            <div className="flex gap-2">
              <select value={formData.categoryId} onChange={e => setFormData(prev => ({ ...prev, categoryId: e.target.value, itemId: '' }))} className="flex-1 p-3.5 bg-gray-50 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-indigo-50">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setUseItem(!useItem)} className={`px-4 rounded-2xl text-xs font-bold transition-all border-2 ${useItem ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                {useItem ? '库选' : '手输'}
              </button>
            </div>
            {useItem ? (
              <select value={formData.itemId} onChange={e => setFormData(prev => ({ ...prev, itemId: e.target.value }))} className="w-full p-4 bg-indigo-50/20 border-2 border-indigo-100/30 rounded-2xl font-black text-indigo-600 outline-none text-sm">
                <option value="">-- 请选择具体事项 --</option>
                {workItems.filter(i => i.categoryId === formData.categoryId).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            ) : (
              <input type="text" placeholder="此刻正在做什么？" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} className="w-full p-4 bg-gray-50 rounded-2xl font-black text-base outline-none border-2 border-transparent focus:border-indigo-100 shadow-inner" />
            )}
          </section>

          <section className="space-y-3">
            <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-indigo-200"/> 时光跨度</label>
            <div className="grid grid-cols-3 gap-2">
              <TimeInput24h label="开始" value={formData.startTime} isNextDay={formData.startNextDay} onTimeChange={(v) => handleTimeUpdate('start', v)} onDayToggle={() => handleTimeUpdate('startDay')} isActive={lastModifiedFields.includes('start')} />
              <TimeInput24h label="结束" value={formData.endTime} isNextDay={formData.endNextDay} onTimeChange={(v) => handleTimeUpdate('end', v)} onDayToggle={() => handleTimeUpdate('endDay')} isActive={lastModifiedFields.includes('end')} />
              <div className={`p-2 rounded-xl border-2 transition-all ${lastModifiedFields.includes('duration') ? 'border-indigo-200 bg-indigo-50/20' : 'border-gray-50 bg-gray-50/30'}`}>
                <label className="text-[8px] md:text-[9px] text-gray-400 block mb-0.5 uppercase font-bold">持续时长</label>
                <div className="flex items-center gap-1">
                   <input type="number" value={formData.duration} onChange={e => handleTimeUpdate('duration', e.target.value)} className="w-full bg-transparent font-black outline-none text-xs md:text-sm" placeholder="分钟" />
                   <span className="text-[9px] text-gray-300 font-black">MIN</span>
                </div>
              </div>
            </div>
          </section>

          {formData.tags.length > 0 && (
            <section className="space-y-3">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-indigo-200"/> 状态感知</label>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <button key={idx} type="button" onClick={() => {
                    const statuses: TagStatus['status'][] = ['neutral', 'positive', 'negative'];
                    const currentIdx = statuses.indexOf(tag.status);
                    const nextStatus = statuses[(currentIdx + 1) % 3];
                    setFormData(prev => {
                      const newTags = [...prev.tags];
                      newTags[idx] = { ...tag, status: nextStatus };
                      return { ...prev, tags: newTags };
                    });
                  }} className={`px-3 py-1.5 rounded-xl text-[10px] md:text-xs font-black border-2 transition-all flex items-center gap-1.5 ${
                    tag.status === 'positive' ? 'bg-green-50 border-green-100 text-green-600' : 
                    tag.status === 'negative' ? 'bg-red-50 border-red-100 text-red-600' : 
                    'bg-gray-50 border-gray-50 text-gray-400'
                  }`}>
                    {tag.status === 'positive' ? '✅' : tag.status === 'negative' ? '❌' : '⚪'} {tag.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="space-y-4">
             <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-indigo-200"/> 深度刻录</label>
             <div className="space-y-3">
                <textarea placeholder="简单记述细节..." value={formData.description} onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))} className="w-full p-4 bg-gray-50 rounded-2xl text-xs md:text-sm min-h-[80px] outline-none border-2 border-transparent focus:border-indigo-50 font-medium" />
                <div className="relative">
                  <Heart className="absolute left-3.5 top-3.5 w-4 h-4 text-indigo-200" />
                  <textarea placeholder="有什么特别的心得或警示？" value={formData.reflection} onChange={e => setFormData(prev => ({ ...prev, reflection: e.target.value }))} className="w-full p-4 pl-10 bg-indigo-50/10 rounded-2xl text-xs md:text-sm min-h-[80px] outline-none border-2 border-transparent focus:border-indigo-100 italic text-indigo-600 font-medium" />
                </div>
             </div>
          </section>

          <section className="space-y-5 pt-3 border-t border-gray-50">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-amber-500 font-black text-[11px]"><Zap className="w-3.5 h-3.5 fill-amber-500" /> 亮点同步</div>
              <div className="flex flex-wrap gap-2">
                {mergedHighlightPool.map(pt => (
                  <button key={pt.name} type="button" onClick={() => togglePointSelection('highlight', pt.name)} className={`px-3 py-2 rounded-xl text-[10px] md:text-xs font-black border-2 transition-all flex items-center gap-2 ${formData.highlights.includes(pt.name) ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm scale-105' : 'bg-white border-gray-50 text-gray-300'}`}>
                    <Star className={`w-3.5 h-3.5 ${formData.highlights.includes(pt.name) ? 'fill-amber-500' : ''}`} /> {pt.name} 
                    <span className="text-[9px] opacity-40">({pt.count})</span>
                  </button>
                ))}
                <div className="flex items-center bg-gray-50 pl-2 pr-1 rounded-xl border-2 border-dashed border-gray-200 focus-within:border-amber-200 transition-colors">
                  <input type="text" placeholder="新亮点" value={newHighlight} onChange={e => setNewHighlight(e.target.value)} onKeyDown={e => { if(e.key === 'Enter'){ e.preventDefault(); handleAddNewPoint('highlight', newHighlight); } }} className="w-20 py-1.5 text-[10px] outline-none bg-transparent font-bold"/>
                  <button type="button" onClick={() => handleAddNewPoint('highlight', newHighlight)} className="p-1 text-indigo-300 hover:text-indigo-500"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-red-400 font-black text-[11px]"><AlertCircle className="w-3.5 h-3.5" /> 避雷预警</div>
              <div className="flex flex-wrap gap-2">
                {mergedPainPointPool.map(pt => (
                  <button key={pt.name} type="button" onClick={() => togglePointSelection('pain', pt.name)} className={`px-3 py-2 rounded-xl text-[10px] md:text-xs font-black border-2 transition-all flex items-center gap-2 ${formData.painPoints.includes(pt.name) ? 'bg-red-50 border-red-100 text-red-700 shadow-sm scale-105' : 'bg-white border-gray-50 text-gray-300'}`}>
                    <AlertCircle className="w-3.5 h-3.5" /> {pt.name}
                    <span className="text-[9px] opacity-40">({pt.count})</span>
                  </button>
                ))}
                <div className="flex items-center bg-gray-50 pl-2 pr-1 rounded-xl border-2 border-dashed border-gray-200 focus-within:border-red-200 transition-colors">
                  <input type="text" placeholder="避雷点" value={newPainPoint} onChange={e => setNewPainPoint(e.target.value)} onKeyDown={e => { if(e.key === 'Enter'){ e.preventDefault(); handleAddNewPoint('pain', newPainPoint); } }} className="w-20 py-1.5 text-[10px] outline-none bg-transparent font-bold"/>
                  <button type="button" onClick={() => handleAddNewPoint('pain', newPainPoint)} className="p-1 text-indigo-300 hover:text-indigo-500"><Plus className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          </section>

          {formData.metrics.length > 0 && (
            <section className="space-y-4">
              <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5 text-indigo-200"/> 核心指标维度</label>
              <div className="space-y-4">
                {formData.metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl">
                    <span className="text-[11px] font-black text-gray-500 w-24 truncate uppercase">{m.name}</span>
                    <div className="flex-1 flex justify-between gap-1">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} type="button" onClick={() => {
                          const nextMetrics = [...formData.metrics];
                          nextMetrics[idx].value = v;
                          setFormData({...formData, metrics: nextMetrics});
                        }} className={`flex-1 h-2.5 rounded-full transition-all ${v <= m.value ? 'bg-indigo-400 shadow-sm' : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="bg-indigo-50/20 p-5 rounded-[28px] border border-indigo-100/30 text-center">
            <label className="text-[10px] font-bold text-indigo-400 block mb-3 uppercase tracking-widest">综合身心状态</label>
            <div className="flex justify-between max-w-xs mx-auto">
              {[1, 2, 3, 4, 5].map(v => (
                <button key={v} type="button" onClick={() => setFormData(prev => ({ ...prev, moodRating: v }))} className={`w-11 h-11 rounded-full flex items-center justify-center text-lg md:text-xl transition-all ${formData.moodRating === v ? 'bg-white border-2 border-indigo-200 scale-125 shadow-md' : 'bg-gray-50 grayscale opacity-40'}`}>
                  {v === 1 ? '🙁' : v === 2 ? '😐' : v === 3 ? '🙂' : v === 4 ? '😊' : '🤩'}
                </button>
              ))}
            </div>
          </section>
        </form>

        <div className="p-5 md:p-8 bg-[#fdfaf6] flex gap-3 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors">取消</button>
          <button 
            type="button" 
            onClick={() => onSubmit({
              ...formData, 
              newHighlights: sessionNewPoolItems.highlights, 
              newPainPoints: sessionNewPoolItems.painPoints
            })} 
            disabled={!formData.title} 
            className={`flex-[2] py-4 text-[#4a6b5d] font-black rounded-2xl shadow-xl shadow-green-100/30 active:scale-95 transition-all disabled:opacity-50 ${formData.isHighPriority ? 'bg-amber-400 text-amber-900' : 'bg-[#b5ead7] hover:bg-[#a0dcc5]'}`}
          >
            保存刻录
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventForm;

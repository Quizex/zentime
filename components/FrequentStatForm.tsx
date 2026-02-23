
import React, { useState, useMemo, useEffect } from 'react';
import { X, Target, Clock, Star, BarChart3, ChevronRight, Zap } from 'lucide-react';
import { Category, WorkItem, FrequentStat, StatDimension, StatOperator } from '../types';

interface FrequentStatFormProps {
  onClose: () => void;
  onSubmit: (stat: Omit<FrequentStat, 'id'>) => void;
  categories: Category[];
  workItems: WorkItem[];
}

const FrequentStatForm: React.FC<FrequentStatFormProps> = ({ onClose, onSubmit, categories, workItems }) => {
  const [formData, setFormData] = useState<Omit<FrequentStat, 'id'>>({
    name: '',
    dimension: 'state',
    field: 'completionRating',
    operator: 'gte',
    targetValue: 4,
    targetCategoryId: categories[0]?.id || '',
    targetItemId: '',
  });

  // 根据当前选择的范围（分类或事项）精准过滤可用的自定义指标
  const filteredMetrics = useMemo(() => {
    if (formData.targetItemId) {
      const item = workItems.find(i => i.id === formData.targetItemId);
      return item?.defaultMetrics || [];
    }
    const cat = categories.find(c => c.id === formData.targetCategoryId);
    return cat?.defaultMetrics || [];
  }, [formData.targetCategoryId, formData.targetItemId, workItems, categories]);

  // 当过滤后的指标列表变化时，如果当前处于指标维度，自动修正 field
  useEffect(() => {
    if (formData.dimension === 'metric' && !filteredMetrics.includes(formData.field)) {
      setFormData(prev => ({ ...prev, field: filteredMetrics[0] || '' }));
    }
  }, [filteredMetrics, formData.dimension]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 自动生成统计方案名称
    const targetName = formData.targetItemId 
      ? workItems.find(i => i.id === formData.targetItemId)?.name 
      : categories.find(c => c.id === formData.targetCategoryId)?.name;
    
    const fieldLabels: Record<string, string> = {
      startTime: '开始时间',
      endTime: '结束时间',
      duration: '持续时长',
      moodRating: '身心状态',
      completionRating: '完成度',
    };
    const fieldLabel = fieldLabels[formData.field] || formData.field;
    
    const generatedName = `${targetName} · ${fieldLabel}`;
    
    onSubmit({
      ...formData,
      name: generatedName
    });
  };

  const handleDimensionChange = (dim: StatDimension) => {
    let field = '';
    if (dim === 'time') field = 'startTime';
    else if (dim === 'state') field = 'moodRating';
    else if (dim === 'metric') field = filteredMetrics[0] || '专注度';
    
    setFormData({ ...formData, dimension: dim, field });
  };

  const isTimeField = formData.field === 'startTime' || formData.field === 'endTime';

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl p-8 md:p-12 animate-in zoom-in duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-gray-700 flex items-center gap-2">
              <Target className="w-6 h-6 text-indigo-400" /> 深度常统计配置
            </h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-8">自动生成方案名称</p>
          </div>
          <button onClick={onClose} type="button" className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. 范围筛选 */}
          <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">1. 追踪范围 (分类与事项)</label>
            <div className="grid grid-cols-2 gap-3">
              <select value={formData.targetCategoryId} onChange={e => setFormData({...formData, targetCategoryId: e.target.value, targetItemId: ''})} className="p-3.5 bg-gray-50 rounded-xl outline-none font-bold text-xs border-2 border-transparent focus:border-indigo-50">
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select value={formData.targetItemId} onChange={e => setFormData({...formData, targetItemId: e.target.value})} className="p-3.5 bg-gray-50 rounded-xl outline-none font-bold text-xs border-2 border-transparent focus:border-indigo-50">
                <option value="">全部子事项</option>
                {workItems.filter(i => i.categoryId === formData.targetCategoryId).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
          </div>

          {/* 2. 理想效果设定 */}
          <div className="space-y-4 border-t border-gray-50 pt-6">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">2. 理想效果设定 (维度与条件)</label>
            
            {/* 维度选择 */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'time', label: '时光跨度', icon: Clock },
                { id: 'metric', label: '核心指标', icon: BarChart3 },
                { id: 'state', label: '身心状态', icon: Zap }
              ].map(d => (
                <button key={d.id} type="button" onClick={() => handleDimensionChange(d.id as StatDimension)} className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border-2 transition-all ${formData.dimension === d.id ? 'border-indigo-200 bg-indigo-50 text-indigo-600' : 'border-gray-50 text-gray-400 grayscale hover:grayscale-0'}`}>
                  <d.icon className="w-5 h-5" />
                  <span className="text-[10px] font-black">{d.label}</span>
                </button>
              ))}
            </div>

            {/* 字段与逻辑选择 */}
            <div className="flex items-center gap-3 bg-indigo-50/30 p-4 rounded-2xl">
               <div className="flex-1 space-y-2">
                  <span className="text-[9px] font-black text-indigo-300 uppercase">具体维度</span>
                  <select value={formData.field} onChange={e => setFormData({...formData, field: e.target.value})} className="w-full bg-transparent outline-none font-black text-sm text-indigo-600">
                    {formData.dimension === 'time' && (
                      <>
                        <option value="startTime">开始时间</option>
                        <option value="endTime">结束时间</option>
                        <option value="duration">持续时长 (分钟)</option>
                      </>
                    )}
                    {formData.dimension === 'state' && (
                      <>
                        <option value="moodRating">身心评分 (Mood)</option>
                        <option value="completionRating">完成度评分</option>
                      </>
                    )}
                    {formData.dimension === 'metric' && (
                      filteredMetrics.length > 0 
                        ? filteredMetrics.map(m => <option key={m} value={m}>{m}</option>) 
                        : <option disabled>该范围暂无自定义指标</option>
                    )}
                  </select>
               </div>
               <ChevronRight className="w-4 h-4 text-indigo-200" />
               <div className="flex-1 space-y-2">
                  <span className="text-[9px] font-black text-indigo-300 uppercase">判定逻辑</span>
                  <select value={formData.operator} onChange={e => setFormData({...formData, operator: e.target.value as StatOperator})} className="w-full bg-transparent outline-none font-black text-sm text-indigo-600">
                    <option value="gte">大于等于 (≥)</option>
                    <option value="lte">小于等于 (≤)</option>
                    <option value="eq">等于 (=)</option>
                  </select>
               </div>
            </div>

            {/* 目标值输入 */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">目标设定值</label>
              <div className="relative">
                <input 
                  required 
                  value={formData.targetValue} 
                  onChange={e => setFormData({...formData, targetValue: e.target.value})} 
                  placeholder={isTimeField ? "08 : 30" : "例如 4 或 60"} 
                  className={`w-full p-4 bg-gray-50 border-2 border-transparent focus:border-indigo-100 rounded-2xl outline-none font-bold text-center text-xl tracking-widest`} 
                />
                {isTimeField && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">
                    <Clock className="w-5 h-5" />
                  </div>
                )}
              </div>
              <div className="flex justify-between px-2">
                 <p className="text-[9px] text-gray-300 italic">
                   {isTimeField ? "请输入 24 小时制时间，如 08:30" : "请输入 1-5 评分或持续分钟数"}
                 </p>
                 {!isTimeField && (
                   <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(v => (
                        <button key={v} type="button" onClick={() => setFormData({...formData, targetValue: v})} className="text-[10px] font-bold text-indigo-300 hover:text-indigo-500">{v}</button>
                      ))}
                   </div>
                 )}
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full py-5 bg-[#b5ead7] text-[#4a6b5d] font-black rounded-3xl shadow-xl shadow-green-100/50 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2">
              开启 {formData.targetItemId ? '精准事项' : '分类汇总'} 追踪
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FrequentStatForm;

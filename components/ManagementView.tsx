
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Folder, LayoutGrid, X, Star, AlertCircle, Tag, BarChart3 } from 'lucide-react';
import { Category, WorkItem } from '../types';

interface ManagementViewProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  workItems: WorkItem[];
  setWorkItems: React.Dispatch<React.SetStateAction<WorkItem[]>>;
}

const ManagementView: React.FC<ManagementViewProps> = ({ categories, setCategories, workItems, setWorkItems }) => {
  const [tab, setTab] = useState<'cat' | 'item'>('item');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [deletingType, setDeletingType] = useState<'category' | 'item' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [tempTags, setTempTags] = useState('');
  const [tempMetrics, setTempMetrics] = useState('');
  const [tempSelectOptions, setTempSelectOptions] = useState('');

  useEffect(() => {
    if (isEditing && editData) {
      setTempTags(editData.defaultTags?.join('，') || '');
      setTempMetrics(editData.defaultMetrics?.join('，') || '');
      setTempSelectOptions(editData.selectOptions?.map(opt => `${opt.name}: ${opt.options.join('，')}`).join('\n') || '');
    }
  }, [isEditing, editData?.id]);

  const handleDeleteClick = (type: 'category' | 'item', id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingType(type);
    setDeletingId(id);
    setShowConfirmDialog(true);
  };

  const handleConfirmDelete = () => {
    if (deletingType && deletingId) {
      if (deletingType === 'category') {
        setCategories(prev => prev.filter(c => c.id !== deletingId));
      } else if (deletingType === 'item') {
        setWorkItems(prev => prev.filter(i => i.id !== deletingId));
      }
    }
    setShowConfirmDialog(false);
    setDeletingType(null);
    setDeletingId(null);
  };

  const handleCancelDelete = () => {
    setShowConfirmDialog(false);
    setDeletingType(null);
    setDeletingId(null);
  };

  const parseCommaString = (str: string) => {
    return str.split(/[，,]/).map(s => s.trim()).filter(Boolean);
  };

  const parseSelectOptions = (str: string) => {
    return str.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const [name, optionsStr] = line.split(':', 2);
        if (!name || !optionsStr) return null;
        return {
          name: name.trim(),
          options: parseCommaString(optionsStr)
        };
      })
      .filter((opt): opt is { name: string; options: string[] } => opt !== null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalData = {
      ...editData,
      defaultTags: parseCommaString(tempTags),
      defaultMetrics: parseCommaString(tempMetrics),
      selectOptions: parseSelectOptions(tempSelectOptions)
    };

    if (tab === 'cat') {
      const newCat = { ...finalData, id: finalData.id || crypto.randomUUID() };
      setCategories(prev => finalData.id ? prev.map(c => c.id === finalData.id ? newCat : c) : [...prev, newCat]);
    } else {
      const newItem = { ...finalData, id: finalData.id || crypto.randomUUID() };
      setWorkItems(prev => finalData.id ? prev.map(i => i.id === finalData.id ? newItem : i) : [...prev, newItem]);
    }
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-24">
      <div className="flex p-1 bg-white border border-gray-100 rounded-2xl w-fit mx-auto md:mx-0 shadow-sm">
        <button onClick={() => setTab('item')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'item' ? 'bg-[#fdf3e7] text-[#e67e22] shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}>事项库</button>
        <button onClick={() => setTab('cat')} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'cat' ? 'bg-[#fdf3e7] text-[#e67e22] shadow-sm' : 'text-gray-400 hover:text-gray-500'}`}>分类设置</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <button onClick={() => {
            const emptyData = tab === 'cat' 
              ? { name: '', color: '#8fb8ed', defaultTags: [], defaultMetrics: [], selectOptions: [], highlightPool: [], painPointPool: [] } 
              : { name: '', categoryId: categories[0]?.id, defaultTags: [], defaultMetrics: [], selectOptions: [], description: '', highlightPool: [], painPointPool: [] };
            setEditData(emptyData);
            setIsEditing(true);
          }} className="h-44 border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center text-gray-300 hover:border-indigo-200 hover:text-indigo-400 transition-all bg-white/40 group">
          <div className="p-3 bg-gray-50 rounded-full group-hover:bg-indigo-50 transition-colors mb-2">
            <Plus className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">添加新{tab === 'cat' ? '分类' : '事项'}</span>
        </button>

        {tab === 'cat' ? (
          categories.map(c => (
            <div key={c.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 relative group hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-inner" style={{ backgroundColor: c.color }}><Folder className="w-6 h-6" /></div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditData(c); setIsEditing(true); }} className="p-2 text-gray-300 hover:text-indigo-400"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={(e) => handleDeleteClick('category', c.id, e)} className="p-2 text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <h4 className="font-bold text-gray-700 text-lg mb-1">{c.name}</h4>
              <p className="text-[10px] text-gray-300 font-medium mb-3">包含 {workItems.filter(i => i.categoryId === c.id).length} 个事项</p>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {c.defaultTags?.slice(0,3).map(t => <span key={t} className="text-[9px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded">#{t}</span>)}
                  {c.defaultTags?.length > 3 && <span className="text-[9px] text-gray-300">...</span>}
                </div>
                <div className="flex flex-wrap gap-1">
                  {c.selectOptions?.slice(0,3).map(opt => <span key={opt.name} className="text-[9px] bg-indigo-50 text-indigo-400 px-1.5 py-0.5 rounded">{opt.name}</span>)}
                  {c.selectOptions?.length > 3 && <span className="text-[9px] text-gray-300">...</span>}
                </div>
              </div>
            </div>
          ))
        ) : (
          workItems.map(i => {
            const cat = categories.find(c => c.id === i.categoryId);
            return (
              <div key={i.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 group hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-tight" style={{ backgroundColor: (cat?.color || '#eee') + '20', color: cat?.color }}>{cat?.name || '未分类'}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditData(i); setIsEditing(true); }} className="p-2 text-gray-300 hover:text-indigo-400"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={(e) => handleDeleteClick('item', i.id, e)} className="p-2 text-gray-300 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <h4 className="font-bold text-gray-700 text-lg mb-4">{i.name}</h4>
                <div className="space-y-2">
                   <div className="flex flex-wrap gap-1">
                    {i.defaultTags?.map(t => <span key={t} className="text-[9px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-full font-bold">#{t}</span>)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {i.defaultMetrics?.map(m => <span key={m} className="text-[9px] bg-indigo-50/50 text-indigo-400 px-2 py-0.5 rounded-full font-bold">📊{m}</span>)}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {i.selectOptions?.map(opt => <span key={opt.name} className="text-[9px] bg-indigo-50 text-indigo-400 px-2 py-0.5 rounded-full font-bold">{opt.name}</span>)}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {isEditing && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl p-10 space-y-8 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <h3 className="text-2xl font-bold text-[#4a4a4a] tracking-tight">{editData.id ? '编辑' : '创建'}{tab === 'cat' ? '分类' : '事项'}</h3>
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-black uppercase tracking-widest">基本名称</label>
                <input required type="text" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-indigo-100 transition-all" />
              </div>
              
              {tab === 'cat' ? (
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-black uppercase tracking-widest">主题色彩</label>
                  <div className="flex gap-4 items-center p-2 bg-gray-50 rounded-2xl">
                    <input type="color" value={editData.color} onChange={e => setEditData({ ...editData, color: e.target.value })} className="h-12 w-20 p-1 bg-white rounded-xl cursor-pointer" />
                    <input 
                      type="text" 
                      value={editData.color} 
                      onChange={e => setEditData({ ...editData, color: e.target.value })} 
                      className="text-xs font-mono text-gray-400 bg-transparent border border-gray-200 rounded px-2 py-1 outline-none focus:border-indigo-200"
                      placeholder="#RRGGBB"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 font-black uppercase tracking-widest">所属大类</label>
                  <select value={editData.categoryId} onChange={e => setEditData({ ...editData, categoryId: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-bold">
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <label className="text-xs text-gray-400 font-black uppercase tracking-widest flex items-center gap-2"><Tag className="w-4 h-4"/> 默认标签库</label>
                <textarea 
                  value={tempTags} 
                  onChange={e => setTempTags(e.target.value)} 
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm min-h-[80px]" 
                  placeholder="支持 中文逗号（，） 或 英文逗号（,） 间隔..."
                />
                <p className="text-[10px] text-gray-300 italic">实时预览：{parseCommaString(tempTags).map(t => `#${t}`).join(' ')}</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-gray-400 font-black uppercase tracking-widest flex items-center gap-2"><BarChart3 className="w-4 h-4"/> 核心指标维度</label>
                <textarea 
                  value={tempMetrics} 
                  onChange={e => setTempMetrics(e.target.value)} 
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm min-h-[80px]" 
                  placeholder="如：专注度，压力感，满足感..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs text-gray-400 font-black uppercase tracking-widest flex items-center gap-2"><LayoutGrid className="w-4 h-4"/> 选择框配置</label>
                <textarea 
                  value={tempSelectOptions} 
                  onChange={e => setTempSelectOptions(e.target.value)} 
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-sm min-h-[120px]" 
                  placeholder="每行一个选择框，格式：选择框名称: 选项1，选项2，选项3\n如：\n乘车方式: 公交，地铁，出租车\n餐时: 早饭，午饭，晚饭"
                />
                <p className="text-[10px] text-gray-300 italic">示例：乘车方式: 公交，地铁，出租车</p>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-500 transition-colors">取消</button>
                <button type="submit" className="flex-1 py-4 bg-[#b5ead7] text-[#4a6b5d] font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all">保存更改</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 确认删除对话框 */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[24px] p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800 mb-4">确认删除</h3>
            <p className="text-gray-500 mb-6">
              确定要删除这条{deletingType === 'category' ? '分类' : '事项'}吗？此操作不可撤销。
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

export default ManagementView;

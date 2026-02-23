import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { parseNaturalLanguageEvent } from '../services/geminiService';
import { EventEntry, TagStatus, MetricValue } from '../types';

interface NaturalLanguageInputProps {
  onParsed: (eventData: Omit<EventEntry, 'id' | 'createdAt'>) => void;
}

const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({ onParsed }) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    const result = await parseNaturalLanguageEvent(input);
    setIsProcessing(false);

    if (result) {
      // 计算时长
      const [sh, sm] = (result.startTime || '12:00').split(':').map(Number);
      const [eh, em] = (result.endTime || '13:00').split(':').map(Number);
      let duration = (eh * 60 + em) - (sh * 60 + sm);
      if (duration < 0) duration += 1440;

      // 映射标签为 TagStatus 对象
      const tags: TagStatus[] = (result.tags || []).map((t: string) => ({
        name: t,
        status: 'positive' as const
      }));

      // Fix: Add missing painPoints and ensure array types are correctly assigned to satisfy Omit<EventEntry, 'id' | 'createdAt'>
      onParsed({
        title: result.title || '无标题活动',
        description: result.description || '',
        reflection: '',
        highlights: [] as string[],
        painPoints: [] as string[],
        categoryId: result.category || '5', 
        tags: tags,
        metrics: [] as MetricValue[],
        moodRating: result.moodRating || 3,
        completionRating: result.completionRating || 3,
        date: result.date || new Date().toISOString().split('T')[0],
        startTime: result.startTime || '12:00',
        endTime: result.endTime || '13:00',
        duration: duration,
      });
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-3xl p-1 shadow-sm border border-gray-100 flex items-center group focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
      <div className="p-3 bg-indigo-50 rounded-full ml-1">
        <Sparkles className="w-5 h-5 text-indigo-400" />
      </div>
      <form onSubmit={handleSubmit} className="flex-1 flex items-center">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="今天我花了2小时学习英语..."
          className="w-full px-4 py-3 bg-transparent focus:outline-none text-gray-600 placeholder-gray-300"
          disabled={isProcessing}
        />
        <button 
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="p-3 mr-1 bg-[#b5ead7] text-[#4a6b5d] rounded-2xl hover:bg-[#a0dcc5] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

export default NaturalLanguageInput;
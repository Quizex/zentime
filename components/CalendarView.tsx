
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Star, ListChecks } from 'lucide-react';
import { EventEntry, Category } from '../types';

interface CalendarViewProps {
  events: EventEntry[];
  onDateSelect: (date: string) => void;
  categories: Category[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ events, onDateSelect, categories }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = daysInMonth(year, month);
  const startDay = firstDayOfMonth(year, month);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1));

  const calendarCells = [];
  for (let i = 0; i < startDay; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-24 md:h-32 border-b border-r border-gray-50 bg-gray-50/20"></div>);
  }

  for (let day = 1; day <= days; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayEvents = events.filter(e => e.date === dateStr);
    const priorityDayEvents = dayEvents.filter(e => e.isHighPriority);
    
    calendarCells.push(
      <div 
        key={day} 
        onClick={() => onDateSelect(dateStr)}
        className="h-24 md:h-32 border-b border-r border-gray-50 p-1 md:p-2 hover:bg-[#fdf3e7] transition-all cursor-pointer group flex flex-col relative overflow-hidden"
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`text-[12px] md:text-sm font-black w-6 h-6 flex items-center justify-center rounded-full transition-colors ${
            dateStr === new Date().toISOString().split('T')[0] 
            ? 'bg-indigo-400 text-white shadow-sm' 
            : 'text-gray-400 group-hover:text-indigo-600'
          }`}>
            {day}
          </span>
          {priorityDayEvents.length > 0 && <Star className="w-3 h-3 text-amber-400 fill-amber-400 mt-1" />}
        </div>

        {/* 重点事件简要列表 */}
        <div className="flex-1 overflow-hidden space-y-0.5">
          {priorityDayEvents.slice(0, 2).map(e => (
            <div key={e.id} className="flex items-center gap-1 text-[8px] md:text-[9px] truncate">
              <div className="w-1 h-1 bg-amber-400 rounded-full shrink-0"></div>
              <span className="text-gray-600 font-bold truncate">{e.title}</span>
            </div>
          ))}
          {priorityDayEvents.length > 2 && (
            <div className="text-[7px] md:text-[8px] text-gray-300 font-bold pl-2 italic">
              ...
            </div>
          )}
        </div>

        {/* 记录总量显示 */}
        {dayEvents.length > 0 && (
          <div className="mt-auto pt-1 flex items-center gap-1">
            <ListChecks className="w-2.5 h-2.5 text-gray-300" />
            <span className="text-[8px] md:text-[10px] font-black text-gray-300 uppercase tracking-tighter">
              共 {dayEvents.length} 条时光
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] md:rounded-[40px] shadow-xl border border-gray-100 overflow-hidden max-w-5xl mx-auto">
      <div className="p-6 md:p-10 flex justify-between items-center border-b border-gray-50 bg-white/50 backdrop-blur-md">
        <h2 className="text-xl md:text-3xl font-black text-[#4a4a4a] tracking-tight">
          {year}年 {month + 1}月
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all border border-gray-50 shadow-sm">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-gray-600 transition-all border border-gray-50 shadow-sm">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-l border-gray-50">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="py-4 text-center text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-gray-300 border-b border-r border-gray-50 bg-gray-50/10">
            {day}
          </div>
        ))}
        {calendarCells}
      </div>
    </div>
  );
};

export default CalendarView;

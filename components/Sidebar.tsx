
import React from 'react';
import { List, Calendar, BarChart3, Settings, Sparkles, LogOut, User, FolderEdit, Search } from 'lucide-react';
import { ViewType } from '../types';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  currentUser: string;
  onLogout: () => void;
}

export default function Sidebar({ activeView, setActiveView, currentUser, onLogout }: SidebarProps) {
  const navItems = [
    { id: 'timeline', label: '时光轴', icon: List },
    { id: 'calendar', label: '日历', icon: Calendar },
    { id: 'stats', label: '分析', icon: BarChart3 },
    { id: 'search', label: '查询', icon: Search },
    { id: 'management', label: '库管理', icon: FolderEdit }, // 在移动端也作为主要入口
  ];

  return (
    <>
      {/* PC Sidebar */}
      <aside className="hidden md:flex w-64 h-full bg-white border-r border-gray-50 flex-col py-8 px-4 shadow-sm z-20 transition-all">
        <div className="flex items-center gap-3 px-4 mb-12">
          <div className="bg-[#ffb7b2] p-2 rounded-xl shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#4a4a4a]">禅定时光</span>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as ViewType)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isActive 
                    ? 'bg-[#fdf3e7] text-[#e67e22] shadow-sm font-semibold' 
                    : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-50 space-y-1">
          <div className="flex items-center gap-3 px-4 py-3 text-[#4a4a4a]">
            <div className="w-8 h-8 bg-indigo-50 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold truncate max-w-[100px]">{currentUser}</span>
              <span className="text-[10px] text-gray-400 font-medium">当前账号</span>
            </div>
            <button 
              onClick={onLogout}
              className="ml-auto p-1.5 text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-all"
              title="退出登录"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setActiveView('management')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
              activeView === 'management' ? 'bg-gray-50 text-gray-700 font-bold' : 'text-gray-400 hover:bg-gray-50'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>空间设置</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-gray-100 flex items-center justify-between px-2 z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewType)}
              className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive ? 'text-[#e67e22]' : 'text-gray-400'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-[#fdf3e7]' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-tight">{item.label}</span>
            </button>
          );
        })}
          <button 
            onClick={onLogout}
            className="flex-1 flex flex-col items-center gap-1 p-2 text-gray-400"
          >
            <div className="p-1.5 rounded-lg">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-tight">退出</span>
          </button>
      </nav>
    </>
  );
}

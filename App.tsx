
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, 
  List, 
  BarChart3, 
  Plus, 
  Search, 
  Settings,
  Sparkles,
  Menu,
  LogOut,
  User,
  ArrowLeft,
  FolderEdit
} from 'lucide-react';
import { EventEntry, Category, WorkItem, ViewType, PoolItem, FrequentStat } from './types';
import { DEFAULT_CATEGORIES, DEFAULT_WORK_ITEMS } from './constants';
import Sidebar from './components/Sidebar';
import EventForm from './components/EventForm';
import TimelineView from './components/TimelineView';
import CalendarView from './components/CalendarView';
import StatsDashboard from './components/StatsDashboard';
import DayDetailView from './components/DayDetailView';
import ManagementView from './components/ManagementView';
import NaturalLanguageInput from './components/NaturalLanguageInput';
import LoginView from './components/LoginView';
import { loadSpaceState } from './services/spaceStateStore';
import { getUserDataCounts, loadUserData, migrateStateToUserTables, replaceUserData, type UserDataCounts } from './services/userDataStore';
import { requireSupabase } from './services/supabaseClient';
import { devBypassSignup } from './services/devBypassSignup';

const App: React.FC = () => {
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('timeline');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [events, setEvents] = useState<EventEntry[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [frequentStats, setFrequentStats] = useState<FrequentStat[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isHydrated, setIsHydrated] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [serverCounts, setServerCounts] = useState<UserDataCounts | null>(null);

  useEffect(() => {
    let unsub: { data: { subscription: { unsubscribe: () => void } } } | null = null;
    (async () => {
      try {
        const supabase = requireSupabase();
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const user = data.session?.user ?? null;
        setSessionUserId(user?.id ?? null);
        setSessionEmail(user?.email ?? null);

        unsub = supabase.auth.onAuthStateChange((_event, newSession) => {
          const u = newSession?.user ?? null;
          setSessionUserId(u?.id ?? null);
          setSessionEmail(u?.email ?? null);
        });
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      unsub?.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!sessionUserId) return;
    let cancelled = false;
    setIsHydrated(false);
    setSyncStatus('idle');
    setSyncError(null);
    setLastSyncedAt(null);
    setServerCounts(null);

    (async () => {
      try {
        const userPrefix = (() => {
          const legacyActive = localStorage.getItem('zt_active_user');
          if (!legacyActive) return null;
          return `zt_${legacyActive}`;
        })();

        const readLegacyArray = <T,>(key: string): T[] | null => {
          const raw = localStorage.getItem(key);
          if (!raw) return null;
          try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? (parsed as T[]) : null;
          } catch {
            return null;
          }
        };

        const legacyEvents = userPrefix ? readLegacyArray<EventEntry>(`${userPrefix}_events`) : null;
        const legacyCats = userPrefix ? readLegacyArray<Category>(`${userPrefix}_cats`) : null;
        const legacyItems = userPrefix ? readLegacyArray<WorkItem>(`${userPrefix}_items`) : null;
        const legacyStats = userPrefix ? readLegacyArray<FrequentStat>(`${userPrefix}_frequent_stats`) : null;

        const legacyState =
          legacyEvents || legacyCats || legacyItems || legacyStats
            ? {
                events: legacyEvents ?? [],
                categories: legacyCats ?? DEFAULT_CATEGORIES,
                workItems: legacyItems ?? DEFAULT_WORK_ITEMS,
                frequentStats: legacyStats ?? []
              }
            : null;

        const userData = await loadUserData(sessionUserId);
        const hasAnyUserRows =
          userData.events.length > 0 ||
          userData.categories.length > 0 ||
          userData.workItems.length > 0 ||
          userData.frequentStats.length > 0;

        if (!hasAnyUserRows && legacyState) {
          await replaceUserData(sessionUserId, legacyState);
        }

        if (!hasAnyUserRows) {
          const legacyActive = localStorage.getItem('zt_active_user');
          if (legacyActive) {
            const { state: dbState, isNew } = await loadSpaceState(legacyActive);
            const shouldMigrateFromState =
              !isNew &&
              (dbState.events.length > 0 ||
                dbState.categories.length > 0 ||
                dbState.workItems.length > 0 ||
                dbState.frequentStats.length > 0);
            if (shouldMigrateFromState) {
              await migrateStateToUserTables(legacyActive);
            }
          }
        }

        const state = await loadUserData(sessionUserId);
        if (cancelled) return;
        setEvents(state.events);
        setCategories(state.categories);
        setWorkItems(state.workItems);
        setFrequentStats(state.frequentStats);
        setIsHydrated(true);
        getUserDataCounts(sessionUserId).then(setServerCounts).catch(() => {});
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setSyncStatus('error');
        setSyncError(e instanceof Error ? e.message : String(e));
        setEvents([]);
        setCategories(DEFAULT_CATEGORIES);
        setWorkItems(DEFAULT_WORK_ITEMS);
        setFrequentStats([]);
        setIsHydrated(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sessionUserId]);

  useEffect(() => {
    if (!sessionUserId || !isHydrated) return;
    setSyncStatus('saving');
    setSyncError(null);
    const handle = window.setTimeout(() => {
      (async () => {
        try {
          await replaceUserData(sessionUserId, { events, categories, workItems, frequentStats });
          setSyncStatus('saved');
          setLastSyncedAt(Date.now());
          getUserDataCounts(sessionUserId).then(setServerCounts).catch(() => {});
        } catch (e) {
          console.error(e);
          setSyncStatus('error');
          setSyncError(e instanceof Error ? e.message : String(e));
        }
      })();
    }, 500);

    return () => window.clearTimeout(handle);
  }, [events, categories, workItems, frequentStats, sessionUserId, isHydrated]);

  const handleLogin = async (email: string, password: string, mode: 'signin' | 'signup', bypassEmailConfirmation: boolean) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const trimmedEmail = email.trim();
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
      if (!isValidEmail) {
        setAuthError('邮箱格式不合法，请输入真实邮箱（例如：test@example.com）。');
        return;
      }
      const supabase = requireSupabase();
      if (mode === 'signup') {
        if (bypassEmailConfirmation) {
          await devBypassSignup(trimmedEmail, password);
          const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
          if (error) throw error;
        } else {
          const { data, error } = await supabase.auth.signUp({ email: trimmedEmail, password });
          if (error) throw error;
          if (!data.session) {
            setAuthError('注册成功，请前往邮箱验证后再登录。');
          }
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
        if (error) throw error;
      }
    } catch (e) {
      const err = e as any;
      const status = typeof err?.status === 'number' ? (err.status as number) : null;
      const message = typeof err?.message === 'string' ? (err.message as string) : String(e);
      if (status === 429) {
        if (message.toLowerCase().includes('email rate limit')) {
          setAuthError('注册触发邮件发送限流（429：email rate limit exceeded）。请在 Supabase 控制台关闭“邮箱确认”，或配置自定义 SMTP；否则会一直被限流。');
        } else {
          setAuthError('请求被限流（429）。请稍后再试。');
        }
      } else if (message.includes('Email address') && message.includes('is invalid')) {
        setAuthError('邮箱格式不合法，请输入真实邮箱（例如：test@example.com）。');
      } else {
        setAuthError(message);
      }
    } finally {
      setAuthLoading(false);
    }
  };
  const handleLogout = () => {
    (async () => {
      try {
        const supabase = requireSupabase();
        await supabase.auth.signOut();
      } catch (e) {
        console.error(e);
      }
      setEvents([]);
      setCategories([]);
      setWorkItems([]);
      setFrequentStats([]);
      setIsHydrated(false);
    })();
  };

  const syncPools = (pool: PoolItem[], allNewNames: string[], selectedNames: string[]): PoolItem[] => {
    let newPool = [...pool];
    allNewNames.forEach(name => {
      if (!newPool.some(p => p.name === name)) newPool.push({ name, count: 0 });
    });
    selectedNames.forEach(name => {
      const index = newPool.findIndex(p => p.name === name);
      if (index > -1) newPool[index] = { ...newPool[index], count: newPool[index].count + 1 };
    });
    return newPool;
  };

  const handleAddEvent = (data: any) => {
    const { newHighlights = [], newPainPoints = [] } = data;
    if (data.itemId) {
      setWorkItems(prev => prev.map(item => item.id === data.itemId ? {
        ...item,
        highlightPool: syncPools(item.highlightPool, newHighlights, data.highlights),
        painPointPool: syncPools(item.painPointPool, newPainPoints, data.painPoints)
      } : item));
    } else {
      setCategories(prev => prev.map(cat => cat.id === data.categoryId ? {
        ...cat,
        highlightPool: syncPools(cat.highlightPool, newHighlights, data.highlights),
        painPointPool: syncPools(cat.painPointPool, newPainPoints, data.painPoints)
      } : cat));
    }

    const newEvent: EventEntry = {
      id: editingEvent?.id || crypto.randomUUID(),
      ...data,
      createdAt: editingEvent?.createdAt || Date.now()
    };

    if (editingEvent) setEvents(prev => prev.map(e => e.id === editingEvent.id ? newEvent : e));
    else setEvents(prev => [newEvent, ...prev]);

    // 保存上一次记录的时间信息到本地存储
    localStorage.setItem('zentime_last_event_time', JSON.stringify({
      endTime: data.endTime
    }));

    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return events.filter(e => 
      e.title.toLowerCase().includes(q) || 
      e.description.toLowerCase().includes(q) ||
      e.tags.some(t => t.name.toLowerCase().includes(q))
    ).sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));
  }, [events, searchQuery]);

  if (!sessionUserId) return <LoginView onLogin={handleLogin} error={authError} isLoading={authLoading} />;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#fdfaf6] overflow-hidden text-[#5a5a5a]">
      <Sidebar activeView={activeView} setActiveView={setActiveView} currentUser={sessionEmail ?? sessionUserId} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden pb-20 md:pb-0">
        <header className="px-4 md:px-8 pt-6 md:pt-8 pb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-[#fdfaf6] z-10 gap-4">
          <div className="flex justify-between items-center w-full sm:w-auto">
            <div className="flex items-center gap-3">
              {activeView === 'day-detail' && (
                <button onClick={() => setActiveView('calendar')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft className="w-5 h-5 text-gray-500" /></button>
              )}
              <h1 className="text-2xl md:text-3xl font-bold text-[#4a4a4a]">
                {activeView === 'timeline' && "时光轴"}
                {activeView === 'calendar' && "日历回顾"}
                {activeView === 'stats' && "数据统计"}
                {activeView === 'management' && "管理中心"}
                {activeView === 'day-detail' && `${selectedDate} 详情`}
              </h1>
            </div>
            <div className="flex gap-2 sm:hidden">
              <button onClick={() => setActiveView('management')} className="p-2 text-gray-400 hover:text-indigo-400 transition-colors">
                <FolderEdit className="w-6 h-6" />
              </button>
              <button onClick={() => { setEditingEvent(null); setIsFormOpen(true); }} className="bg-[#b5ead7] text-[#4a6b5d] p-2 rounded-full shadow-sm">
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="搜索时光..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"/>
            </div>
            <div className="hidden sm:flex items-center px-3 py-2 rounded-full text-xs font-semibold border bg-white shadow-sm">
              {syncStatus === 'saving' && <span className="text-gray-500">同步中…</span>}
              {syncStatus === 'saved' && (
                <span className="text-emerald-600">
                  已同步{lastSyncedAt ? `（${new Date(lastSyncedAt).toLocaleTimeString()}）` : ''}
                  {serverCounts ? ` · 云端：事件${serverCounts.events}` : ''}
                </span>
              )}
              {syncStatus === 'error' && (
                <span className="text-red-600">同步失败：{syncError ?? '未知错误'}</span>
              )}
              {syncStatus === 'idle' && <span className="text-gray-500">未同步</span>}
            </div>
            <button onClick={() => { setEditingEvent(null); setIsFormOpen(true); }} className="hidden sm:flex bg-[#b5ead7] hover:bg-[#a0dcc5] text-[#4a6b5d] px-4 py-2 rounded-full font-semibold shadow-sm items-center gap-2 transition-all active:scale-95"><Plus className="w-5 h-5" /> 快速记录</button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-12 custom-scrollbar">
          {activeView === 'timeline' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <NaturalLanguageInput onParsed={handleAddEvent} />
              <TimelineView events={filteredEvents} onEdit={(e) => {setEditingEvent(e); setIsFormOpen(true);}} onDelete={(id) => setEvents(events.filter(e => e.id !== id))} categories={categories} />
            </div>
          )}
          {activeView === 'calendar' && (
            <CalendarView 
              events={events} 
              onDateSelect={(date) => { setSelectedDate(date); setActiveView('day-detail'); }} 
              categories={categories} 
            />
          )}
          {activeView === 'day-detail' && (
            <DayDetailView 
              date={selectedDate} 
              events={events} 
              categories={categories} 
              onEditEvent={(e) => {setEditingEvent(e); setIsFormOpen(true);}} 
            />
          )}
          {activeView === 'stats' && (
            <StatsDashboard 
              events={events} 
              categories={categories} 
              frequentStats={frequentStats} 
              setFrequentStats={setFrequentStats}
              workItems={workItems}
            />
          )}
          {activeView === 'management' && (
            <ManagementView categories={categories} setCategories={setCategories} workItems={workItems} setWorkItems={setWorkItems} />
          )}
        </div>
      </main>

      {isFormOpen && (
        <EventForm onClose={() => setIsFormOpen(false)} onSubmit={handleAddEvent} editingEvent={editingEvent} categories={categories} workItems={workItems} onJumpToManage={() => { setIsFormOpen(false); setActiveView('management'); }} />
      )}
    </div>
  );
};

export default App;

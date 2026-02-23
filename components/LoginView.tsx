
import React, { useState } from 'react';
import { Sparkles, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

interface LoginViewProps {
  onLogin: (email: string, password: string, mode: 'signin' | 'signup', bypassEmailConfirmation: boolean) => void;
  error?: string | null;
  isLoading?: boolean;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, error, isLoading }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bypassEmailConfirmation, setBypassEmailConfirmation] = useState(false);
  const canBypass = !!(import.meta.env.VITE_DEV_BYPASS_KEY as string | undefined)?.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password) {
      onLogin(email.trim(), password, mode, bypassEmailConfirmation);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* 装饰性渐变背景 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ffb7b2] rounded-full blur-[120px] opacity-20 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#b5ead7] rounded-full blur-[120px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl p-8 md:p-12 rounded-[48px] shadow-2xl shadow-indigo-100/20 border border-white/50 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center mb-10">
          <div className="inline-flex p-4 bg-[#ffb7b2]/20 rounded-[28px] mb-6 animate-bounce" style={{ animationDuration: '3s' }}>
            <Sparkles className="w-10 h-10 text-[#ffb7b2]" />
          </div>
          <h1 className="text-3xl font-black text-[#4a4a4a] tracking-tight mb-3">禅定时光</h1>
          <p className="text-gray-400 text-sm font-medium leading-relaxed">
            记录此刻，治愈未来。<br />进入您的私人宁静空间。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-2 bg-white/60 p-1 rounded-3xl border border-white/50">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`flex-1 py-3 rounded-3xl text-xs font-black tracking-wide ${
                mode === 'signin' ? 'bg-[#fdf3e7] text-[#e67e22]' : 'text-gray-400'
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`flex-1 py-3 rounded-3xl text-xs font-black tracking-wide ${
                mode === 'signup' ? 'bg-[#fdf3e7] text-[#e67e22]' : 'text-gray-400'
              }`}
            >
              注册
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">邮箱</label>
            <div className="relative">
              <input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-6 py-5 bg-white border-2 border-transparent focus:border-indigo-100 rounded-3xl outline-none font-bold text-gray-600 placeholder-gray-300 shadow-sm transition-all text-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">密码</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-6 py-5 bg-white border-2 border-transparent focus:border-indigo-100 rounded-3xl outline-none font-bold text-gray-600 placeholder-gray-300 shadow-sm transition-all text-lg"
              />
            </div>
          </div>

          {mode === 'signup' && (
            <label className={`flex items-center gap-3 px-5 py-4 bg-white/50 border border-white/60 rounded-3xl text-xs font-bold ${canBypass ? 'text-gray-500' : 'text-gray-300'}`}>
              <input
                type="checkbox"
                checked={bypassEmailConfirmation}
                onChange={(e) => setBypassEmailConfirmation(e.target.checked)}
                disabled={!canBypass}
                className="w-4 h-4 accent-[#e67e22]"
              />
              跳过邮箱验证（仅开发）
            </label>
          )}

          {error && (
            <div className="px-5 py-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-3xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!email.trim() || !password || !!isLoading}
            className="w-full py-5 bg-gradient-to-r from-[#b5ead7] to-[#a0dcc5] text-[#4a6b5d] font-black rounded-3xl shadow-xl shadow-green-100/50 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
          >
            {mode === 'signin' ? '登录并继续' : '注册并继续'} <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-12 grid grid-cols-2 gap-4">
          <div className="p-4 bg-white/40 rounded-2xl flex flex-col items-center text-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-300" />
            <span className="text-[10px] font-bold text-gray-400">账号登录保护</span>
          </div>
          <div className="p-4 bg-white/40 rounded-2xl flex flex-col items-center text-center gap-2">
            <Heart className="w-5 h-5 text-pink-300" />
            <span className="text-[10px] font-bold text-gray-400">云端私有存储</span>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[9px] text-gray-300 font-medium">
          Powered by ZenTime Engine & Gemini 2.0
        </p>
      </div>
    </div>
  );
};

export default LoginView;

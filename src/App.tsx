import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Scan, 
  LayoutDashboard, 
  Settings, 
  Plus, 
  Search,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Moon,
  Sun,
  FileText,
  BrainCircuit,
  X,
  Download,
  Trash2,
  Save,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import Reader from './components/Reader';

type View = 'dashboard' | 'scanner' | 'reader';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const navigateToReader = (book: any) => {
    setSelectedBook(book);
    setCurrentView('reader');
  };

  return (
    <div className={cn(
      "min-h-screen flex flex-col lg:flex-row bg-[#F8F9FA] text-stone-900 transition-colors duration-500 font-sans",
      isDarkMode && "bg-[#0A0A0B] text-stone-100"
    )}>
      {/* Sidebar - Desktop Only */}
      <nav className={cn(
        "hidden lg:flex w-72 border-r border-stone-200/60 flex-col p-6 gap-8 transition-all duration-500 z-50 relative overflow-hidden",
        isDarkMode ? "border-stone-800/50 bg-[#0E0E10]/80 backdrop-blur-xl" : "bg-white/80 backdrop-blur-xl"
      )}>
        {/* Sidebar background decorative element */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
        
        <div className="flex items-center gap-4 px-2 relative z-10">
          <motion.div 
            whileHover={{ rotate: 10, scale: 1.1 }}
            className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-500/30"
          >
            <BookOpen size={26} strokeWidth={2.5} />
          </motion.div>
          <div className="hidden lg:block">
            <h1 className="text-xl font-black tracking-tighter uppercase">Scan<span className="text-emerald-500">Book</span></h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-[0.2em]">AI Powered</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2 relative z-10">
          <div className="mb-2 px-4 hidden lg:block">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] opacity-50">Main Menu</span>
          </div>
          
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Library" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')}
            isDarkMode={isDarkMode}
          />
          <SidebarItem 
            icon={<Scan size={20} />} 
            label="AI Scanner" 
            active={currentView === 'scanner'} 
            onClick={() => setCurrentView('scanner')}
            isDarkMode={isDarkMode}
            badge="New"
          />
          {selectedBook && (
            <SidebarItem 
              icon={<BookOpen size={20} />} 
              label="Reader" 
              active={currentView === 'reader'} 
              onClick={() => setCurrentView('reader')}
              isDarkMode={isDarkMode}
            />
          )}
          
          <div className="mt-8 mb-2 px-4 hidden lg:block">
            <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em] opacity-50">Intelligence</span>
          </div>
          
          <SidebarItem 
            icon={<BrainCircuit size={20} />} 
            label="AI Insights" 
            active={false} 
            onClick={() => {}}
            isDarkMode={isDarkMode}
          />
          <SidebarItem 
            icon={<FileText size={20} />} 
            label="Knowledge Base" 
            active={false} 
            onClick={() => {}}
            isDarkMode={isDarkMode}
          />
        </div>

        <div className="flex flex-col gap-2 mt-auto relative z-10">
          <div className="p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 hidden lg:block mb-6 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={14} className="text-emerald-500" />
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Pro Status</span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed font-medium">Gemini 3.1 Pro is analyzing your library in real-time.</p>
            </div>
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 blur-2xl rounded-full -mr-8 -mt-8 group-hover:bg-emerald-500/20 transition-colors" />
          </div>

          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={cn(
              "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group",
              isDarkMode ? "hover:bg-stone-800/50 text-stone-400 hover:text-stone-100" : "hover:bg-stone-100 text-stone-500 hover:text-stone-900"
            )}
          >
            <div className="transition-transform duration-500 group-hover:rotate-[360deg]">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </div>
            <span className="hidden lg:block font-bold text-sm tracking-tight">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <SidebarItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={false} 
            onClick={() => {}}
            isDarkMode={isDarkMode}
          />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative pb-20 lg:pb-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-stone-200/60 dark:border-stone-800/50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl z-40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <BookOpen size={18} strokeWidth={2.5} />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase">Scan<span className="text-emerald-500">Book</span></h1>
          </div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>

        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -mr-64 -mt-64 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none" />

        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar relative z-10"
            >
              <Dashboard onOpenBook={navigateToReader} onStartScan={() => setCurrentView('scanner')} />
            </motion.div>
          )}

          {currentView === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar relative z-10"
            >
              <Scanner onComplete={(book) => {
                setSelectedBook(book);
                setCurrentView('dashboard');
              }} />
            </motion.div>
          )}

          {currentView === 'reader' && selectedBook && (
            <motion.div
              key="reader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 overflow-hidden relative z-10"
            >
              <Reader book={selectedBook} onClose={() => setCurrentView('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Bottom Navigation */}
        <nav className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 h-20 border-t border-stone-200/60 dark:border-stone-800/50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl z-50 flex items-center justify-around px-4 pb-safe",
          isDarkMode && "border-stone-800/50"
        )}>
          <MobileNavItem 
            icon={<LayoutDashboard size={22} />} 
            label="Library" 
            active={currentView === 'dashboard'} 
            onClick={() => setCurrentView('dashboard')}
          />
          <div className="relative -top-6">
            <button 
              onClick={() => setCurrentView('scanner')}
              className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-4 border-white dark:border-stone-900"
            >
              <Plus size={32} strokeWidth={3} />
            </button>
          </div>
          <MobileNavItem 
            icon={<BookOpen size={22} />} 
            label="Reader" 
            active={currentView === 'reader'} 
            onClick={() => {
              if (selectedBook) setCurrentView('reader');
              else setCurrentView('dashboard');
            }}
            disabled={!selectedBook}
          />
        </nav>
      </main>
    </div>
  );
}

function MobileNavItem({ icon, label, active, onClick, disabled }: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1 transition-all duration-300",
        active ? "text-emerald-500" : "text-stone-400",
        disabled && "opacity-20"
      )}
    >
      <div className={cn("transition-transform duration-300", active && "scale-110")}>
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function SidebarItem({ icon, label, active, onClick, isDarkMode, badge }: { 
  icon: React.ReactNode, 
  label: string, 
  active: boolean, 
  onClick: () => void,
  isDarkMode: boolean,
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
        active 
          ? "bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30" 
          : cn("text-stone-500 hover:bg-stone-100 hover:text-stone-900", isDarkMode && "text-stone-400 hover:bg-stone-800/50 hover:text-stone-100")
      )}
    >
      <span className={cn("transition-transform duration-500 group-hover:scale-110 relative z-10", active && "scale-110")}>
        {icon}
      </span>
      <span className="hidden lg:block font-bold text-sm tracking-tight relative z-10">{label}</span>
      {badge && (
        <span className="hidden lg:block absolute right-4 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black rounded-md uppercase tracking-widest relative z-10">
          {badge}
        </span>
      )}
      {active && (
        <motion.div 
          layoutId="sidebar-active-glow"
          className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-transparent opacity-50"
        />
      )}
    </button>
  );
}

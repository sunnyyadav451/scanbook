import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Maximize2, 
  Minimize2, 
  BrainCircuit, 
  FileText, 
  MessageSquare,
  Search,
  Download,
  Settings,
  Highlighter,
  StickyNote,
  Loader2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { cn } from '../lib/utils';
import { summarizeText, explainParagraph, answerQuestion } from '../services/gemini';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

interface Note {
  id: string;
  book_id: string;
  page_number: number;
  content: string;
  highlight_data: string;
  created_at: string;
}

export default function Reader({ book, onClose }: { book: any, onClose: () => void }) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState<'notes' | 'ai'>('notes');
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageText, setPageText] = useState('');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPdf();
    fetchNotes();
  }, [book.id]);

  useEffect(() => {
    if (pdfDoc) {
      renderPage(pageNumber);
    }
  }, [pdfDoc, pageNumber, scale]);

  const loadPdf = async () => {
    try {
      const loadingTask = pdfjsLib.getDocument(book.file_path);
      const pdf = await loadingTask.promise;
      setPdfDoc(pdf);
      setNumPages(pdf.numPages);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/books/${book.id}/notes`);
      const data = await res.json();
      setNotes(data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const renderPage = async (num: number) => {
    if (!pdfDoc || !canvasRef.current) return;

    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    // Extract text for AI
    const textContent = await page.getTextContent();
    const text = textContent.items.map((item: any) => item.str).join(' ');
    setPageText(text);
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    const note = {
      id: crypto.randomUUID(),
      book_id: book.id,
      page_number: pageNumber,
      content: newNote,
      highlight_data: ''
    };

    try {
      await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note)
      });
      setNotes([...notes, { ...note, created_at: new Date().toISOString() }]);
      setNewNote('');
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleAiAction = async (action: 'summarize' | 'explain') => {
    setIsAiLoading(true);
    setSidebarView('ai');
    try {
      let response = '';
      if (action === 'summarize') {
        response = await summarizeText(pageText);
      } else {
        response = await explainParagraph(pageText);
      }
      setAiResponse(response);
    } catch (error) {
      setAiResponse('AI failed to process. Please try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-stone-100 dark:bg-stone-950">
      {/* Top Toolbar */}
      <header className="h-16 lg:h-20 border-b border-stone-200/60 dark:border-stone-800/50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 z-30 sticky top-0">
        <div className="flex items-center gap-3 lg:gap-5">
          <motion.button 
            whileHover={{ x: -3 }}
            onClick={onClose} 
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors"
          >
            <ChevronLeft size={20} lg:size={22} />
          </motion.button>
          <div className="hidden sm:block">
            <h2 className="font-bold text-sm lg:text-lg truncate max-w-[150px] lg:max-w-[300px] tracking-tight">{book.title}</h2>
            <div className="flex items-center gap-2">
              <span className="text-[8px] lg:text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Reading</span>
              <span className="w-1 h-1 bg-stone-300 dark:bg-stone-700 rounded-full" />
              <p className="text-[8px] lg:text-[10px] font-bold text-stone-400 uppercase tracking-widest">P. {pageNumber}/{numPages}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center bg-stone-100 dark:bg-stone-800/50 rounded-xl p-1 lg:p-1.5 shadow-inner">
            <button 
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber <= 1}
              className="p-1.5 lg:p-2 hover:bg-white dark:hover:bg-stone-700 rounded-lg disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={16} lg:size={18} />
            </button>
            <div className="px-2 lg:px-4 flex flex-col items-center min-w-[50px] lg:min-w-[80px]">
              <span className="text-xs lg:text-sm font-bold">{pageNumber}</span>
              <div className="w-full h-0.5 bg-stone-200 dark:bg-stone-700 rounded-full mt-0.5">
                <motion.div 
                  className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(pageNumber / numPages) * 100}%` }}
                />
              </div>
            </div>
            <button 
              onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
              disabled={pageNumber >= numPages}
              className="p-1.5 lg:p-2 hover:bg-white dark:hover:bg-stone-700 rounded-lg disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight size={16} lg:size={18} />
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-1 bg-stone-100 dark:bg-stone-800/50 rounded-xl p-1">
            <button onClick={() => setScale(Math.max(0.5, scale - 0.2))} className="p-2 hover:bg-white dark:hover:bg-stone-700 rounded-lg transition-all">
              <span className="text-xs font-bold">-</span>
            </button>
            <span className="text-[10px] font-bold w-12 text-center text-stone-500">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(Math.min(3, scale + 0.2))} className="p-2 hover:bg-white dark:hover:bg-stone-700 rounded-lg transition-all">
              <span className="text-xs font-bold">+</span>
            </button>
          </div>

          <div className="hidden sm:block h-8 w-px bg-stone-200 dark:bg-stone-800 mx-1" />

          <a 
            href={book.file_path} 
            download={`${book.title}.pdf`}
            className="hidden sm:flex p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors text-stone-600 dark:text-stone-400"
          >
            <Download size={20} />
          </a>

          <button onClick={toggleFullscreen} className="hidden sm:block p-2.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "p-2 lg:p-2.5 rounded-xl transition-all relative",
              isSidebarOpen ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "hover:bg-stone-100 dark:hover:bg-stone-800"
            )}
          >
            <BrainCircuit size={18} lg:size={20} />
            {isSidebarOpen && (
              <motion.div 
                layoutId="sidebar-dot"
                className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white dark:border-stone-900 rounded-full"
              />
            )}
          </button>
        </div>
      </header>

      {/* Main Reader Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Viewport */}
        <div className="flex-1 overflow-auto p-2 lg:p-8 flex justify-center bg-stone-200 dark:bg-stone-950 custom-scrollbar">
          <div className="shadow-2xl bg-white dark:bg-stone-900 h-fit rounded-sm">
            <canvas ref={canvasRef} className="max-w-full h-auto" />
          </div>
        </div>

        {/* Floating AI Quick Actions */}
        <div className="absolute left-4 bottom-4 lg:left-6 lg:bottom-6 flex flex-col gap-2 z-20">
          <QuickAction 
            icon={<Sparkles size={18} />} 
            label="Summarize Page" 
            onClick={() => handleAiAction('summarize')} 
            color="bg-emerald-600"
          />
          <QuickAction 
            icon={<BrainCircuit size={18} />} 
            label="Explain Concepts" 
            onClick={() => handleAiAction('explain')} 
            color="bg-blue-600"
          />
        </div>

        {/* Sidebar */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              {/* Mobile Overlay */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              />
              <motion.aside
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed lg:relative right-0 top-0 bottom-0 w-[85%] sm:w-80 md:w-[400px] border-l border-stone-200/60 dark:border-stone-800/50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl flex flex-col shadow-2xl z-50 lg:z-40"
              >
                <div className="flex lg:hidden items-center justify-between p-4 border-b border-stone-100 dark:border-stone-800">
                  <span className="text-xs font-black uppercase tracking-widest text-stone-400">Intelligence</span>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex border-b border-stone-200/60 dark:border-stone-800/50 p-2">
                <button 
                  onClick={() => setSidebarView('notes')}
                  className={cn(
                    "flex-1 py-3 text-[11px] font-bold flex items-center justify-center gap-2 rounded-xl transition-all uppercase tracking-widest",
                    sidebarView === 'notes' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  )}
                >
                  <StickyNote size={14} />
                  Notes
                </button>
                <button 
                  onClick={() => setSidebarView('ai')}
                  className={cn(
                    "flex-1 py-3 text-[11px] font-bold flex items-center justify-center gap-2 rounded-xl transition-all uppercase tracking-widest",
                    sidebarView === 'ai' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                  )}
                >
                  <BrainCircuit size={14} />
                  Gemini AI
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {sidebarView === 'notes' ? (
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="relative">
                        <textarea 
                          placeholder="Capture your thoughts..."
                          value={newNote}
                          onChange={(e) => setNewNote(e.target.value)}
                          className="w-full p-5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-[1.5rem] text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 min-h-[140px] resize-none transition-all"
                        />
                        <div className="absolute bottom-4 right-4 text-[10px] font-bold text-stone-400 uppercase">Page {pageNumber}</div>
                      </div>
                      <button 
                        onClick={handleAddNote}
                        className="w-full py-4 bg-stone-900 dark:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all shadow-xl hover:scale-[1.02] active:scale-98"
                      >
                        Save Note
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div className="flex items-center justify-between px-1">
                        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em]">Recent Notes</h4>
                        <span className="text-[10px] font-bold text-emerald-500">{notes.length} Total</span>
                      </div>
                      {notes.length > 0 ? (
                        notes.map((note) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={note.id} 
                            className="p-5 bg-white dark:bg-stone-800/30 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm space-y-3 group hover:border-emerald-500/30 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md uppercase tracking-wider">Page {note.page_number}</span>
                              <span className="text-[9px] font-bold text-stone-400 uppercase">{new Date(note.created_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">{note.content}</p>
                          </motion.div>
                        ))
                      ) : (
                        <div className="text-center py-16 text-stone-400 bg-stone-50/50 dark:bg-stone-800/20 rounded-[2rem] border border-dashed border-stone-200 dark:border-stone-800">
                          <StickyNote size={32} className="mx-auto mb-3 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-widest">No notes yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {isAiLoading ? (
                      <div className="flex flex-col items-center justify-center py-24 gap-6">
                        <div className="relative">
                          <Loader2 className="animate-spin text-emerald-500" size={48} strokeWidth={1.5} />
                          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-500/50" size={20} />
                        </div>
                        <div className="text-center space-y-1">
                          <p className="text-sm font-bold tracking-tight">Gemini is analyzing...</p>
                          <p className="text-[10px] text-stone-400 uppercase tracking-widest">Processing page content</p>
                        </div>
                      </div>
                    ) : aiResponse ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-6"
                      >
                        <div className="p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10 relative overflow-hidden">
                          <div className="flex items-center gap-3 mb-4 relative z-10">
                            <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                              <Sparkles size={16} />
                            </div>
                            <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">AI Insight</h4>
                          </div>
                          <div className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed whitespace-pre-wrap relative z-10 font-medium">
                            {aiResponse}
                          </div>
                          {/* Decorative background */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                        </div>
                        <button 
                          onClick={() => setAiResponse('')}
                          className="w-full py-3 text-stone-400 text-[10px] font-bold hover:text-stone-900 dark:hover:text-stone-100 uppercase tracking-[0.2em] transition-colors"
                        >
                          Clear Analysis
                        </button>
                      </motion.div>
                    ) : (
                      <div className="space-y-6">
                        <div className="p-8 bg-stone-50 dark:bg-stone-800/30 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 text-center space-y-5">
                          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto">
                            <BrainCircuit size={32} />
                          </div>
                          <div className="space-y-2">
                            <h4 className="font-bold text-lg tracking-tight">AI Assistant</h4>
                            <p className="text-xs text-stone-500 leading-relaxed">Unlock deep insights from your documents with Gemini 3.1 Pro.</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                          <AiToolButton 
                            icon={<Sparkles size={18} />} 
                            label="Summarize Page" 
                            onClick={() => handleAiAction('summarize')} 
                          />
                          <AiToolButton 
                            icon={<BrainCircuit size={18} />} 
                            label="Explain Concepts" 
                            onClick={() => handleAiAction('explain')} 
                          />
                        </div>

                        <div className="relative mt-10">
                          <div className="absolute -top-6 left-2">
                            <span className="text-[9px] font-bold text-stone-400 uppercase tracking-widest">Direct Query</span>
                          </div>
                          <input 
                            type="text" 
                            placeholder="Ask Gemini anything..."
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                setIsAiLoading(true);
                                try {
                                  const res = await answerQuestion(pageText, (e.target as HTMLInputElement).value);
                                  setAiResponse(res);
                                } catch (err) {
                                  setAiResponse('Failed to answer.');
                                } finally {
                                  setIsAiLoading(false);
                                }
                              }
                            }}
                            className="w-full p-5 pr-14 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-[1.5rem] text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium"
                          />
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500">
                            <MessageSquare size={20} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  </div>
);
}

function QuickAction({ icon, label, onClick, color }: { icon: React.ReactNode, label: string, onClick: () => void, color: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "group relative flex items-center justify-center w-12 h-12 rounded-full text-white shadow-lg transition-all hover:scale-110",
        color
      )}
    >
      {icon}
      <span className="absolute left-14 bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        {label}
      </span>
    </button>
  );
}

function AiToolButton({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 p-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/5 hover:border-emerald-200 dark:hover:border-emerald-500/20 transition-all group"
    >
      <div className="p-2 bg-stone-100 dark:bg-stone-800 text-stone-500 group-hover:text-emerald-600 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-500/20 rounded-lg transition-all">
        {icon}
      </div>
      <span className="text-sm font-bold text-stone-700 dark:text-stone-300 group-hover:text-emerald-900 dark:group-hover:text-emerald-400">{label}</span>
    </button>
  );
}

import React, { useState, useEffect } from 'react';
import { Plus, Search, Book, Clock, Star, MoreVertical, ExternalLink, ArrowRight, Sparkles, TrendingUp, Download } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface BookData {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  file_path: string;
  created_at: string;
}

export default function Dashboard({ onOpenBook, onStartScan }: { 
  onOpenBook: (book: BookData) => void,
  onStartScan: () => void 
}) {
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/books');
      const data = await res.json();
      setBooks(data);
    } catch (error) {
      console.error('Failed to fetch books:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 lg:space-y-12 pb-20 lg:pb-20">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 px-4 lg:px-0">
        <div className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-emerald-500 font-bold text-[10px] lg:text-sm uppercase tracking-[0.2em]"
          >
            <Sparkles size={14} />
            Welcome Back
          </motion.div>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight">Your Library</h2>
          <p className="text-sm lg:text-base text-stone-500 dark:text-stone-400 max-w-md">Access your digital knowledge base, enhanced by Gemini AI.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all w-full lg:w-80 shadow-sm"
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartScan}
            className="hidden lg:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3.5 rounded-2xl transition-all shadow-xl shadow-emerald-500/25 font-bold whitespace-nowrap"
          >
            <Plus size={20} strokeWidth={3} />
            New Scan
          </motion.button>
        </div>
      </header>

      {/* Featured / Stats Bento Grid */}
      <motion.section 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 px-4 lg:px-0"
      >
        <motion.div variants={item} className="sm:col-span-2 lg:col-span-2 p-6 lg:p-8 bg-emerald-500 rounded-[2rem] lg:rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl shadow-emerald-500/20">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-3xl font-bold leading-tight">You've read 4 books <br/> this month.</h3>
              <p className="text-emerald-50/80 font-medium">That's 20% more than last month. Keep it up!</p>
            </div>
            <button className="mt-8 flex items-center gap-2 font-bold text-sm bg-white text-emerald-600 px-6 py-3 rounded-xl w-fit hover:bg-emerald-50 transition-colors">
              View Analytics
              <ArrowRight size={16} />
            </button>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 blur-[60px] rounded-full -ml-24 -mb-24" />
        </motion.div>

        <motion.div variants={item} className="p-8 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between group hover:border-emerald-500/50 transition-colors">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
              <Clock size={24} />
            </div>
            <h4 className="text-stone-500 dark:text-stone-400 font-bold text-sm uppercase tracking-widest">Reading Time</h4>
            <div className="text-4xl font-bold">12.5 <span className="text-lg text-stone-400 font-medium">hrs</span></div>
          </div>
          <div className="text-xs font-bold text-emerald-500 flex items-center gap-1">
            +2.4h from last week
          </div>
        </motion.div>

        <motion.div variants={item} className="p-8 bg-white dark:bg-stone-900 rounded-[2.5rem] border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between group hover:border-emerald-500/50 transition-colors">
          <div className="space-y-4">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
              <Star size={24} />
            </div>
            <h4 className="text-stone-500 dark:text-stone-400 font-bold text-sm uppercase tracking-widest">AI Insights</h4>
            <div className="text-4xl font-bold">128 <span className="text-lg text-stone-400 font-medium">notes</span></div>
          </div>
          <div className="text-xs font-bold text-stone-400">
            Across 12 documents
          </div>
        </motion.div>
      </motion.section>

      {/* Library Grid */}
      <div className="space-y-6 px-4 lg:px-0">
        <div className="flex items-center justify-between">
          <h3 className="text-xl lg:text-2xl font-bold tracking-tight">Recent Documents</h3>
          <button className="text-xs lg:text-sm font-bold text-emerald-500 hover:text-emerald-600 transition-colors">View All</button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[3/4] bg-stone-200 dark:bg-stone-800 rounded-[1.5rem] lg:rounded-[2rem] animate-pulse" />
                <div className="h-4 w-2/3 bg-stone-200 dark:bg-stone-800 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : filteredBooks.length > 0 ? (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-8"
          >
            {filteredBooks.map((book) => (
              <motion.div
                key={book.id}
                variants={item}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
                onClick={() => onOpenBook(book)}
              >
                <div className="aspect-[3/4] relative rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden shadow-lg group-hover:shadow-2xl group-hover:shadow-emerald-500/10 transition-all duration-500 border border-stone-200 dark:border-stone-800">
                  <img 
                    src={book.cover_url || `https://picsum.photos/seed/${book.id}/400/600`} 
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-4 lg:p-6 gap-2">
                    <motion.button 
                      initial={{ y: 20, opacity: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenBook(book);
                      }}
                      className="w-full bg-white text-stone-900 py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm flex items-center justify-center gap-2 shadow-xl"
                    >
                      <ExternalLink size={14} />
                      Open Reader
                    </motion.button>
                    <motion.a
                      href={book.file_path}
                      download={`${book.title}.pdf`}
                      initial={{ y: 20, opacity: 0 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-emerald-500 text-white py-2.5 lg:py-3 rounded-xl font-bold text-xs lg:text-sm flex items-center justify-center gap-2 shadow-xl"
                    >
                      <Download size={14} />
                      Download PDF
                    </motion.a>
                  </div>
                </div>
                <div className="mt-4 space-y-1 px-1">
                  <h3 className="font-bold text-sm lg:text-lg truncate group-hover:text-emerald-500 transition-colors leading-tight">{book.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">{book.author}</span>
                    <span className="w-1 h-1 bg-stone-300 dark:bg-stone-700 rounded-full" />
                    <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">PDF</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 lg:py-24 text-center space-y-6 bg-white dark:bg-stone-900/50 rounded-[2rem] lg:rounded-[3rem] border-2 border-dashed border-stone-200 dark:border-stone-800"
          >
            <div className="w-16 h-16 lg:w-24 lg:h-24 bg-stone-100 dark:bg-stone-800 rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center text-stone-300 dark:text-stone-700">
              <Book size={32} lg:size={48} />
            </div>
            <div className="space-y-2 px-6">
              <h3 className="text-xl lg:text-2xl font-bold">Your library is empty</h3>
              <p className="text-xs lg:text-sm text-stone-500 dark:text-stone-400 max-w-sm mx-auto">Start building your digital knowledge base by scanning your first document.</p>
            </div>
            <button 
              onClick={onStartScan}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 lg:px-8 py-3 lg:py-4 rounded-2xl font-bold shadow-xl shadow-emerald-500/20 transition-all text-sm"
            >
              Start Scanning Now
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

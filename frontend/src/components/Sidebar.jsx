import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FileText, LogOut, Moon, Sun, 
  Trash2, Plus, Menu, ChevronLeft 
} from 'lucide-react';
import clsx from 'clsx';

export default function Sidebar({ pdfs, activePdf, setActivePdf, handleDeletePdf, isOpen, setIsOpen }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile toggle */}
      <button 
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col flex-shrink-0 z-40 absolute md:relative"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-tr from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg hidden md:block">Smart PDF</span>
              </div>
              <button onClick={() => setIsOpen(false)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <button 
                onClick={() => setActivePdf(null)}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-xl transition-colors font-medium border border-primary-200 dark:border-primary-800/30"
              >
                <Plus className="w-5 h-5" />
                <span>Upload New PDF</span>
              </button>

              <button 
                onClick={() => setActivePdf({ id: "all", filename: "Global Search", total_pages: "All" })}
                className={clsx(
                  "w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl transition-colors font-medium border",
                  activePdf?.id === "all" 
                    ? "bg-purple-500 text-white border-purple-600 shadow-md shadow-purple-500/20" 
                    : "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-800/30"
                )}
              >
                <FileText className="w-5 h-5" />
                <span>Search All PDFs</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Your PDFs</h3>
              
              {pdfs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm px-4">
                  No PDFs uploaded yet. Upload one to get started.
                </div>
              ) : (
                pdfs.map(pdf => (
                  <div 
                    key={pdf.id}
                    className={clsx(
                      "group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all",
                      activePdf?.id === pdf.id 
                        ? "bg-primary-500 text-white shadow-md shadow-primary-500/20" 
                        : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    )}
                    onClick={() => setActivePdf(pdf)}
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <FileText className={clsx("w-5 h-5 flex-shrink-0", activePdf?.id === pdf.id ? "text-primary-100" : "text-slate-400")} />
                      <div className="truncate text-sm font-medium">
                        {pdf.filename}
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePdf(pdf.id); }}
                      className={clsx(
                        "opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all",
                        activePdf?.id === pdf.id ? "hover:bg-primary-600 text-primary-100" : "hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500"
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center font-bold text-sm">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm font-medium truncate w-24">
                    {user?.username}
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500">
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  </button>
                  <button onClick={logout} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-500 transition-colors">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}

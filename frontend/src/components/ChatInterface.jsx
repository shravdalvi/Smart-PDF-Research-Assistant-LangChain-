/**
 * ChatInterface — ChatGPT-style conversation panel.
 *
 * Features:
 *  - Ask questions about the active PDF (or all PDFs in global-search mode)
 *  - Display AI answers with source pages and expandable source text
 *  - Generate document summary, interview questions, and quiz via toolbar
 *  - Export chat history as a .txt download
 *  - Animated loading state while waiting for the LLM
 *  - Mobile-responsive layout
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Send, User, Bot, FileText, Calendar, Layers,
  Info, Loader2, Download, BookOpen, MessageSquare,
  HelpCircle, ChevronDown, ChevronUp, Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import clsx from 'clsx';

const API = 'http://localhost:8000';

export default function ChatInterface({ activePdf }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [expandedParagraph, setExpandedParagraph] = useState({});
  const messagesEndRef = useRef(null);

  /** True when the user selected the "Search All PDFs" virtual document. */
  const isGlobalMode = activePdf?.id === 'all';

  // Reset chat and load history whenever the active PDF changes
  useEffect(() => {
    setMessages([]);
    setExpandedParagraph({});
    if (activePdf?.id) {
      fetchHistory();
    }
  }, [activePdf?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Data fetching ───────────────────────────────────────────────────────────

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API}/api/chat/history/${activePdf.id}`);
      const history = [];
      res.data.forEach(chat => {
        history.push({ role: 'user', content: chat.question });
        history.push({
          role: 'assistant',
          content: chat.answer,
          sourcePages: chat.source_pages,
          sourceParagraphs: chat.source_paragraphs,
        });
      });
      setMessages(history);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    }
  };

  // ── Message sending ─────────────────────────────────────────────────────────

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      // When in global mode, send null so the backend searches all PDFs
      const pdfId = isGlobalMode ? null : activePdf.id;

      const res = await axios.post(`${API}/api/chat/ask`, {
        question: userMessage,
        pdf_id: pdfId,
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data.answer,
        sourcePages: res.data.source_pages,
        sourceParagraphs: res.data.source_paragraphs,
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        isError: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── AI generation helpers ───────────────────────────────────────────────────

  /**
   * Call a generation endpoint and add the result as an assistant message.
   * @param {string} endpoint  - URL segment, e.g. "summary", "interview-questions"
   * @param {string} label     - Human-readable label for the user bubble
   * @param {string} dataKey   - Key in the response object that holds the text
   */
  const handleGenerate = async (endpoint, label, dataKey) => {
    if (!activePdf?.id || isGlobalMode) return;
    setIsTyping(true);
    setMessages(prev => [...prev, { role: 'user', content: `Generate ${label}` }]);

    try {
      const res = await axios.get(`${API}/api/pdf/${activePdf.id}/${endpoint}`);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.data[dataKey] ?? 'No content returned.',
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Failed to generate ${label}.`,
        isError: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Export ──────────────────────────────────────────────────────────────────

  const handleExport = async () => {
    if (!activePdf?.id) return;
    try {
      const res = await axios.get(`${API}/api/chat/export/${activePdf.id}`);
      const blob = new Blob([res.data.export_text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_${activePdf.filename ?? activePdf.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // ── Paragraph expand toggle ─────────────────────────────────────────────────

  const toggleParagraph = (idx) =>
    setExpandedParagraph(prev => ({ ...prev, [idx]: !prev[idx] }));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col h-full relative bg-slate-50 dark:bg-slate-900/50">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="px-4 md:px-6 py-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3 min-w-0 md:pl-0 pl-12">
          <div className={clsx(
            "p-2 rounded-lg flex-shrink-0",
            isGlobalMode
              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
              : "bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
          )}>
            {isGlobalMode ? <Globe className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
          </div>
          <div className="min-w-0">
            <h2 className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px] md:max-w-sm">
              {activePdf.filename}
            </h2>
            <p className="text-xs text-slate-500 flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {isGlobalMode ? 'Searching all documents' : `${activePdf.total_pages} pages`}
            </p>
          </div>
        </div>

        {/* Toolbar — only visible for single-PDF mode */}
        <div className="flex items-center gap-1 md:gap-2">
          {!isGlobalMode && (
            <>
              <button
                onClick={() => handleGenerate('summary', 'Summary', 'summary')}
                className="hidden md:flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                title="Generate Summary"
              >
                <BookOpen className="w-4 h-4" /> Summary
              </button>
              <button
                onClick={() => handleGenerate('interview-questions', 'Interview Questions', 'questions')}
                className="hidden md:flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                title="Generate Interview Questions"
              >
                <MessageSquare className="w-4 h-4" /> Interview Qs
              </button>
              <button
                onClick={() => handleGenerate('quiz-questions', 'Quiz Questions', 'quiz')}
                className="hidden md:flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-slate-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Generate Quiz"
              >
                <HelpCircle className="w-4 h-4" /> Quiz
              </button>
              <button
                onClick={handleExport}
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Export Chat History"
              >
                <Download className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />
            </>
          )}

          <button
            onClick={() => setShowInfo(!showInfo)}
            className={clsx(
              'p-2 rounded-full transition-colors',
              showInfo
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'
            )}
            title="Document Info"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── Info Dropdown ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-[73px] right-4 md:right-6 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-30 p-4"
          >
            <h3 className="font-semibold text-xs uppercase tracking-wider text-slate-400 mb-3">
              Document Info
            </h3>
            <div className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span className="break-all">{activePdf.filename}</span>
              </div>
              {!isGlobalMode && (
                <>
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{activePdf.total_pages} pages</span>
                  </div>
                  {activePdf.upload_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span>Uploaded {new Date(activePdf.upload_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Messages ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-60 select-none">
            <div className={clsx(
              'w-16 h-16 rounded-2xl flex items-center justify-center mb-6',
              isGlobalMode
                ? 'bg-purple-100 dark:bg-purple-900/30'
                : 'bg-primary-100 dark:bg-primary-900/30'
            )}>
              {isGlobalMode
                ? <Globe className="w-8 h-8 text-purple-500" />
                : <Bot className="w-8 h-8 text-primary-500" />
              }
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isGlobalMode ? 'Global PDF Search' : "Hello! I'm your PDF Assistant"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {isGlobalMode
                ? "Ask anything — I'll search across all your uploaded documents."
                : `I've analysed "${activePdf.filename}". Ask me anything about it!`
              }
            </p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              'flex max-w-3xl mx-auto gap-3',
              msg.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            {/* Avatar */}
            <div className={clsx(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1',
              msg.role === 'user'
                ? 'bg-slate-200 dark:bg-slate-700'
                : 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
            )}>
              {msg.role === 'user'
                ? <User className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                : <Bot className="w-4 h-4" />
              }
            </div>

            {/* Content column */}
            <div className={clsx(
              'flex-1 flex flex-col gap-2',
              msg.role === 'user' ? 'items-end' : 'items-start'
            )}>
              {/* Bubble */}
              <div className={clsx(
                'px-4 py-3 rounded-2xl max-w-[85%] prose prose-sm dark:prose-invert leading-relaxed',
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-tr-sm prose-p:text-white'
                  : msg.isError
                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                    : 'bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-sm'
              )}>
                {msg.role === 'user'
                  ? <p className="m-0">{msg.content}</p>
                  : <ReactMarkdown>{msg.content}</ReactMarkdown>
                }
              </div>

              {/* Source pages badge */}
              {msg.sourcePages?.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  <FileText className="w-3 h-3" />
                  Source pages: {msg.sourcePages.sort((a, b) => a - b).join(', ')}
                </div>
              )}

              {/* Expandable source paragraphs */}
              {msg.sourceParagraphs?.length > 0 && (
                <div className="w-full max-w-[85%]">
                  <button
                    onClick={() => toggleParagraph(idx)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary-500 transition-colors"
                  >
                    {expandedParagraph[idx]
                      ? <><ChevronUp className="w-3 h-3" /> Hide source text</>
                      : <><ChevronDown className="w-3 h-3" /> View source text</>
                    }
                  </button>

                  <AnimatePresence>
                    {expandedParagraph[idx] && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-1.5"
                      >
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-600 dark:text-slate-400 max-h-48 overflow-y-auto space-y-3">
                          {msg.sourceParagraphs.map((p, i) => (
                            <div key={i} className="pb-2 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
                              <span className="font-semibold text-primary-500 mr-1">
                                Extract {i + 1}:
                              </span>
                              {p}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex max-w-3xl mx-auto gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-primary-500/20">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
              <span className="text-sm text-slate-500">Generating response…</span>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* ── Input Area ───────────────────────────────────────────────────── */}
      <div className="p-3 md:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto relative flex items-end rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder={
              isGlobalMode
                ? 'Search across all your PDFs…'
                : 'Ask a question about this PDF…'
            }
            rows={1}
            className="w-full min-h-[52px] max-h-32 py-3.5 pl-4 pr-14 bg-transparent border-none focus:ring-0 resize-none outline-none text-slate-900 dark:text-white placeholder-slate-400 text-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 bottom-2 p-2.5 bg-primary-600 hover:bg-primary-500 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl transition-colors"
            title="Send message (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-[10px] text-slate-400 mt-2">
          Smart PDF Assistant may make mistakes. Verify important information independently.
        </p>
      </div>
    </div>
  );
}

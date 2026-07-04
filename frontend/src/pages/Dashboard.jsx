/**
 * Dashboard — root authenticated view.
 *
 * Owns the list of PDFs and the active-PDF state.
 * Renders either the PdfUploader (no PDF selected) or ChatInterface.
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import ChatInterface from '../components/ChatInterface';
import PdfUploader from '../components/PdfUploader';

const API = 'http://localhost:8000';

export default function Dashboard() {
  const [pdfs, setPdfs] = useState([]);
  const [activePdf, setActivePdf] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch user's PDF list on mount
  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const res = await axios.get(`${API}/api/pdf`);
      setPdfs(res.data);
    } catch (err) {
      console.error('Failed to fetch PDFs:', err);
    }
  };

  const handleUploadSuccess = (newPdf) => {
    setPdfs(prev => [...prev, newPdf]);
    setActivePdf(newPdf);
  };

  const handleDeletePdf = async (pdfId) => {
    try {
      await axios.delete(`${API}/api/pdf/${pdfId}`);
      setPdfs(prev => prev.filter(p => p.id !== pdfId));
      if (activePdf?.id === pdfId) setActivePdf(null);
    } catch (err) {
      console.error('Failed to delete PDF:', err);
    }
  };

  /**
   * True when an actual content view should be shown.
   * activePdf can be:
   *   null                    → show uploader
   *   { id: 'all', ... }     → global search chat
   *   { id: <mongoId>, ... } → single-PDF chat
   */
  const showChat = activePdf !== null;

  return (
    <div className="flex h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-200">
      <Sidebar
        pdfs={pdfs}
        activePdf={activePdf}
        setActivePdf={setActivePdf}
        handleDeletePdf={handleDeletePdf}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {showChat ? (
          <ChatInterface activePdf={activePdf} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 md:p-10 overflow-y-auto">
            <PdfUploader onUploadSuccess={handleUploadSuccess} />
          </div>
        )}
      </main>
    </div>
  );
}

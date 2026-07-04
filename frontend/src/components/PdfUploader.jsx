import { useState, useCallback } from 'react';
import axios from 'axios';
import { UploadCloud, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PdfUploader({ onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        handleUpload(droppedFile);
      } else {
        setStatus('error');
        setErrorMessage('Only PDF files are supported.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        handleUpload(selectedFile);
      } else {
        setStatus('error');
        setErrorMessage('Only PDF files are supported.');
      }
    }
  };

  const handleUpload = async (selectedFile) => {
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await axios.post('http://localhost:8000/api/pdf/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setStatus('success');
      setTimeout(() => {
        onUploadSuccess(res.data);
      }, 1500);
      
    } catch (error) {
      setStatus('error');
      setErrorMessage(error.response?.data?.detail || 'Failed to upload PDF. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary-500 to-purple-500">
          Upload a Document
        </h2>
        <p className="text-slate-500 dark:text-slate-400">
          Upload a PDF to start asking questions and analyzing its content.
        </p>
      </div>

      <div 
        className={`relative overflow-hidden border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 ease-in-out ${
          isDragging 
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange} 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={status === 'uploading' || status === 'success'}
        />

        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center pointer-events-none"
            >
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <UploadCloud className="w-10 h-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Drag & Drop your PDF here</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">or click to browse from your computer</p>
              
              <div className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-medium shadow-lg hover:scale-105 transition-transform">
                Select File
              </div>
            </motion.div>
          )}

          {status === 'uploading' && (
            <motion.div 
              key="uploading"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center pointer-events-none py-8"
            >
              <div className="relative mb-6">
                <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <File className="w-6 h-6 text-primary-500" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyzing Document...</h3>
              <p className="text-slate-500 dark:text-slate-400">Extracting text and generating embeddings</p>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center pointer-events-none py-8"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-green-600 dark:text-green-400">Upload Complete!</h3>
              <p className="text-slate-500 dark:text-slate-400">Redirecting to chat...</p>
            </motion.div>
          )}

          {status === 'error' && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center py-4"
            >
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-red-600 dark:text-red-400">Upload Failed</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">{errorMessage}</p>
              
              <button 
                onClick={() => setStatus('idle')}
                className="px-6 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full font-medium transition-colors z-20"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

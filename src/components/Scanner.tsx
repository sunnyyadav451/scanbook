import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Camera, X, Check, Loader2, FileUp, Wand2, ArrowRight, Plus, Image as ImageIcon, Sparkles, FileText, RefreshCw, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { extractTextFromImage } from '../services/gemini';

import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export default function Scanner({ onComplete }: { onComplete: (book: any) => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isPdfUpload, setIsPdfUpload] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [step, setStep] = useState<'upload' | 'review' | 'metadata'>('upload');
  const [metadata, setMetadata] = useState({ title: '', author: '' });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(err => console.error("Error playing video:", err));
    }
  }, [isCameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      streamRef.current = stream;
      setIsCameraActive(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureImage = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      // Limit resolution for performance
      const maxWidth = 1600;
      const scale = Math.min(1, maxWidth / videoRef.current.videoWidth);
      canvas.width = videoRef.current.videoWidth * scale;
      canvas.height = videoRef.current.videoHeight * scale;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8); // 0.8 quality for compression
        
        // Convert dataUrl to File object
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], `scan-${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFiles(prev => [...prev, file]);
            setPreviews(prev => [...prev, dataUrl]);
            // Stay in camera mode for more scans
          });
      }
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const pdfs = acceptedFiles.filter(f => f.type === 'application/pdf');
    if (pdfs.length > 0) {
      setIsPdfUpload(true);
      const file = pdfs[0];
      setPdfFile(file);
      setMetadata(prev => ({ ...prev, title: file.name.replace('.pdf', '') }));
      
      // Generate cover from PDF
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        if (context) {
          await page.render({ canvasContext: context, viewport } as any).promise;
          setPreviews([canvas.toDataURL()]);
        }
      } catch (err) {
        console.error("Error generating PDF cover:", err);
        setPreviews(['https://picsum.photos/seed/pdf/400/600']);
      }
      setStep('metadata');
    } else {
      setIsPdfUpload(false);
      setFiles(prev => [...prev, ...acceptedFiles]);
      const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
      setStep('review');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/*': [],
      'application/pdf': ['.pdf']
    },
    multiple: true
  } as any);

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
    if (files.length <= 1) setStep('upload');
  };

  const generatePdf = async () => {
    const pdf = new jsPDF();
    
    for (let i = 0; i < files.length; i++) {
      if (i > 0) pdf.addPage();
      
      const imgData = previews[i];
      const img = new Image();
      img.src = imgData;
      
      await new Promise((resolve) => {
        img.onload = () => {
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();
          
          const canvas = document.createElement('canvas');
          const maxDimension = 1200;
          let width = img.width;
          let height = img.height;
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height *= maxDimension / width;
              width = maxDimension;
            } else {
              width *= maxDimension / height;
              height = maxDimension;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
            
            const ratio = Math.min(pageWidth / width, pageHeight / height);
            pdf.addImage(compressedDataUrl, 'JPEG', 0, 0, width * ratio, height * ratio, undefined, 'FAST');
          }
          resolve(null);
        };
      });
    }
    return pdf;
  };

  const handleQuickDownload = async () => {
    setIsDownloading(true);
    try {
      const pdf = await generatePdf();
      pdf.save(`scan-${Date.now()}.pdf`);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      let pdfUrl = '';
      if (isPdfUpload && pdfFile) {
        pdfUrl = URL.createObjectURL(pdfFile);
      } else {
        const pdf = await generatePdf();
        const pdfBlob = pdf.output('blob');
        pdfUrl = URL.createObjectURL(pdfBlob);
      }
      
      const bookId = crypto.randomUUID();
      const newBook = {
        id: bookId,
        title: metadata.title || 'Untitled Scan',
        author: metadata.author || 'Unknown',
        cover_url: previews[0],
        file_path: pdfUrl,
        created_at: new Date().toISOString()
      };

      await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook)
      });

      onComplete(newBook);
    } catch (error) {
      console.error('Failed to process scan:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 lg:space-y-10 pb-20 lg:pb-20">
      <header className="text-center space-y-3 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[9px] lg:text-[10px] font-bold uppercase tracking-widest"
        >
          <Sparkles size={12} />
          AI-Powered Scanning
        </motion.div>
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">Digitalize Your World</h2>
        <p className="text-sm lg:text-base text-stone-500 dark:text-stone-400 max-w-lg mx-auto leading-relaxed">Convert physical books, notes, and documents into searchable, AI-enhanced digital assets.</p>
      </header>

      <div className="bg-white dark:bg-stone-900/50 rounded-[2rem] lg:rounded-[3rem] border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden relative mx-4 lg:mx-0">
        {/* Step Progress */}
        <div className="flex border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
          <StepIndicator active={step === 'upload'} completed={step !== 'upload'} label="Upload" icon={<Upload size={16} />} />
          <StepIndicator active={step === 'review'} completed={step === 'metadata'} label="Review" icon={<ImageIcon size={16} />} />
          <StepIndicator active={step === 'metadata'} completed={false} label="Finalize" icon={<FileText size={16} />} />
        </div>

        <div className="p-6 lg:p-16">
          <AnimatePresence mode="wait">
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 lg:space-y-8"
              >
                {isCameraActive ? (
                  <div className="relative rounded-[1.5rem] lg:rounded-[2.5rem] overflow-hidden bg-black aspect-[3/4] lg:aspect-video flex items-center justify-center border-4 border-emerald-500/20 shadow-2xl">
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-6 lg:bottom-8 left-0 right-0 flex justify-center items-center gap-3 lg:gap-6 px-4">
                      <button 
                        onClick={stopCamera}
                        className="p-3 lg:p-4 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all"
                        title="Close Camera"
                      >
                        <X size={20} lg:size={24} />
                      </button>

                      <div {...getRootProps()} className="flex">
                        <input {...getInputProps()} />
                        <button 
                          className="p-3 lg:p-4 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all"
                          title="Add from Gallery"
                        >
                          <ImageIcon size={20} lg:size={24} />
                        </button>
                      </div>

                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={captureImage}
                        className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 border-4 border-white"
                      >
                        <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full border-2 border-white/50" />
                      </motion.button>
                      
                      {files.length > 0 ? (
                        <button 
                          onClick={() => {
                            setStep('review');
                            stopCamera();
                          }}
                          className="p-3 lg:p-4 bg-emerald-500 text-white rounded-full shadow-xl flex items-center justify-center"
                          title="Finish Scanning"
                        >
                          <Check size={20} lg:size={24} strokeWidth={3} />
                        </button>
                      ) : (
                        <div className="w-10 lg:w-14" />
                      )}
                    </div>
                    
                    {previews.length > 0 && (
                      <div className="absolute top-4 right-4 lg:top-6 lg:right-6">
                        <div className="relative">
                          <img 
                            src={previews[previews.length - 1]} 
                            className="w-12 h-16 lg:w-16 lg:h-20 object-cover rounded-lg border-2 border-white shadow-xl"
                            alt="Last scan"
                          />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                            {previews.length}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="absolute top-4 left-4 lg:top-6 lg:left-6 px-3 py-1.5 lg:px-4 lg:py-2 bg-emerald-500 text-white text-[9px] lg:text-[10px] font-bold rounded-full uppercase tracking-widest animate-pulse">
                      Live Scanner
                    </div>
                  </div>
                ) : (
                  <div 
                    {...getRootProps()} 
                    className={cn(
                      "border-2 border-dashed rounded-[1.5rem] lg:rounded-[2.5rem] p-8 lg:p-16 text-center transition-all cursor-pointer flex flex-col items-center gap-4 lg:gap-6 group relative overflow-hidden",
                      isDragActive ? "border-emerald-500 bg-emerald-500/5" : "border-stone-200 dark:border-stone-800 hover:border-emerald-500/50 hover:bg-stone-50 dark:hover:bg-stone-800/30"
                    )}
                  >
                    <input {...getInputProps()} />
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-16 h-16 lg:w-20 lg:h-20 bg-emerald-500 text-white rounded-[1.5rem] lg:rounded-[2rem] flex items-center justify-center shadow-2xl shadow-emerald-500/20"
                    >
                      <FileUp size={28} lg:size={36} strokeWidth={2.5} />
                    </motion.div>
                    <div className="space-y-1 lg:space-y-2">
                      <p className="text-xl lg:text-2xl font-bold tracking-tight">Drop your images</p>
                      <p className="text-xs lg:text-sm text-stone-500 dark:text-stone-400 font-medium px-4">JPG, PNG or WEBP supported.</p>
                    </div>
                    <button className="mt-2 px-6 py-2.5 bg-stone-900 dark:bg-white text-white dark:text-stone-900 rounded-xl font-bold text-xs shadow-xl">
                      Browse Files
                    </button>
                    
                    {/* Decorative background for dropzone */}
                    <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                )}

                {cameraError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold text-center">
                    {cameraError}
                  </div>
                )}

                {!isCameraActive && (
                  <>
                    <div className="flex items-center justify-center gap-4 lg:gap-6">
                      <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
                      <span className="text-[9px] lg:text-[10px] font-bold text-stone-400 uppercase tracking-[0.3em]">or use camera</span>
                      <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800" />
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={startCamera}
                      className="w-full py-4 lg:py-5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-emerald-500/50 rounded-[1.5rem] lg:rounded-[2rem] font-bold flex items-center justify-center gap-3 transition-all shadow-sm text-sm"
                    >
                      <Camera size={20} lg:size={24} className="text-emerald-500" />
                      Launch Scanner Camera
                    </motion.button>
                  </>
                )}
              </motion.div>
            )}

            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 lg:space-y-8"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                  {previews.map((preview, i) => (
                    <motion.div 
                      key={i} 
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group aspect-[3/4] rounded-2xl lg:rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-md"
                    >
                      <img src={preview} alt={`Page ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          onClick={() => removeFile(i)}
                          className="p-2.5 lg:p-3 bg-red-500 text-white rounded-xl lg:rounded-2xl shadow-xl hover:scale-110 transition-transform"
                        >
                          <X size={18} lg:size={20} />
                        </button>
                      </div>
                      <div className="absolute bottom-3 left-3 lg:bottom-4 lg:left-4 px-2 py-0.5 lg:px-3 lg:py-1 bg-white/90 dark:bg-stone-900/90 text-stone-900 dark:text-white text-[9px] lg:text-[10px] font-bold rounded-lg backdrop-blur-md shadow-lg">
                        PAGE {i + 1}
                      </div>
                    </motion.div>
                  ))}
                  <motion.div 
                    {...getRootProps()}
                    whileHover={{ scale: 1.02 }}
                    className="aspect-[3/4] border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl lg:rounded-3xl flex flex-col items-center justify-center gap-2 lg:gap-3 text-stone-400 hover:border-emerald-500 hover:text-emerald-500 cursor-pointer transition-all bg-stone-50/50 dark:bg-stone-800/30"
                  >
                    <input {...getInputProps()} />
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                      <Plus size={20} lg:size={24} />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Add Page</span>
                  </motion.div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 lg:pt-8 border-t border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <button 
                      onClick={() => setStep('upload')}
                      className="text-stone-500 font-bold hover:text-stone-900 dark:hover:text-stone-100 transition-colors text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleQuickDownload}
                      disabled={isDownloading}
                      className="flex-1 sm:flex-none border-2 border-emerald-500/20 text-emerald-600 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white px-6 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                      Quick Download
                    </button>
                  </div>
                  <button 
                    onClick={() => setStep('metadata')}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 lg:px-10 py-3.5 lg:py-4 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/25 transition-all text-sm"
                  >
                    Continue to Details
                    <ArrowRight size={18} lg:size={20} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'metadata' && (
              <motion.div
                key="metadata"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 lg:space-y-10"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                  <div className="space-y-5 lg:space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] lg:text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-2">Document Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Biology Lecture Notes"
                        value={metadata.title}
                        onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                        className="w-full p-4 lg:p-5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-[1.25rem] lg:rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm lg:text-base"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] lg:text-[10px] font-bold text-stone-400 uppercase tracking-[0.2em] ml-2">Author / Category</label>
                      <input 
                        type="text" 
                        placeholder="e.g. University of Science"
                        value={metadata.author}
                        onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                        className="w-full p-4 lg:p-5 bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-[1.25rem] lg:rounded-[1.5rem] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-sm lg:text-base"
                      />
                    </div>
                  </div>

                  <div className="p-6 lg:p-8 bg-emerald-500/5 rounded-[1.5rem] lg:rounded-[2.5rem] border border-emerald-500/10 flex flex-col justify-center gap-4 lg:gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 lg:w-12 lg:h-12 bg-emerald-500 text-white rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Wand2 size={20} lg:size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-base lg:text-lg">AI Enhancement</h4>
                        <p className="text-[10px] lg:text-xs text-stone-500 leading-relaxed">Gemini will automatically optimize your document for readability and search.</p>
                      </div>
                    </div>
                    <ul className="space-y-2 lg:space-y-3">
                      <AiFeatureItem label="Auto-OCR Text Extraction" />
                      <AiFeatureItem label="Shadow & Noise Removal" />
                      <AiFeatureItem label="Perspective Correction" />
                    </ul>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 lg:pt-8 border-t border-stone-200 dark:border-stone-800">
                  <div className="flex items-center gap-6 w-full sm:w-auto">
                    <button 
                      onClick={() => setStep('review')}
                      className="text-stone-500 font-bold hover:text-stone-900 dark:hover:text-stone-100 transition-colors text-sm"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleQuickDownload}
                      disabled={isDownloading}
                      className="flex-1 sm:flex-none border-2 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-emerald-500 hover:text-emerald-500 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all text-sm"
                    >
                      {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                      Download Only
                    </button>
                  </div>
                  <button 
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 dark:disabled:bg-stone-800 text-white px-10 lg:px-12 py-4 lg:py-5 rounded-[1.5rem] lg:rounded-[2rem] font-bold flex items-center justify-center gap-3 shadow-2xl shadow-emerald-500/30 transition-all text-sm"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={18} lg:size={20} />
                        Digitalizing...
                      </>
                    ) : (
                      <>
                        <Check size={18} lg:size={20} strokeWidth={3} />
                        Generate Smart PDF
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ active, completed, label, icon }: { active: boolean, completed: boolean, label: string, icon: React.ReactNode }) {
  return (
    <div className={cn(
      "flex-1 py-5 flex items-center justify-center gap-3 text-sm font-bold transition-all border-b-2 relative",
      active ? "text-emerald-500 border-emerald-500 bg-emerald-500/5" : "text-stone-400 border-transparent",
      completed && "text-emerald-600/60"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
        active ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-stone-100 dark:bg-stone-800 text-stone-400",
        completed && "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
      )}>
        {completed ? <Check size={16} strokeWidth={3} /> : icon}
      </div>
      <span className="hidden md:block uppercase tracking-widest text-[11px]">{label}</span>
      {active && (
        <motion.div 
          layoutId="step-active"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500"
        />
      )}
    </div>
  );
}

function AiFeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
      {label}
    </li>
  );
}

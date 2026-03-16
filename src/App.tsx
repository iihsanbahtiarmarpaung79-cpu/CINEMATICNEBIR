/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Loader2, 
  Video, 
  Settings2, 
  AlertCircle,
  Key,
  ChevronRight,
  Eye,
  EyeOff,
  Upload,
  FileJson,
  FileText,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnalysisResult {
  plainText: string;
  json: any;
}

interface AnalysisState {
  status: 'idle' | 'analyzing' | 'success' | 'error';
  message: string;
  result?: AnalysisResult;
  error?: string;
}

const LOADING_MESSAGES = [
  "Visualizing your imagination...",
  "Synthesizing cinematic frames...",
  "Orchestrating pixels and motion...",
  "Applying digital cinematography...",
  "Rendering your masterpiece...",
  "Finalizing the visual sequence...",
];

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('veo_api_key') || '');
  const [showKey, setShowKey] = useState(false);
  const [isKeyExpired, setIsKeyExpired] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  const [inputType, setInputType] = useState<'video' | 'image'>('video');
  const [sceneCount, setSceneCount] = useState(5);
  const [promptStyle, setPromptStyle] = useState('Cinematic');
  const [scenePrompts, setScenePrompts] = useState('');
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    message: '',
  });
  
  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      localStorage.setItem('veo_api_key', apiKey.trim());
    }
  };

  const analyzeMedia = async () => {
    if (!file || !apiKey) return;

    setIsKeyExpired(false);
    setState({
      status: 'analyzing',
      message: 'Menganalisis media...',
    });

    try {
      const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
      
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      const base64Data = await base64Promise;
      const base64String = base64Data.split(',')[1];

      const promptInstruction = inputType === 'video' 
        ? `Analisis video ini. Bagi menjadi ${sceneCount} adegan berdurasi 8 detik. Untuk setiap adegan, berikan deskripsi prompt dalam Bahasa Inggris dan Bahasa Indonesia.`
        : `Analisis gambar ini dan berikan deskripsi prompt dalam Bahasa Inggris dan Bahasa Indonesia.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64String,
                mimeType: file.type,
              },
            },
            {
              text: `${promptInstruction} Gunakan gaya: ${promptStyle}. Format output JSON: { "scenes": [ { "sceneNumber": 1, "duration": "8s", "englishPrompt": "...", "indonesianPrompt": "..." } ], "plainText": "..." }`,
            },
          ],
        },
      });

      const text = response.text || "{}";
      // Simple parsing attempt
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonStr = text.substring(jsonStart, jsonEnd + 1);
      const result = JSON.parse(jsonStr);

      setState({
        status: 'success',
        message: 'Analisis berhasil!',
        result: result,
      });

    } catch (error: any) {
      console.error("Analysis failed", error);
      
      let errorMessage = error.message || "Terjadi kesalahan.";
      
      if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403") || errorMessage.includes("401")) {
        errorMessage = "Akses Ditolak (401/403): API Key Anda tidak valid atau kedaluwarsa.";
        setIsKeyExpired(true);
      }

      setState({
        status: 'error',
        message: 'Analisis gagal',
        error: errorMessage,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0502] text-white font-sans selection:bg-orange-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-900/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
      </div>

      <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shadow-orange-900/20">
              <Video className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-light tracking-tight">Cinematic <span className="text-orange-500 font-medium">NEBIR</span></span>
          </div>
        </div>
      </header>

      {isKeyExpired && (
        <div className="bg-red-500/10 border-b border-red-500/20 text-red-500 text-center py-3 text-sm">
          API Key Anda tidak valid atau kedaluwarsa. Silakan periksa kembali kunci Anda.
        </div>
      )}

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-12">
        {/* Left Column: Controls */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-3xl font-light tracking-tight serif">Buat adegan Anda</h2>
            <p className="text-gray-400">Jelaskan video yang ingin Anda buat secara detail. Semakin deskriptif, semakin baik hasilnya.</p>
          </div>

          <div className="space-y-6">
            <div className="relative w-full">
              <label className="text-xs uppercase tracking-widest text-gray-500 ml-1">Gemini API Key</label>
              <div className="relative mt-2">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    localStorage.setItem('veo_api_key', e.target.value);
                    setIsKeyExpired(false);
                  }}
                  placeholder="Paste your Gemini API Key here..."
                  className="w-full py-3 px-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-orange-600 rounded-full text-[10px] font-bold uppercase tracking-widest z-20 shadow-lg">
                Media Input
              </div>
              <div className="flex gap-2 mb-2">
                <button onClick={() => setInputType('video')} className={`flex-1 py-2 rounded-xl ${inputType === 'video' ? 'bg-white/20' : 'bg-white/5'}`}>Video</button>
                <button onClick={() => setInputType('image')} className={`flex-1 py-3 rounded-xl ${inputType === 'image' ? 'bg-white/20' : 'bg-white/5'}`}>Image</button>
              </div>
              <label className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
                <Upload className="w-10 h-10 text-orange-500 mb-4" />
                <span className="text-lg text-gray-300">{file ? file.name : `Pilih ${inputType === 'video' ? 'Video' : 'Gambar'}`}</span>
                <input type="file" accept={inputType === 'video' ? "video/*" : "image/*"} className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest text-gray-500">Paste Scene Prompts</label>
              <textarea 
                value={scenePrompts}
                onChange={(e) => setScenePrompts(e.target.value)}
                placeholder="Paste your scene prompts here..."
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-sm min-h-[150px]"
              />
            </div>

            <button
              onClick={analyzeMedia}
              disabled={!file || !apiKey || state.status === 'analyzing'}
              className="w-full py-5 bg-orange-600 hover:bg-orange-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-3xl font-medium text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-900/20"
            >
              {state.status === 'analyzing' ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Menganalisis...
                </>
              ) : (
                <>
                  <Video className="w-5 h-5" />
                  Analisis {inputType === 'video' ? 'Video' : 'Gambar'}
                </>
              )}
            </button>
            
            <div className="grid grid-cols-2 gap-4">
              {inputType === 'video' && (
                <div className="space-y-2">
                  <label className="text-xs uppercase tracking-widest text-gray-500">Scene Count</label>
                  <input type="number" value={sceneCount} onChange={(e) => setSceneCount(Number(e.target.value))} className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm" />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-500">Prompt Style</label>
                <select 
                  value={promptStyle} 
                  onChange={(e) => setPromptStyle(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-sm"
                >
                  <option>Cinematic</option>
                  <option>Technical</option>
                  <option>Creative</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="relative">
          <div className="w-full bg-white/5 rounded-[2rem] border border-white/10 overflow-hidden min-h-[400px] flex flex-col relative group p-8">
            <AnimatePresence mode="wait">
              {state.status === 'idle' && (
                <motion.div 
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-4 p-12"
                >
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                    <Video className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-xl font-light">Hasil Analisis</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Hasil prompt akan muncul di sini setelah analisis selesai.</p>
                </motion.div>
              )}

              {state.status === 'analyzing' && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center space-y-8 p-12 w-full"
                >
                  <Loader2 className="w-16 h-16 animate-spin text-orange-500 mx-auto" />
                  <p className="text-xl font-light text-white animate-pulse">{state.message}</p>
                </motion.div>
              )}

              {state.status === 'success' && state.result && (
                <motion.div 
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full space-y-6"
                >
                  <div className="flex gap-4 border-b border-white/10 pb-4">
                    <button className="flex items-center gap-2 text-orange-500 font-medium">
                      <FileText className="w-4 h-4" /> Plain Text
                    </button>
                    <button className="flex items-center gap-2 text-gray-500 hover:text-white">
                      <FileJson className="w-4 h-4" /> JSON
                    </button>
                  </div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 font-mono text-sm text-gray-300 overflow-auto max-h-[500px]">
                    {state.result.plainText}
                  </div>
                  <div className="bg-black/40 p-6 rounded-2xl border border-white/5 font-mono text-sm text-gray-300 overflow-auto max-h-[500px]">
                    <pre>{JSON.stringify(state.result.json, null, 2)}</pre>
                  </div>
                </motion.div>
              )}

              {state.status === 'error' && (
                <motion.div 
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center space-y-6 p-8 max-h-full overflow-y-auto"
                >
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-light text-red-500">Kesalahan Analisis</h3>
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 text-left">
                    <p className="text-sm text-gray-300 leading-relaxed">{state.error}</p>
                  </div>
                  
                  {state.error?.includes("403") && (
                    <div className="text-left space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10">
                      <p className="text-xs font-bold uppercase tracking-wider text-orange-500">Cara Memperbaiki:</p>
                      <ul className="text-xs text-gray-400 space-y-2 list-disc ml-4">
                        <li>Pastikan API Key Anda memiliki akses ke model Gemini 3.1 Flash Image Preview.</li>
                        <li>Periksa apakah API Key Anda valid dan tidak dibatasi.</li>
                        <li>Pastikan proyek Google Cloud Anda memiliki penagihan (billing) aktif.</li>
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={() => setState({ status: 'idle', progress: 0, message: '' })}
                      className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all text-sm"
                    >
                      Tutup
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -top-4 -left-4 w-24 h-24 border-t-2 border-l-2 border-orange-500/30 rounded-tl-3xl pointer-events-none" />
          <div className="absolute -bottom-4 -right-4 w-24 h-24 border-b-2 border-r-2 border-orange-500/30 rounded-br-3xl pointer-events-none" />
        </div>
      </main>

      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center space-y-4">
        <p className="text-gray-600 text-sm tracking-widest uppercase">
          Powered by Google Gemini AI
        </p>
        <p className="text-gray-500 text-sm">
          Hubungi kami via WhatsApp: <a href="https://wa.me/6282277930100" className="text-orange-500 hover:underline">082277930100</a>
        </p>
      </footer>
    </div>
  );
}

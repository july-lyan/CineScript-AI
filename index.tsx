
import React, { useState, useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { 
  Clapperboard, 
  FileVideo, 
  Sparkles, 
  LayoutTemplate, 
  Users, 
  ListVideo, 
  BrainCircuit, 
  ArrowRight,
  Loader2,
  Film,
  Music,
  Camera,
  Search,
  AlertCircle,
  Sun,
  Moon,
  Copy,
  Check,
  Lock,
  Unlock,
  CreditCard,
  Smartphone,
  QrCode,
  ShieldCheck,
  X,
  Wrench,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  AlignLeft,
  FileText,
  Zap
} from "lucide-react";

// --- Types ---

interface VideoStructure {
  section: string;
  timestamp: string;
  summary: string;
  narrativeFunction: string;
}

interface TranscriptSegment {
  title: string;
  content: string;
}

interface ScriptScene {
  sceneNumber: number;
  location: string;
  shotType: string;
  visuals: string;
  audio: string;
}

interface AnalysisResult {
  analysis: {
    theme: string;
    audience: string;
    structure: VideoStructure[];
    corePoints: string[];
    transcriptSegments: TranscriptSegment[];
  };
  script: {
    title: string;
    scenes: ScriptScene[];
  };
  usedModel?: string; // Track which model was actually used
}

// --- API Logic ---

const API_BASE = "/api";

const analyzeVideo = async (input: string, tier: "free" | "paid"): Promise<AnalysisResult> => {
  const res = await fetch(`${API_BASE}/analyze?tier=${tier}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "分析失败，请稍后重试。");
  }

  const data = await res.json();
  return data as AnalysisResult;
};

// --- Helper Functions ---

const formatAnalysisForCopy = (data: AnalysisResult['analysis']): string => {
  let text = `【视频深度分析报告】\n\n`;
  text += `🎯 核心主题：${data.theme}\n`;
  text += `👥 目标受众：${data.audience}\n\n`;
  text += `📅 叙事结构：\n`;
  data.structure.forEach(s => {
    text += `- [${s.timestamp || 'N/A'}] ${s.section}: ${s.summary} (功能: ${s.narrativeFunction})\n`;
  });
  text += `\n✨ 关键洞察：\n`;
  data.corePoints.forEach(p => text += `- ${p}\n`);
  
  return text;
};

const formatTranscriptForCopy = (segments: TranscriptSegment[]): string => {
  let text = `【视频全量文案整理】\n\n`;
  segments.forEach(t => {
     text += `### ${t.title}\n${t.content}\n\n`;
  });
  return text;
};

const formatScriptForCopy = (data: AnalysisResult['script']): string => {
  let text = `【拍摄脚本】${data.title}\n\n`;
  data.scenes.forEach(s => {
    text += `SCENE ${s.sceneNumber}: ${s.location}\n`;
    text += `镜头: ${s.shotType}\n`;
    text += `画面: ${s.visuals}\n`;
    text += `音效/对白: ${s.audio}\n`;
    text += `-------------------\n\n`;
  });
  return text;
};

// --- Payment Component ---

const PaymentModal = ({ isOpen, onClose, onSuccess, price, showAdmin = false }: { isOpen: boolean; onClose: () => void; onSuccess: (count?: number) => void; price: number; showAdmin?: boolean }) => {
  const [method, setMethod] = useState<'wechat' | 'alipay' | 'card'>('wechat');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  useEffect(() => {
    // Reset when关闭
    if (!isOpen) {
      setQrUrl(null);
      setOrderId(null);
      setStatus('idle');
      setIsProcessing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!orderId) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/pay/status?orderId=${orderId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'success') {
          clearInterval(timer);
          setStatus('success');
          onSuccess(data.paidCount || 1);
        }
      } catch (e) {
        // 忽略轮询错误
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [orderId, onSuccess]);

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    setStatus('pending');
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: method, count: 1 }),
      });
      if (!res.ok) {
        throw new Error('支付下单失败，请稍后重试');
      }
      const data = await res.json();
      setQrUrl(data.qrUrl || data.code_url || data.payUrl);
      setOrderId(data.orderId);
    } catch (e) {
      console.error(e);
      setStatus('failed');
      alert('支付下单失败，请稍后重试');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800 animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-center">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md mb-3">
             <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white">解锁专业版功能</h3>
          <p className="text-indigo-100 text-sm mt-1">CineScript AI Pro Lifetime</p>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">¥{price.toFixed(1)}</span>
            <span className="text-slate-500 dark:text-slate-400 ml-2 text-sm">/次</span>
            <span className="block text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">免费 3 次后按次计费</span>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
              <Check className="w-4 h-4 text-indigo-500" />
              <span>无限次视频深度分析</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
               <Check className="w-4 h-4 text-indigo-500" />
              <span>解锁 Gemini 3.0 Pro 高级模型</span>
            </div>
             <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
               <Check className="w-4 h-4 text-indigo-500" />
              <span>一键导出专业拍摄脚本</span>
            </div>
          </div>

          {/* Payment Methods Tabs */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              onClick={() => setMethod('wechat')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                method === 'wechat' 
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
              }`}
            >
              <div className="w-6 h-6 mb-1 rounded bg-[#09BB07] text-white flex items-center justify-center">
                 <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M8.5,14.5c0.82,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S7.67,14.5,8.5,14.5z M15.5,14.5c0.82,0,1.5,0.67,1.5,1.5s-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5S14.67,14.5,15.5,14.5z M12,2C6.48,2,2,5.92,2,10.75c0,2.67,1.37,5.06,3.52,6.66l-0.89,3.06l3.59-1.5c1.17,0.46,2.44,0.72,3.78,0.72c5.52,0,10-3.92,10-8.75S17.52,2,12,2z" /></svg>
              </div>
              <span className="text-xs font-medium">微信支付</span>
            </button>
            <button
              onClick={() => setMethod('alipay')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                method === 'alipay' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 ring-1 ring-blue-500' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
              }`}
            >
              <div className="w-6 h-6 mb-1 rounded bg-[#1677FF] text-white flex items-center justify-center">
                <span className="font-bold text-[10px]">支</span>
              </div>
              <span className="text-xs font-medium">支付宝</span>
            </button>
            <button
              onClick={() => setMethod('card')}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                method === 'card' 
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 ring-1 ring-indigo-500' 
                  : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
              }`}
            >
              <CreditCard className="w-6 h-6 mb-1 text-slate-700 dark:text-slate-300" />
              <span className="text-xs font-medium">银行卡</span>
            </button>
          </div>

          {/* Dynamic Payment Content */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 flex flex-col items-center justify-center mb-6 h-48 border border-slate-100 dark:border-slate-800">
             {method === 'card' ? (
                <div className="w-full space-y-3">
                  <div className="h-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 flex items-center text-sm text-slate-400">
                    <CreditCard className="w-4 h-4 mr-2" /> 0000 0000 0000 0000
                  </div>
                  <div className="flex gap-3">
                    <div className="h-10 w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 flex items-center text-sm text-slate-400">
                      MM/YY
                    </div>
                    <div className="h-10 w-1/2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-3 flex items-center text-sm text-slate-400">
                      CVC
                    </div>
                  </div>
                </div>
             ) : (
               <>
                 <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 mb-2 w-32 h-32 flex items-center justify-center">
                    {qrUrl ? (
                      <img src={qrUrl} alt="支付二维码" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode className={`w-24 h-24 ${method === 'wechat' ? 'text-[#09BB07]' : 'text-[#1677FF]'}`} />
                    )}
                 </div>
                 <p className="text-xs text-slate-500">
                   {qrUrl ? '请使用扫码完成支付' : `请使用${method === 'wechat' ? '微信' : '支付宝'}扫码支付`}
                 </p>
               </>
             )}
          </div>

          <button
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl font-bold text-base transition-all shadow-lg shadow-indigo-500/25 active:scale-95 flex items-center justify-center gap-2"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
            {isProcessing ? "拉起支付..." : `立即支付 ¥${price.toFixed(1)}`}
          </button>
          
          <div className="flex items-center justify-between mt-4 px-1">
             <p className="text-[10px] text-slate-400">
              虚拟商品售出概不退换。
            </p>
            {showAdmin && (
              <button onClick={() => onSuccess(1)} className="text-[10px] text-slate-300 hover:text-indigo-500 transition-colors">
                Admin Unlock (Dev)
              </button>
            )}
          </div>
         
        </div>
      </div>
    </div>
  );
};


// --- Components ---

const App = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentModelName, setCurrentModelName] = useState<string>("Gemini 3.0 Pro");
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Copy States
  const [copiedAnalysis, setCopiedAnalysis] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  // Payment State
  const [isPaid, setIsPaid] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [usageCount, setUsageCount] = useState(0);
  const [credits, setCredits] = useState(0); // 已购未用次数
  
  const FREE_USAGE_LIMIT = 3;
  const PAY_PER_USE_PRICE = 9.9;

  // Dev Tools State
  const [devMode, setDevMode] = useState(false);

  const isLocalMac = useMemo(() => {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent || "";
    const host = window.location.hostname;
    const isMac = ua.includes("Macintosh");
    const isLocalhost = ["localhost", "127.0.0.1", "::1"].includes(host);
    return isMac && isLocalhost;
  }, []);

  // Check Local Storage on Mount
  useEffect(() => {
    const paidStatus = localStorage.getItem('cinescript_pro_status');
    const count = parseInt(localStorage.getItem('cinescript_usage_count') || '0');
    const storedCredits = parseInt(localStorage.getItem('cinescript_paid_credits') || '0');
    if (paidStatus === 'true') {
      setIsPaid(true);
    }
    setUsageCount(count);
    setCredits(Number.isNaN(storedCredits) ? 0 : storedCredits);
  }, []);

  const handlePaymentSuccess = (count = 1) => {
    setCredits((c) => {
      const next = c + count;
      localStorage.setItem('cinescript_paid_credits', next.toString());
      return next;
    });
    setShowPayModal(false);
    
    // Auto trigger analysis after payment
    if (input.trim()) {
      handleAnalyze('paid', { consumeCredit: true }); 
    }
  };

  const resetAppState = () => {
    localStorage.removeItem('cinescript_pro_status');
    localStorage.removeItem('cinescript_usage_count');
    localStorage.removeItem('cinescript_paid_credits');
    setIsPaid(false);
    setUsageCount(0);
    setCredits(0);
    setResult(null);
    setInput("");
    alert("应用状态已重置：恢复为免费用户，使用次数清零。");
  };

  const handleAnalyzeClick = () => {
    if (!input.trim()) return;

    // 开发者模式：直接用付费通道且不扣额度
    if (devMode) {
      handleAnalyze('paid', { consumeCredit: false });
      return;
    }

    // 已付费（终身或已标记）
    if (isPaid) {
      handleAnalyze('paid', { consumeCredit: false });
      return;
    }

    // 免费额度
    if (usageCount < FREE_USAGE_LIMIT) {
      handleAnalyze('free', { consumeCredit: false });
      return;
    }

    // 付费额度
    if (credits > 0) {
      handleAnalyze('paid', { consumeCredit: true });
      return;
    }

    // 无额度则拉起支付
    setShowPayModal(true);
  };

  const handleAnalyze = async (tier: 'free' | 'paid', options?: { consumeCredit?: boolean }) => {
    setIsLoading(true);
    setError(null);
    setResult(null); 
    
    try {
      const data = await analyzeVideo(input, tier);
      setResult(data);
      if (data.usedModel) {
        setCurrentModelName(data.usedModel === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' : 'Gemini 3.0 Pro');
      }
      
      if (!devMode) {
        if (tier === 'free' && !isPaid) {
          const newCount = usageCount + 1;
          setUsageCount(newCount);
          localStorage.setItem('cinescript_usage_count', newCount.toString());
        }
        if (tier === 'paid' && options?.consumeCredit) {
          setCredits((c) => {
            const next = Math.max(0, c - 1);
            localStorage.setItem('cinescript_paid_credits', next.toString());
            return next;
          });
        }
      }

    } catch (err: any) {
      console.error(err);
      // Improve error message display
      let errorMessage = err.message || "分析失败，请稍后重试。";
      
      // Try to parse JSON error strings from proxy
      if (typeof errorMessage === 'string' && errorMessage.trim().startsWith('{')) {
        try {
           const parsed = JSON.parse(errorMessage);
           if (parsed.details) errorMessage = parsed.details;
           else if (parsed.error && typeof parsed.error === 'string') errorMessage = parsed.error;
           
           if (errorMessage === "Failed to fetch" || errorMessage === "Proxying failed") {
             errorMessage = "网络连接超时或服务繁忙，请重试。";
           }
        } catch (e) {
          // ignore parse error
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, type: 'analysis' | 'script' | 'transcript') => {
    navigator.clipboard.writeText(text);
    if (type === 'analysis') {
      setCopiedAnalysis(true);
      setTimeout(() => setCopiedAnalysis(false), 2000);
    } else if (type === 'script') {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    }
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-500/30 transition-colors duration-300 flex flex-col">
        
        {/* Payment Modal */}
        <PaymentModal 
          isOpen={showPayModal} 
          onClose={() => setShowPayModal(false)} 
          onSuccess={handlePaymentSuccess} 
          price={PAY_PER_USE_PRICE}
          showAdmin={isLocalMac}
        />

        {/* Header */}
        <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors duration-300">
          <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-500/20">
                <Clapperboard className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 dark:from-indigo-400 dark:to-cyan-400 bg-clip-text text-transparent leading-none">
                    CineScript AI
                  </h1>
                  {isPaid ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-200 to-yellow-400 text-amber-900 uppercase tracking-wide shadow-sm">PRO</span>
                  ) : devMode ? (
                     <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white uppercase tracking-wide shadow-sm">DEV</span>
                  ) : null}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-0.5">
                  智能视频分析与脚本生成
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {!isPaid && !devMode && (
                <button 
                  onClick={() => setShowPayModal(true)}
                  className="hidden sm:flex text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  升级专业版
                </button>
              )}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title={isDarkMode ? "切换到浅色模式" : "切换到深色模式"}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow w-full px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300">
          
          {/* Input Section */}
          <section className="mb-8 w-full mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
            <div className={`bg-white dark:bg-slate-900 border rounded-2xl p-1 shadow-lg dark:shadow-2xl dark:shadow-indigo-500/5 transition-colors duration-300 relative overflow-hidden ${
              devMode ? 'border-emerald-500/50 ring-4 ring-emerald-500/10' : 'border-slate-200 dark:border-slate-800 ring-4 ring-slate-50/50 dark:ring-slate-900/50'
            }`}>
               
               {/* Input Area */}
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="在此粘贴 YouTube/Bilibili/小红书 视频链接，或者直接输入您的视频创意/文案描述..."
                  className="w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl p-5 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-y text-base lg:text-lg transition-colors duration-300 pb-16"
                />
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 absolute bottom-3 right-3 left-3 sm:left-auto z-10">
                   <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 dark:text-slate-600 font-mono">
                    Model: {currentModelName} 
                    {currentModelName.includes("Flash") && <Zap className="w-3 h-3 text-amber-500" />}
                    {isPaid && <span className="ml-2 text-emerald-500 flex items-center gap-0.5"><Check className="w-3 h-3" /> Unlocked</span>}
                   </div>
                   <button
                    onClick={handleAnalyzeClick}
                    disabled={isLoading || !input.trim()}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95 ${
                        isPaid || devMode
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20' 
                        : 'bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white shadow-slate-900/20'
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        深度分析中...
                      </>
                    ) : (
                      <>
                        {isPaid || devMode ? <Sparkles className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {isPaid || devMode ? "开始分析 & 生成脚本" : `解锁并生成 (¥${PAY_PER_USE_PRICE.toFixed(1)})`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Trial Status / Hints */}
            {!isPaid && !devMode && (
               <div className="mt-3 text-center">
                 {usageCount < FREE_USAGE_LIMIT ? (
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-semibold animate-pulse">
                     ✨ 免费试用中 ({usageCount}/{FREE_USAGE_LIMIT})
                   </span>
                 ) : (
                   <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-semibold">
                     🔒 试用次数已耗尽
                   </span>
                 )}
               </div>
            )}
            
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <Search className="w-3 h-3" />
                <span>支持链接解析与文本描述</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-xs px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/20">
                <AlertCircle className="w-3 h-3" />
                <span>提示：Bilibili/小红书 链接建议配合视频标题/简介使用以提升准确度</span>
              </div>
            </div>
          </section>

          {error && (
            <div className="w-full max-w-4xl mx-auto mb-8 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-center flex items-center justify-center gap-2 animate-in fade-in zoom-in-95">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Results Section - 3 Column Layout */}
          {result && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 mb-20">
              
              {/* Left Panel: Transcript (Swapped Position) */}
              <div className="space-y-4 flex flex-col h-[600px] xl:h-[850px] rounded-2xl bg-white/50 dark:bg-slate-900/20 p-4 lg:p-6 border border-slate-200/50 dark:border-slate-800/50">
                 <div className="flex-shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">视频全量文案</h2>
                  </div>
                  <button 
                    onClick={() => handleCopy(formatTranscriptForCopy(result.analysis.transcriptSegments || []), 'transcript')}
                    className="group flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
                  >
                    {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 group-hover:text-indigo-500" />}
                    {copiedTranscript ? "已复制" : "复制文案"}
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300 flex-grow flex flex-col min-h-0">
                  <div className="p-5 overflow-y-auto h-full scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    {result.analysis.transcriptSegments && result.analysis.transcriptSegments.length > 0 ? (
                      <div className="space-y-6">
                        {result.analysis.transcriptSegments.map((segment, idx) => (
                          <div key={idx}>
                             <h5 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-blue-600"></span>
                               {segment.title}
                             </h5>
                             <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line pl-3.5 border-l-2 border-slate-100 dark:border-slate-800">
                               {segment.content}
                             </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                       <p className="text-sm text-slate-400 italic text-center py-4">
                         未能提取到详细的视频文案，可能是因为视频源限制或未搜索到相关字幕。
                       </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle Panel: Analysis (Swapped Position) */}
              <div className="space-y-4 flex flex-col h-[600px] xl:h-[850px] rounded-2xl bg-white/50 dark:bg-slate-900/20 p-4 lg:p-6 border border-slate-200/50 dark:border-slate-800/50">
                <div className="flex-shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg">
                      <BrainCircuit className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">视频深度分析</h2>
                  </div>
                  <button 
                    onClick={() => handleCopy(formatAnalysisForCopy(result.analysis), 'analysis')}
                    className="group flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
                  >
                    {copiedAnalysis ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 group-hover:text-indigo-500" />}
                    {copiedAnalysis ? "已复制" : "复制报告"}
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto min-h-0 space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700 scrollbar-track-transparent">
                  {/* Theme & Audience Cards */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                      <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <LayoutTemplate className="w-3 h-3" /> 核心主题
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{result.analysis.theme}</p>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl shadow-sm dark:shadow-none transition-colors duration-300 relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                      <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Users className="w-3 h-3" /> 目标受众
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">{result.analysis.audience}</p>
                    </div>
                  </div>

                  {/* Structure Timeline */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm dark:shadow-none transition-colors duration-300">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <ListVideo className="w-4 h-4 text-slate-400" />
                      <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">叙事结构时间轴</h3>
                    </div>
                    <div className="p-5">
                      <div className="space-y-6 relative">
                         {/* Vertical Line */}
                        <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800 z-0"></div>
                        
                        {result.analysis.structure.map((item, index) => (
                          <div key={index} className="relative z-10 flex gap-4 group">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-indigo-100 dark:border-indigo-900 bg-white dark:bg-slate-900 flex items-center justify-center mt-0.5 group-hover:border-indigo-500 dark:group-hover:border-indigo-400 transition-colors">
                              <div className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400"></div>
                            </div>
                            <div className="flex-grow pb-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {item.section}
                                </h4>
                                <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                  {item.timestamp}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                                {item.summary}
                              </p>
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded text-[10px] text-indigo-700 dark:text-indigo-300 font-medium">
                                <span className="opacity-70">功能:</span> {item.narrativeFunction}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-5 transition-colors duration-300">
                    <h3 className="text-sm font-bold text-amber-800 dark:text-amber-500 flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4" /> 关键洞察 & 价值
                    </h3>
                    <ul className="space-y-2.5">
                      {result.analysis.corePoints.map((point, index) => (
                        <li key={index} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2.5 leading-relaxed">
                          <ArrowRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Panel: Script */}
              <div className="space-y-4 flex flex-col h-[600px] xl:h-[850px] rounded-2xl bg-white/50 dark:bg-slate-900/20 p-4 lg:p-6 border border-slate-200/50 dark:border-slate-800/50">
                 <div className="flex-shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                      <FileVideo className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">生成拍摄脚本</h2>
                  </div>
                  <button 
                    onClick={() => handleCopy(formatScriptForCopy(result.script), 'script')}
                    className="group flex items-center gap-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition-all active:scale-95 shadow-sm"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 group-hover:text-indigo-500" />}
                    {copiedScript ? "已复制" : "复制脚本"}
                  </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-sm dark:shadow-2xl flex-grow flex flex-col min-h-0 border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                  {/* Script Title Header */}
                  <div className="flex-shrink-0 p-6 sm:p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700/50 text-center relative overflow-hidden transition-colors duration-300">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <h3 className="text-2xl font-serif text-slate-900 dark:text-white font-bold leading-snug tracking-wide mb-2">
                       {result.script.title}
                    </h3>
                    <div className="flex items-center justify-center gap-3 text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      <span>Shooting Script</span>
                      <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                      <span>{new Date().toLocaleDateString()}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                      <span>Draft V1</span>
                    </div>
                  </div>

                  {/* Scenes List */}
                  <div className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700 scrollbar-track-slate-100 dark:scrollbar-track-transparent transition-colors duration-300">
                    {result.script.scenes.map((scene, index) => (
                      <div key={index} className="group border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-5 transition-all duration-300 shadow-sm">
                        {/* Scene Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700/50 border-dashed transition-colors duration-300">
                          <div className="flex items-center gap-3">
                            <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                              SCENE {scene.sceneNumber}
                            </span>
                            <span className="text-slate-800 dark:text-slate-200 font-bold uppercase tracking-wide text-sm">
                              {scene.location}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-xs bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                            <Camera className="w-3 h-3" />
                            {scene.shotType}
                          </div>
                        </div>

                        {/* Visuals */}
                        <div className="mb-4 pl-3 border-l-2 border-slate-200 dark:border-slate-700 group-hover:border-indigo-500/50 transition-colors">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">
                             <Film className="w-3 h-3" /> 画面描述 / Visuals
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                            {scene.visuals}
                          </p>
                        </div>

                        {/* Audio */}
                        <div className="pl-3 border-l-2 border-slate-200 dark:border-slate-700 group-hover:border-emerald-500/50 transition-colors">
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">
                             <Music className="w-3 h-3" /> 音效 & 对白 / Audio
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-serif italic bg-slate-50 dark:bg-black/20 p-3 rounded-lg border border-slate-200 dark:border-white/5 transition-colors duration-300">
                            “ {scene.audio} ”
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    {/* End Marker */}
                    <div className="flex items-center justify-center gap-2 pt-4 pb-2">
                       <div className="h-px w-10 bg-slate-200 dark:bg-slate-800 transition-colors duration-300"></div>
                       <span className="text-slate-500 dark:text-slate-600 text-[10px] uppercase tracking-widest">End of Script</span>
                       <div className="h-px w-10 bg-slate-200 dark:bg-slate-800 transition-colors duration-300"></div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          )}
        </main>
        
        {/* Simple Footer */}
        {devMode && isLocalMac && (
          <div className="fixed bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-[10px] rounded pointer-events-none z-50">
             DevMode Active
          </div>
        )}

        <footer className="w-full border-t border-slate-200 dark:border-slate-800 py-6 text-center text-slate-400 dark:text-slate-600 text-xs transition-colors duration-300">
          <p>Powered by Google Gemini 3.0 Pro & React</p>
          <div className="mt-2 flex items-center justify-center gap-2">
             {isLocalMac ? (
               <>
                 <button onClick={() => setDevMode(!devMode)} className="hover:text-indigo-500 transition-colors">
                   &copy; {new Date().getFullYear()} CineScript AI
                 </button>
                 {devMode && (
                   <button onClick={resetAppState} className="text-red-500 underline ml-2">Reset App State</button>
                 )}
               </>
             ) : (
               <span>&copy; {new Date().getFullYear()} CineScript AI</span>
             )}
          </div>
        </footer>

      </div>
    </div>
  );
};

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

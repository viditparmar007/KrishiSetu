import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Sparkles,
  Send,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  ArrowLeft,
  Wheat,
  Sprout,
  IndianRupee,
  CloudSun,
} from "lucide-react";
import farmerApi from "../api/farmerApi";
import krishiMascotImg from "../assets/krishi_ai_mascot.png";

export default function FarmerAiChatView({ farmerName = "Vidit Parmar", farms = [], crops = [], onBack }) {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: `नमस्ते **${farmerName} जी**! 🙏\n\nमैं आपका कृषि AI सहायक हूँ। आप अपनी फसल (मक्का, गन्ना, उड़द), खाद-उर्वरक की सही मात्रा, मौसम सलाह, रोग-कीट उपचार या मंडी भाव के बारे में कुछ भी पूछ सकते हैं।`,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (customQuery) => {
    const query = (typeof customQuery === "string" ? customQuery : input).trim();
    if (!query || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (typeof customQuery !== "string") setInput("");
    setLoading(true);

    try {
      const response = await farmerApi.assistantQuery({ query });
      const answer =
        response.data?.answer ||
        response.data?.response ||
        response.data?.message ||
        "कृषिसेतु AI ने आपका प्रश्न प्राप्त किया। कृपया पुनः प्रयास करें।";

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: answer,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: "⚠️ क्षमा करें, अभी AI सर्वर से संपर्क नहीं हो सका। कृपया पुनः प्रयास करें।",
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleNewChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "ai",
        text: `🌾 **नई बातचीत शुरू हुई!**\n\nनमस्ते ${farmerName} जी, आज मैं आपकी क्या सहायता कर सकता हूँ?`,
        time: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const starterSuggestions = [
    {
      icon: Sprout,
      title: "🌽 Sweet Corn देखभाल",
      desc: "मक्का में पहला पानी और खाद का समय",
      query: "स्वीट कॉर्न में सिंचाई और खाद की सही मात्रा क्या है?",
    },
    {
      icon: Wheat,
      title: "🎋 गन्ने में कल्ले व खाद",
      desc: "कल्ले बढ़ाने और कीट रोकथाम का तरीका",
      query: "गन्ने में कल्ले बढ़ाने के लिए कौन सी खाद और कीटनाशक डालें?",
    },
    {
      icon: IndianRupee,
      title: "💰 आज का मंडी भाव",
      desc: "सहारनपुर व आसपास की मंडियों के भाव",
      query: "आज सहारनपुर मंडी में मक्का, गेहूं और उड़द का भाव क्या है?",
    },
    {
      icon: CloudSun,
      title: "🌧️ मौसम व छिड़काव गाइड",
      desc: "आज स्प्रे या सिंचाई करना सुरक्षित है?",
      query: "आज मौसम कैसा रहेगा, क्या खेत में कीटनाशक छिड़काव करना चाहिए?",
    },
  ];

  return (
    <div className="flex h-[calc(100vh-130px)] min-h-[550px] w-full flex-col overflow-hidden rounded-3xl border border-[#d6ecdc] bg-white shadow-xl">
      {/* Clean Minimal Header (ChatGPT / Gemini style) */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#e8f2ea] bg-white/90 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[#3d5a47] transition hover:bg-[#f0f7f2] hover:text-[#176b3e]"
              title="वापस डैशबोर्ड पर जाएं"
            >
              <ArrowLeft size={19} />
            </button>
          )}

          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-white/90 p-0.5 shadow-md border border-[#cfe6d6]">
            <img src={krishiMascotImg} alt="Krishi AI Mascot" className="h-full w-full object-contain" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-[#113821]">KrishiSetu AI</h2>
              <span className="flex items-center gap-1 rounded-full bg-[#edf8f1] px-2 py-0.5 text-[10px] font-bold text-[#176b3e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#27ae60] animate-pulse" />
                Live
              </span>
            </div>
            <p className="text-[11px] text-[#6e8576]">आपका निजी डिजिटल कृषि सलाहकार</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="flex items-center gap-1.5 rounded-xl border border-[#cfe6d6] bg-[#f4faf6] px-3 py-1.5 text-xs font-bold text-[#176b3e] transition hover:bg-[#e6f5ec] active:scale-95"
            title="नई बातचीत शुरू करें"
          >
            <Sparkles size={13} />
            <span>New Chat</span>
          </button>

          <button
            type="button"
            onClick={handleNewChat}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#758a7d] transition hover:bg-[#fff0f0] hover:text-[#b83b42]"
            title="चैट साफ़ करें"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-5">
          {/* If only welcome message, show clean quick starter cards */}
          {messages.length === 1 && (
            <div className="mb-6 mt-2">
              <div className="mb-4 text-center">
                <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white p-1 shadow-md border border-[#d6ecdd]">
                  <img src={krishiMascotImg} alt="Krishi Mascot" className="h-full w-full object-contain" />
                </div>
                <h3 className="text-base font-extrabold text-[#113821]">
                  नमस्ते {farmerName} जी! आज क्या जानकारी चाहिए?
                </h3>
                <p className="text-xs text-[#6e8576]">
                  नीचे दिए गए किसी भी विषय पर क्लिक करें या अपना सवाल टाइप करें
                </p>
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {starterSuggestions.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSend(item.query)}
                      className="group flex items-start gap-3 rounded-2xl border border-[#d6ecdc] bg-[#fbfdfb] p-3.5 text-left transition-all hover:border-[#176b3e] hover:bg-white hover:shadow-md active:scale-98"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#edf8f1] text-[#176b3e] transition group-hover:bg-[#176b3e] group-hover:text-white">
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-[#1a452a] group-hover:text-[#176b3e]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-[#71887a]">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages list */}
          {messages.map((msg) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-sm border border-[#d6ecdd]">
                    <img src={krishiMascotImg} alt="AI" className="h-full w-full object-contain" />
                  </div>
                )}

                <div
                  className={`group relative max-w-[85%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 ${
                    isUser
                      ? "rounded-tr-xs bg-[#176b3e] text-white shadow-md shadow-[#176b3e]/15"
                      : "rounded-tl-xs border border-[#dceee0] bg-white text-[#193a26] shadow-sm"
                  }`}
                >
                  {/* Sender & Timestamp */}
                  <div className="mb-1 flex items-center justify-between gap-4 text-[10px] opacity-70">
                    <span className="font-bold">{isUser ? "आप (किसान)" : "KrishiSetu AI"}</span>
                    <span>{msg.time}</span>
                  </div>

                  {/* Message Content */}
                  <div className="whitespace-pre-line text-xs sm:text-[13px] leading-relaxed">
                    {msg.text}
                  </div>

                  {/* Copy Button for AI response */}
                  {!isUser && (
                    <div className="mt-2 flex justify-end border-t border-[#f0f6f1] pt-1.5">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.id, msg.text)}
                        className="flex items-center gap-1 text-[10px] font-semibold text-[#6e8576] hover:text-[#176b3e]"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check size={12} className="text-[#176b3e]" />
                            <span className="text-[#176b3e]">कॉपी हो गया!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={12} />
                            <span>कॉपी करें</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#234b33] text-xs font-bold text-white shadow-sm">
                    {farmerName[0] || "K"}
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading bubble */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-0.5 shadow-sm border border-[#d6ecdd]">
                <img src={krishiMascotImg} alt="AI" className="h-full w-full object-contain" />
              </div>
              <div className="rounded-2xl rounded-tl-xs border border-[#dceee0] bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold text-[#176b3e]">
                  <RefreshCw size={14} className="animate-spin" />
                  <span>कृषि विशेषज्ञ AI उत्तर तैयार कर रहा है...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sleek Floating Dock Input (ChatGPT / Gemini style) */}
      <div className="border-t border-[#e8f2ea] bg-white/95 p-3 sm:p-4 backdrop-blur-md">
        <div className="mx-auto max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 rounded-2xl border border-[#cfe2d4] bg-[#fbfdfb] p-1.5 shadow-sm transition focus-within:border-[#176b3e] focus-within:bg-white focus-within:shadow-md focus-within:ring-2 focus-within:ring-[#176b3e]/15"
          >
            <div className="pl-2.5 text-[#176b3e]">
              <Sparkles size={18} />
            </div>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="फसल, खाद, मौसम या मंडी भाव के बारे में पूछें..."
              className="min-w-0 flex-1 bg-transparent px-2 py-2 text-xs sm:text-sm font-semibold text-[#183a24] outline-none placeholder:text-[#839b8d]"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#176b3e] text-white shadow-md transition hover:bg-[#125832] active:scale-95 disabled:opacity-30"
              title="Send"
            >
              {loading ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </button>
          </form>

          <p className="mt-1.5 text-center text-[10px] text-[#7d9688]">
            KrishiSetu AI • फसलों, मौसम और मंडी भाव के लिए समर्पित सलाहकार
          </p>
        </div>
      </div>
    </div>
  );
}

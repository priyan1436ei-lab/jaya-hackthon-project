import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  User,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { useFinFam } from '../context/FinFamContext';
import { GeminiAiEngine, AiChatMessage } from '../lib/geminiAiEngine';

export const AiAdvisorScreen: React.FC = () => {
  const {
    userProfile,
    financialHealth,
    monthlySpendingTrends,
    emis,
    budgets,
    goals,
    householdProfile
  } = useFinFam();

  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Namaste ${userProfile.name}! I am your FinFam Multi-Goal Intelligence Coach. I've analyzed your family vault with a total balance of ₹${userProfile.totalBalance.toLocaleString(
        'en-IN'
      )} and your household goals against available cashflow. Ask me anything about goal conflicts, deadline trade-offs, or resolution scenarios!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Why do our financial goals have a funding conflict?',
    'What happens if we move our House deadline to 2028?',
    'What resolution scenarios can eliminate our shortfall?',
    'What if our family saves ₹5,000 more per month?',
    'Should we prepay our active EMIs or invest in SIP?'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (userText: string) => {
    if (!userText.trim()) return;

    const userMsg: AiChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await GeminiAiEngine.askAdvisor(userText, {
        userProfile,
        financialHealth,
        monthlySpendingTrends,
        emis,
        budgets,
        goals,
        householdProfile
      });

      const botMsg: AiChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: AiChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: 'I apologize, but I encountered an error while formulating your strategy. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto pb-4">
      {/* Header */}
      <div className="p-4 rounded-2xl bg-[#0E1528] border border-white/10 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">FinFam AI Wealth Coach</h2>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                ONLINE
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Context-Aware Family Advisory</p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] text-slate-400">Vault Score:</span>
          <span className="text-xs font-mono font-bold text-cyan-400 ml-1">
            {financialHealth.overallScore}/100
          </span>
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto space-y-4 p-2 sm:p-4 rounded-2xl bg-[#080E20] border border-white/5">
        {messages.map((msg) => {
          const isBot = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                  isBot
                    ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}
              >
                {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                  isBot
                    ? 'bg-[#0E1528] border border-white/10 text-slate-200 shadow-lg'
                    : 'bg-cyan-500 text-[#050816] font-medium shadow-md shadow-cyan-500/10'
                }`}
              >
                <div className="whitespace-pre-line">{msg.text}</div>
                <div
                  className={`text-[9px] mt-2 font-mono ${
                    isBot ? 'text-slate-500' : 'text-cyan-950 font-semibold'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0E1528] border border-white/10 text-xs text-cyan-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing portfolio metrics & formulating strategy...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] border border-white/10 whitespace-nowrap transition-all flex items-center gap-1 shrink-0"
          >
            <Lightbulb className="w-3 h-3 text-amber-400" />
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="flex items-center gap-2 pt-1"
      >
        <input
          type="text"
          placeholder="Ask anything about investments, EMIs, tax or savings..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={!input.trim() || isTyping}
          className="px-4 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#050816] font-bold text-xs transition-all flex items-center gap-1 shadow-md shadow-cyan-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AssistantPage() {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Hello! I am your MedBridge planning assistant. I can help you clarify your requirements, understand logistics, and narrow down your options based on public data. How can I help you plan your journey today?' }
  ]);
  const [input, setInput] = useState('');
  
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: input }]);
    const currentInput = input;
    setInput('');
    
    // Simulate AI response for the mock UI
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: `I understand you're asking about "${currentInput}". I am currently in development mode and cannot provide a personalized response yet. However, you can use our manual search to explore options directly.`
      }]);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-120px)] max-h-[800px]">
      
      {/* Header Area */}
      <div className="bg-white p-5 rounded-t-xl border border-slate-200 border-b-0 shadow-sm shrink-0 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            Planning Assistant
          </h1>
          <Link href="/customer/requirements" className="text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
            Use Manual Search Instead
          </Link>
        </div>
        
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-900 text-xs flex gap-2 items-start">
          <svg className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          <p className="leading-relaxed font-medium">
            <strong>Important:</strong> MedBridge AI is a planning assistant, not a doctor. It cannot diagnose conditions, recommend treatments, or declare a hospital as "best". Always consult a medical professional.
          </p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-slate-50 border-x border-slate-200 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-sm' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 rounded-b-xl border border-slate-200 shadow-sm shrink-0">
        <form onSubmit={handleSend} className="flex gap-2">
          <input 
            type="text" 
            className="flex-1 border border-slate-300 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
            placeholder="Type your planning question here..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={!input.trim()}
            className="bg-slate-900 text-white px-6 py-3 rounded-lg font-bold shadow-sm hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
        <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
          Protected by Privacy Gate. No PII is sent to external LLMs.
        </p>
      </div>
      
    </div>
  );
}

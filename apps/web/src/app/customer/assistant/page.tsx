'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useAuth } from '../../../components/AuthProvider';
import { AIMessage } from '../../../types/models';
// import { ProviderCard } from '../../../components/ProviderCard'; // Will implement or remove later

function AIAssistantPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !currentUser) return;
    
    const userMessage = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      const token = await currentUser.getIdToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://medbridge-india-api-staging.onrender.com';
      const res = await fetch(`${apiUrl}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: conversationId
        })
      });
      
      if (!res.ok) throw new Error("Failed to fetch response");
      
      const data = await res.json();
      
      const assistantMessage = {
        role: 'assistant',
        content: data.text,
        type: data.type,
        data: data.data,
        timestamp: new Date().toISOString()
      };
      
      setConversationId(data.conversationId);
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again later.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setConversationId(null);
  };

  const handleProviderAction = (action: string, providerId: string) => {
    if (action === 'PROFILE') {
      router.push(`/customer/providers/${providerId}`);
    } else if (action === 'QUOTE') {
      router.push(`/customer/request-quote?providerId=${providerId}`);
    }
  };

  return (
    <ProtectedRoute allowedRoles={['CUSTOMER']}>
      <div className="max-w-4xl mx-auto py-8 px-4 h-[calc(100vh-80px)] flex flex-col">
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MedBridge Assistant</h1>
            <p className="text-sm text-gray-500">I can help you find providers, check your requests, or get a quote.</p>
          </div>
          <button 
            onClick={clearConversation}
            className="text-sm px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Clear Conversation
          </button>
        </div>

        <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          
          {/* Message History */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p>Send a message to start.</p>
                <div className="flex gap-2 flex-wrap justify-center max-w-lg mt-4">
                  <button onClick={() => setInput("Find hospitals in Pune")} className="px-3 py-1.5 bg-gray-50 rounded-full text-xs text-gray-600 hover:bg-gray-100 border border-gray-200">"Find hospitals in Pune"</button>
                  <button onClick={() => setInput("What is the status of my request?")} className="px-3 py-1.5 bg-gray-50 rounded-full text-xs text-gray-600 hover:bg-gray-100 border border-gray-200">"What is the status of my request?"</button>
                  <button onClick={() => setInput("I want a quote from Apollo")} className="px-3 py-1.5 bg-gray-50 rounded-full text-xs text-gray-600 hover:bg-gray-100 border border-gray-200">"I want a quote from Apollo"</button>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0 mt-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-l-2xl rounded-tr-2xl' : 'bg-gray-100 text-gray-800 rounded-r-2xl rounded-tl-2xl'} p-4 shadow-sm`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    
                    {/* Render Structured Data */}
                    {msg.type === 'PROVIDER_SEARCH_RESULT' && msg.data?.providers?.length > 0 && (
                      <div className="mt-4 space-y-4">
                        {msg.data.providers.map((provider: any) => (
                          <div key={provider.id} className="bg-white rounded p-4 shadow-sm border border-gray-200 text-gray-800 text-sm">
                            <h4 className="font-bold">{provider.name}</h4>
                            <p className="text-gray-500 mb-2">{[provider.city, provider.state].filter(Boolean).join(', ')}</p>
                            
                            <div className="flex gap-2 mt-3">
                              <button 
                                onClick={() => handleProviderAction('PROFILE', provider.id)}
                                className="px-3 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100"
                              >
                                View Profile
                              </button>
                              <button 
                                onClick={() => handleProviderAction('QUOTE', provider.id)}
                                className="px-3 py-1 bg-green-50 text-green-600 rounded text-xs font-medium hover:bg-green-100"
                              >
                                Request Quote
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {msg.type === 'CASE_STATUS_RESULT' && msg.data?.cases?.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {msg.data.cases.map((c: any) => (
                          <div key={c.id} className="bg-white rounded p-3 shadow-sm border border-gray-200 text-sm text-gray-800 flex justify-between items-center">
                            <div>
                              <div className="font-medium">{c.treatmentName || 'Treatment Request'}</div>
                              <div className="text-gray-500 text-xs">{c.providerName || 'Any Provider'}</div>
                            </div>
                            <div className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-semibold">
                              {c.currentStage.replace(/_/g, ' ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.type === 'ACTION' && msg.data?.action === 'QUOTE_REQUEST' && (
                      <div className="mt-4">
                         <button 
                           onClick={() => router.push(`/customer/request-quote`)}
                           className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm"
                         >
                           Continue to Quote Request
                         </button>
                      </div>
                    )}

                    {msg.type === 'AI_REQUIREMENTS_UPDATE' && msg.data?.requirements && (
                      <div className="mt-4 bg-white rounded p-4 shadow-sm border border-gray-200 text-sm">
                        <h4 className="font-bold text-gray-900 mb-2">Collected Requirements</h4>
                        <ul className="space-y-1 text-gray-700 mb-4">
                          {Object.entries(msg.data.requirements).map(([key, value]) => (
                            <li key={key}><span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {String(value)}</li>
                          ))}
                        </ul>
                        {msg.data.requirements.treatmentId || msg.data.requirements.treatmentName ? (
                          <button 
                            onClick={() => {
                              const params = new URLSearchParams();
                              if (msg.data.requirements.treatmentId) params.set('treatmentId', msg.data.requirements.treatmentId);
                              if (msg.data.requirements.budgetMax) params.set('budgetMax', msg.data.requirements.budgetMax.toString());
                              if (msg.data.requirements.preferredCity) params.set('city', msg.data.requirements.preferredCity);
                              if (msg.data.requirements.requiresAccommodation) params.set('accommodation', 'true');
                              if (msg.data.requirements.requiresLocalTransport) params.set('transport', 'true');
                              router.push(`/customer/options?${params.toString()}`);
                            }}
                            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium shadow-sm"
                          >
                            View Matching Options
                          </button>
                        ) : (
                          <p className="text-gray-500 italic">Please specify a treatment to view options.</p>
                        )}
                      </div>
                    )}

                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div className="bg-gray-100 text-gray-800 rounded-r-2xl rounded-tl-2xl p-4 shadow-sm flex space-x-1 items-center">
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                   <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask MedBridge Assistant..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                disabled={isLoading}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white p-3 rounded-lg flex items-center justify-center transition-colors shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            <p className="text-center text-xs text-gray-500 mt-3 max-w-2xl mx-auto">
              MedBridge provides informational comparisons and general guidance based on available information. It does not provide medical advice or make medical decisions. Patients should consult qualified healthcare professionals before making treatment decisions.
            </p>
          </div>
          
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AIAssistantPage;

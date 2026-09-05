'use client';

import React from 'react';
import Link from 'next/link';
import { Disclaimer } from '../../../components/Disclaimer';

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 bg-gradient-to-br from-indigo-50/50 to-white">
        <h2 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">Find. Compare. Plan.</h2>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl leading-relaxed">
          MedBridge helps you explore healthcare treatment options, neutrally compare providers based on public information, and plan your travel logistics.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/customer/requirements" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-sm transition-all text-center">
            Find Treatment Options
          </Link>
          <Link href="/customer/assistant" className="px-6 py-3 bg-white border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 shadow-sm transition-all text-center flex items-center justify-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
            Explain what you need with AI
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* My Searches */}
        <section className="flex flex-col">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-lg font-bold text-slate-800">Recent Searches</h3>
            <Link href="/customer/searches" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">View All</Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-slate-500 mb-4 text-sm">You haven't made any searches yet.</p>
            <Link href="/customer/requirements" className="text-indigo-600 font-semibold hover:underline text-sm">Start exploring</Link>
          </div>
        </section>

        {/* Shortlisted Options */}
        <section className="flex flex-col">
          <div className="flex justify-between items-center mb-3 px-1">
            <h3 className="text-lg font-bold text-slate-800">Shortlisted Options</h3>
            <Link href="/customer/shortlist" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">View All</Link>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            </div>
            <p className="text-slate-500 text-sm">You haven't shortlisted any options yet.</p>
          </div>
        </section>
      </div>

      {/* Help & Services */}
      <section>
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-1">Value-Added Services</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { title: 'Accommodation', desc: 'Find safe places to stay' },
            { title: 'Transport', desc: 'Airport transfers & daily travel' },
            { title: 'Travel Planning', desc: 'Flights and itineraries' },
            { title: 'Food & Logistics', desc: 'Dietary planning & local assistance' },
            { title: 'Support', desc: 'Document & visa guidance' },
          ].map((service, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors group cursor-default">
              <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-indigo-700 transition-colors">{service.title}</h4>
              <p className="text-sm text-slate-500 mb-3 line-clamp-2">{service.desc}</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide bg-slate-100 text-slate-500 border border-slate-200">
                COMING SOON
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <Disclaimer />
    </div>
  );
}

'use client';

import React from 'react';
import EmptyState from '../../../components/EmptyState';
import Link from 'next/link';
import { Disclaimer } from '../../../components/Disclaimer';

export default function SearchesPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Recent Searches</h1>
          <p className="text-slate-600 mt-2">Resume your past treatment explorations.</p>
        </div>
      </div>
      
      <EmptyState 
        title="No Recent Searches"
        description="You haven't made any treatment searches yet. Start exploring options to see your history here."
        action={
          <Link href="/customer/requirements" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-colors">
            Find Treatment Options
          </Link>
        }
      />

      <Disclaimer className="mt-8" />
    </div>
  );
}

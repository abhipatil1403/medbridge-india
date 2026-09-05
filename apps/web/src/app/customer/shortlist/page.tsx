'use client';

import React from 'react';
import EmptyState from '../../../components/EmptyState';
import Link from 'next/link';
import { Disclaimer } from '../../../components/Disclaimer';

export default function ShortlistPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">My Shortlist</h1>
          <p className="text-slate-600 mt-2">Compare and review your saved healthcare options.</p>
        </div>
      </div>
      
      <EmptyState 
        title="Your shortlist is empty"
        description="You haven't shortlisted any options yet. When you explore treatments, click the 'Shortlist' button to save them here for easy comparison later."
        action={
          <Link href="/customer/requirements" className="inline-block mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-colors">
            Start Exploring
          </Link>
        }
      />

      <Disclaimer className="mt-8" />
    </div>
  );
}

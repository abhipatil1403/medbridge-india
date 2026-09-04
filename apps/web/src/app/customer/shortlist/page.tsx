'use client';

import React from 'react';
import EmptyState from '../../../components/EmptyState';
import Link from 'next/link';

export default function ShortlistPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Shortlist</h1>
      
      <EmptyState 
        title="Your shortlist is empty"
        description="You haven't shortlisted any options yet. When you explore treatments, click the 'Shortlist' button to save them here for easy comparison later."
        action={
          <Link href="/customer/requirements" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
            Explore Options
          </Link>
        }
      />
    </div>
  );
}

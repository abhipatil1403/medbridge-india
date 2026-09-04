'use client';

import React from 'react';
import EmptyState from '../../../components/EmptyState';
import Link from 'next/link';

export default function SearchesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Past Searches</h1>
      
      <EmptyState 
        title="No Past Searches"
        description="You haven't made any treatment searches yet. Start exploring options to see your history here."
        action={
          <Link href="/customer/requirements" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
            Find a Treatment
          </Link>
        }
      />
    </div>
  );
}

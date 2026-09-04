'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProviderServicesAdminPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock loading delay
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Provider Services</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 mb-4">Manage treatment offerings and costs linked to specific providers.</p>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <div className="text-center p-8 border border-dashed border-gray-300 rounded">
            <p className="text-gray-500">Service management interface is currently in development.</p>
            <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs font-semibold text-gray-500 rounded">DEFERRED</span>
          </div>
        )}
      </div>
    </div>
  );
}

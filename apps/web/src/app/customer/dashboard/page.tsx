'use client';

import React from 'react';
import Link from 'next/link';

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">How can we help you plan your treatment journey?</h2>
        <p className="text-gray-600 mb-6">MedBridge helps you explore treatment options, compare hospitals, and plan your logistics based on public information.</p>
        <div className="flex flex-wrap gap-4">
          <Link href="/customer/requirements" className="px-5 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 shadow-sm">
            Find a Treatment
          </Link>
          <Link href="/customer/assistant" className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-md font-medium hover:bg-gray-50 shadow-sm">
            Ask MedBridge AI
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* My Searches */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">My Searches</h3>
            <Link href="/customer/searches" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't made any searches yet.</p>
              <Link href="/customer/requirements" className="text-blue-600 font-medium hover:underline">Start a new search</Link>
            </div>
          </div>
        </section>

        {/* Shortlisted Options */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Shortlisted Options</h3>
            <Link href="/customer/shortlist" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <div className="text-center py-8">
              <p className="text-gray-500">You haven't shortlisted any options yet.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Help & Services */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-4">Would you like help with anything else?</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { title: 'Accommodation', desc: 'Find places to stay near your treatment' },
            { title: 'Transport', desc: 'Local travel options and planning' },
            { title: 'Travel Planning', desc: 'Flights, trains, and itineraries' },
            { title: 'Document Guidance', desc: 'Visa and medical document help' },
            { title: 'Provider Contact', desc: 'Assistance reaching out to hospitals' },
          ].map((service, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
              <h4 className="font-semibold text-gray-800 mb-1">{service.title}</h4>
              <p className="text-xs text-gray-500 mb-3">{service.desc}</p>
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded">Coming Soon</span>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <div className="mt-8 text-xs text-gray-400 text-center max-w-3xl mx-auto">
        MedBridge provides general information and comparison options based on publicly available and verified sources where available. It does not provide medical diagnosis or treatment advice. Patients should consult qualified healthcare professionals before making medical decisions.
      </div>
    </div>
  );
}

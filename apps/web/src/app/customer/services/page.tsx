'use client';

import React from 'react';

export default function ServicesPage() {
  const services = [
    { title: 'Travel Planning', icon: '✈️', desc: 'Flights, trains, and itineraries tailored to your medical schedule.' },
    { title: 'Accommodation Assistance', icon: '🏨', desc: 'Find safe, comfortable places to stay near your chosen provider.' },
    { title: 'Transport Assistance', icon: '🚕', desc: 'Airport transfers and local daily transport.' },
    { title: 'Provider Contact Assistance', icon: '📞', desc: 'We help you communicate effectively with hospitals to get quotes faster.' },
    { title: 'Document Guidance', icon: '📄', desc: 'Checklists for Medical Visas and hospital paperwork.' },
  ];

  return (
    <div className="max-w-4xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Value-Added Services</h1>
      <p className="text-gray-600 mb-6">
        Basic treatment and provider discovery is always free. If you need extra help managing the logistics of your journey, we offer optional value-added services.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((service, idx) => (
          <div key={idx} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-3">{service.icon}</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{service.desc}</p>
            <button disabled className="bg-gray-100 text-gray-500 border border-gray-200 px-4 py-2 rounded text-sm font-medium cursor-not-allowed flex items-center gap-2">
              Coming Soon
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

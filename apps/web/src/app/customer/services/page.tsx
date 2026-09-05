'use client';

import React from 'react';
import { Disclaimer } from '../../../components/Disclaimer';
import { Badge } from '../../../components/Badge';

export default function ServicesPage() {
  const services = [
    { title: 'Travel Planning', icon: '✈️', desc: 'Flights, trains, and itineraries tailored to your medical schedule.' },
    { title: 'Accommodation Assistance', icon: '🏨', desc: 'Find safe, comfortable places to stay near your chosen provider.' },
    { title: 'Transport Assistance', icon: '🚕', desc: 'Airport transfers and local daily transport.' },
    { title: 'Provider Contact Assistance', icon: '📞', desc: 'We help you communicate effectively with hospitals to get quotes faster.' },
    { title: 'Document Guidance', icon: '📄', desc: 'Checklists for Medical Visas and hospital paperwork.' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="pb-6 border-b border-slate-200">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Value-Added Services</h1>
        <p className="text-slate-600 max-w-2xl">
          Basic treatment discovery and provider comparison is always free. If you need extra help managing the logistics of your journey, we offer optional value-added services.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group flex flex-col">
            <div className="text-4xl mb-4 bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center border border-slate-100 group-hover:scale-110 transition-transform">
              {service.icon}
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">{service.title}</h3>
            <p className="text-sm text-slate-600 mb-6 flex-1 leading-relaxed">{service.desc}</p>
            <div className="mt-auto">
              <Badge variant="outline" className="w-full justify-center py-1.5 border-slate-200 text-slate-400 bg-slate-50 shadow-inner">
                COMING SOON
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      <Disclaimer className="mt-8" />
    </div>
  );
}

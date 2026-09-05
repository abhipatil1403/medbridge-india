import React from 'react';

interface DisclaimerProps {
  className?: string;
  compact?: boolean;
}

export function Disclaimer({ className = '', compact = false }: DisclaimerProps) {
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg text-amber-900 ${compact ? 'p-3 text-xs' : 'p-4 text-sm'} ${className}`}>
      <div className="flex gap-3">
        <div className="shrink-0 mt-0.5">
          <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
             <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-semibold mb-1">Informational Platform Only</p>
          <p className="leading-relaxed opacity-90">
            MedBridge provides informational options and comparisons based on available public data. 
            We do not provide medical advice, diagnosis, or recommend specific treatments or hospitals. 
            Estimated costs and logistical information are not guaranteed. Always consult a qualified 
            healthcare professional before making medical decisions.
          </p>
        </div>
      </div>
    </div>
  );
}

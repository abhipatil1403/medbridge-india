'use client';

import React from 'react';
import Link from 'next/link';
import EmptyState from '../../../components/EmptyState';

export default function AssistantPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">MedBridge AI Planning Assistant</h1>
        <p className="text-gray-600 mb-4">
          Our AI assistant can help you figure out your logistics, compare public provider information, and narrow down your preferences.
        </p>
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-amber-800 text-sm mb-6">
          <strong>Important:</strong> MedBridge AI is a planning assistant, not a doctor. It cannot diagnose conditions, recommend medical treatments, or tell you which hospital is "best" for your health. Always consult a qualified medical professional for healthcare decisions.
        </div>
      </div>

      <EmptyState 
        title="Start a Conversation"
        description="The AI Assistant is currently in development. Soon you will be able to chat with it to plan your travel and explore options safely."
        action={
          <Link href="/customer/requirements" className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700">
            Use Manual Search Instead
          </Link>
        }
      />
    </div>
  );
}

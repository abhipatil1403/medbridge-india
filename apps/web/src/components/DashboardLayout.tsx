'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Role } from '../types/auth';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
  roleContext?: string;
}

export default function DashboardLayout({ children, navItems, title, roleContext }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { userProfile, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Mobile Header */}
      <div className="md:hidden bg-indigo-700 text-white flex justify-between items-center p-4 shadow-md z-30 relative">
        <div className="font-bold text-xl tracking-tight">MedBridge</div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 -mr-2 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-white"
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0
        fixed md:sticky top-0 left-0 h-[100dvh] w-64 bg-white border-r border-slate-200 shadow-sm z-30
        transition-transform duration-200 ease-in-out flex flex-col
      `}>
        <div className="p-6 hidden md:block border-b border-slate-100">
          <div className="font-extrabold text-2xl text-indigo-700 tracking-tight">MedBridge</div>
          {roleContext && <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{roleContext}</div>}
        </div>
        
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href) && item.href.length > 1);
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                {item.icon && <span className={`shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`}>{item.icon}</span>}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Sign Out (inside sidebar) */}
        <div className="p-4 border-t border-slate-100 md:hidden">
           <div className="text-sm font-medium text-slate-800 mb-3 px-2 truncate">
              {userProfile?.displayName || userProfile?.email}
           </div>
           <button 
              onClick={() => signOut()}
              className="w-full text-left px-3 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              Sign Out
            </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-[100dvh] w-full min-w-0">
        {/* Top Navigation (Desktop) */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10 hidden md:flex h-16 shrink-0">
          <div className="flex-1 px-8 flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800 truncate">{title || 'Dashboard'}</h1>
            
            <div className="flex items-center gap-5 ml-4">
              <div className="text-sm font-medium text-slate-600 truncate max-w-[200px]" title={userProfile?.email || ''}>
                {userProfile?.displayName || userProfile?.email}
              </div>
              <button 
                onClick={() => signOut()}
                className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Title */}
        <div className="md:hidden bg-white px-5 py-3 border-b border-slate-200 shadow-sm shrink-0">
          <h1 className="text-lg font-bold text-slate-800 truncate">{title || 'Dashboard'}</h1>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

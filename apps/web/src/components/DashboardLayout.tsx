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
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-700 text-white flex justify-between items-center p-4 shadow-md z-20">
        <div className="font-bold text-xl">MedBridge</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Sidebar */}
      <div className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:block md:w-64 bg-white border-r border-gray-200 shadow-sm
        fixed md:sticky top-0 h-screen overflow-y-auto z-10 w-full md:w-64
      `}>
        <div className="p-6 hidden md:block">
          <div className="font-bold text-2xl text-blue-700">MedBridge</div>
          {roleContext && <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{roleContext}</div>}
        </div>
        
        <nav className="px-4 py-6 md:py-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  block px-3 py-2.5 rounded-md text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                `}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10 hidden md:flex">
          <div className="flex-1 px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">{title || 'Dashboard'}</h1>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                {userProfile?.displayName || userProfile?.email}
              </div>
              <button 
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium border border-gray-300 rounded px-3 py-1.5"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Title (when top nav is hidden) */}
        <div className="md:hidden bg-white px-4 py-3 border-b shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">{title || 'Dashboard'}</h1>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

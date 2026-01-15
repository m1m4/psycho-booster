'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export function Navbar() {
    const pathname = usePathname();
    const { user, role, logout } = useAuth();

    // Hide navbar on print page
    if (pathname === '/print') {
        return null;
    }

    const allNavItems = [
        { label: 'בית', href: '/' },
        { label: 'הוספה', href: '/submit' },
        { label: 'מצב בוחן', href: '/exam' },
        { label: 'תיבת דואר', href: '/inbox' },
        { label: 'צפייה', href: '/viewer' },
        { label: 'אישור', href: '/approval' }, // Added approval link
        { label: 'פיתוח', href: '/dev' },
    ];

    // Filter items based on role
    const navItems = allNavItems.filter(item => {
        if (!role) return false;
        if (role === 'admin') return true;
        if (role === 'tester') return item.href === '/exam' || item.label === 'בית';
        return false;
    });

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200" dir="rtl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="text-xl font-bold text-black hover:opacity-80 transition-opacity">
                        Psycho Booster
                    </Link>

                    {user && (
                        <nav className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${pathname === item.href
                                        ? 'bg-gray-100 text-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {user && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-medium hidden sm:block">
                                {role === 'admin' ? 'מנהל' : 'בוחן'}
                            </span>
                            <button
                                onClick={() => logout()}
                                className="text-xs font-bold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                התנתקות
                            </button>
                        </div>
                    )}
                    {!user && pathname !== '/login' && (
                        <Link 
                            href="/login"
                            className="text-sm font-bold text-blue-600 hover:text-blue-800"
                        >
                            כניסת מנהלים
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

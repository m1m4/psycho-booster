'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export function Navbar() {
    const pathname = usePathname();
    const { user } = useAuth();

    // Hide navbar on print page
    if (pathname === '/print') {
        return null;
    }

    const navItems = [
        { label: 'בית', href: '/' },
        { label: 'הוספה', href: '/submit' },
        { label: 'מצב בוחן', href: '/exam' },
        { label: 'תיבת דואר', href: '/inbox' },
        { label: 'צפייה', href: '/viewer' },
        { label: 'פיתוח', href: '/dev' },
    ];

    return (
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
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
                    <p className="text-xs text-gray-500 font-medium hidden sm:block">פאנל ניהול</p>
                </div>
            </div>
        </header>
    );
}

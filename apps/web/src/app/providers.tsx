'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import React, { useState } from 'react';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { AuthGuard } from '@/lib/auth/AuthGuard';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60 * 1000, // 1 minute
            },
        },
    }));

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <AuthGuard>
                    {children}
                </AuthGuard>
            </AuthProvider>
        </QueryClientProvider>
    );
}

'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { SelectionScreen, ExamFilters } from '@/components/features/exam/SelectionScreen';
import { ExamManager } from '@/components/features/exam/ExamManager';

export default function ExamPage() {
    const [filters, setFilters] = useState<ExamFilters | null>(null);

    return (
        <div className="min-h-screen bg-white font-sans" dir="rtl">
            <main className="max-w-4xl mx-auto px-4 py-8">
                {!filters ? (
                    <SelectionScreen onStart={setFilters} />
                ) : (
                    <ExamManager 
                        filters={filters} 
                        onExit={() => setFilters(null)} 
                    />
                )}
            </main>
        </div>
    );
}

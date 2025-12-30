'use client';

import React from 'react';
import { GeneratorTab } from '@/components/features/submit/tabs/GeneratorTab';

export default function AutomationPage() {
    const handleGenerate = (prompt: string, category: string) => {
        console.log('Generate:', prompt, category);
        alert('Generator feature coming soon (connected to UI)');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white" dir="rtl">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">אוטומציה</h1>
                    <p className="text-gray-500 dark:text-gray-400">מחולל שאלות (AI)</p>
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm min-h-[500px]">
                    <GeneratorTab onGenerate={handleGenerate} />
                </div>
            </main>
        </div>
    );
}

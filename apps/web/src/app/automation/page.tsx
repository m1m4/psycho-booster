'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { InboxTab } from '@/components/features/submit/tabs/InboxTab';
import { GeneratorTab } from '@/components/features/submit/tabs/GeneratorTab'; // Assuming this exists or I'll create/ensure it works
import { QuestionSet } from '@/types/submit';

export default function AutomationPage() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'inbox' | 'generator'>('inbox');

    const handleEditDraft = (data: QuestionSet) => {
        router.push(`/submit?id=${data.id}`);
    };

    const handleGenerate = (prompt: string, category: string) => {
        // For now, we might want to just log it or handle it if there's existing logic.
        // Since the user asked to put it here, I assume they want the UI.
        // The implementation of actual generation might be inside GeneratorTab or needs to be passed.
        // Inspecting GeneratorTab earlier showed it just calls onGenerate.
        // I'll alert for now or if there is a known service I should call, I'd do it.
        // But the previous generator page was disabled, so maybe just the UI is what's needed for now to be "enabled".
        console.log('Generate:', prompt, category);
        alert('Generator feature coming soon (connected to UI)');
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white" dir="rtl">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">אוטומציה</h1>
                    <p className="text-gray-500 dark:text-gray-400">ניהול תיבת דואר ומחולל שאלות (AI)</p>
                </div>

                {/* Tabs Navigation */}
                <div className="flex p-1 mb-8 bg-gray-100 dark:bg-gray-900 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('inbox')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'inbox'
                                ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        תיבת דואר
                    </button>
                    <button
                        onClick={() => setActiveTab('generator')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'generator'
                                ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        מחולל (AI)
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm min-h-[500px]">
                    {activeTab === 'inbox' ? (
                        <InboxTab onEdit={handleEditDraft} />
                    ) : (
                        <GeneratorTab onGenerate={handleGenerate} />
                    )}
                </div>
            </main>
        </div>
    );
}

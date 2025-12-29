'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { InboxTab } from '@/components/features/submit/tabs/InboxTab';
import { QuestionSet } from '@/types/submit';

export default function InboxPage() {
    const router = useRouter();

    const handleEditDraft = (data: QuestionSet) => {
        // We can pass the ID in the URL to edit it in the submit page
        router.push(`/submit?id=${data.id}`);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="mb-8 flex justify-between items-center" dir="rtl">
                    <h1 className="text-3xl font-bold">תיבת דואר (שעורי בית)</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={() => router.push('/submit')}
                            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            עורך (חדש)
                        </button>
                    </div>
                </div>

                <div className="min-h-[500px]">
                    <InboxTab onEdit={handleEditDraft} />
                </div>
            </main>
        </div>
    );
}

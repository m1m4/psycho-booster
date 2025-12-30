'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { QuestionsTable } from '@/components/features/viewer/QuestionsTable';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function InboxPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'initial' | 'final'>('initial');
    const [initialReviewCount, setInitialReviewCount] = useState<number | null>(null);

    const currentUserAuthorName = user?.email?.split('@')[0];

    useEffect(() => {
        async function fetchCount() {
            if (!currentUserAuthorName) return;
            try {
                // Note: This query matches the InboxTable query
                const q = query(
                    collection(db, 'question_sets'),
                    where('status', '==', 'pending'),
                    where('author', '!=', currentUserAuthorName)
                );
                const snapshot = await getCountFromServer(q);
                setInitialReviewCount(snapshot.data().count);
            } catch (err) {
                console.error("Error fetching inbox count:", err);
            }
        }

        fetchCount();
        // Set up interval to refresh count occasionally? 
        // For now, just on mount/user change.
    }, [currentUserAuthorName]);

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white" dir="rtl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">תיבת דואר</h1>
                    <p className="text-gray-500 dark:text-gray-400">ניהול ובדיקת שאלות הממתינות לאישור</p>
                </div>

                {/* Tabs Navigation */}
                <div className="flex p-1 mb-8 bg-gray-100 dark:bg-gray-900 rounded-xl w-fit">
                    <button
                        onClick={() => setActiveTab('initial')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'initial'
                            ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        בדיקה ראשונית
                        {initialReviewCount !== null && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'initial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                {initialReviewCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('final')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'final'
                            ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        אישור סופי
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm min-h-[500px]">
                    {activeTab === 'initial' ? (
                        currentUserAuthorName ? (
                            <QuestionsTable
                                title="תיבת דואר"
                                fixedFilters={{
                                    status: 'pending',
                                    excludeAuthor: currentUserAuthorName
                                }}
                                showAddButton={false}
                                showStatistics={false}
                            />
                        ) : (
                            <div className="text-center p-8 text-gray-500">אנא התחבר למערכת לצפייה בתיבת הדואר</div>
                        )
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-medium">אין משימות לאישור סופי כרגע</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

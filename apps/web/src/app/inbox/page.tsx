'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { QuestionsTable } from '@/components/features/viewer/QuestionsTable';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useQuery } from '@tanstack/react-query';

export default function InboxPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'pending' | 'initial'>('pending');
    const currentUserAuthorName = user?.email?.split('@')[0];

    // Use React Query for counts to ensure they sync with other data
    const { data: pendingCount } = useQuery({
        queryKey: ['inboxCount', 'pending', currentUserAuthorName],
        queryFn: async () => {
            if (!currentUserAuthorName) return 0;
            const q = query(
                collection(db, 'question_sets'),
                where('status', '==', 'pending'),
                where('author', '!=', currentUserAuthorName)
            );
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        },
        enabled: !!currentUserAuthorName,
    });

    const { data: finalCount } = useQuery({
        queryKey: ['inboxCount', 'initial'],
        queryFn: async () => {
            const q = query(
                collection(db, 'question_sets'),
                where('status', '==', 'initial')
            );
            const snapshot = await getCountFromServer(q);
            return snapshot.data().count;
        },
    });

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
                        onClick={() => setActiveTab('pending')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'pending'
                            ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        ממתין לבדיקה
                        {pendingCount !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'pending' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                {pendingCount}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('initial')}
                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'initial'
                            ? 'bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                            }`}
                    >
                        אישור סופי
                        {finalCount !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'initial' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'bg-gray-200 dark:bg-gray-800'}`}>
                                {finalCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-black rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm min-h-[500px]">
                    {!currentUserAuthorName ? (
                        <div className="text-center p-8 text-gray-500">אנא התחבר למערכת לצפייה בתיבת הדואר</div>
                    ) : activeTab === 'pending' ? (
                        <QuestionsTable
                            title="ממתין לבדיקה ראשונית"
                            fixedFilters={{
                                status: 'pending',
                                excludeAuthor: currentUserAuthorName
                            }}
                            showAddButton={false}
                            showStatistics={false}
                        />
                    ) : (
                        <QuestionsTable
                            title="אישור סופי למערכת"
                            fixedFilters={{ status: 'initial' }}
                            showApproveButton={true}
                            showAddButton={false}
                            showStatistics={false}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

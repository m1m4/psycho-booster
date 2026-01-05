'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStatistics, subscribeToStatistics } from '@/lib/firebase/db';
import { CATEGORY_LABELS } from '@/components/features/submit/QuestionPreview';
import { SUBCATEGORY_OPTIONS, TOPIC_OPTIONS } from '@/types/submit';


interface StatisticsPanelProps {
    onStatusClick?: (status: string) => void;
    activeStatus?: string;
}

export function StatisticsPanel({ onStatusClick, activeStatus }: StatisticsPanelProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['statistics'],
        queryFn: getStatistics,
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 mins as we have real-time updates
    });

    useEffect(() => {
        // Subscribe to real-time updates
        const unsubscribe = subscribeToStatistics((newStats) => {
            // Manually update the React Query cache when new data arrives
            queryClient.setQueryData(['statistics'], newStats);
        });

        return () => unsubscribe();
    }, [queryClient]);

    if (isLoading) return <div className="p-4 bg-white rounded-xl animate-pulse h-32"></div>;
    if (isError || !stats) return null;

    const { totalQuestions = 0, byStatus = {}, byCategory = {}, bySubcategory = {}, byTopic = {} } = stats;

    // Requested order: Approved -> Initial -> Pending
    const statusOrder = ['approved', 'initial', 'pending'];
    const statusLabels: Record<string, { label: string, color: string }> = {
        approved: { label: 'מאושר', color: 'bg-green-500' },
        initial: { label: 'בדיקה ראשונית', color: 'bg-blue-500' },
        pending: { label: 'ממתין לבדיקה', color: 'bg-orange-400' }
    };

    const getLabel = (value: string, options: any) => {
        const option = Object.values(options).flat().find((opt: any) => opt.value === value) as any;
        return option ? option.label : value;
    };

    const closeModal = () => setSelectedCategory(null);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Questions */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
                <span className="text-sm text-gray-500 font-medium">סה"כ שאלות</span>
                <span className="text-4xl font-bold text-blue-600 mt-2">{totalQuestions}</span>
            </div>

            {/* Status Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="text-sm text-gray-500 font-bold mb-4">סטטוסים</h4>
                <div className="space-y-2">
                    {statusOrder.map(status => (
                        <button
                            key={status}
                            onClick={() => onStatusClick?.(status)}
                            className={`w-full flex justify-between text-sm p-1.5 rounded-md transition-all cursor-pointer group border ${activeStatus === status
                                ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/20'
                                : 'hover:bg-gray-50 border-transparent'
                                }`}
                            title={`סינון לפי ${statusLabels[status].label}`}
                        >
                            <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${statusLabels[status].color} ${activeStatus === status ? 'ring-2 ring-white' : ''}`}></span>
                                <span className={`transition-colors font-medium ${activeStatus === status ? 'text-blue-700' : 'group-hover:text-blue-600'}`}>
                                    {statusLabels[status].label}
                                </span>
                            </span>
                            <span className={`font-bold ${activeStatus === status ? 'text-blue-700' : ''}`}>
                                {byStatus[status] || 0}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm col-span-1 md:col-span-2">
                <h4 className="text-sm text-gray-500 font-bold mb-4">חלוקה לנושאים</h4>
                <div className="grid grid-cols-3 gap-4">
                    {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
                        const count = byCategory[cat] || 0;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className="bg-gray-100 p-3 rounded-lg text-center hover:bg-gray-200 transition-colors cursor-pointer group"
                            >
                                <div className="text-xs text-gray-500 mb-1 group-hover:text-gray-700">{label}</div>
                                <div className="text-lg font-bold">{count as number}</div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Category Details Modal */}
            {selectedCategory && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border border-gray-100" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">פירוט {CATEGORY_LABELS[selectedCategory]}</h3>
                            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Subcategories */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">תתי נושאים</h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {(SUBCATEGORY_OPTIONS[selectedCategory as keyof typeof SUBCATEGORY_OPTIONS] || []).map(opt => (
                                        <div key={opt.value} className="flex justify-between p-3 bg-gray-50 rounded-xl">
                                            <span className="text-sm font-medium">{opt.label}</span>
                                            <span className="font-bold text-blue-600">{bySubcategory[opt.value] || 0}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Topics (Quantitative only) */}
                            {selectedCategory === 'quantitative' && (
                                <div>
                                    <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">נושאים (Topics)</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {(TOPIC_OPTIONS[selectedCategory as keyof typeof TOPIC_OPTIONS] || []).map(opt => (
                                            <div key={opt.value} className="flex justify-between p-2 bg-blue-50/50 rounded-lg">
                                                <span className="text-xs">{opt.label}</span>
                                                <span className="font-bold text-xs">{byTopic[opt.value] || 0}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={closeModal}
                            className="w-full mt-8 py-3 bg-gray-100 text-gray-900 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                        >
                            סגור
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


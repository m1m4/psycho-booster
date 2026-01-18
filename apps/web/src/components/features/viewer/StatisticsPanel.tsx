'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getStatistics, subscribeToStatistics } from '@/lib/firebase/db';
import { CATEGORY_LABELS } from '@/components/features/submit/QuestionPreview';
import { SUBCATEGORY_OPTIONS, TOPIC_OPTIONS } from '@/types/submit';


interface StatisticsPanelProps {
    onStatusClick?: (status: string) => void;
    activeStatus?: string;
    onCategoryClick?: (category: string) => void;
    activeCategory?: string;
    onSubcategoryClick?: (subcategory: string) => void;
    activeSubcategory?: string | string[];
    onTopicClick?: (topic: string) => void;
    activeTopic?: string | string[];
}

export function StatisticsPanel({ 
    onStatusClick, 
    activeStatus,
    onCategoryClick,
    activeCategory,
    onSubcategoryClick,
    activeSubcategory,
    onTopicClick,
    activeTopic
}: StatisticsPanelProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [showSubcategories, setShowSubcategories] = useState(false);
    const [expandedSubcategories, setExpandedSubcategories] = useState<Set<string>>(new Set());
    const queryClient = useQueryClient();

    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['statistics'],
        queryFn: getStatistics,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        const unsubscribe = subscribeToStatistics((newStats) => {
            queryClient.setQueryData(['statistics'], newStats);
        });
        return () => unsubscribe();
    }, [queryClient]);

    useEffect(() => {
        if (selectedCategory) {
            setShowSubcategories(false);
            setExpandedSubcategories(new Set()); // Reset on category change
        }
    }, [selectedCategory]);

    const toggleSubcategory = (subValue: string) => {
        setExpandedSubcategories(prev => {
            const next = new Set(prev);
            if (next.has(subValue)) {
                next.delete(subValue);
            } else {
                next.add(subValue);
            }
            return next;
        });
    };

    if (isLoading) return <div className="p-4 bg-white rounded-xl animate-pulse h-32"></div>;
    if (isError || !stats) return null;

    const { totalQuestions = 0, byStatus = {}, byCategory = {}, bySubcategory = {}, byTopic = {} } = stats;

    const statusOrder = ['approved', 'initial', 'pending'];
    const statusLabels: Record<string, { label: string, color: string }> = {
        approved: { label: 'מאושר', color: 'bg-green-500' },
        initial: { label: 'בדיקה ראשונית', color: 'bg-blue-500' },
        pending: { label: 'ממתין לבדיקה', color: 'bg-orange-400' }
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
                        const isActive = activeCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`p-3 rounded-lg text-center transition-all cursor-pointer group border ${isActive
                                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/20'
                                    : 'bg-gray-100 border-transparent hover:bg-gray-200'
                                    }`}
                                title="לחץ לפירוט וסינון"
                            >
                                <div className={`text-xs mb-1 ${isActive ? 'text-blue-700 font-medium' : 'text-gray-500 group-hover:text-gray-700'}`}>{label}</div>
                                <div className={`text-lg font-bold ${isActive ? 'text-blue-700' : ''}`}>{count as number}</div>
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
                            {/* Filter by Main Category Button */}
                            <button 
                                onClick={() => {
                                    onCategoryClick?.(selectedCategory);
                                    closeModal();
                                }}
                                className={`w-full p-3 rounded-xl border text-center transition-all ${activeCategory === selectedCategory 
                                    ? 'bg-blue-100 border-blue-300 text-blue-800 font-bold' 
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'}`}
                            >
                                {activeCategory === selectedCategory ? 'הסר סינון קטגוריה' : `סנן לפי ${CATEGORY_LABELS[selectedCategory]}`}
                            </button>

                                {/* Subcategories Section */}
                                <div>
                                    {selectedCategory === 'english' ? (
                                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl mb-2 flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-700">תתי נושאים</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setShowSubcategories(prev => !prev)}
                                            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl mb-2 transition-all group"
                                        >
                                            <span className="text-sm font-bold text-gray-700">תתי נושאים</span>
                                            <svg className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform ${showSubcategories ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    )}
                                    
                                    {(showSubcategories || selectedCategory === 'english') && (
                                <div className="grid grid-cols-1 gap-2 max-h-[250px] overflow-y-auto pr-1">
                                  {(SUBCATEGORY_OPTIONS[selectedCategory as keyof typeof SUBCATEGORY_OPTIONS] || []).map(opt => {
                                    const isActive = Array.isArray(activeSubcategory)
                                      ? activeSubcategory.includes(opt.value)
                                      : activeSubcategory === opt.value;
                                    return (
                                      <button
                                        key={opt.value}
                                        onClick={() => {
                                          onSubcategoryClick?.(opt.value);
                                          closeModal();
                                        }}
                                        className={`flex justify-between p-3 rounded-xl w-full transition-all text-right ${isActive
                                          ? 'bg-blue-50 border border-blue-200 ring-1 ring-blue-500/20'
                                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'}`}
                                      >
                                        <span className={`text-sm font-medium ${isActive ? 'text-blue-800' : ''}`}>{opt.label}</span>
                                        <span className={`font-bold ${isActive ? 'text-blue-600' : 'text-blue-600'}`}>{bySubcategory[opt.value] || 0}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>


                            {/* Topics (Iterate over Subcategories to find relevant Topics) */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">נושאים (Topics)</h4>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                    {(SUBCATEGORY_OPTIONS[selectedCategory as keyof typeof SUBCATEGORY_OPTIONS] || []).map(subOpt => {
                                        const subTopics = TOPIC_OPTIONS[subOpt.value];
                                        if (!subTopics) return null;

                                        const isExpanded = expandedSubcategories.has(subOpt.value);

                                        return (
                                            <div key={subOpt.value} className="border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                                                <button 
                                                    onClick={() => toggleSubcategory(subOpt.value)}
                                                    className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors text-right group"
                                                >
                                                    <span className="text-sm font-bold text-gray-700">{subOpt.label}</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                            {bySubcategory[subOpt.value] || 0}
                                                        </span>
                                                        <svg 
                                                            className={`w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                                            fill="none" 
                                                            stroke="currentColor" 
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </button>
                                                
                                                {isExpanded && (
                                                    <div className="p-3 grid grid-cols-1 gap-2 bg-white animate-in slide-in-from-top-2 duration-200">
                                                        {subTopics.map(opt => {
                                                            const isActive = Array.isArray(activeTopic)
                                                                ? activeTopic.includes(opt.value)
                                                                : activeTopic === opt.value;
                                                            return (
                                                                <button 
                                                                    key={opt.value} 
                                                                    onClick={() => {
                                                                        onTopicClick?.(opt.value);
                                                                        closeModal();
                                                                    }}
                                                                    className={`flex justify-between p-2.5 rounded-lg w-full transition-all text-right border ${isActive
                                                                        ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-500/10'
                                                                        : 'bg-gray-50/50 hover:bg-gray-100 border-transparent'
                                                                    }`}
                                                                >
                                                                    <span className={`text-xs font-medium ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>{opt.label}</span>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className={`font-bold text-xs ${isActive ? 'text-blue-800' : 'text-blue-600'}`}>
                                                                            {byTopic[opt.value] || 0}
                                                                        </span>
                                                                        {stats.byTopicDifficulty?.[opt.value] && (
                                                                            <div className="flex gap-1 ml-1 scale-90 origin-right">
                                                                                <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-[9px] font-bold border border-green-200 shadow-sm" title="קל">
                                                                                    {stats.byTopicDifficulty[opt.value].easy || 0}
                                                                                </span>
                                                                                <span className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-[9px] font-bold border border-yellow-200 shadow-sm" title="בינוני">
                                                                                    {stats.byTopicDifficulty[opt.value].medium || 0}
                                                                                </span>
                                                                                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-[9px] font-bold border border-red-200 shadow-sm" title="קשה">
                                                                                    {stats.byTopicDifficulty[opt.value].hard || 0}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
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


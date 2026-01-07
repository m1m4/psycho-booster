'use client';

import React, { useState, useMemo } from 'react';
import { SUBCATEGORY_OPTIONS, TOPIC_OPTIONS } from '@/types/submit';

interface SelectionScreenProps {
    onStart: (filters: ExamFilters) => void;
}

export interface ExamFilters {
    categories: string[];
    subcategories: string[];
    topics: string[];
    difficulties: string[];
    limit: number | 'all';
}

const CATEGORIES = [
    { label: 'כמותי', value: 'quantitative', icon: '📐' },
    { label: 'מילולי', value: 'verbal', icon: '📚' },
    { label: 'אנגלית', value: 'english', icon: '🅰️' },
];

const DIFFICULTIES = [
    { label: 'נמוך', value: 'easy', color: 'bg-green-100 text-green-700 border-green-200' },
    { label: 'בינוני', value: 'medium', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { label: 'גבוה', value: 'hard', color: 'bg-red-100 text-red-700 border-red-200' },
];

const LIMIT_OPTIONS = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '20', value: 20 },
    { label: 'הכל', value: 'all' },
];

export function SelectionScreen({ onStart }: SelectionScreenProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
    const [selectedLimit, setSelectedLimit] = useState<number | 'all'>(10);

    const toggle = (list: string[], value: string, setList: (l: string[]) => void) => {
        if (list.includes(value)) {
            setList(list.filter(item => item !== value));
        } else {
            setList([...list, value]);
        }
    };

    const availableSubcategories = useMemo(() => {
        if (selectedCategories.length === 0) return [];
        return Object.entries(SUBCATEGORY_OPTIONS)
            .filter(([cat]) => selectedCategories.includes(cat))
            .flatMap(([cat, options]) => options.map(opt => ({ ...opt, category: cat })));
    }, [selectedCategories]);

    const availableTopics = useMemo(() => {
        if (selectedSubcategories.length === 0) return [];
        return selectedSubcategories.flatMap(sub => {
             const topics = TOPIC_OPTIONS[sub];
             if (!topics) return [];
             return topics.map(t => ({...t, subcategory: sub}));
        });
    }, [selectedSubcategories]);

    const handleStart = () => {
        onStart({
            categories: selectedCategories,
            subcategories: selectedSubcategories,
            topics: selectedTopics,
            difficulties: selectedDifficulties,
            limit: selectedLimit,
        });
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500" dir="rtl">
            <div className="text-center mb-12 space-y-3">
                <span className="inline-block p-3 rounded-2xl bg-blue-50 text-blue-600 mb-2">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </span>
                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">הגדרת בוחן</h1>
                <p className="text-lg text-gray-500 max-w-md mx-auto">בחרו את נושאי הלימוד והרמה הרצויה כדי לייצר מבחן תרגול מותאם אישית</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Scope Selection */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Categories */}
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                            תחום לימוד
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.value}
                                    onClick={() => toggle(selectedCategories, cat.value, setSelectedCategories)}
                                    className={`
                                        relative group flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200
                                        ${selectedCategories.includes(cat.value)
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-blue-200 hover:bg-white'}
                                    `}
                                >
                                    <span className="text-2xl filter grayscale group-hover:grayscale-0 transition-all">{cat.icon}</span>
                                    <span className="font-bold text-lg">{cat.label}</span>

                                </button>
                            ))}
                        </div>
                    </section>
                    
                    {/* Drill Down (Subcategories & Topics) */}
                    {(availableSubcategories.length > 0 || availableTopics.length > 0) && (
                         <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                             
                             {/* Subcategories */}
                            {availableSubcategories.length > 0 && (
                                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                                        נושא ראשי
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSubcategories.map(sub => (
                                            <button
                                                key={sub.value}
                                                onClick={() => toggle(selectedSubcategories, sub.value, setSelectedSubcategories)}
                                                className={`
                                                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                                                    ${selectedSubcategories.includes(sub.value)
                                                    ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}
                                                `}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {/* Topics */}
                            {availableTopics.length > 0 && (
                                <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                                        נושא משני
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {availableTopics.map(topic => (
                                            <button
                                                key={topic.value}
                                                onClick={() => toggle(selectedTopics, topic.value, setSelectedTopics)}
                                                className={`
                                                    px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all
                                                    ${selectedTopics.includes(topic.value)
                                                    ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-purple-200'}
                                                `}
                                            >
                                                {topic.label}
                                            </button>
                                        ))}
                                    </div>
                                </section>
                            )}
                         </div>
                    )}
                </div>

                {/* Right Column: Settings */}
                <div className="space-y-8">
                     
                     {/* Difficulty */}
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                             <span className="w-1 h-6 bg-gray-800 rounded-full"></span>
                             רמת קושי
                        </h3>
                        <div className="space-y-3">
                            {DIFFICULTIES.map(diff => (
                                <button
                                    key={diff.value}
                                    onClick={() => toggle(selectedDifficulties, diff.value, setSelectedDifficulties)}
                                    className={`
                                        w-full flex items-center justify-between p-3 rounded-xl border transition-all
                                        ${selectedDifficulties.includes(diff.value)
                                        ? diff.color + ' border-current shadow-sm'
                                        : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'}
                                    `}
                                >
                                    <span className="font-bold">{diff.label}</span>
                                    {selectedDifficulties.includes(diff.value) && (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Question Limit */}
                    <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 h-fit">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                             <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
                             אורך הבוחן
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {LIMIT_OPTIONS.map(opt => (
                                <button
                                    key={String(opt.value)}
                                    onClick={() => setSelectedLimit(opt.value as number | 'all')}
                                    className={`
                                        flex-1 min-w-[60px] py-2 rounded-lg text-sm font-bold border transition-all
                                        ${selectedLimit === opt.value
                                        ? 'bg-teal-500 text-white border-teal-500 shadow-md'
                                        : 'bg-white text-gray-500 border-gray-200 hover:border-teal-300'}
                                    `}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Start Button */}
                    <div className="pt-4">
                        <button
                            onClick={handleStart}
                            disabled={selectedCategories.length === 0}
                            className={`
                                w-full py-4 rounded-2xl text-xl font-bold shadow-xl transition-all transform active:scale-95
                                ${selectedCategories.length > 0 
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-2xl hover:from-blue-700 hover:to-indigo-700' 
                                : 'bg-gray-100 text-gray-300 cursor-not-allowed'}
                            `}
                        >
                            התחל בוחן
                        </button>
                        <p className="text-center text-xs text-gray-400 mt-3">
                            {selectedCategories.length === 0 ? 'אנא בחר תחום לימוד אחד לפחות' : 'בהצלחה!'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

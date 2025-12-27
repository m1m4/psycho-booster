'use client';

import React from 'react';
import { QuestionFilters, SUBCATEGORY_OPTIONS } from '@/types/submit';

interface FilterPanelProps {
    filters: QuestionFilters;
    onChange: (newFilters: QuestionFilters) => void;
    onClose: () => void;
}

const CREATORS = ['unknown', 'DatabaseSeeder']; // In a real app, fetch unique authors or hardcode known admins

export function FilterPanel({ filters, onChange, onClose }: FilterPanelProps) {

    const handleChange = (key: keyof QuestionFilters, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const handleTimeRangeChange = (range: QuestionFilters['timeRange']) => {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = new Date(); // end is now

        switch (range) {
            case 'today':
                start = new Date(now.setHours(0, 0, 0, 0));
                break;
            case 'lastWeek':
                start = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'lastMonth':
                start = new Date(now.setMonth(now.getMonth() - 1));
                break;
            default:
                start = null;
                end = null;
        }

        onChange({
            ...filters,
            timeRange: range,
            startDate: start,
            endDate: end
        });
    };


    const panelRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const getInputClasses = (hasValue: boolean) => {
        const base = "w-full p-2 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 outline-none ";
        if (hasValue) {
            return base + "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/10";
        }
        return base + "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100";
    };

    return (
        <div ref={panelRef} className="absolute top-16 left-0 right-0 z-20 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-2xl border-t p-6 animate-in slide-in-from-top-2 duration-200 ring-1 ring-black/5 dark:ring-white/10">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Time Range */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase ${filters.timeRange && filters.timeRange !== 'all' ? 'text-blue-600' : 'text-gray-500'}`}>תאריך יצירה</label>
                    <select
                        value={filters.timeRange || 'all'}
                        onChange={(e) => handleTimeRangeChange(e.target.value as any)}
                        className={getInputClasses(!!filters.timeRange && filters.timeRange !== 'all')}
                    >
                        <option value="all">הכל</option>
                        <option value="today">היום</option>
                        <option value="lastWeek">שבוע אחרון</option>
                        <option value="lastMonth">חודש אחרון</option>
                    </select>
                </div>

                {/* Creator */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase ${filters.creator ? 'text-blue-600' : 'text-gray-500'}`}>יוצר</label>
                    <select
                        value={filters.creator || ''}
                        onChange={(e) => handleChange('creator', e.target.value)}
                        className={getInputClasses(!!filters.creator)}
                    >
                        <option value="">כל היוצרים</option>
                        {CREATORS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase ${filters.category ? 'text-blue-600' : 'text-gray-500'}`}>קטגוריה</label>
                    <select
                        value={filters.category || ''}
                        onChange={(e) => handleChange('category', e.target.value)}
                        className={getInputClasses(!!filters.category)}
                    >
                        <option value="">הכל</option>
                        <option value="verbal">חשיבה מילולית</option>
                        <option value="quantitative">חשיבה כמותית</option>
                        <option value="english">אנגלית</option>
                    </select>
                </div>

                {/* Subcategory (Dependent) */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase ${filters.subcategory ? 'text-blue-600' : 'text-gray-500'}`}>תת-קטגוריה</label>
                    <select
                        value={filters.subcategory || ''}
                        onChange={(e) => handleChange('subcategory', e.target.value)}
                        className={getInputClasses(!!filters.subcategory)}
                        disabled={!filters.category}
                    >
                        <option value="">הכל</option>
                        {filters.category && SUBCATEGORY_OPTIONS[filters.category as keyof typeof SUBCATEGORY_OPTIONS]?.map(sub => (
                            <option key={sub.value} value={sub.value}>{sub.label}</option>
                        ))}
                    </select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase ${filters.status ? 'text-blue-600' : 'text-gray-500'}`}>סטטוס</label>
                    <select
                        value={filters.status || ''}
                        onChange={(e) => handleChange('status', e.target.value)}
                        className={getInputClasses(!!filters.status)}
                    >
                        <option value="">הכל</option>
                        <option value="pending">ממתין לבדיקה</option>
                        <option value="initial">בדיקה ראשונית</option>
                        <option value="approved">מאושר</option>
                    </select>
                </div>

                {/* Difficulty */}
                <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase ${filters.difficulty ? 'text-blue-600' : 'text-gray-500'}`}>רמת קושי</label>
                    <select
                        value={filters.difficulty || ''}
                        onChange={(e) => handleChange('difficulty', e.target.value)}
                        className={getInputClasses(!!filters.difficulty)}
                    >
                        <option value="">הכל</option>
                        <option value="easy">נמוך</option>
                        <option value="medium">בינוני</option>
                        <option value="hard">גבוה</option>
                    </select>
                </div>
            </div>

            <div className="mt-4 flex justify-end gap-2 max-w-7xl mx-auto px-1">
                <button
                    onClick={() => onChange({})}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1"
                >
                    נקה הכל
                </button>
                <button
                    onClick={onClose}
                    className="text-xs text-gray-500 hover:text-gray-900 font-medium px-3 py-1"
                >
                    סגור
                </button>
            </div>
        </div>
    );
}

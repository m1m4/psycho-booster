import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { QuestionFilters, SUBCATEGORY_OPTIONS, TOPIC_OPTIONS } from '@/types/submit';
import { getStatistics, recalculateStatistics } from '@/lib/firebase/db';
import { CATEGORY_LABELS } from '@/components/features/submit/QuestionPreview';
import { useQueryClient } from '@tanstack/react-query';

interface FilterPanelProps {
    filters: QuestionFilters;
    fixedFilters?: QuestionFilters;
    totalCount?: number;
    onChange: (newFilters: QuestionFilters) => void;
    onClose: () => void;
}

export function FilterPanel({ filters, fixedFilters = {}, totalCount, onChange, onClose }: FilterPanelProps) {
    const { data: stats } = useQuery({
        queryKey: ['statistics'],
        queryFn: getStatistics,
        staleTime: 5 * 60 * 1000,
    });

    const handleChange = (key: keyof QuestionFilters, value: any) => {
        onChange({ ...filters, [key]: value });
    };

    const toggleMultiSelect = (key: keyof QuestionFilters, value: string) => {
        const currentValues = Array.isArray(filters[key]) ? (filters[key] as string[]) : (filters[key] ? [filters[key] as string] : []);
        if (currentValues.includes(value)) {
            const newValues = currentValues.filter(v => v !== value);
            handleChange(key, newValues.length > 0 ? newValues : undefined);
        } else {
            handleChange(key, [...currentValues, value]);
        }
    };

    const handleTimeRangeChange = (range: QuestionFilters['timeRange']) => {
        const now = new Date();
        let start: Date | null = null;
        let end: Date | null = new Date();

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



    const creators = ["noamkadim", "orenlavi827", "AI", "Testing"];

    // Status Labels Matching QuestionsTable
    const statusLabels = [
        { value: 'pending', label: 'ממתין לבדיקה' },
        { value: 'initial', label: 'בדיקה ראשונית' },
        { value: 'approved', label: 'מאושר' },
    ];

    const difficultyLabels = [
        { value: 'easy', label: 'נמוך' },
        { value: 'medium', label: 'בינוני' },
        { value: 'hard', label: 'גבוה' },
    ];

    const Chip = ({ label, selected, onClick, disabled = false }: { label: string, selected: boolean, onClick: () => void, disabled?: boolean }) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-full text-base md:text-xs font-bold transition-all border whitespace-nowrap ${selected
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/30'
                : disabled
                    ? 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed opacity-50'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:text-blue-600'
                }`}
        >
            {label}
        </button>
    );

    const isOptionEnabled = (type: 'subcategory' | 'topic' | 'author', value: string) => {
        if (!stats) return true;

        // Relation-based visibility (Cross-disabling)

        // If Category is selected, disable authors/subcategories not in that category
        if (filters.category) {
            if (type === 'author' && stats.authorsByCategory?.[filters.category]) {
                if (!stats.authorsByCategory[filters.category].includes(value)) return false;
            }
            if (type === 'subcategory' && stats.subcategoriesByCategory?.[filters.category]) {
                if (!stats.subcategoriesByCategory[filters.category].includes(value)) return false;
            }
        }

        // If Subcategory is selected, disable topics not in that subcategory
        const selectedSubs = Array.isArray(filters.subcategory) ? filters.subcategory : (filters.subcategory ? [filters.subcategory] : []);
        if (selectedSubs.length > 0 && type === 'topic') {
            const possibleTopics = selectedSubs.flatMap(sub => stats.topicsBySubcategory?.[sub] || []);
            if (possibleTopics.length > 0 && !possibleTopics.includes(value)) return false;
        }

        return true;
    };

    const getCount = (type: string, value: string) => {
        if (!stats) return 0;
        // Map types to stat keys
        switch (type) {
            case 'category': return stats.byCategory?.[value] || 0;
            case 'author': return stats.byAuthor?.[value] || 0;
            case 'status': return stats.byStatus?.[value] || 0;
            case 'difficulty': return stats.byDifficulty?.[value] || 0;
            case 'subcategory': return stats.bySubcategory?.[value] || 0;
            case 'topic': return stats.byTopic?.[value] || 0;
            default: return 0;
        }
    };

    const sectionLabelClass = "text-xl md:text-base font-bold uppercase text-gray-700 dark:text-gray-300 tracking-wider flex items-center gap-2";

    // Subcategory Sorting
    const getSortedSubcategories = () => {
        const cat = filters.category || fixedFilters.category;
        if (!cat) return [];
        const options = SUBCATEGORY_OPTIONS[cat as keyof typeof SUBCATEGORY_OPTIONS] || [];

        const selectedSet = new Set(Array.isArray(filters.subcategory) ? filters.subcategory : (filters.subcategory ? [filters.subcategory] : []));

        return [...options].sort((a, b) => {
            const aSel = selectedSet.has(a.value);
            const bSel = selectedSet.has(b.value);
            if (aSel === bSel) return 0;
            return aSel ? -1 : 1;
        });
    };

    // Topic Sorting
    const getSortedTopics = () => {
        const allTopics = Object.values(TOPIC_OPTIONS).flat();
        // Unique topics
        const uniqueTopics = allTopics.filter((t, i, arr) => arr.findIndex(x => x.value === t.value) === i);

        // Filter by relevance (same logic as before)
        const relevantTopics = uniqueTopics.filter(t => {
            const selectedSubs = Array.isArray(filters.subcategory) ? filters.subcategory : (filters.subcategory ? [filters.subcategory] : []);
            if (selectedSubs.length > 0) {
                return selectedSubs.some(sub => TOPIC_OPTIONS[sub]?.some(to => to.value === t.value));
            }
            return true;
        });

        const selectedSet = new Set(Array.isArray(filters.topic) ? filters.topic : (filters.topic ? [filters.topic] : []));

        return relevantTopics.sort((a, b) => {
            const aSel = selectedSet.has(a.value);
            const bSel = selectedSet.has(b.value);
            if (aSel === bSel) return 0;
            return aSel ? -1 : 1;
        });
    };

    // Prevent body scroll when open on mobile
    React.useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div ref={panelRef} className="fixed inset-0 md:absolute md:top-16 md:bottom-auto md:left-0 md:right-0 z-50 md:z-20 bg-white dark:bg-gray-900 md:border-b border-gray-200 dark:border-gray-800 shadow-2xl md:border-t animate-in slide-in-from-bottom-10 md:slide-in-from-top-2 duration-200 md:ring-1 ring-black/5 dark:ring-white/10 flex flex-col md:max-h-[80vh]">

            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 p-4 shrink-0 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white hidden md:block">סינון מתקדם</h2>
                        {totalCount !== undefined && (
                            <span className="text-base md:text-lg font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 md:px-4 md:py-1.5 rounded-full whitespace-nowrap">
                                {totalCount} תוצאות
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => onChange({})}
                            className="text-sm text-red-500 hover:text-red-700 font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-all whitespace-nowrap"
                        >
                            נקה הכל
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 -ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto p-6">
                <div className="max-w-7xl mx-auto space-y-8">

                    {/* Top Grid: Time, Author, Status, Difficulty */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                        {/* Time Range (Moved here) */}
                        {!fixedFilters.startDate && !fixedFilters.endDate && (
                            <div className="space-y-4">
                                <label className={sectionLabelClass}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    תאריך יצירה
                                </label>
                                <select
                                    value={filters.timeRange || 'all'}
                                    onChange={(e) => handleTimeRangeChange(e.target.value as any)}
                                    className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-lg md:text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                                >
                                    <option value="all">הכל</option>
                                    <option value="today">היום</option>
                                    <option value="lastWeek">שבוע אחרון</option>
                                    <option value="lastMonth">חודש אחרון</option>
                                </select>
                            </div>
                        )}

                        {/* Author */}
                        {!fixedFilters.creator && (
                            <div className="space-y-4">
                                <label className={sectionLabelClass}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    יוצר
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {creators.map(c => (
                                        <Chip
                                            key={c}
                                            label={c}
                                            selected={filters.creator === c}
                                            onClick={() => handleChange('creator', filters.creator === c ? undefined : c)}
                                            disabled={!isOptionEnabled('author', c)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Status */}
                        {!fixedFilters.status && (
                            <div className="space-y-4">
                                <label className={sectionLabelClass}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    סטטוס
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {statusLabels.map(s => (
                                        <Chip
                                            key={s.value}
                                            label={s.label}
                                            selected={filters.status === s.value}
                                            onClick={() => handleChange('status', filters.status === s.value ? undefined : s.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Difficulty */}
                        {!fixedFilters.difficulty && (
                            <div className="space-y-4">
                                <label className={sectionLabelClass}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                    רמת קושי
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {difficultyLabels.map(d => (
                                        <Chip
                                            key={d.value}
                                            label={d.label}
                                            selected={filters.difficulty === d.value}
                                            onClick={() => handleChange('difficulty', filters.difficulty === d.value ? undefined : d.value)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bottom Grid: Category, Subcategory, Topic */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-gray-100 dark:border-gray-800">

                        {/* Category (Moved here) */}
                        {!fixedFilters.category && (
                            <div className="space-y-4">
                                <label className={sectionLabelClass}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                                    קטגוריה
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                                        <Chip
                                            key={val}
                                            label={label}
                                            selected={filters.category === val}
                                            onClick={() => handleChange('category', filters.category === val ? undefined : val)}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Subcategory (Multi-select) */}
                        {!fixedFilters.subcategory && (filters.category || fixedFilters.category) && (
                            <div className="space-y-4">
                                <label className={sectionLabelClass}>תת-קטגוריה</label>
                                <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    {getSortedSubcategories().map(sub => (
                                        <label key={sub.value} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-700 ${!isOptionEnabled('subcategory', sub.value) ? 'opacity-30' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={Array.isArray(filters.subcategory) ? filters.subcategory.includes(sub.value) : filters.subcategory === sub.value}
                                                onChange={() => toggleMultiSelect('subcategory', sub.value)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                disabled={!isOptionEnabled('subcategory', sub.value)}
                                            />
                                            <span className={`text-lg md:text-sm font-medium ${!isOptionEnabled('subcategory', sub.value) ? 'text-gray-400' : ''}`}>
                                                {sub.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Topic (Multi-select) */}
                        {(filters.category === 'quantitative' || fixedFilters.category === 'quantitative') && (
                            <div className="space-y-4">
                                <label className={sectionLabelClass}>נושא</label>
                                <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    {getSortedTopics().map(topic => (
                                        <label key={topic.value} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-700 ${!isOptionEnabled('topic', topic.value) ? 'opacity-30' : ''}`}>
                                            <input
                                                type="checkbox"
                                                checked={Array.isArray(filters.topic) ? filters.topic.includes(topic.value) : filters.topic === topic.value}
                                                onChange={() => toggleMultiSelect('topic', topic.value)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                disabled={!isOptionEnabled('topic', topic.value)}
                                            />
                                            <span className={`text-lg md:text-sm font-medium ${!isOptionEnabled('topic', topic.value) ? 'text-gray-400' : ''}`}>
                                                {topic.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}

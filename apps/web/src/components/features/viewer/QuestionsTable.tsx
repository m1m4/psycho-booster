'use client';

import React, { useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getPaginatedQuestions, deleteQuestionSets, recalculateStatistics } from '@/lib/firebase/db';
import { QuestionSet, SUBCATEGORY_OPTIONS, QuestionFilters } from '@/types/submit';
import { QuestionModal } from '@/components/features/submit/QuestionModal';
import { CATEGORY_LABELS } from '@/components/features/submit/QuestionPreview';
import { StatisticsPanel } from './StatisticsPanel';
import { FilterPanel } from './FilterPanel';

const DIFFICULTY_ORDER = { easy: 1, medium: 2, hard: 3 };
const STATUS_ORDER = { pending: 1, initial: 2, approved: 3 };

type SortKey = keyof QuestionSet | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface QuestionsTableProps {
    title?: string;
    initialFilters?: QuestionFilters;
    fixedFilters?: QuestionFilters;
    showAddButton?: boolean;
    showFilterPanel?: boolean;
    showStatistics?: boolean;
}

export function QuestionsTable({
    title = 'רשימת שאלות',
    initialFilters = {},
    fixedFilters = {},
    showAddButton = true,
    showFilterPanel = true,
    showStatistics = true
}: QuestionsTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ key: 'createdAt', direction: 'desc' });

    // Filter State
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState<QuestionFilters>(initialFilters);

    // Merge filters with fixedFilters for the query
    const activeFilters = { ...filters, ...fixedFilters };

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Modal State
    const [selectedQuestion, setSelectedQuestion] = useState<QuestionSet | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Deletion states
    const queryClient = useQueryClient();
    const [isDeleting, setIsDeleting] = useState(false);

    // React Query for Real Data
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error
    } = useInfiniteQuery({
        queryKey: ['questions', sortConfig, activeFilters], // Refetch on filter change
        queryFn: ({ pageParam }) => getPaginatedQuestions(20, pageParam, sortConfig.key, sortConfig.direction, activeFilters),
        initialPageParam: null as any,
        getNextPageParam: (lastPage) => lastPage.lastVisible,
    });

    const questionsToDisplay = data?.pages.flatMap(page => page.questions) || [];

    // --- Selection Logic ---
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = new Set(questionsToDisplay.map(q => q.id));
            setSelectedIds(allIds);
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectRow = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedIds.size} פריטים?`)) return;

        setIsDeleting(true);
        try {
            await deleteQuestionSets(Array.from(selectedIds));

            // Cleanup UI
            setSelectedIds(new Set());
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            queryClient.invalidateQueries({ queryKey: ['statistics'] });
            alert('הפריטים נמחקו בהצלחה.');
        } catch (error) {
            console.error(error);
            alert('שגיאה במחיקת הפריטים.');
        } finally {
            setIsDeleting(false);
        }
    };


    const handleSort = (key: string) => {
        // If sorting by author and we have author exclusion, we might be locked to author sort if it was necessary, 
        // but here we just toggle. The db function handles the constraints.
        const direction = sortConfig.key === key && sortConfig.direction === 'desc' ? 'asc' : 'desc';
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <span className="text-gray-400 opacity-50">⇅</span>;
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    const difficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'initial': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'approved': return 'bg-green-600 text-white dark:bg-green-700';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const statusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'ממתין לבדיקה';
            case 'initial': return 'בדיקה ראשונית';
            case 'approved': return 'מאושר';
            default: return status;
        }
    };

    const difficultyLabel = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'נמוך';
            case 'medium': return 'בינוני';
            case 'hard': return 'גבוה';
            default: return difficulty;
        }
    };

    const formatDate = (date: any) => {
        if (!date) return 'Unknown';
        if (date.toDate) return date.toDate().toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
        if (date instanceof Date) return date.toLocaleString('he-IL', { dateStyle: 'short', timeStyle: 'short' });
        return date;
    };

    const getSubcategoryLabel = (sub: string) => {
        const option = Object.values(SUBCATEGORY_OPTIONS).flat().find(opt => opt.value === sub);
        return option ? option.label : sub;
    };


    const handleRowClick = (question: QuestionSet) => {
        setSelectedQuestion(question);
        setIsModalOpen(true);
    };

    // Extract index link for friendlier error message
    const renderError = (err: Error) => {
        const msg = err.message || '';
        if (msg.includes('requires an index') || msg.toLowerCase().includes('index')) {
            // Find any URL starting with https://console.firebase.google.com
            const urlPattern = /(https:\/\/console\.firebase\.google\.com[^\s"<>]+)/g;
            const match = msg.match(urlPattern);
            const link = match ? match[0] : null;

            if (link) {
                return (
                    <div className="flex flex-col items-center gap-4 bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <div className="flex items-center gap-3 text-blue-800 dark:text-blue-300">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-bold text-lg">נדרש אינדקס חדש עבור שאילתה זו</span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400 text-center max-w-md">
                            פיירבייס דורש יצירת אינדקס מיוחד כדי לשלב את המסננים שבחרת עם המיון הנוכחי. השגנו עבורך את הקישור הישיר:
                        </p>
                        <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center gap-2"
                        >
                            <span>לחץ כאן ליצירת האינדקס</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                        <span className="text-xs text-blue-400">(התהליך לוקח כדקה אחת במסוף פיירבייס)</span>
                    </div>
                );
            }
        }
        return <div className="text-red-500 p-4 font-mono text-xs overflow-auto max-w-full">{msg}</div>;
    };

    return (
        <div className="space-y-4 relative">
            {/* Statistics Panel with click-to-filter */}
            {showStatistics && (
                <StatisticsPanel
                    activeStatus={filters.status}
                    onStatusClick={(status) => {
                        // Only allow toggling if it doesn't conflict with fixed filters
                        if (fixedFilters.status && fixedFilters.status !== status) return;

                        setFilters(prev => ({
                            ...prev,
                            status: prev.status === status ? undefined : status
                        }));
                    }}
                />
            )}

            {/* Filter Panel (Slide-over) */}
            {showFilters && showFilterPanel && (
                <FilterPanel
                    filters={filters}
                    onChange={setFilters}
                    onClose={() => setShowFilters(false)}
                />
            )}

            {/* Header / Table Tools */}
            <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                        {title}
                        {selectedIds.size > 0 && ` `}
                    </h3>
                    {selectedIds.size > 0 && (
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            נבחרו {selectedIds.size} פריטים
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Add Button */}
                    {showAddButton && (
                        <button
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-all"
                            title="הוספת שאלה חדשה"
                            onClick={() => window.location.href = '/submit'}
                        >
                            <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    )}

                    {/* Filter Button */}
                    {showFilterPanel && (
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`p-2 rounded-lg transition-all ${showFilters ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                            title="סינון"
                        >
                            <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </button>
                    )}

                    {/* Delete Icon */}
                    <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.size === 0 || isDeleting}
                        className={`p-2 rounded-lg transition-all ${selectedIds.size > 0 ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                        title={selectedIds.size > 0 ? 'מחק נבחרים' : 'בחר פריטים למחיקה'}
                    >
                        {isDeleting ? (
                            <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            <div className="w-full overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 font-medium">
                            <tr>
                                <th className="px-4 py-4 w-[5%] font-medium text-gray-400">
                                    בחר
                                </th>
                                {[
                                    { key: 'createdAt', label: 'זמן העלאה', width: 'w-[15%]' },
                                    { key: 'author', label: 'יוצר', width: 'w-[15%]' },
                                    { key: 'status', label: 'סטטוס', width: 'w-[15%]' },
                                    { key: 'category', label: 'קטגוריה', width: 'w-[15%]' },
                                    { key: 'subcategory', label: 'תת-קטגוריה', width: 'w-[20%]' },
                                    { key: 'difficulty', label: 'רמת קושי', width: 'w-[15%]' },
                                ].map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        className={`px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none text-center ${col.width}`}
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            {col.label}
                                            <span className="w-4 inline-flex justify-center">
                                                {getSortIcon(col.key)}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">

                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">טוען נתונים...</td>
                                </tr>
                            ) : isError ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-red-500">
                                        {renderError(error as Error)}
                                    </td>
                                </tr>
                            ) : questionsToDisplay.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">לא נמצאו שאלות</td>
                                </tr>
                            ) : (
                                questionsToDisplay.map((q) => (
                                    <tr
                                        key={q.id}
                                        onClick={() => handleRowClick(q as QuestionSet)}
                                        className={`hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors text-center cursor-pointer ${selectedIds.has(q.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                    >
                                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(q.id)}
                                                onChange={() => handleSelectRow(q.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-4 dir-ltr text-xs text-gray-500">{formatDate(q.createdAt)}</td>
                                        <td className="px-6 py-4">{q.author}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block whitespace-nowrap ${statusBadge(q.status || 'pending')}`}>
                                                {statusLabel(q.status || 'pending')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">{CATEGORY_LABELS[q.category || ''] || q.category}</td>
                                        <td className="px-6 py-4">{getSubcategoryLabel(q.subcategory || '')}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColor(q.difficulty || 'medium')}`}>
                                                {difficultyLabel(q.difficulty || 'medium')}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {
                hasNextPage && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm font-medium"
                        >
                            {isFetchingNextPage ? 'טוען עוד...' : 'טען עוד שאלות'}
                        </button>
                    </div>
                )
            }

            {
                selectedQuestion && (
                    <QuestionModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        onConfirm={() => { }}
                        formData={{
                            ...selectedQuestion,
                            assetFile: null,
                            assetText: selectedQuestion.assetText || '',
                            questions: selectedQuestion.questions
                        }}
                        isEnglish={selectedQuestion.category === 'english'}
                        readOnly={true}
                    />
                )
            }
        </div >
    );
}

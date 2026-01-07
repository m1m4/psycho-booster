'use client';

import React, { useState } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getPaginatedQuestions, deleteQuestionSets, recalculateStatistics, approveQuestionSets } from '@/lib/firebase/db';
import { QuestionSet, SUBCATEGORY_OPTIONS, TOPIC_OPTIONS, QuestionFilters } from '@/types/submit';
import { QuestionModal } from '@/components/features/submit/QuestionModal';
import { CATEGORY_LABELS } from '@/components/features/submit/QuestionPreview';
import { StatisticsPanel } from './StatisticsPanel';
import { FilterPanel } from './FilterPanel';

import { ExportTemplate } from './ExportTemplate';

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
    showApproveButton?: boolean;
}

export function QuestionsTable({
    title = 'רשימת שאלות',
    initialFilters = {},
    fixedFilters = {},
    showAddButton = true,
    showFilterPanel = true,
    showStatistics = true,
    showApproveButton = false
}: QuestionsTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: SortDirection }>({ key: 'createdAt', direction: 'desc' });

    // Export State
    const [isExporting, setIsExporting] = useState(false);
    const [questionsToExport, setQuestionsToExport] = useState<QuestionSet[]>([]);

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

    const totalCount = data?.pages[0]?.totalCount || 0;
    const questionsToDisplay = data?.pages.flatMap(page => page.questions) || [];

    // --- Selection Logic ---


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
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['questions'] }),
                queryClient.invalidateQueries({ queryKey: ['statistics'] }),
                queryClient.invalidateQueries({ queryKey: ['inboxCount'] })
            ]);
            alert('הפריטים נמחקו בהצלחה.');
        } catch (error) {
            console.error(error);
            alert('שגיאה במחיקת הפריטים.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`האם אתה בטוח שברצונך לאשר ${selectedIds.size} פריטים?`)) return;

        setIsDeleting(true); // Using isDeleting for loading state
        try {
            await approveQuestionSets(Array.from(selectedIds));

            // Cleanup UI
            setSelectedIds(new Set());
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['questions'] }),
                queryClient.invalidateQueries({ queryKey: ['statistics'] }),
                queryClient.invalidateQueries({ queryKey: ['inboxCount'] })
            ]);
            alert('הפריטים אוישרו בהצלחה.');
        } catch (error) {
            console.error(error);
            alert('שגיאה באישור הפריטים.');
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
            case 'easy': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'pending': return 'bg-orange-100 text-orange-800';
            case 'initial': return 'bg-blue-100 text-blue-800';
            case 'approved': return 'bg-green-600 text-white';
            default: return 'bg-gray-100 text-gray-800';
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

    const getTopicLabel = (topic: string) => {
        const option = Object.values(TOPIC_OPTIONS).flat().find(opt => opt.value === topic);
        return option ? option.label : topic;
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
                    <div className="flex flex-col items-center gap-4 bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <div className="flex items-center gap-3 text-blue-800">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-bold text-lg">נדרש אינדקס חדש עבור שאילתה זו</span>
                        </div>
                        <p className="text-sm text-blue-600 text-center max-w-md">
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

    const handleExport = async () => {
        if (selectedIds.size === 0) return;

        const selectedQuestions = questionsToDisplay.filter(q => selectedIds.has(q.id));
        setQuestionsToExport(selectedQuestions as QuestionSet[]);
        setIsExporting(true);

        const { snapdom } = await import('@zumer/snapdom');
        const { jsPDF } = await import('jspdf');

        // Allow render to complete
        setTimeout(async () => {
            try {
                const container = document.getElementById('printable-area');
                if (!container) {
                    setIsExporting(false);
                    return;
                }

                const pdf = new jsPDF('p', 'mm', 'a4');
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const margin = 10;
                const contentWidth = pageWidth - (margin * 2);
                let currentY = margin;

                /**
                 * Helper to capture and add an element to PDF
                 */
                const addElementToPdf = async (element: HTMLElement | null, spacingAfter = 0) => {
                    if (!element) return;
                    try {
                        // Capture as JPEG with 0.95 quality using Snapdom
                        // Snapdom has better mobile browser compatibility, especially for Safari
                        const imgElement = await snapdom.toJpeg(element, {
                            quality: 0.95,
                            backgroundColor: '#ffffff',
<<<<<<< HEAD
                            scale: 1.5, // Improves clarity without excessive file size
=======
                            pixelRatio: 2.0, // Reduced from 2.5 for better mobile performance
                            skipFonts: true, // Bypass font embedding to prevent "trim" errors in production
                            // cacheBust removed to support signed URLs
>>>>>>> b895a05e0fa81e2b2471520c7128913d25bbd97c
                        });
                        
                        // Extract data URL from the image element's src
                        const dataUrl = imgElement.src;

                        const imgProps = pdf.getImageProperties(dataUrl);
                        let imgHeight = (imgProps.height * contentWidth) / imgProps.width;
                        let finalWidth = contentWidth;

                        // Check for page break
                        if (currentY + imgHeight > pageHeight - margin) {
                            // Fix for "Orphaned Title" issue:
                            // If we are near the top (e.g., just after title), and the image is just too big,
                            // we try to scale it down to fit the first page instead of breaking.
                            const availableSpace = pageHeight - margin - currentY;
                            const isNearTop = currentY < pageHeight * 0.25; // First quarter of page (likely just title)

                            // If we are near top, and scaling it down allows it to fit (with some reasonable limit e.g. 70% orig size)
                            if (isNearTop && availableSpace > 50 && imgHeight > availableSpace) {
                                // Check if scaling to available space is reasonable (e.g. not squashing it to a tiny line)
                                const scaleFactor = availableSpace / imgHeight;
                                // If we don't scale too aggressively (keep at least 65% size), do it.
                                if (scaleFactor > 0.65) {
                                    imgHeight = availableSpace;
                                    // Recalculate width to maintain aspect ratio (optional, but PDF addImage typically takes w/h)
                                    // Actually addImage stretches if we give both. We should adjust width to keep ratio?
                                    // No, we usually want full width. If we shrink height, we should shrink width to keep ratio, or center it.
                                    // Let's shrink width proportional to height to maintain aspect ratio.
                                    finalWidth = contentWidth * scaleFactor;
                                } else {
                                    // Too big to fit even with scaling. We MUST break.
                                    // But currentY > margin is true.
                                    if (currentY > margin) {
                                        pdf.addPage();
                                        currentY = margin;
                                        // If it still doesn't fit on a fresh page, we might need to scale it to fit the page
                                        if (imgHeight > pageHeight - (margin * 2)) {
                                            const maxPageHeight = pageHeight - (margin * 2);
                                            const pageScale = maxPageHeight / imgHeight;
                                            imgHeight = maxPageHeight;
                                            finalWidth = contentWidth * pageScale;
                                        }
                                    }
                                }
                            } else if (currentY > margin) {
                                // Normal break behavior
                                pdf.addPage();
                                currentY = margin;
                            }
                        }

                        // Center the image if width was reduced
                        const xOffset = margin + (contentWidth - finalWidth) / 2;
                        pdf.addImage(dataUrl, 'JPEG', xOffset, currentY, finalWidth, imgHeight);
                        currentY += imgHeight + spacingAfter;
                    } catch (err) {
                        console.warn('Skipped element export:', err);
                    }
                };

                // --- 1. Title ---
                const titleEl = document.getElementById('export-questions-section')?.querySelector('h1');
                await addElementToPdf(titleEl as HTMLElement, 5);

                // --- 2. Questions ---
                const questionElements = Array.from(document.querySelectorAll('.export-question-item'));
                for (let i = 0; i < questionElements.length; i++) {
                    const el = questionElements[i] as HTMLElement;
                    await addElementToPdf(el, 0); // Spacing handled by CSS margin capture

                    // Force Page Break if requested by the template - only if not already top of page
                    if (el.dataset.breakAfter === 'true' && currentY > margin) {
                        pdf.addPage();
                        currentY = margin;
                    }
                }

                // Force Page Break after Questions (Part 1 -> Part 2) - only if not already top of page
                if (currentY > margin) {
                    pdf.addPage();
                    currentY = margin;
                }

                // --- 3. Answer Key ---
                // We add a bit of spacing before the answer key if it's on the same page
                if (currentY > margin && currentY + 40 < pageHeight) { // Heuristic check if worth adding spacing
                    currentY += 10;
                }

                const answersTitle = document.getElementById('export-answers-section')?.querySelector('h2');
                await addElementToPdf(answersTitle as HTMLElement, 5);

                const answersGrid = document.getElementById('export-answers-grid');
                await addElementToPdf(answersGrid as HTMLElement, 15);

                // --- 4. Explanations ---
                const explanationsTitle = document.getElementById('export-explanations-section')?.querySelector('h2');
                await addElementToPdf(explanationsTitle as HTMLElement, 5);

                const explanationElements = Array.from(document.querySelectorAll('.export-explanation-item'));
                for (let i = 0; i < explanationElements.length; i++) {
                    await addElementToPdf(explanationElements[i] as HTMLElement, 0);
                }

                pdf.save(`questions-export-${new Date().toISOString().slice(0, 10)}.pdf`);
                setIsExporting(false);
            } catch (err: unknown) {
                console.error('Export failed:', err);
                setIsExporting(false);
            }
        }, 2000); // 2s timeout for reliable asset loading
    };

    return (
        <div className="space-y-4 relative">
            {/* Hidden Printable Component - Offscreen but rendered */}
            {isExporting && questionsToExport.length > 0 && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', width: '800px' }}>
                    <ExportTemplate questions={questionsToExport} />
                </div>
            )}
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
                    fixedFilters={fixedFilters}
                    totalCount={totalCount}
                    onChange={setFilters}
                    onClose={() => setShowFilters(false)}
                />
            )}

            {/* Header / Table Tools */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-4">
                    <h3 className="font-bold text-lg text-gray-800">
                        {title}
                        {totalCount > 0 && (
                            <span className="mr-2 text-blue-600 font-medium">({totalCount})</span>
                        )}
                    </h3>
                    {selectedIds.size > 0 && (
                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            נבחרו {selectedIds.size} פריטים
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        disabled={selectedIds.size === 0 || isExporting}
                        className={`p-2 rounded-lg transition-all ${selectedIds.size > 0 ? 'text-blue-600 hover:bg-blue-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                        title={selectedIds.size > 0 ? 'ייצוא ל-PDF' : 'בחר פריטים לייצוא'}
                    >
                        {isExporting ? (
                            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        )}
                    </button>
                    {/* Add Button */}
                    {showAddButton && (
                        <button
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
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
                            className={`p-2 rounded-lg transition-all ${showFilters || Object.keys(filters).length > 0 ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
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
                        className={`p-2 rounded-lg transition-all ${selectedIds.size > 0 ? 'text-red-500 hover:bg-red-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
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

                    {/* Approve Button */}
                    {showApproveButton && (
                        <button
                            onClick={handleBulkApprove}
                            disabled={selectedIds.size === 0 || isDeleting}
                            className={`p-2 rounded-lg transition-all ${selectedIds.size > 0 ? 'text-green-600 hover:bg-green-50 cursor-pointer' : 'text-gray-300 cursor-not-allowed'}`}
                            title={selectedIds.size > 0 ? 'אישור נבחרים' : 'בחר פריטים לאישור'}
                        >
                            {isDeleting ? (
                                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <svg className="w-6 h-6 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full overflow-hidden border border-gray-200 rounded-xl bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-center">
                        <thead className="bg-gray-50 text-gray-900 border-b border-gray-200 font-medium">
                            <tr>
                                <th className="px-4 py-4 w-[5%] font-medium text-gray-400">
                                    בחר
                                </th>
                                {[
                                    { key: 'createdAt', label: 'זמן העלאה', width: 'w-[12%]' },
                                    { key: 'author', label: 'יוצר', width: 'w-[12%]' },
                                    { key: 'status', label: 'סטטוס', width: 'w-[12%]' },
                                    { key: 'category', label: 'קטגוריה', width: 'w-[12%]' },
                                    { key: 'subcategory', label: 'תת-קטגוריה', width: 'w-[15%]' },
                                    { key: 'topic', label: 'נושא', width: 'w-[15%]' },
                                    { key: 'difficulty', label: 'רמת קושי', width: 'w-[10%]' },
                                ].map((col) => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        className={`px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors select-none text-center ${col.width}`}
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
                        <tbody className="divide-y divide-gray-200">

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
                                    <td colSpan={10} className="p-8 text-center text-gray-500">לא נמצאו שאלות</td>
                                </tr>
                            ) : (
                                questionsToDisplay.map((q) => (
                                    <tr
                                        key={q.id}
                                        onClick={() => handleRowClick(q as QuestionSet)}
                                        className={`hover:bg-gray-50 transition-colors text-center cursor-pointer ${selectedIds.has(q.id) ? 'bg-blue-50/50' : ''}`}
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
                                        <td className="px-6 py-4">{getTopicLabel(q.topic || '')}</td>
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

'use client';

import React, { useState, useEffect } from 'react';

const MOCK_DATA = [
    { id: '1703521200000', createdAt: '2023-12-25 18:20', category: 'כמותי', subcategory: 'אלגברה', difficulty: 'easy', creator: 'ישראל ישראלי', status: 'pending' },
    { id: '1703524800000', createdAt: '2023-12-25 19:20', category: 'מילולי', subcategory: 'אנלוגיות', difficulty: 'medium', creator: 'שרה כהן', status: 'initial' },
    { id: '1703528400000', createdAt: '2023-12-25 20:20', category: 'אנגלית', subcategory: 'השלמת משפטים', difficulty: 'hard', creator: 'דוד לוי', status: 'approved' },
    { id: '1703532000000', createdAt: '2023-12-25 21:20', category: 'כמותי', subcategory: 'גיאומטריה', difficulty: 'medium', creator: 'מיכל לוי', status: 'pending' },
    { id: '1703535600000', createdAt: '2023-12-25 22:20', category: 'מילולי', subcategory: 'הבנת הנקרא', difficulty: 'easy', creator: 'ישראל ישראלי', status: 'approved' },
];

const DIFFICULTY_ORDER = { easy: 1, medium: 2, hard: 3 };
const STATUS_ORDER = { pending: 1, initial: 2, approved: 3 };

type Question = typeof MOCK_DATA[0];

type SortKey = keyof Question;
type SortDirection = 'asc' | 'desc';

export function QuestionsTable() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>(null);

    useEffect(() => {
        // Simulate fetch
        setQuestions(MOCK_DATA);
    }, []);

    const handleSort = (key: SortKey) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });

        setQuestions((prev) => {
            return [...prev].sort((a, b) => {
                let valA = a[key] as any;
                let valB = b[key] as any;

                if (key === 'difficulty') {
                    valA = DIFFICULTY_ORDER[a.difficulty as keyof typeof DIFFICULTY_ORDER];
                    valB = DIFFICULTY_ORDER[b.difficulty as keyof typeof DIFFICULTY_ORDER];
                } else if (key === 'status') {
                    valA = STATUS_ORDER[a.status as keyof typeof STATUS_ORDER];
                    valB = STATUS_ORDER[b.status as keyof typeof STATUS_ORDER];
                }

                if (valA < valB) return direction === 'asc' ? -1 : 1;
                if (valA > valB) return direction === 'asc' ? 1 : -1;
                return 0;
            });
        });
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig?.key !== key) return <span className="text-gray-400 opacity-50">⇅</span>;
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
            case 'initial': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'; // Match 'קל'
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
            case 'easy': return 'קל';
            case 'medium': return 'בינוני';
            case 'hard': return 'קשה';
            default: return difficulty;
        }
    };

    return (
        <div className="w-full overflow-hidden border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-black shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-center">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-800 font-medium">
                        <tr>
                            {[
                                { key: 'createdAt', label: 'זמן העלאה' },
                                { key: 'creator', label: 'יוצר' },
                                { key: 'status', label: 'סטטוס' },
                                { key: 'category', label: 'קטגוריה' },
                                { key: 'subcategory', label: 'תת-קטגוריה' },
                                { key: 'difficulty', label: 'רמת קושי' },
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key as SortKey)}
                                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors select-none whitespace-nowrap text-center"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {col.label}
                                        {getSortIcon(col.key as SortKey)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {questions.map((q) => (
                            <tr
                                key={q.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors text-center"
                            >
                                <td className="px-6 py-4 dir-ltr">{q.createdAt}</td>
                                <td className="px-6 py-4">{q.creator}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold inline-block whitespace-nowrap ${statusBadge(q.status)}`}>
                                        {statusLabel(q.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">{q.category}</td>
                                <td className="px-6 py-4">{q.subcategory}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${difficultyColor(q.difficulty)}`}>
                                        {difficultyLabel(q.difficulty)}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {questions.length === 0 && (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    לא נמצאו שאלות
                </div>
            )}
        </div>
    );
}

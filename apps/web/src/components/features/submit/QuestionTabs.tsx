import React from 'react';
import { QuestionItem } from '@/types/submit';

interface QuestionTabsProps {
    questions: QuestionItem[];
    activeQuestionIndex: number;
    onQuestionSelect: (index: number) => void;
    isEnglish: boolean;
    isSubCategorySelected: boolean;
}

export function QuestionTabs({
    questions,
    activeQuestionIndex,
    onQuestionSelect,
    isEnglish,
    isSubCategorySelected
}: QuestionTabsProps) {
    return (
        <div className={`w-full md:w-48 flex-shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 z-10 bg-white dark:bg-black md:bg-transparent md:dark:bg-transparent sticky top-4 h-fit`}>
            {questions.map((q, idx) => (
                <button
                    key={q.id}
                    type="button"
                    onClick={() => onQuestionSelect(idx)}
                    disabled={!isSubCategorySelected}
                    className={`
                        px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-start
                        ${activeQuestionIndex === idx
                            ? 'bg-[#4169E1] text-white shadow-md'
                            : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                    `}
                >
                    {isEnglish ? `Question ${idx + 1}` : `שאלה ${idx + 1}`}
                </button>
            ))}
        </div>
    );
}

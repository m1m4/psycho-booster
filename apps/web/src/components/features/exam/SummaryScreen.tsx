'use client';

import React, { useMemo } from 'react';
import { QuestionItem, SavedQuestionItem } from '@/types/submit';

interface SummaryScreenProps {
    results: {
        totalQuestions: number;
        correctCount: number;
        answers: Record<string, number>; // questionId -> answerIndex
        questions: (QuestionItem | SavedQuestionItem)[];
    };
    onRestart: () => void;
    onHome: () => void;
}

export function SummaryScreen({ results, onRestart, onHome }: SummaryScreenProps) {
    const { totalQuestions, correctCount } = results;
    const score = Math.round((correctCount / totalQuestions) * 100) || 0;

    // Determine message based on score
    const message = useMemo(() => {
        if (score === 100) return 'מצוין! ביצוע מושלם';
        if (score >= 80) return 'עבודה טובה מאוד!';
        if (score >= 60) return 'טוב, אבל יש מקום לשיפור';
        return 'כדאי להמשיך לתרגל';
    }, [score]);

    return (
        <div className="w-full max-w-2xl mx-auto space-y-8 p-6 text-center animate-in zoom-in-95 duration-500">
            <div className="space-y-4">
                <h1 className="text-4xl font-bold text-gray-900">סיכום בוחן</h1>
                <p className="text-xl text-gray-600 font-medium">{message}</p>
            </div>

            <div className="bg-white rounded-3xl p-10 shadow-xl border border-gray-100 flex flex-col items-center gap-4">
                <div className="w-40 h-40 rounded-full flex items-center justify-center border-8 border-blue-500 bg-blue-50">
                    <span className="text-5xl font-bold text-blue-600">{score}%</span>
                </div>
                
                <div className="grid grid-cols-2 gap-8 w-full mt-4">
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold text-gray-900">{totalQuestions}</span>
                        <span className="text-sm text-gray-500">שאלות</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-3xl font-bold text-green-600">{correctCount}</span>
                        <span className="text-sm text-gray-500">תשובות נכונות</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
                 <button
                    onClick={onHome}
                    className="px-8 py-3 bg-gray-100 text-gray-700 text-lg font-bold rounded-xl hover:bg-gray-200 transition-all"
                >
                    חזרה לראשי
                </button>
                <button
                    onClick={onRestart}
                    className="px-8 py-3 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
                >
                    מבחן חדש
                </button>
            </div>
        </div>
    );
}

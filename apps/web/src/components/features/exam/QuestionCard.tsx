'use client';

import React, { useMemo, useState } from 'react';
import { QuestionItem, SavedQuestionItem } from '@/types/submit';
import { PreviewImage } from '@/components/ui/PreviewImage';
import { PreviewRender } from '@/components/ui/PreviewRender';
import { hasHebrew, useResponsiveFontSize } from '@/components/features/submit/QuestionPreview';
import { ExplanationAccordion } from './ExplanationAccordion';

interface QuestionCardProps {
    question: Omit<QuestionItem, 'id'> & { id: string | number } | Omit<SavedQuestionItem, 'id'> & { id: string | number };
    selectedAnswer: number | null;
    onSelectAnswer: (index: number) => void;
    showExplanation: boolean;
    isEnglish: boolean;
    // Shared Assets
    assetText?: string;
    assetImageUrl?: string | null;
}

export function QuestionCard({ 
    question, 
    selectedAnswer, 
    onSelectAnswer, 
    showExplanation, 
    isEnglish,
    assetText,
    assetImageUrl
}: QuestionCardProps) {
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);

    const getQuestionImageSource = (q: any, fieldPrefx: string) => {
        if (q[fieldPrefx + 'Image']) return q[fieldPrefx + 'Image'];
        if (q[fieldPrefx + 'ImageUrl']) return q[fieldPrefx + 'ImageUrl'];
        return undefined;
    };

    const questionFontSize = useResponsiveFontSize(question.questionText);
    const correctAnswerIndex = parseInt(question.correctAnswer);

    // Layout helper for answers grid
    const answers = [1, 2, 3, 4].map(num => ({
        index: num,
        text: (question as any)[`answer${num}`],
        image: getQuestionImageSource(question, `answer${num}`)
    }));

    // Logic for answer feedback
    const getAnswerStyle = (index: number) => {
        const baseStyle = "flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer relative overflow-hidden";
        
        if (selectedAnswer === null) {
            return `${baseStyle} border-gray-200 hover:border-blue-300 hover:bg-blue-50 bg-white`;
        }

        // If this answer is selected
        if (selectedAnswer === index) {
            // Correct
            if (index === correctAnswerIndex) {
                return `${baseStyle} border-green-500 bg-green-50 ring-2 ring-green-200`;
            }
            // Incorrect
            return `${baseStyle} border-red-500 bg-red-50`;
        }

        // If not selected but IS the correct answer (reveal after selection)
        if (index === correctAnswerIndex && selectedAnswer !== null) {
            return `${baseStyle} border-green-500 bg-green-50 opacity-80`;
        }

        return `${baseStyle} border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed`;
    };

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500" dir={isEnglish && !hasHebrew(question.questionText) ? 'ltr' : 'rtl'}>
            
            {/* Shared Asset Section */}
            {(assetText || assetImageUrl) && (
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-100 text-blue-600 px-3 py-1 text-xs font-bold rounded-bl-lg">
                        קטע משותף / תרשים
                    </div>
                    
                    {assetImageUrl && (
                        <div className="mb-6 flex justify-center">
                            <PreviewImage
                                src={assetImageUrl}
                                alt="Shared Asset"
                                className="max-h-96 h-auto w-auto object-contain rounded-lg border border-gray-200"
                                useCors
                            />
                        </div>
                    )}
                    
                    {assetText && (
                        <div 
                            className={`text-gray-800 whitespace-pre-wrap leading-relaxed ${isEnglish && !hasHebrew(assetText) ? 'text-left' : 'text-right'}`}
                            dir={isEnglish && !hasHebrew(assetText) ? 'ltr' : 'rtl'}
                        >
                            <PreviewRender content={assetText} minimal isEnglish={isEnglish} />
                        </div>
                    )}
                </div>
            )}

            {/* Question Section */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-gray-100">
                <div 
                    className={`${questionFontSize} font-medium text-gray-900 whitespace-pre-wrap leading-relaxed ${isEnglish && !hasHebrew(question.questionText) ? 'text-left' : 'text-right'}`}
                    dir={isEnglish && !hasHebrew(question.questionText) ? 'ltr' : 'rtl'}
                >
                    <PreviewRender content={question.questionText} minimal isEnglish={isEnglish} />
                </div>

                {getQuestionImageSource(question, 'question') && (
                    <div className="mt-6 flex justify-center">
                        <PreviewImage
                            src={getQuestionImageSource(question, 'question')}
                            alt="Question"
                            className="max-h-80 h-auto w-auto object-contain rounded-lg border border-gray-100 shadow-sm"
                            useCors
                        />
                    </div>
                )}
            </div>

            {/* Answers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {answers.map((ans) => (
                    <div
                        key={ans.index}
                        onClick={() => selectedAnswer === null && onSelectAnswer(ans.index)}
                        className={getAnswerStyle(ans.index)}
                    >
                        {/* Indicator Circle */}
                        <div className={`
                            w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold shrink-0 border transition-colors
                            ${selectedAnswer === ans.index && ans.index === correctAnswerIndex ? 'bg-green-500 border-green-500 text-white' : ''}
                            ${selectedAnswer === ans.index && ans.index !== correctAnswerIndex ? 'bg-red-500 border-red-500 text-white' : ''}
                            ${selectedAnswer !== null && ans.index === correctAnswerIndex && selectedAnswer !== ans.index ? 'bg-green-500 border-green-500 text-white' : ''}
                            ${selectedAnswer === null ? 'bg-gray-100 border-gray-200 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600' : ''}
                            ${selectedAnswer !== null && ans.index !== correctAnswerIndex && selectedAnswer !== ans.index ? 'bg-gray-100 border-gray-200 text-gray-400' : ''}
                        `}>
                            {ans.index}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                             {ans.image ? (
                                <PreviewImage
                                    src={ans.image}
                                    alt={`Answer ${ans.index}`}
                                    className="h-16 w-auto object-contain rounded"
                                    useCors
                                />
                             ) : (
                                <div className={`text-lg font-medium ${isEnglish && !hasHebrew(ans.text) ? 'text-left' : 'text-right'}`}>
                                    <PreviewRender content={ans.text || ''} minimal isEnglish={isEnglish} />
                                </div>
                             )}
                        </div>

                         {/* Result Icon */}

                    </div>
                ))}
            </div>

            {/* Explanation */}
            {(showExplanation || selectedAnswer !== null) && (
                <ExplanationAccordion 
                    explanation={question.explanation}
                    isEnglish={!hasHebrew(question.questionText)}
                />
            )}
        </div>
    );
}

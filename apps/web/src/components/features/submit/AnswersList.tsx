import React from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { PreviewRender } from '@/components/ui/PreviewRender';
import { CameraIcon, XIcon } from './SubmitIcons';
import { QuestionItem } from '@/types/submit';
import { useResponsiveFontSize, hasHebrew } from './QuestionPreview';

interface AnswersListProps {
    question: QuestionItem;
    activeQuestionIndex: number;
    handleQuestionChange: (field: keyof QuestionItem, value: any) => void;
    handleImageChange: (field: keyof QuestionItem, file: File | null) => void;
    isSubCategorySelected: boolean;
    isEnglish: boolean;
    showLatex: boolean;
    errors: Record<string, boolean>;
    labels: {
        answers: string;
        answerPlaceholder: string;
    };
    onFocus?: (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
}

export function AnswersList({
    question,
    activeQuestionIndex,
    handleQuestionChange,
    handleImageChange,
    isSubCategorySelected,
    isEnglish,
    showLatex,
    errors,
    labels,
    onFocus
}: AnswersListProps) {
    const isImageMode = question.answersMode === 'image';

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${isEnglish ? 'text-left' : ''}`}>{labels.answers}</h3>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                    <button
                        type='button'
                        onClick={() => handleQuestionChange('answersMode', 'text')}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${!isImageMode ? 'bg-white dark:bg-gray-700 shadow-sm font-medium' : 'text-gray-500'}`}
                        disabled={!isSubCategorySelected}
                    >
                        טקסט
                    </button>
                    <button
                        type='button'
                        onClick={() => handleQuestionChange('answersMode', 'image')}
                        className={`px-3 py-1 text-sm rounded-md transition-all ${isImageMode ? 'bg-white dark:bg-gray-700 shadow-sm font-medium' : 'text-gray-500'}`}
                        disabled={!isSubCategorySelected}
                    >
                        תמונה
                    </button>
                </div>
            </div>
            <div id={`q${activeQuestionIndex}-correct-container`} className={`rounded-xl transition-all ${errors[`q${activeQuestionIndex}-correct-container`] ? 'ring-2 ring-red-500 ring-offset-2 p-2' : ''}`}>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((num) => {
                        const isCorrect = question.correctAnswer === num.toString();
                        const hasSelection = question.correctAnswer !== '';
                        const answerKey = `answer${num}` as keyof QuestionItem;
                        const answerImageKey = `answer${num}Image` as keyof QuestionItem;
                        const answerValue = (question as any)[answerKey];
                        const answerImageValue = (question as any)[answerImageKey];

                        return (
                            <div key={num} className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <div
                                        onClick={() => isSubCategorySelected && handleQuestionChange('correctAnswer', num.toString())}
                                        className={`
                                            w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all flex-shrink-0
                                            ${isCorrect
                                                ? 'border-green-500 bg-green-500'
                                                : hasSelection
                                                    ? 'border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10' // Slight red tint for wrong answers
                                                    : 'border-gray-200 dark:border-gray-800 hover:border-green-500'}
                                            ${!isSubCategorySelected ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        {isCorrect && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                    </div>
                                    <div className="flex-1 flex gap-2">
                                        {!isImageMode ? (
                                            <Textarea
                                                id={`q${activeQuestionIndex}-ans${num}`}
                                                placeholder={`${labels.answerPlaceholder} ${num}`}
                                                value={answerValue}
                                                onChange={(e) => handleQuestionChange(answerKey, e.target.value)}
                                                onFocus={onFocus}
                                                className={`transition-all ${useResponsiveFontSize("a".repeat(Math.max((question.answer1 || "").length, (question.answer2 || "").length, (question.answer3 || "").length, (question.answer4 || "").length)))} ${hasSelection
                                                    ? isCorrect
                                                        ? 'border-2 border-green-500 bg-green-50/5 dark:bg-green-500/10'
                                                        : 'border-2 border-red-500 bg-red-100/10 dark:bg-red-900/20' // Bolder red for wrong answers
                                                    : ''
                                                    }`}
                                                dir={isEnglish ? 'ltr' : undefined}
                                                disabled={!isSubCategorySelected}
                                                error={errors[`q${activeQuestionIndex}-ans${num}`] ? ' ' : undefined}
                                            />
                                        ) : (
                                            // Image Mode
                                            <div className={`
                                                flex-1 relative rounded-lg border overflow-hidden bg-white dark:bg-black p-1 transition-all h-[42px] flex items-center
                                                ${hasSelection
                                                    ? isCorrect
                                                        ? 'border-2 border-green-500 bg-green-50/5'
                                                        : 'border-2 border-red-500 bg-red-100/10'
                                                    : 'border-gray-200 dark:border-gray-800'
                                                }
                                            `}>
                                                {answerImageValue ? (
                                                    <>
                                                        <img
                                                            src={URL.createObjectURL(answerImageValue as File)}
                                                            className="h-full w-auto object-contain mx-auto"
                                                            alt=""
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImageChange(answerImageKey, null)}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                                                            disabled={!isSubCategorySelected}
                                                        >
                                                            <XIcon className="w-3 h-3" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <input
                                                            type="file"
                                                            id={`ans-image-${num}`}
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0] || null;
                                                                handleImageChange(answerImageKey, file);
                                                            }}
                                                            disabled={!isSubCategorySelected}
                                                        />
                                                        <label
                                                            htmlFor={`ans-image-${num}`}
                                                            className="w-full h-full flex items-center justify-center cursor-pointer text-gray-400 hover:text-blue-500"
                                                        >
                                                            <CameraIcon className="w-5 h-5" />
                                                            <span className="text-xs ml-2">העלה</span>
                                                        </label>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {showLatex && !isImageMode && (
                                    <div className="mt-2">
                                        <div
                                            className={`
                                                flex items-center gap-2 p-3 rounded-xl border transition-all
                                                ${isCorrect
                                                    ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10 ring-1 ring-green-500/20 shadow-lg shadow-green-500/5'
                                                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40'}
                                            `}
                                        >
                                            <div className={`
                                                w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold shrink-0 border
                                                ${isCorrect
                                                    ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}
                                            `}>
                                                {num}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className={`${useResponsiveFontSize("a".repeat(Math.max((question.answer1 || "").length, (question.answer2 || "").length, (question.answer3 || "").length, (question.answer4 || "").length)))} font-medium text-gray-800 dark:text-gray-200 ${isEnglish && !hasHebrew(answerValue || '') ? 'text-left' : 'text-right'}`}
                                                    dir={isEnglish && !hasHebrew(answerValue || '') ? 'ltr' : 'rtl'}
                                                >
                                                    <PreviewRender content={answerValue || '-'} minimal isEnglish={isEnglish} />
                                                </div>
                                            </div>

                                            {isCorrect && (
                                                <div className="text-green-600 dark:text-green-400 shrink-0 bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

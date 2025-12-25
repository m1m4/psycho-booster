import React from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { LatexPreview } from '@/components/ui/LatexPreview';
import { CameraIcon, XIcon } from './SubmitIcons';
import { QuestionItem } from '@/types/submit';

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
    labels
}: AnswersListProps) {
    return (
        <div>
            <h3 className={`text-lg font-medium mb-4 ${isEnglish ? 'text-left' : ''}`}>{labels.answers}</h3>
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
                            <div key={num} className="space-y-2">
                                <div className="flex items-center gap-4">
                                    <div
                                        onClick={() => isSubCategorySelected && handleQuestionChange('correctAnswer', num.toString())}
                                        className={`
                                            w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all flex-shrink-0
                                            ${isCorrect
                                                ? 'border-green-500 bg-green-500'
                                                : 'border-gray-200 dark:border-gray-800 hover:border-green-500'}
                                            ${!isSubCategorySelected ? 'opacity-50 cursor-not-allowed' : ''}
                                        `}
                                    >
                                        {isCorrect && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                    </div>
                                    <div className="flex-1 flex gap-2">
                                        {!answerImageValue ? (
                                            <Textarea
                                                id={`q${activeQuestionIndex}-ans${num}`}
                                                placeholder={`${labels.answerPlaceholder} ${num}`}
                                                value={answerValue}
                                                onChange={(e) => handleQuestionChange(answerKey, e.target.value)}
                                                required
                                                singleLine={true}
                                                minHeight="46px"
                                                className={`transition-all ${hasSelection
                                                    ? isCorrect
                                                        ? 'border-2 border-green-500 bg-green-50/5 dark:bg-green-500/10'
                                                        : 'border-2 border-red-500 bg-red-50/5 dark:bg-red-500/10'
                                                    : ''
                                                    }`}
                                                dir={isEnglish ? 'ltr' : undefined}
                                                disabled={!isSubCategorySelected}
                                                error={errors[`q${activeQuestionIndex}-ans${num}`] ? ' ' : undefined}
                                            />
                                        ) : (
                                            <div className={`
                                                flex-1 relative rounded-lg border-2 overflow-hidden bg-white dark:bg-black p-1 transition-all h-[42px] flex items-center
                                                ${hasSelection
                                                    ? isCorrect
                                                        ? 'border-green-500 bg-green-50/5'
                                                        : 'border-red-500 bg-red-50/5'
                                                    : 'border-gray-200 dark:border-gray-800'
                                                }
                                            `}>
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
                                            </div>
                                        )}

                                        {!answerImageValue && (
                                            <div className="flex-shrink-0 flex items-center gap-2">
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
                                                    className={`p-2 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center text-gray-400 opacity-60 ${!isSubCategorySelected ? 'cursor-not-allowed pointer-events-none' : ''}`}
                                                    title={isEnglish ? "Upload Image" : "העלה תמונה"}
                                                >
                                                    <CameraIcon className="w-5 h-5" />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {showLatex && !answerImageValue && (
                                    <div className={isEnglish ? 'pl-10' : 'pr-10'}>
                                        <LatexPreview
                                            content={answerValue}
                                            label={isEnglish ? `Preview Answer ${num}` : `תצוגה מקדימה לתשובה ${num}`}
                                        />
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

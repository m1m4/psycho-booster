import React from 'react';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LatexPreview } from '@/components/ui/LatexPreview';
import { CameraIcon, XIcon } from './SubmitIcons';
import { AnswersList } from './AnswersList';
import { QuestionItem } from '@/types/submit';

interface SingleQuestionFormProps {
    question: QuestionItem;
    activeQuestionIndex: number;
    isQuestionSet: boolean;
    isEnglish: boolean;
    isSubCategorySelected: boolean;
    showLatex: boolean;
    formErrors: Record<string, boolean>;
    handleQuestionChange: (field: keyof QuestionItem, value: any) => void;
    handleImageChange: (field: keyof QuestionItem, file: File | null) => void;
    labels: {
        answers: string;
        answerPlaceholder: string;
        explanation: string;
    };
}

export function SingleQuestionForm({
    question,
    activeQuestionIndex,
    isQuestionSet,
    isEnglish,
    isSubCategorySelected,
    showLatex,
    formErrors,
    handleQuestionChange,
    handleImageChange,
    labels
}: SingleQuestionFormProps) {
    return (
        <div
            id="question-form-container"
            className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl space-y-6 border border-gray-200 dark:border-gray-800 scroll-mt-20"
            dir={isEnglish ? 'ltr' : 'rtl'}
        >
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                    {isQuestionSet
                        ? (isEnglish ? `Question ${activeQuestionIndex + 1}` : `שאלה ${activeQuestionIndex + 1}`)
                        : (isEnglish ? 'Question Details' : 'פרטי השאלה')
                    }
                </h2>
                <div className="w-40">
                    <Select
                        id={`q${activeQuestionIndex}-difficulty`}
                        options={[
                            { label: 'קל', value: 'easy' },
                            { label: 'בינוני', value: 'medium' },
                            { label: 'קשה', value: 'hard' },
                        ]}
                        placeholder="רמה..."
                        value={question.difficulty}
                        onChange={(e) => handleQuestionChange('difficulty', e.target.value)}
                        dir="rtl"
                        disabled={!isSubCategorySelected}
                        error={formErrors[`q${activeQuestionIndex}-difficulty`] ? ' ' : undefined}
                    />
                </div>
            </div>

            <Textarea
                id={`q${activeQuestionIndex}-text`}
                value={question.questionText}
                onChange={(e) => handleQuestionChange('questionText', e.target.value)}
                placeholder={isEnglish ? 'Type question here...' : 'הקלד את השאלה כאן...'}
                required
                dir={isEnglish ? 'ltr' : undefined}
                disabled={!isSubCategorySelected}
                error={formErrors[`q${activeQuestionIndex}-text`] ? ' ' : undefined}
            />
            {showLatex && (
                <LatexPreview content={question.questionText} />
            )}

            {!isQuestionSet && (
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <CameraIcon className="w-4 h-4" />
                        {isEnglish ? "Attach Image to Question (Optional)" : "צרף תמונה לשאלה (אופציונלי)"}
                    </label>
                    <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl transition-all hover:border-[#4169E1]/50 bg-white dark:bg-black overflow-hidden min-h-[160px] flex items-center justify-center">
                        {question.questionImage ? (
                            <div className="relative w-full h-full flex items-center justify-center p-2">
                                <img
                                    src={URL.createObjectURL(question.questionImage as File)}
                                    className="max-w-full max-h-[400px] object-contain rounded-lg"
                                    alt="Question Content"
                                />
                                <button
                                    type="button"
                                    onClick={() => handleImageChange('questionImage', null)}
                                    className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 shadow-md hover:bg-red-600 transition-colors z-10"
                                    disabled={!isSubCategorySelected}
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="file"
                                    id="question-image"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        handleImageChange('questionImage', file);
                                    }}
                                    disabled={!isSubCategorySelected}
                                />
                                <div className="flex flex-col items-center justify-center gap-2 text-gray-500 p-8">
                                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-full">
                                        <CameraIcon className="w-8 h-8" />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-medium">{isEnglish ? "Click or drag to upload photo" : "לחץ או גרור להעלאת תמונה"}</p>
                                        <p className="text-xs opacity-60">PNG, JPG</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            <AnswersList
                question={question}
                activeQuestionIndex={activeQuestionIndex}
                handleQuestionChange={handleQuestionChange}
                handleImageChange={handleImageChange}
                isSubCategorySelected={isSubCategorySelected}
                isEnglish={isEnglish}
                showLatex={showLatex}
                errors={formErrors}
                labels={labels}
            />

            <div dir={isEnglish ? 'ltr' : 'rtl'}>
                <Textarea
                    id={`q${activeQuestionIndex}-explanation`}
                    label={labels.explanation}
                    value={question.explanation}
                    onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                    placeholder={isEnglish ? 'Explain why the correct answer is correct...' : 'הסבר מדוע התשובה הנכונה היא נכונה...'}
                    required
                    dir={isEnglish ? 'ltr' : 'rtl'}
                    disabled={!isSubCategorySelected}
                    error={formErrors[`q${activeQuestionIndex}-explanation`] ? ' ' : undefined}
                />
                {showLatex && <LatexPreview content={question.explanation} />}
            </div>
        </div>
    );
}

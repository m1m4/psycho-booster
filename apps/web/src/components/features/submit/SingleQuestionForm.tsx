import React from 'react';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PreviewRender } from '@/components/ui/PreviewRender';
import { CameraIcon, XIcon } from './SubmitIcons';
import { AnswersList } from './AnswersList';
import { QuestionPreview, useResponsiveFontSize, hasHebrew } from './QuestionPreview';
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
    if (!question) return null;

    const scrollOnFocus = (e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        // Scroll the element into view with a bit of padding at the top
        e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    return (
        <div
            id="question-form-container"
            className="flex-1 space-y-6 scroll-mt-20"
            dir={isEnglish ? 'ltr' : 'rtl'}
        >
            <div className="flex justify-between items-center gap-4">
                <h2 className="text-xl font-semibold">
                    {isQuestionSet
                        ? (isEnglish ? `Question ${activeQuestionIndex + 1}` : `שאלה ${activeQuestionIndex + 1}`)
                        : (isEnglish ? 'Question Details' : 'פרטי השאלה')
                    }
                </h2>
                <div className="w-40">
                    {isQuestionSet ? (
                        <Select
                            id={`q${activeQuestionIndex}-difficulty`}
                            label={isEnglish ? 'Question Difficulty' : 'רמת קושי לשאלה'}
                            options={[
                                { label: isEnglish ? 'Low' : 'נמוך', value: 'easy' },
                                { label: isEnglish ? 'Medium' : 'בינוני', value: 'medium' },
                                { label: isEnglish ? 'High' : 'גבוה', value: 'hard' },
                            ]}
                            placeholder={isEnglish ? 'Difficulty...' : 'רמה...'}
                            value={question.difficulty}
                            onChange={(e) => handleQuestionChange('difficulty', e.target.value)}
                            dir={isEnglish ? 'ltr' : 'rtl'}
                            disabled={!isSubCategorySelected}
                            error={formErrors[`q${activeQuestionIndex}-difficulty`] ? ' ' : undefined}
                        />
                    ) : null}
                </div>
            </div>

            <Textarea
                id={`q${activeQuestionIndex}-text`}
                value={question.questionText}
                onChange={(e) => handleQuestionChange('questionText', e.target.value)}
                onFocus={scrollOnFocus}
                placeholder={isEnglish ? 'Type question here...' : 'הקלד את השאלה כאן...'}
                dir={isEnglish ? 'ltr' : undefined}
                disabled={!isSubCategorySelected}
                error={formErrors[`q${activeQuestionIndex}-text`] ? ' ' : undefined}
                className={useResponsiveFontSize(question.questionText)}
                rows={4}
            />
            {showLatex && (
                <div className="mt-4">
                    <div className="text-xs font-bold text-gray-500 mb-2 px-1">
                        {isEnglish ? 'Question Preview' : 'תצוגה מקדימה לשאלה'}
                    </div>
                    <div
                        className={`p-4 rounded-2xl bg-gray-50/50 border border-gray-100 ${useResponsiveFontSize(question.questionText)} font-normal text-gray-900 whitespace-pre-wrap ${isEnglish && !hasHebrew(question.questionText) ? 'text-left' : 'text-right'}`}
                        dir={isEnglish && !hasHebrew(question.questionText) ? 'ltr' : 'rtl'}
                    >
                        <PreviewRender content={question.questionText} minimal isEnglish={isEnglish} />
                    </div>
                </div>
            )}

            {!isQuestionSet && (
                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <CameraIcon className="w-4 h-4" />
                        {isEnglish ? "Attach Image to Question (Optional)" : "צרף תמונה לשאלה (אופציונלי)"}
                    </label>
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl transition-all hover:border-[#4169E1]/50 bg-white overflow-hidden min-h-[160px] flex items-center justify-center">
                        {question.questionImage ? (
                            <div className="relative w-full h-full flex items-center justify-center p-2">
                                <img
                                    src={typeof question.questionImage === 'string' ? question.questionImage : URL.createObjectURL(question.questionImage as File)}
                                    className="max-w-full max-h-[400px] object-contain rounded-lg"
                                    alt="Question Content"
                                />
                                {question.questionImage instanceof File && (
                                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full font-medium border border-white/10">
                                        {(question.questionImage.size / 1024).toFixed(0)}KB
                                    </div>
                                )}
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
                                    <div className="p-3 bg-gray-50 rounded-full">
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
                onFocus={scrollOnFocus}
            />

            <div dir={isEnglish ? 'ltr' : 'rtl'}>
                <Textarea
                    id={`q${activeQuestionIndex}-explanation`}
                    label={labels.explanation}
                    value={question.explanation}
                    onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                    onFocus={scrollOnFocus}
                    placeholder={isEnglish ? 'Explain why the correct answer is correct...' : 'הסבר מדוע התשובה הנכונה היא נכונה...'}
                    dir={isEnglish ? 'ltr' : 'rtl'}
                    disabled={!isSubCategorySelected}
                    error={formErrors[`q${activeQuestionIndex}-explanation`] ? ' ' : undefined}
                    className={useResponsiveFontSize(question.explanation)}
                    rows={4}
                />
                {showLatex && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-2">
                            {isEnglish ? 'Explanation Preview' : 'תצוגה מקדימה להסבר'}
                        </h4>
                        <div
                            className={`p-4 rounded-2xl bg-gray-50/50 border border-gray-100 text-gray-600 ${useResponsiveFontSize(question.explanation)} ${isEnglish && !hasHebrew(question.explanation) ? 'text-left' : 'text-right'}`}
                            dir={isEnglish && !hasHebrew(question.explanation) ? 'ltr' : 'rtl'}
                        >
                            <PreviewRender content={question.explanation} minimal isEnglish={isEnglish} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

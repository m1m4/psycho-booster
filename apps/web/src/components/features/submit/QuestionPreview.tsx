import React, { useState } from 'react';
import { QuestionItem, SUBCATEGORY_OPTIONS, TOPIC_OPTIONS } from '@/types/submit';
import { LatexPreview } from '@/components/ui/LatexPreview';

const CATEGORY_LABELS: Record<string, string> = {
    verbal: 'מילולי',
    quantitative: 'כמותי',
    english: 'אנגלית'
};

interface QuestionPreviewProps {
    formData: {
        category: string;
        subcategory: string;
        topic?: string;
        assetFile: File | null;
        assetText: string;
        questions: QuestionItem[];
    };
    isEnglish: boolean;
}

export function QuestionPreview({ formData, isEnglish }: QuestionPreviewProps) {
    const [activeTab, setActiveTab] = useState(0);
    const { questions, assetFile, assetText } = formData;
    const currentQuestion = questions[activeTab];
    const isQuestionSet = questions.length > 1 || !!assetText || !!assetFile;

    const showAsset = assetFile || assetText;
    const isAssetRequiredSubcategory =
        formData.subcategory === 'chart_inference' ||
        formData.subcategory === 'reading_comprehension_verbal' ||
        formData.subcategory === 'reading_comprehension_eng';

    const renderAsset = () => {
        if (!showAsset || !isAssetRequiredSubcategory) return null;
        return (
            <div className="bg-transparent mb-4">
                {assetFile && (
                    <img
                        src={URL.createObjectURL(assetFile)}
                        alt="Asset"
                        className="max-h-60 h-auto w-auto object-contain rounded-lg mb-4 mx-auto"
                    />
                )}
                {assetText && (
                    <div className="dark:text-gray-300 text-gray-700" dir={isEnglish ? 'ltr' : 'rtl'}>
                        <LatexPreview content={assetText} />
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-6" dir={isEnglish ? 'ltr' : 'rtl'}>

            {/* Header info - Title Only (Difficulty moved to question frame) */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {CATEGORY_LABELS[formData.category] || formData.category} - {
                        Object.values(SUBCATEGORY_OPTIONS)
                            .flat()
                            .find(opt => opt.value === formData.subcategory)?.label || formData.subcategory
                    } {formData.topic && ` - ${Object.values(TOPIC_OPTIONS)
                        .flat()
                        .find(opt => opt.value === formData.topic)?.label || formData.topic
                        }`}
                </h2>
            </div>

            {/* Main Content Area - Split Layout for Question Sets */}
            {/* Logic: If Asset + Multiple Questions -> Split 50/50. Else -> Stacked/Centered */}
            <div className={`flex flex-col md:flex-row gap-6 ${isQuestionSet && questions.length > 1 ? '' : 'justify-center'}`}>

                {/* Right Column: Shared Assets (Desktop) - Always First (RTL: Right, LTR: Left) */}
                {showAsset && (
                    <div className={`w-full ${isQuestionSet && questions.length > 1 ? 'md:w-1/2' : 'max-w-3xl mx-auto'}`}>
                        <div className="sticky top-4">
                            {renderAsset()}
                        </div>
                    </div>
                )}

                {/* Left Column: Question Tabs & Content */}
                <div className={`w-full ${showAsset && questions.length > 1 ? 'md:w-1/2' : 'max-w-3xl mx-auto'}`}>

                    {/* Tabs */}
                    {questions.length > 1 && (
                        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-1 mb-2" dir={isEnglish ? 'ltr' : 'rtl'}>
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveTab(idx)}
                                    className={`
                                        px-6 py-2 text-sm font-bold rounded-t-xl transition-all whitespace-nowrap
                                        ${activeTab === idx
                                            ? 'bg-[#4169E1] text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}
                                    `}
                                >
                                    {isEnglish ? `Q ${idx + 1}` : `שאלה ${idx + 1}`}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Unified Question Frame */}
                    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm space-y-4">

                        {/* Question Text & Difficulty - Compact Flex */}
                        <div className="flex justify-between items-start gap-4">
                            <div className="text-lg font-medium flex-1">
                                <LatexPreview content={currentQuestion.questionText} />
                            </div>
                            {/* Difficulty Label - Beside Question */}
                            <span className={`
                                px-2 py-1 rounded text-xs font-bold whitespace-nowrap shrink-0
                                ${currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200/50' : ''}
                                ${currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200/50' : ''}
                                ${currentQuestion.difficulty === 'hard' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200/50' : ''}
                            `}>
                                {currentQuestion.difficulty === 'easy' ? 'קל' : currentQuestion.difficulty === 'medium' ? 'בינוני' : currentQuestion.difficulty === 'hard' ? 'קשה' : currentQuestion.difficulty}
                            </span>
                        </div>

                        {/* Question Image */}
                        {currentQuestion.questionImage && (
                            <div className="flex justify-center bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg">
                                <img
                                    src={URL.createObjectURL(currentQuestion.questionImage)}
                                    alt="Question"
                                    className="max-h-60 h-auto w-auto object-contain rounded shadow-sm"
                                />
                            </div>
                        )}

                        {/* Answers Grid - Compact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[1, 2, 3, 4].map((num) => {
                                const answerKey = `answer${num}` as keyof QuestionItem;
                                const answerImageKey = `answer${num}Image` as keyof QuestionItem;
                                const isCorrect = currentQuestion.correctAnswer === num.toString();
                                const answerText = currentQuestion[answerKey] as string;
                                const answerImage = currentQuestion[answerImageKey] as File | null;

                                return (
                                    <div
                                        key={num}
                                        className={`
                                            flex flex-col rounded-lg border transition-all overflow-hidden
                                            ${isCorrect
                                                ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10 shadow-sm'
                                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-90'}
                                        `}
                                    >
                                        {/* Answer Header - Compact */}
                                        <div className={`
                                            flex items-center justify-between px-2 py-1 text-[10px] font-bold border-b
                                            ${isCorrect
                                                ? 'bg-green-100/30 dark:bg-green-900/30 border-green-500/10 text-green-700 dark:text-green-300'
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400'}
                                        `}>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-4 h-4 flex items-center justify-center rounded-full border border-current text-[9px]">
                                                    {num}
                                                </div>
                                            </div>
                                            {isCorrect && (
                                                <span className="flex items-center gap-0.5 text-green-700 dark:text-green-300">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-1 text-center flex-1 flex items-center justify-center min-h-[50px]">
                                            {answerImage ? (
                                                <img
                                                    src={URL.createObjectURL(answerImage)}
                                                    alt={`Answer ${num}`}
                                                    className="h-16 w-full object-contain mx-auto rounded"
                                                />
                                            ) : (
                                                <div className="text-sm font-medium px-2">
                                                    <LatexPreview content={answerText || '-'} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Explanation - Compact */}
                        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {isEnglish ? 'Explanation' : 'הסבר'}
                            </h4>
                            <div className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                                <LatexPreview content={currentQuestion.explanation} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

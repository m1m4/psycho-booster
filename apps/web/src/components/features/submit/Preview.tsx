'use client';

import React, { useState } from 'react';
import { QuestionItem, SavedQuestionItem, SUBCATEGORY_OPTIONS, TOPIC_OPTIONS } from '@/types/submit';
import { LatexPreview } from '@/components/ui/LatexPreview';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

const hasHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);

export const CATEGORY_LABELS: Record<string, string> = {
    verbal: 'מילולי',
    quantitative: 'כמותי',
    english: 'אנגלית'
};



interface PreviewProps {
    formData: {
        category: string;
        subcategory: string;
        topic?: string;
        assetFile?: File | null;
        assetImageUrl?: string | null;
        assetText: string;
        questions: (QuestionItem | SavedQuestionItem)[];
    };
    isEnglish: boolean;
}

export function Preview({ formData, isEnglish }: PreviewProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const { questions, assetFile, assetImageUrl, assetText } = formData;
    const currentQuestion = questions[activeTab];

    const getImageSrc = (image: File | string | null | undefined) => {
        if (!image) return undefined;
        if (typeof image === 'string') return image;
        return URL.createObjectURL(image);
    };

    // Helper to access image safely (whether File or URL string property)
    const getQuestionImage = (q: any, fieldPrefx: string) => {
        // Try File property first (e.g. answer1Image)
        if (q[fieldPrefx + 'Image']) return getImageSrc(q[fieldPrefx + 'Image']);
        // Try URL property (e.g. answer1ImageUrl)
        if (q[fieldPrefx + 'ImageUrl']) return getImageSrc(q[fieldPrefx + 'ImageUrl']);
        return undefined;
    };

    const showAssetData = assetFile || assetImageUrl || assetText;
    const isAssetRequiredSubcategory =
        formData.subcategory === 'chart_inference' ||
        formData.subcategory === 'reading_comprehension_verbal' ||
        formData.subcategory === 'reading_comprehension_eng';

    const isAssetVisible = !!showAssetData && isAssetRequiredSubcategory;
    const isMultiQuestion = questions.length > 1;
    const isChartInference = formData.subcategory === 'chart_inference';

    const renderAsset = () => {
        if (!isAssetVisible) return null;

        const assetSrc = getImageSrc(assetFile || assetImageUrl);
        const imageElement = assetSrc && (
            <img
                src={assetSrc}
                alt="Asset"
                className="max-h-60 h-auto w-auto object-contain rounded-lg mb-4 mx-auto cursor-zoom-in hover:opacity-90 transition-opacity shadow-md"
                onClick={() => setLightboxImage(assetSrc)}
                title="Click to zoom"
            />
        );

        const textElement = assetText && (
            <div
                className={`dark:text-gray-300 text-gray-700 ${isEnglish && !hasHebrew(assetText) ? 'text-left' : 'text-right'}`}
                dir={isEnglish && !hasHebrew(assetText) ? 'ltr' : 'rtl'}
            >
                <LatexPreview content={assetText} minimal isEnglish={isEnglish} />
            </div>
        );

        return (
            <div className="bg-transparent mb-4">
                {isChartInference ? (
                    <>
                        {textElement}
                        <div className="mt-4">{imageElement}</div>
                    </>
                ) : (
                    <>
                        {imageElement}
                        {textElement}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8 w-fit mx-auto min-w-0" dir={isEnglish ? 'ltr' : 'rtl'}>
            {/* Width Sizer: Hidden container to force modal width to max question content width */}
            <div className="h-0 overflow-hidden invisible pointer-events-none select-none aria-hidden" aria-hidden="true">
                {questions.map((q, idx) => (
                    <div key={idx} className="mb-4 max-w-[800px] w-fit">
                        <div className="text-lg font-medium min-w-[300px] whitespace-pre-wrap">{q.questionText}</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-lg">{q.answer1}</div>
                            <div className="text-lg">{q.answer2}</div>
                            <div className="text-lg">{q.answer3}</div>
                            <div className="text-lg">{q.answer4}</div>
                        </div>
                        <div className="text-lg whitespace-pre-wrap">{q.explanation}</div>
                    </div>
                ))}
            </div>

            {/* Header info - Title Only (Difficulty moved to question frame) */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-2 w-full">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
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
            <div className={`flex flex-col md:flex-row gap-8 ${isAssetVisible && isMultiQuestion ? 'w-full' : 'w-full mx-auto'}`}>

                {/* Right Column: Shared Assets (Desktop) - Always First (RTL: Right, LTR: Left) */}
                {isAssetVisible && (
                    <div className={`w-full ${isMultiQuestion ? 'md:w-1/2' : 'mb-8'}`}>
                        <div className="sticky top-4">
                            {renderAsset()}
                        </div>
                    </div>
                )}

                {/* Left Column: Question Tabs & Content */}
                <div className={`w-full max-w-[800px] ${isAssetVisible && isMultiQuestion ? 'md:w-1/2' : 'mx-auto'}`}>

                    {/* Tabs */}
                    {isMultiQuestion && (
                        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-1 mb-8 w-full" dir={isEnglish ? 'ltr' : 'rtl'}>
                            {questions.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setActiveTab(idx)}
                                    className={`
                                        px-6 py-3 text-sm font-bold rounded-t-xl transition-all whitespace-nowrap
                                        ${activeTab === idx
                                            ? 'bg-[#4169E1] text-white shadow-md'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}
                                    `}
                                >
                                    {isEnglish ? `Question ${idx + 1}` : `שאלה ${idx + 1}`}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Unified Question Content */}
                    <div className="space-y-6 w-full">

                        {/* Question Text Frame */}
                        <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl w-full">
                            <div className="flex justify-between items-start gap-8 w-full">
                                <div
                                    className={`text-lg font-medium flex-1 text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap ${isEnglish && !hasHebrew(currentQuestion.questionText) ? 'text-left' : 'text-right'}`}
                                    dir={isEnglish && !hasHebrew(currentQuestion.questionText) ? 'ltr' : 'rtl'}
                                >
                                    <LatexPreview content={currentQuestion.questionText} minimal isEnglish={isEnglish} />
                                </div>
                                {/* Difficulty Label - Beside Question */}
                                <span className={`
                                    px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0
                                    ${currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                                    ${currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                                    ${currentQuestion.difficulty === 'hard' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                                `}>
                                    {currentQuestion.difficulty === 'easy' ? 'נמוך' : currentQuestion.difficulty === 'medium' ? 'בינוני' : currentQuestion.difficulty === 'hard' ? 'גבוה' : currentQuestion.difficulty}
                                </span>
                            </div>

                            {/* Question Image */}
                            {getQuestionImage(currentQuestion, 'question') && (
                                <div className="mt-6 flex justify-center p-4 rounded-xl bg-white dark:bg-black/20 border border-gray-100 dark:border-gray-800/50">
                                    <img
                                        src={getQuestionImage(currentQuestion, 'question')!}
                                        alt="Question"
                                        className="max-h-80 h-auto w-auto object-contain rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity"
                                        onClick={() => setLightboxImage(getQuestionImage(currentQuestion, 'question')!)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Answers Grid - Compact & Integrated */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                            {[1, 2, 3, 4].map((num) => {
                                const qAny = currentQuestion as any;
                                const answerKey = `answer${num}`;
                                const answerImageKey = `answer${num}Image`;
                                const isCorrect = currentQuestion.correctAnswer === num.toString();
                                const answerText = qAny[answerKey] as string;
                                const answerImage = qAny[answerImageKey] as File | null;

                                return (
                                    <div
                                        key={num}
                                        className={`
                                            flex items-center gap-4 p-5 rounded-2xl border transition-all
                                            ${isCorrect
                                                ? 'border-green-500 bg-green-50/50 dark:bg-green-900/10 ring-1 ring-green-500/20 shadow-lg shadow-green-500/5'
                                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 hover:border-gray-300 dark:hover:border-gray-700'}
                                        `}
                                    >
                                        {/* Answer Number indicator */}
                                        <div className={`
                                            w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold shrink-0 border
                                            ${isCorrect
                                                ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500'}
                                        `}>
                                            {num}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            {getQuestionImage(currentQuestion, `answer${num}`) ? (
                                                <img
                                                    src={getQuestionImage(currentQuestion, `answer${num}`)!}
                                                    alt={`Answer ${num}`}
                                                    className="h-14 w-auto object-contain rounded cursor-zoom-in hover:opacity-90 transition-opacity"
                                                    onClick={() => setLightboxImage(getQuestionImage(currentQuestion, `answer${num}`)!)}
                                                />
                                            ) : (
                                                <div
                                                    className={`text-lg font-medium text-gray-800 dark:text-gray-200 leading-normal ${isEnglish && !hasHebrew(answerText || '') ? 'text-left' : 'text-right'}`}
                                                    dir={isEnglish && !hasHebrew(answerText || '') ? 'ltr' : 'rtl'}
                                                >
                                                    <LatexPreview content={answerText || '-'} minimal isEnglish={isEnglish} />
                                                </div>
                                            )}
                                        </div>

                                        {isCorrect && (
                                            <div className="text-green-600 dark:text-green-400 shrink-0 bg-green-100 dark:bg-green-900/30 p-1.5 rounded-lg">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Explanation Section */}
                        <div className="bg-blue-50/30 dark:bg-blue-900/10 border border-blue-100/50 dark:border-blue-900/30 p-6 rounded-2xl w-full">
                            <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                                {isEnglish ? 'Explanation' : 'הסבר'}
                            </h4>
                            <div
                                className={`text-gray-600 dark:text-gray-400 text-lg leading-relaxed ${isEnglish && !hasHebrew(currentQuestion.explanation) ? 'text-left' : 'text-right'}`}
                                dir={isEnglish && !hasHebrew(currentQuestion.explanation) ? 'ltr' : 'rtl'}
                            >
                                <LatexPreview content={currentQuestion.explanation} minimal isEnglish={isEnglish} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ImageLightbox
                src={lightboxImage || ''}
                isOpen={!!lightboxImage}
                onClose={() => setLightboxImage(null)}
            />
        </div>
    );
}




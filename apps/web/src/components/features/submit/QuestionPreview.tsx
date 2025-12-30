'use client';

import React, { useState, useMemo } from 'react';
import { QuestionItem, SavedQuestionItem, SUBCATEGORY_OPTIONS, TOPIC_OPTIONS } from '@/types/submit';
import { PreviewRender } from '@/components/ui/PreviewRender';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

/**
 * Helper to detect if a string contains Hebrew characters.
 */
export const hasHebrew = (text: string): boolean => /[\u0590-\u05FF]/.test(text || '');

/**
 * Hook to calculate responsive font size based on text length.
 * Target: ~50 chars/line roughly.
 * Logic: 
 * - Standard size: 1.125rem (text-lg) => approx 18px
 * - If text is short (< 80 chars), scale UP to 1.5rem (text-2xl)
 * - If text is long (> 300 chars), scale DOWN to 1rem (text-base) or 0.875rem (text-sm)
 */
export const useResponsiveFontSize = (text: string, baseSize = 'text-lg') => {
    return useMemo(() => {
        if (!text) return baseSize;
        const len = text.length;
        if (len < 45) return 'text-xl leading-relaxed'; // Reduced from 2xl, user requested 45
        if (len < 120) return 'text-lg leading-relaxed'; // Reduced from xl
        if (len > 400) return 'text-xs leading-relaxed'; // Reduced from sm
        if (len > 250) return 'text-sm leading-relaxed'; // Reduced from base
        return 'text-base leading-relaxed'; // Standard reduced to base
    }, [text, baseSize]);
};

export const CATEGORY_LABELS: Record<string, string> = {
    verbal: 'מילולי',
    quantitative: 'כמותי',
    english: 'אנגלית'
};

interface QuestionPreviewProps {
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

export function QuestionPreview({ formData, isEnglish }: QuestionPreviewProps) {
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

    // Calculate generic font sizes for current view
    const questionFontSize = useResponsiveFontSize(currentQuestion.questionText);
    const explanationFontSize = useResponsiveFontSize(currentQuestion.explanation);

    // Find longest answer to normalize answer font sizes
    const longestAnswerLength = useMemo(() => {
        return Math.max(
            (currentQuestion.answer1 || '').length,
            (currentQuestion.answer2 || '').length,
            (currentQuestion.answer3 || '').length,
            (currentQuestion.answer4 || '').length
        );
    }, [currentQuestion]);

    // Create a dummy text of max length to get the unified class
    const answersFontSize = useResponsiveFontSize("a".repeat(longestAnswerLength));

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
                <PreviewRender content={assetText} minimal isEnglish={isEnglish} />
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

            {/* Header info - Title & Difficulty Inline */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-2 mb-2 w-full flex items-center justify-between gap-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap truncate">
                    {CATEGORY_LABELS[formData.category] || formData.category} - {
                        Object.values(SUBCATEGORY_OPTIONS)
                            .flat()
                            .find(opt => opt.value === formData.subcategory)?.label || formData.subcategory
                    } {formData.topic && ` - ${Object.values(TOPIC_OPTIONS)
                        .flat()
                        .find(opt => opt.value === formData.topic)?.label || formData.topic
                        }`}
                </h2>

                <span className={`
                    px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0
                    ${currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}
                    ${currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                    ${currentQuestion.difficulty === 'hard' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : ''}
                `}>
                    {currentQuestion.difficulty === 'easy' ? 'נמוך' : currentQuestion.difficulty === 'medium' ? 'בינוני' : currentQuestion.difficulty === 'hard' ? 'גבוה' : currentQuestion.difficulty}
                </span>
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

                        {/* Question Text Frame - Removed Background/Border */}
                        <div className="w-full">
                            <div
                                className={`${questionFontSize} font-normal text-gray-900 dark:text-white whitespace-pre-wrap ${isEnglish && !hasHebrew(currentQuestion.questionText) ? 'text-left' : 'text-right'}`}
                                dir={isEnglish && !hasHebrew(currentQuestion.questionText) ? 'ltr' : 'rtl'}
                            >
                                <PreviewRender content={currentQuestion.questionText} minimal isEnglish={isEnglish} />
                            </div>

                            {/* Question Image */}
                            {getQuestionImage(currentQuestion, 'question') && (
                                <div className="mt-4 flex justify-center">
                                    <img
                                        src={getQuestionImage(currentQuestion, 'question')!}
                                        alt="Question"
                                        className="max-h-80 h-auto w-auto object-contain rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity p-2 border border-gray-100 dark:border-gray-800" // Kept simple border for image
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
                                            flex items-center gap-2 p-3 rounded-xl border transition-all
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
                                                    className={`${answersFontSize} font-medium text-gray-800 dark:text-gray-200 ${isEnglish && !hasHebrew(answerText || '') ? 'text-left' : 'text-right'}`}
                                                    dir={isEnglish && !hasHebrew(answerText || '') ? 'ltr' : 'rtl'}
                                                >
                                                    <PreviewRender content={answerText || '-'} minimal isEnglish={isEnglish} />
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

                        {/* Explanation Section - Reduced Padding/Frames */}
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                                {isEnglish ? 'Explanation' : 'הסבר'}
                            </h4>
                            <div
                                className={`text-gray-600 dark:text-gray-400 ${explanationFontSize} ${isEnglish && !hasHebrew(currentQuestion.explanation) ? 'text-left' : 'text-right'}`}
                                dir={isEnglish && !hasHebrew(currentQuestion.explanation) ? 'ltr' : 'rtl'}
                            >
                                <PreviewRender content={currentQuestion.explanation} minimal isEnglish={isEnglish} />
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

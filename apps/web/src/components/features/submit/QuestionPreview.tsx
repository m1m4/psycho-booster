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
        if (len < 45) return 'text-lg leading-relaxed'; // Reduced from xl
        if (len < 120) return 'text-base leading-relaxed'; // Reduced from lg
        if (len > 400) return 'text-[10px] leading-relaxed'; // Reduced from xs
        if (len > 250) return 'text-xs leading-relaxed'; // Reduced from sm
        return 'text-sm leading-relaxed'; // Standard reduced to sm
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
        difficulty: string;
        assetFile?: File | null;
        assetImageUrl?: string | null;
        assetText: string;
        questions: (QuestionItem | SavedQuestionItem)[];
    };
    isEnglish: boolean;
    hideCorrectAnswer?: boolean;
    viewMode?: 'full' | 'question_only' | 'explanation_only' | 'asset_only'; // Controlled view for PDF export steps
    isExport?: boolean;
}

// Helper component to handle File -> Blob URL conversion with cleanup
function PreviewImage({
    src,
    alt,
    className,
    onClick,
    useCors = false,
    ...props
}: {
    src: File | string | null | undefined;
    alt: string;
    className?: string;
    onClick?: (src: string) => void;
    useCors?: boolean;
    [key: string]: any;
}) {
    const [displaySrc, setDisplaySrc] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);

    React.useEffect(() => {
        setHasError(false);
        if (src instanceof File) {
            const url = URL.createObjectURL(src);
            setDisplaySrc(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setDisplaySrc(typeof src === 'string' ? src : null);
        }
    }, [src]);

    if (!displaySrc) return null;

    if (hasError) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`}>
                <span className="text-gray-400 mb-1">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </span>
                <span className="text-xs text-gray-500 font-medium">Image Unavailable</span>
            </div>
        );
    }

    const isBlob = displaySrc.startsWith('blob:');

    return (
        <img
            src={displaySrc}
            alt={alt}
            className={className}
            onClick={() => onClick?.(src instanceof File ? displaySrc : (src as string))}
            onError={() => {
                console.warn('Image failed to load (likely CORS). Switching to placeholder.', displaySrc);
                setHasError(true);
            }}
            {...((useCors && !isBlob) ? { crossOrigin: "anonymous" } : {})}
            {...props}
        />
    );
}

export function QuestionPreview({ formData, isEnglish, hideCorrectAnswer = false, viewMode = 'full', isExport = false }: QuestionPreviewProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const { questions, assetFile, assetImageUrl, assetText } = formData;
    const currentQuestion = questions[activeTab];

    const getQuestionImageSource = (q: any, fieldPrefx: string) => {
        if (q[fieldPrefx + 'Image']) return q[fieldPrefx + 'Image'];
        if (q[fieldPrefx + 'ImageUrl']) return q[fieldPrefx + 'ImageUrl'];
        return undefined;
    };

    // Calculate generic font sizes for current view (keep existing logic)
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

    const answersFontSize = useResponsiveFontSize("a".repeat(longestAnswerLength));

    const showAssetData = assetFile || assetImageUrl || assetText;
    const isAssetRequiredSubcategory =
        formData.subcategory === 'chart_inference' ||
        formData.subcategory === 'reading_comprehension_verbal' ||
        formData.subcategory === 'reading_comprehension_eng';

    const isAssetVisible = (!!showAssetData && viewMode === 'asset_only') ||
        ((!!showAssetData && isAssetRequiredSubcategory) && viewMode !== 'question_only' && viewMode !== 'explanation_only') ||
        ((!!showAssetData && isExport) && viewMode !== 'question_only' && viewMode !== 'explanation_only');
    const isMultiQuestion = questions.length > 1;
    const isChartInference = formData.subcategory === 'chart_inference';

    const renderAsset = () => {
        if (!isAssetVisible) return null;

        const assetSrc = assetFile || assetImageUrl;

        const imageElement = assetSrc && (
            <PreviewImage
                src={assetSrc}
                alt="Asset"
                className={`${isExport ? 'max-h-[450px] h-auto w-auto max-w-full' : 'max-h-60 h-auto w-auto'} object-contain rounded-lg mb-4 mx-auto cursor-zoom-in hover:opacity-90 transition-opacity shadow-md`}
                onClick={setLightboxImage}
                title="Click to zoom"
                useCors={isExport}
            />
        );

        const textElement = assetText && (
            <div
                className={`text-gray-700 ${isEnglish && !hasHebrew(assetText) ? 'text-left' : 'text-right'}`}
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
        <div className={`space-y-8 ${isExport ? 'w-full' : 'w-fit mx-auto'} min-w-0`} dir={isEnglish ? 'ltr' : 'rtl'}>

            {/* Width Sizer: Hidden container (keep existing) */}
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

            {/* Header info - Only show in full or question mode, but hide for specific export questions */}
            {viewMode !== 'explanation_only' && !(isExport && viewMode === 'question_only') && (
                <div className={`border-b border-gray-200 ${isExport ? 'pb-1 mb-1' : 'pb-2 mb-2'} w-full flex items-center justify-between gap-4`}>
                    <h2 className={`${isExport ? 'text-base' : 'text-lg md:text-xl'} font-bold text-gray-900 whitespace-nowrap truncate`}>
                        {CATEGORY_LABELS[formData.category] || formData.category} - {
                            Object.values(SUBCATEGORY_OPTIONS)
                                .flat()
                                .find(opt => opt.value === formData.subcategory)?.label || formData.subcategory
                        } {formData.topic && ` - ${Object.values(TOPIC_OPTIONS)
                            .flat()
                            .find(opt => opt.value === formData.topic)?.label || formData.topic
                            }`}
                    </h2>

                    {!isExport && (
                        <div className="flex items-center gap-2">
                            {/* Set Difficulty */}
                            {isAssetRequiredSubcategory && formData.difficulty && (
                                <span className={`
                                    px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 border border-gray-200 flex items-center gap-1
                                    ${formData.difficulty === 'easy' ? 'text-green-600' : ''}
                                    ${formData.difficulty === 'medium' ? 'text-yellow-600' : ''}
                                    ${formData.difficulty === 'hard' ? 'text-red-600' : ''}
                                `}>
                                    <span className="opacity-60 font-normal">{isEnglish ? 'Set:' : 'ערכה:'}</span>
                                    {formData.difficulty === 'easy' ? 'נמוך' : formData.difficulty === 'medium' ? 'בינוני' : formData.difficulty === 'hard' ? 'גבוה' : formData.difficulty}
                                </span>
                            )}

                            {/* Question Difficulty */}
                            <span className={`
                                px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0
                                ${currentQuestion.difficulty === 'easy' ? 'bg-green-100 text-green-800' : ''}
                                ${currentQuestion.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : ''}
                                ${currentQuestion.difficulty === 'hard' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                                {isAssetRequiredSubcategory && <span className="opacity-60 font-normal ml-1">{isEnglish ? 'Question:' : 'שאלה:'}</span>}
                                {currentQuestion.difficulty === 'easy' ? 'נמוך' : currentQuestion.difficulty === 'medium' ? 'בינוני' : currentQuestion.difficulty === 'hard' ? 'גבוה' : currentQuestion.difficulty}
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Main Content Area */}
            <div className={`flex flex-col md:flex-row gap-8 ${isAssetVisible && isMultiQuestion ? 'w-full' : 'w-full mx-auto'}`}>

                {/* Shared Assets - Not in explanation_only or question_only */}
                {viewMode !== 'explanation_only' && viewMode !== 'question_only' && isAssetVisible && (
                    <div className={`w-full ${(isMultiQuestion && viewMode !== 'asset_only') ? 'md:w-1/2' : 'mb-8'}`}>
                        <div className="sticky top-4">
                            {renderAsset()}
                        </div>
                    </div>
                )}

                {/* Left Column: Question Tabs & Content - Hide in asset_only */}
                {viewMode !== 'asset_only' && (
                    <div className={`w-full max-w-[800px] ${isAssetVisible && isMultiQuestion ? 'md:w-1/2' : 'mx-auto'}`}>

                        {/* Tabs - Only if multi-question and not explanation mode (explanations will just list loop in parent usually, or we handle here) */}
                        {/* Actually for PDF export we usually iterate questions outside, so this component likely renders ONE question at a time if fed single item arrays, but here we feed the whole form data. */}
                        {/* For 'explanation_only', we might want to just show the current active one, relying on parent to cycle tabs or feed singular data. */}
                        {isMultiQuestion && viewMode !== 'explanation_only' && (
                            <div className="flex gap-2 border-b border-gray-200 overflow-x-auto pb-1 mb-8 w-full" dir={isEnglish ? 'ltr' : 'rtl'}>
                                {questions.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveTab(idx)}
                                        className={`
                                        px-6 py-3 text-sm font-bold rounded-t-xl transition-all whitespace-nowrap
                                        ${activeTab === idx
                                                ? 'bg-[#4169E1] text-white shadow-md'
                                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                                    `}
                                    >
                                        {isEnglish ? `Question ${idx + 1}` : `שאלה ${idx + 1}`}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Unified Question Content */}
                        <div className="space-y-6 w-full">

                            {/* Question Text & Image - Show in full or question_only */}
                            {viewMode !== 'explanation_only' && (
                                <div className="w-full">
                                    <div
                                        className={`${questionFontSize} font-normal text-gray-900 whitespace-pre-wrap ${isEnglish && !hasHebrew(currentQuestion.questionText) ? 'text-left' : 'text-right'}`}
                                        dir={isEnglish && !hasHebrew(currentQuestion.questionText) ? 'ltr' : 'rtl'}
                                    >
                                        <PreviewRender content={currentQuestion.questionText} minimal isEnglish={isEnglish} />
                                    </div>

                                    {getQuestionImageSource(currentQuestion, 'question') && (
                                        <div className="mt-4 flex justify-center">
                                            <PreviewImage
                                                src={getQuestionImageSource(currentQuestion, 'question')}
                                                alt="Question"
                                                className="max-h-80 h-auto w-auto object-contain rounded-lg cursor-zoom-in hover:opacity-90 transition-opacity p-2 border border-gray-100"
                                                onClick={setLightboxImage}
                                                useCors={isExport}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Answers Grid - Show in full or question_only */}
                            {viewMode !== 'explanation_only' && (
                                <div className={`grid gap-4 w-full ${isExport ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'}`}>
                                    {[1, 2, 3, 4].map((num) => {
                                        const qAny = currentQuestion as any;
                                        const answerKey = `answer${num}`;
                                        const answerText = qAny[answerKey] as string;
                                        const isCorrect = currentQuestion.correctAnswer === num.toString();
                                        const answerImgSrc = getQuestionImageSource(currentQuestion, `answer${num}`);

                                        return (
                                            <div
                                                key={num}
                                                className={`
                                                flex items-center gap-2 p-3 rounded-xl border transition-all
                                                ${isCorrect && !hideCorrectAnswer
                                                        ? 'border-green-500 bg-green-50/50 ring-1 ring-green-500/20 shadow-lg shadow-green-500/5'
                                                        : 'border-gray-200 bg-white hover:border-gray-300'}
                                            `}
                                            >
                                                <div className={`
                                                w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold shrink-0 border
                                                ${isCorrect && !hideCorrectAnswer
                                                        ? 'bg-green-500 border-green-500 text-white shadow-sm'
                                                        : 'bg-gray-100 border-gray-200 text-gray-500'}
                                            `}>
                                                    {num}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    {answerImgSrc ? (
                                                        <PreviewImage
                                                            src={answerImgSrc}
                                                            alt={`Answer ${num}`}
                                                            className="h-14 w-auto object-contain rounded cursor-zoom-in hover:opacity-90 transition-opacity"
                                                            onClick={setLightboxImage}
                                                            useCors={isExport}
                                                        />
                                                    ) : (
                                                        <div
                                                            className={`${answersFontSize} font-medium text-gray-800 ${isEnglish && !hasHebrew(answerText || '') ? 'text-left' : 'text-right'}`}
                                                            dir={isEnglish && !hasHebrew(answerText || '') ? 'ltr' : 'rtl'}
                                                        >
                                                            <PreviewRender content={answerText || '-'} minimal isEnglish={isEnglish} />
                                                        </div>
                                                    )}
                                                </div>

                                                {isCorrect && !hideCorrectAnswer && (
                                                    <div className="text-green-600 shrink-0 bg-green-100 p-1.5 rounded-lg">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Explanation Section - Show in full or explanation_only */}
                            {(viewMode === 'full' || viewMode === 'explanation_only') && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-bold text-gray-500 mb-1 flex items-center gap-2">
                                        {isEnglish ? 'Explanation' : 'הסבר'}
                                    </h4>
                                    <div
                                        className={`text-gray-600 ${explanationFontSize} ${isEnglish && !hasHebrew(currentQuestion.explanation) ? 'text-left' : 'text-right'}`}
                                        dir={isEnglish && !hasHebrew(currentQuestion.explanation) ? 'ltr' : 'rtl'}
                                    >
                                        <PreviewRender content={currentQuestion.explanation} minimal isEnglish={isEnglish} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <ImageLightbox
                src={lightboxImage || ''}
                isOpen={!!lightboxImage}
                onClose={() => setLightboxImage(null)}
            />
        </div>
    );
}

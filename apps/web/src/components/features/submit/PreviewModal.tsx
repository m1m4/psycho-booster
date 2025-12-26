import React, { useEffect } from 'react';
import { Preview } from './Preview';
import { QuestionItem } from '@/types/submit';

interface PreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    formData: {
        category: string;
        subcategory: string;
        topic?: string;
        assetFile: File | null;
        assetText: string;
        questions: QuestionItem[];
    };
    isEnglish: boolean;
    isSubmitting: boolean;
}

export function PreviewModal({ isOpen, onClose, onConfirm, formData, isEnglish, isSubmitting }: PreviewModalProps) {
    const isAssetRequiredSubcategory =
        formData.subcategory === 'chart_inference' ||
        formData.subcategory === 'reading_comprehension_verbal' ||
        formData.subcategory === 'reading_comprehension_eng';

    const isQuestionSet = formData.questions.length > 1 || (!!formData.assetText && isAssetRequiredSubcategory) || (!!formData.assetFile && isAssetRequiredSubcategory);

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir={isEnglish ? 'ltr' : 'rtl'}>

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={`
                relative w-fit min-w-[min(90vw,480px)] max-w-6xl max-h-[92vh] mx-auto
                ${isQuestionSet ? 'min-h-[750px]' : 'min-h-[500px]'}
                bg-white dark:bg-black rounded-3xl shadow-2xl flex flex-col overflow-hidden 
                border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in-95 duration-300
            `}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isEnglish ? 'Preview Question' : 'תצוגה מקדימה'}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {isEnglish ? 'Please review the details before submitting' : 'אנא וודא שכל הפרטים נכונים לפני השליחה'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    <Preview formData={formData} isEnglish={isEnglish} />
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#4169E1] text-white font-bold hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isEnglish ? 'Submitting...' : 'שולח...'}
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {isEnglish ? 'Confirm & Submit' : 'אישור ושליחה'}
                            </>
                        )}
                    </button>
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        {isEnglish ? 'Back to Edit' : 'חזרה לעריכה'}
                    </button>
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.5);
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
}

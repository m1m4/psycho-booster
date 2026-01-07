'use client';

import React, { useState } from 'react';
import { PreviewRender } from '@/components/ui/PreviewRender';
import { hasHebrew } from '@/components/features/submit/QuestionPreview';

interface ExplanationAccordionProps {
    explanation: string;
    isEnglish: boolean;
}

export function ExplanationAccordion({ explanation, isEnglish }: ExplanationAccordionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!explanation) return null;

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden mt-6 bg-white shadow-sm">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors text-right"
                dir={isEnglish ? 'ltr' : 'rtl'}
            >
                <div className="flex items-center gap-2 font-bold text-gray-700">
                    <svg
                        className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <span>{isEnglish ? 'Explanation' : 'הסבר ופתרון'}</span>
                </div>
            </button>
            
            <div
                className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-6 border-t border-gray-200">
                    <div
                        className={`text-gray-700 leading-relaxed whitespace-pre-wrap ${isEnglish && !hasHebrew(explanation) ? 'text-left' : 'text-right'}`}
                        dir={isEnglish && !hasHebrew(explanation) ? 'ltr' : 'rtl'}
                    >
                        <PreviewRender content={explanation} minimal isEnglish={isEnglish} />
                    </div>
                </div>
            </div>
        </div>
    );
}

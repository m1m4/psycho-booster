'use client';

import React, { useEffect, useRef, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render';

interface LatexPreviewProps {
    content: string;
    label?: string;
    placeholder?: string;
}

export function LatexPreview({ content, label = "תצוגה מקדימה", placeholder = "אין תוכן להצגה" }: LatexPreviewProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && isOpen) {
            // Reset content to plain text to avoid duplicating renders or processing already processed HTML
            containerRef.current.innerText = content || placeholder;

            if (content) {
                try {
                    renderMathInElement(containerRef.current, {
                        delimiters: [
                            { left: '$$', right: '$$', display: true },
                            { left: '$', right: '$', display: false },
                            { left: '\\(', right: '\\)', display: false },
                            { left: '\\[', right: '\\]', display: true }
                        ],
                        throwOnError: false,
                        errorColor: '#cc0000',
                    });
                } catch (e) {
                    console.error("KaTeX rendering error:", e);
                }
            }
        }
    }, [content, isOpen, placeholder]);

    // Don't show the toggle if there's no content, unless you want to let them open an empty preview
    // But usually it's better to allow it so they can see "No content" if they really want.
    // However, for cleaner UI, maybe only show if there is content?
    // The requirement says "add collapsable preview... showing it after it was formatted".
    // I will always show the button.

    return (
        <div className="w-full mt-2">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="text-sm text-[#4169E1] hover:text-blue-700 flex items-center gap-1 transition-colors font-medium mb-2"
                aria-expanded={isOpen}
            >
                {isOpen ? 'הסתר תצוגה מקדימה' : 'הצג תצוגה מקדימה (LaTeX)'}
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isOpen && (
                <div
                    ref={containerRef}
                    className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-black dark:text-white min-h-[60px] text-right shadow-sm [&_.katex]:[direction:ltr] [&_.katex]:[unicode-bidi:isolate]"
                    dir="rtl"
                />
            )}
        </div>
    );
}

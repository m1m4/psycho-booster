'use client';

import React, { useEffect, useRef, useState } from 'react';
import 'katex/dist/katex.min.css';

// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render';

/**
 * Props for the LatexPreview component.
 */
interface LatexPreviewProps {
    /** The content (text and/or LaTeX) to render */
    content: string;
    /** Accessibility label (unused in current render) */
    label?: string;
    /** Placeholder text when content is empty */
    placeholder?: string;
}

/**
 * A component that renders LaTeX and markdown-style bold text using KaTeX.
 * Supports inline ($...$) and block ($$...$$) math delimiters.
 */
export function LatexPreview({ content, placeholder = "אין תוכן להצגה" }: LatexPreviewProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && isOpen) {
            const displayContent = content || placeholder;

            // Process bold markdown (**text**) into HTML while preserving content
            const processedContent = displayContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

            containerRef.current.innerHTML = processedContent;

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
                    className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-black dark:text-white min-h-[60px] text-right shadow-sm whitespace-pre-wrap break-words [&_strong]:font-bold"
                    style={{
                        lineHeight: '1.8',
                        direction: 'rtl',
                    }}
                />
            )}
        </div>
    );
}

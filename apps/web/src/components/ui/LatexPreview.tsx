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
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
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
    }, [content, placeholder]);

    return (
        <div className="w-full mt-2">
            <div className="relative">
                <div
                    ref={containerRef}
                    className="p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg text-black dark:text-white min-h-[60px] shadow-sm whitespace-pre-wrap break-words [&_strong]:font-bold"
                    style={{
                        lineHeight: '1.8',
                        direction: 'rtl',
                        unicodeBidi: 'plaintext',
                        textAlign: 'right'
                    }}
                />
                <style jsx global>{`
                    .katex-display, .katex {
                        direction: ltr !important;
                        unicode-bidi: isolate !important;
                        text-align: left;
                    }
                    .katex-display {
                        margin: 1em 0;
                    }
                    /* Ensure inline math doesn't mess up RTL line flow but remains LTR internally */
                    .katex {
                        display: inline-block;
                        white-space: nowrap;
                    }
                `}</style>
            </div>
        </div>
    );
}

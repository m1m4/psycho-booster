'use client';

import React, { useEffect, useRef } from 'react';
import 'katex/dist/katex.min.css';

// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render';

/**
 * Props for the PreviewRender component.
 */
interface PreviewRenderProps {
    /** The content (text and/or LaTeX) to render */
    content: string;
    /** Accessibility label (unused in current render) */
    label?: string;
    /** Placeholder text when content is empty */
    placeholder?: string;
    /** Whether to remove background and border */
    minimal?: boolean;
    /** Whether the context is English (affects alignment) */
    isEnglish?: boolean;
}

const hasHebrew = (text: string) => /[\u0590-\u05FF]/.test(text);

/**
 * A component that renders LaTeX and markdown-style bold text using KaTeX.
 * Supports inline ($...$) and block ($$...$$) math delimiters.
 */
export function PreviewRender({
    content,
    placeholder,
    minimal = false,
    isEnglish = false
}: PreviewRenderProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const defaultPlaceholder = isEnglish ? "No content to display" : "אין תוכן להצגה";
    const actualPlaceholder = placeholder || defaultPlaceholder;

    // Determine alignment: 
    // If NOT English category, always RTL/Right.
    // If English category, RTL/Right ONLY if Hebrew is detected.
    const isHebrew = hasHebrew(content || "");
    const shouldBeRtl = !isEnglish || isHebrew;

    useEffect(() => {
        if (containerRef.current) {
            const displayContent = content || actualPlaceholder;

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
        <div className={`w-full ${minimal ? '' : 'mt-2'}`}>
            <div className="relative">
                <div
                    ref={containerRef}
                    className={`
                        ${minimal
                            ? 'p-0 bg-transparent border-none shadow-none'
                            : 'p-4 bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm'} 
                        text-black dark:text-white min-h-[auto] whitespace-pre-wrap break-words [&_strong]:font-bold
                    `}
                    style={{
                        lineHeight: '1.8',
                        direction: shouldBeRtl ? 'rtl' : 'ltr',
                        unicodeBidi: 'plaintext',
                        textAlign: shouldBeRtl ? 'right' : 'left'
                    }}
                />
                <style dangerouslySetInnerHTML={{
                    __html: `
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
                ` }} />
            </div>
        </div>
    );
}

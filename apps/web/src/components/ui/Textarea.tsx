import React, { forwardRef, useEffect, useRef } from 'react';

/**
 * Props for the Textarea component.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Label text displayed above the textarea */
    label?: string;
    /** Error message displayed below the textarea */
    error?: string;
    /** Custom minimum height */
    minHeight?: string;
    /** Whether to auto-detect direction */
    autoDir?: boolean;
    /** Whether to restrict to a single line */
    singleLine?: boolean;
}

/**
 * A custom Textarea component that supports auto-height and real-time bold text highlighting (**text**).
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', label, error, onChange, value, minHeight = '120px', autoDir = true, singleLine = false, ...props }, ref) => {
        const textareaRef = useRef<HTMLTextAreaElement | null>(null);
        const highlightRef = useRef<HTMLDivElement | null>(null);

        /**
         * Adjusts the height of the textarea and its highlight layer based on its content.
         */
        const adjustHeight = () => {
            if (singleLine) return;
            const element = textareaRef.current;
            if (element) {
                element.style.height = 'auto';
                const newHeight = `${element.scrollHeight}px`;
                element.style.height = newHeight;
                if (highlightRef.current) {
                    highlightRef.current.style.height = newHeight;
                }
            }
        };

        useEffect(() => {
            adjustHeight();
        }, [value]);

        /**
         * Escapes HTML and wraps markdown-style bold markers in <strong> tags for visual highlighting.
         * 
         * @param text The raw input text
         * @returns Sanitized HTML string with bold highlighting
         */
        const getHighlightedContent = (text: string) => {
            if (!text) return '';
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>**$1**</strong>')
                .replace(/(\$\$?)([^\$]+?)(\$\$?)/g, (match, d1, content, d2) => {
                    // Wrap LaTeX math in LTR span to prevent BiDi reordering of delimiters
                    return `<span dir="ltr" style="unicode-bidi: isolate; display: inline-block;">${d1}${content}${d2}</span>`;
                })
                .replace(/\n/g, '<br/>');
        };

        useEffect(() => {
            if (highlightRef.current && typeof value === 'string') {
                highlightRef.current.innerHTML = getHighlightedContent(value) + (value.endsWith('\n') ? '<br/>' : '');
            }
        }, [value]);

        /**
         * Synchronizes scroll position between the textarea and the highlight layer.
         */
        const handleScroll = () => {
            if (textareaRef.current && highlightRef.current) {
                highlightRef.current.scrollTop = textareaRef.current.scrollTop;
                highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
            }
        };

        /**
         * Infers text direction (LTR/RTL) based on the first character.
         * 
         * @param val The value to check
         * @returns 'ltr' or 'rtl'
         */
        const getDirection = (val: any) => {
            if (!val) return 'rtl';
            const firstChar = String(val).trim().charAt(0);
            return /^[A-Za-z]/.test(firstChar) ? 'ltr' : 'rtl';
        };

        const direction = (props.dir as any) || (autoDir ? getDirection(value) : 'rtl');

        const sharedStyles: React.CSSProperties = {
            direction: direction,
            lineHeight: '24px',
            fontSize: '16px',
            fontFamily: 'inherit',
            padding: singleLine ? '10px 16px' : '12px 16px',
            margin: '0',
            border: 'none',
            whiteSpace: singleLine ? 'nowrap' : 'pre-wrap',
            overflowWrap: 'break-word',
            boxSizing: 'border-box',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textAlign: direction === 'rtl' ? 'right' : 'left',
            letterSpacing: 'normal',
            wordSpacing: 'normal',
            textTransform: 'none',
            fontVariantNumeric: 'tabular-nums',
            textRendering: 'optimizeLegibility',
            unicodeBidi: 'plaintext',
        };

        return (
            <div className="w-full space-y-2" style={{ boxSizing: 'border-box' }}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                )}
                <div className={`
                    relative rounded-lg border overflow-hidden bg-white dark:bg-black transition-all duration-200
                    ${error ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500' : 'border-gray-200 dark:border-gray-800 focus-within:ring-2 focus-within:ring-[#4169E1]'}
                `}>
                    <div
                        ref={highlightRef}
                        className="absolute inset-0 pointer-events-none text-black dark:text-white"
                        style={{
                            ...sharedStyles,
                        }}
                        dangerouslySetInnerHTML={{ __html: getHighlightedContent(String(value || '')) }}
                    />

                    <textarea
                        ref={(element) => {
                            textareaRef.current = element;
                            if (typeof ref === 'function') ref(element);
                            else if (ref) (ref as any).current = element;
                        }}
                        dir={direction}
                        value={value}
                        onChange={(e) => {
                            if (singleLine) {
                                e.target.value = e.target.value.replace(/\n/g, '');
                            }
                            if (onChange) onChange(e);
                        }}
                        onScroll={handleScroll}
                        rows={singleLine ? 1 : undefined}
                        className={`
                            relative w-full bg-transparent caret-black dark:caret-white
                            placeholder:text-gray-500 dark:placeholder:text-gray-400
                            focus:outline-none resize-none ${singleLine ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'}
                            ${className}
                        `}
                        style={{
                            ...sharedStyles,
                            height: singleLine ? minHeight : undefined,
                            minHeight: minHeight,
                            color: 'transparent',
                            WebkitTextFillColor: 'transparent',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                        {...props}
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}

                <style jsx>{`
                    strong {
                        font-weight: normal;
                        color: inherit;
                        /* Use a very subtle text-stroke for bolding to keep character widths identical */
                        -webkit-text-stroke: 0.5px currentColor;
                        paint-order: stroke fill;
                        letter-spacing: -0.2px; /* Tiny adjustment to compensate for stroke-induced width */
                    }
                `}</style>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';


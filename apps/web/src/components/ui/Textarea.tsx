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
    /** Whether to restrict to a single line (prevents enter) */
    singleLine?: boolean;
    /** Whether to disable word wrap but allow multiple lines via Enter */
    noWrap?: boolean;
}

/**
 * A custom Textarea component that supports auto-height and real-time bold text highlighting (**text**).
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', label, error, onChange, value, minHeight = '32px', autoDir = true, singleLine = false, noWrap = false, ...props }, ref) => {
        const textareaRef = useRef<HTMLTextAreaElement | null>(null);
        const highlightRef = useRef<HTMLDivElement | null>(null);

        /**
         * Adjusts the height of the textarea and its highlight layer based on its content.
         */
        const adjustHeight = () => {
            if (singleLine) return;
            const element = textareaRef.current;
            if (element) {
                // Reset height to auto to correctly shrink/grow
                element.style.height = 'auto';
                const parsedMinHeight = parseInt(String(minHeight)) || 0;
                const newHeight = `${Math.max(element.scrollHeight, parsedMinHeight)}px`;
                element.style.height = newHeight;
                if (highlightRef.current) {
                    highlightRef.current.style.height = newHeight;
                }
            }
        };

        useEffect(() => {
            adjustHeight();
            // Double check after a small delay to handle layout shifts
            const timer = setTimeout(adjustHeight, 10);
            return () => clearTimeout(timer);
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
                // Removed automatic bold highlighting for **text**
                .replace(/(\$\$?)([^\$]+?)(\$\$?)/g, (match, d1, content, d2) => {
                    // Wrap LaTeX math in a span without forcing flow/display changes to keep cursor aligned
                    return `<span>${d1}${content}${d2}</span>`;
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
            padding: (singleLine || noWrap) ? '4px 12px' : '8px 16px',
            margin: '0',
            border: 'none',
            whiteSpace: (singleLine || noWrap) ? 'pre' : 'pre-wrap', // Important for horizontal scroll
            overflowWrap: (singleLine || noWrap) ? 'normal' : 'break-word',
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
                    <label className="block text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <div className={`
                    relative rounded-lg border overflow-hidden bg-white transition-all duration-200
                    ${error ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500' : 'border-gray-200 focus-within:ring-2 focus-within:ring-[#4169E1]'}
                `}>
                    <div
                        ref={highlightRef}
                        className="absolute inset-0 pointer-events-none text-black"
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
                        rows={singleLine ? 1 : (noWrap ? 1 : (props.rows || 1))}
                        className={`
                            relative w-full bg-transparent caret-black
                            placeholder:text-gray-500
                            focus:outline-none resize-none ${singleLine ? 'overflow-x-auto overflow-y-hidden' : 'overflow-hidden'}
                            ${className}
                        `}
                        style={{
                            ...sharedStyles,
                            height: singleLine ? minHeight : 'auto', // Allow it to collapse to check scrollHeight 
                            minHeight: minHeight,
                            color: 'transparent',
                            WebkitTextFillColor: 'transparent',
                            WebkitTapHighlightColor: 'transparent',
                            whiteSpace: (singleLine || noWrap) ? 'pre' : 'pre-wrap',
                            overflowX: (singleLine || noWrap) ? 'auto' : 'hidden',
                            overflowY: 'hidden',
                        }}
                        {...props}
                        onInput={(e) => {
                            adjustHeight();
                            if (props.onInput) props.onInput(e);
                        }}
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}

                <style dangerouslySetInnerHTML={{
                    __html: `
                    /* Removed strong styles as bold highlighting is disabled */
                ` }} />
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

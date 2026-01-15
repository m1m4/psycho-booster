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

        // Remove JS-based auto-resize for multiline to prevent scroll jumping.
        // Instead, we rely on the "Ghost Element" pattern where the highlight div drives the height naturally.
        
        /**
         * Escapes HTML and wraps markdown-style bold markers in <strong> tags for visual highlighting.
         */
        const getHighlightedContent = (text: string) => {
            if (!text) return '';
            // Ensure trailing newlines generate a line in the ghost element
            const hasTrailingNewline = text.endsWith('\n');
            
            let content = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/(\$\$?)([^\$]+?)(\$\$?)/g, (match, d1, content, d2) => {
                    return `<span>${d1}${content}${d2}</span>`;
                })
                .replace(/\n/g, '<br/>');
            
            if (hasTrailingNewline) {
                content += '<br/>';
            }
            
            return content;
        };

        useEffect(() => {
            if (highlightRef.current && typeof value === 'string') {
                // For the ghost element pattern, we need a zero-width space if empty to maintain one line height
                const html = value ? getHighlightedContent(value) : (singleLine ? '' : '<br/>');
                highlightRef.current.innerHTML = html;
            }
        }, [value, singleLine]);

        /**
         * Synchronizes scroll position for single-line inputs (horizontal scroll).
         * For multiline, we don't scroll inside the box (it grows), so this is less critical but kept for safety.
         */
        const handleScroll = () => {
            if (textareaRef.current && highlightRef.current) {
                highlightRef.current.scrollTop = textareaRef.current.scrollTop;
                highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
            }
        };

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
            whiteSpace: (singleLine || noWrap) ? 'pre' : 'pre-wrap',
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

        // Render strategy:
        // Single Line: Standard relative input, absolute highlight behind.
        // Multi Line (Auto Grow): Relative highlight (ghost) drives height, Absolute input overlays it.
        const isMultiLine = !singleLine && !noWrap;

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
                    
                    {/* Ghost / Highlight Element */}
                    <div
                        ref={highlightRef}
                        className={`
                            ${isMultiLine ? 'relative' : 'absolute inset-0'} 
                            pointer-events-none text-black
                        `}
                        style={{
                            ...sharedStyles,
                            height: isMultiLine ? 'auto' : '100%',
                            minHeight: isMultiLine ? minHeight : undefined,
                            // Ensure the ghost is not visible to screen readers (it's just for layout/visuals)
                            visibility: 'visible', // Must be visible to take up space (opacity is handled by text overlaying logic if needed, but here text is transparent on input)
                        }}
                    />

                    {/* Input Element */}
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
                            ${isMultiLine ? 'absolute inset-0 h-full' : 'relative'}
                            w-full bg-transparent caret-black
                            placeholder:text-gray-500
                            focus:outline-none 
                            ${singleLine ? 'resize-none overflow-x-auto overflow-y-hidden' : 'resize-none overflow-hidden'}
                            ${className}
                        `}
                        style={{
                            ...sharedStyles,
                            minHeight: isMultiLine ? undefined : minHeight,
                            color: 'transparent',
                            WebkitTextFillColor: 'transparent',
                            WebkitTapHighlightColor: 'transparent',
                            overflowX: (singleLine || noWrap) ? 'auto' : 'hidden',
                            overflowY: 'hidden',
                        }}
                        {...props}
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

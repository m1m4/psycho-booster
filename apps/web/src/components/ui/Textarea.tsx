import React, { forwardRef, useEffect, useRef } from 'react';

/**
 * Props for the Textarea component.
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    /** Label text displayed above the textarea */
    label?: string;
    /** Error message displayed below the textarea */
    error?: string;
}

/**
 * A custom Textarea component that supports auto-height and real-time bold text highlighting (**text**).
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', label, error, onChange, value, ...props }, ref) => {
        const textareaRef = useRef<HTMLTextAreaElement | null>(null);
        const highlightRef = useRef<HTMLDivElement | null>(null);

        /**
         * Adjusts the height of the textarea and its highlight layer based on its content.
         */
        const adjustHeight = () => {
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

        const direction = (props.dir as any) || getDirection(value);

        return (
            <div className="w-full space-y-2">
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
                        className="absolute inset-0 px-4 py-3 pointer-events-none whitespace-pre-wrap break-words text-black dark:text-white"
                        style={{
                            direction: direction,
                            lineHeight: '1.6',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            WebkitFontSmoothing: 'antialiased',
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
                            if (onChange) onChange(e);
                        }}
                        onScroll={handleScroll}
                        className={`
                            relative w-full px-4 py-3 bg-transparent text-transparent caret-black dark:caret-white
                            placeholder:text-gray-500 dark:placeholder:text-gray-400
                            focus:outline-none min-h-[120px] resize-none overflow-hidden
                            ${className}
                        `}
                        style={{
                            lineHeight: '1.6',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            WebkitTextFillColor: 'transparent',
                        }}
                        {...props}
                    />
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}

                <style jsx>{`
                    strong {
                        font-weight: 700;
                        color: inherit;
                    }
                `}</style>
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';


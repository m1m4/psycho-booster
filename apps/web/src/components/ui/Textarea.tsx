import React, { forwardRef, useEffect, useRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className = '', label, error, onChange, ...props }, ref) => {
        const textareaRef = useRef<HTMLTextAreaElement | null>(null);

        // Helper to adjust height automatically
        const adjustHeight = () => {
            const element = textareaRef.current;
            if (element) {
                // Reset height to auto to correctly calculate new scrollHeight
                element.style.height = 'auto';
                element.style.height = `${element.scrollHeight}px`;
            }
        };

        // Adjust height whenever value changes
        useEffect(() => {
            adjustHeight();
        }, [props.value]);

        // Helper to determine text direction
        const getDirection = (value: string | number | readonly string[] | undefined) => {
            if (!value) return 'rtl';
            const stringValue = String(value);
            const firstChar = stringValue.trim().charAt(0);
            // Check if starts with English letter
            const isEnglish = /^[A-Za-z]/.test(firstChar);
            return isEnglish ? 'ltr' : 'rtl';
        };

        // Calculate direction based on current value
        const direction = getDirection(props.value);

        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                )}
                <textarea
                    ref={(element) => {
                        // Handle both local ref and forwarded ref
                        textareaRef.current = element;
                        if (typeof ref === 'function') {
                            ref(element);
                        } else if (ref) {
                            (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = element;
                        }
                    }}
                    dir={direction}
                    onChange={(e) => {
                        adjustHeight();
                        if (onChange) {
                            onChange(e);
                        }
                    }}
                    className={`
            w-full px-4 py-3 rounded-lg border bg-white dark:bg-black text-black dark:text-white
            placeholder:text-gray-500 dark:placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:border-[#4169E1]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 min-h-[120px] resize-none overflow-hidden
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800'}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Textarea.displayName = 'Textarea';

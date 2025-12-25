import React, { forwardRef } from 'react';

/**
 * Props for the Select component.
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    /** Label text displayed above the select */
    label?: string;
    /** Error message displayed below the select */
    error?: string;
    /** Array of option objects with label and value */
    options: { label: string; value: string }[];
    /** Placeholder text shown as a disabled first option */
    placeholder?: string;
}

/**
 * A styled Select component with support for custom arrows and text direction.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, error, options, placeholder, dir, ...props }, ref) => {
        const isLtr = dir === 'ltr';
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        dir={dir}
                        className={`
                            w-full px-4 py-3 rounded-lg border bg-white dark:bg-black text-black dark:text-white
                            appearance-none
                            focus:outline-none focus:ring-2 focus:ring-[#4169E1] focus:border-[#4169E1]
                            disabled:opacity-50 disabled:cursor-not-allowed
                            transition-all duration-200
                            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800'}
                            ${className}
                        `}
                        {...props}
                    >
                        {placeholder && (
                            <option value="" disabled>
                                {placeholder}
                            </option>
                        )}
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                    <div className={`absolute inset-y-0 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 ${isLtr ? 'right-0 pr-3' : 'left-0 pl-3'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                {error && (
                    <p className="text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Select.displayName = 'Select';

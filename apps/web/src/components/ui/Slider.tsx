import React from 'react';

/**
 * Props for the Slider component.
 */
interface SliderProps {
    /** Minimum value of the slider */
    min: number;
    /** Maximum value of the slider */
    max: number;
    /** Step increment of the slider */
    step?: number;
    /** Current value of the slider */
    value: number;
    /** Callback fired when the value changes */
    onChange: (value: number) => void;
    /** Label text displayed above the slider */
    label?: string;
    /** Additional CSS classes */
    className?: string;
    /** Whether the slider is disabled */
    disabled?: boolean;
}

/**
 * A styled range input component with value display and min/max markers.
 */
export function Slider({ min, max, step = 1, value, onChange, label, className = '', disabled }: SliderProps) {
    return (
        <div className={`space-y-2 ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            {label && (
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {label}
                    </label>
                    <span className="text-sm font-semibold text-[#4169E1]">
                        {value}
                    </span>
                </div>
            )}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                disabled={disabled}
                className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#4169E1] disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-gray-400">
                <span>{min}</span>
                <span>{max}</span>
            </div>
        </div>
    );
}

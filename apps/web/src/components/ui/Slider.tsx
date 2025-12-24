import React from 'react';

interface SliderProps {
    min: number;
    max: number;
    step?: number;
    value: number;
    onChange: (value: number) => void;
    label?: string;
    className?: string;
    disabled?: boolean;
}

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

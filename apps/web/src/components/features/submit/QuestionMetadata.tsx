import React from 'react';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { SUBCATEGORY_OPTIONS } from '@/types/submit';

interface QuestionMetadataProps {
    category: string;
    subcategory: string;
    onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onMetadataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    questionCount: number;
    onSliderChange: (count: number) => void;
    isQuestionSet: boolean;
    isSubCategorySelected: boolean;
    errors: Record<string, boolean>;
    isEnglish: boolean;
}

export function QuestionMetadata({
    category,
    subcategory,
    onCategoryChange,
    onMetadataChange,
    questionCount,
    onSliderChange,
    isQuestionSet,
    isSubCategorySelected,
    errors,
    isEnglish
}: QuestionMetadataProps) {
    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl space-y-6 border border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-semibold">פרטי השאלה</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                    label="קטגוריה"
                    name="category"
                    id="category-select"
                    value={category}
                    onChange={onCategoryChange}
                    placeholder="בחר קטגוריה..."
                    options={[
                        { label: 'כמותי', value: 'quantitative' },
                        { label: 'מילולי', value: 'verbal' },
                        { label: 'אנגלית', value: 'english' },
                    ]}
                    required
                    error={errors['category-select'] ? ' ' : undefined}
                />
                <Select
                    label="תת-קטגוריה"
                    name="subcategory"
                    id="subcategory-select"
                    value={subcategory}
                    onChange={onMetadataChange}
                    placeholder={isEnglish ? 'Select Subcategory...' : 'בחר תת-קטגוריה...'}
                    options={category ? SUBCATEGORY_OPTIONS[category as keyof typeof SUBCATEGORY_OPTIONS] || [] : []}
                    required
                    disabled={!category}
                    dir={isEnglish ? 'ltr' : 'rtl'}
                    error={errors['subcategory-select'] ? ' ' : undefined}
                />
            </div>

            {isQuestionSet && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <label className={`block text-sm font-medium mb-4 ${isEnglish ? 'text-left' : ''}`}>
                        {isEnglish ? 'Number of Questions:' : 'מספר שאלות:'}
                    </label>
                    <Slider
                        min={3}
                        max={6}
                        value={questionCount}
                        onChange={onSliderChange}
                        disabled={!isSubCategorySelected}
                    />
                </div>
            )}
        </div>
    );
}

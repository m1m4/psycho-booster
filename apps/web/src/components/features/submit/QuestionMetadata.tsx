import React from 'react';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { SUBCATEGORY_OPTIONS } from '@/types/submit';

interface QuestionMetadataProps {
    category: string;
    subcategory: string;
    topic: string;
    difficulty: string;
    onCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onMetadataChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onSubcategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    questionCount: number;
    onSliderChange: (count: number) => void;
    isQuestionSet: boolean;
    isSubCategorySelected: boolean;
    errors: Record<string, boolean>;
    isEnglish: boolean;
    onImportOpen: () => void;
}

import { TOPIC_OPTIONS } from '@/types/submit';

export function QuestionMetadata({
    category,
    subcategory,
    topic,
    difficulty,
    onCategoryChange,
    onMetadataChange,
    onSubcategoryChange,
    questionCount,
    onSliderChange,
    isQuestionSet,
    isSubCategorySelected,
    errors,
    isEnglish,
    onImportOpen
}: QuestionMetadataProps) {
    return (
        <div className="bg-gray-50 p-6 rounded-2xl space-y-6 border border-gray-200">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">פרטי השאלה</h2>
                <button
                    type="button"
                    onClick={onImportOpen}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-white rounded-full transition-all shadow-sm hover:shadow-md"
                    title={isEnglish ? 'Import from JSON' : 'ייבוא מ-JSON'}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    error={errors['category-select'] ? ' ' : undefined}
                />
                <Select
                    label="תת-קטגוריה"
                    name="subcategory"
                    id="subcategory-select"
                    value={subcategory}
                    onChange={onSubcategoryChange}
                    placeholder={isEnglish ? 'Select Subcategory...' : 'בחר תת-קטגוריה...'}
                    options={
                        (category && category in SUBCATEGORY_OPTIONS)
                            ? SUBCATEGORY_OPTIONS[category as keyof typeof SUBCATEGORY_OPTIONS]
                            : []
                    }
                    disabled={!category}
                    dir={isEnglish ? 'ltr' : 'rtl'}
                    error={errors['subcategory-select'] ? ' ' : undefined}
                />
                {category === 'quantitative' && subcategory && TOPIC_OPTIONS[subcategory] && (
                    <Select
                        label="נושא"
                        name="topic"
                        id="topic-select"
                        value={topic}
                        onChange={onMetadataChange}
                        placeholder="בחר נושא..."
                        options={TOPIC_OPTIONS[subcategory] || []}
                        disabled={!subcategory}
                        error={errors['topic-select'] ? ' ' : undefined}
                    />
                )}
                <Select
                    label={isQuestionSet ? (isEnglish ? 'Set Difficulty' : 'רמת קושי לערכה') : (isEnglish ? 'Difficulty' : 'רמת קושי')}
                    name="difficulty"
                    id="difficulty-select"
                    value={difficulty}
                    onChange={onMetadataChange}
                    placeholder={isEnglish ? 'Select Difficulty...' : 'בחר רמת קושי...'}
                    options={[
                        { label: isEnglish ? 'Low' : 'נמוך', value: 'easy' },
                        { label: isEnglish ? 'Medium' : 'בינוני', value: 'medium' },
                        { label: isEnglish ? 'High' : 'גבוה', value: 'hard' },
                    ]}
                    disabled={!subcategory}
                    dir={isEnglish ? 'ltr' : 'rtl'}
                    error={errors['difficulty-select'] ? ' ' : undefined}
                />
            </div>

            {isQuestionSet && (
                <div className="mt-4 pt-4 border-t border-gray-200">
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

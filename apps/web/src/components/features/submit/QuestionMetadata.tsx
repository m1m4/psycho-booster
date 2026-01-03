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
    isEnglish
}: QuestionMetadataProps) {
    return (
        <div className="bg-gray-50 p-6 rounded-2xl space-y-6 border border-gray-200">
            <h2 className="text-xl font-semibold">פרטי השאלה</h2>
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

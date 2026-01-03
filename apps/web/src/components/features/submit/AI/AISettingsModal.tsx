import React, { useState, useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { SUBCATEGORY_OPTIONS, TOPIC_OPTIONS } from '@/types/submit';

interface GlobalPrompts {
    base_prompt: string;
    categories: Record<string, string>; // key might be "category_subcategory" or "category_subcategory_topic"
}

interface AISettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentApiKey: string;
    globalPrompts: GlobalPrompts;
    onSaveApiKey: (key: string) => void;
    onSaveGlobalPrompts: (prompts: GlobalPrompts) => void;
    // Initial values from parent context
    initialCategory?: string;
    initialSubcategory?: string;
    initialTopic?: string;
}

export function AISettingsModal({
    isOpen,
    onClose,
    currentApiKey,
    globalPrompts,
    onSaveApiKey,
    onSaveGlobalPrompts,
    initialCategory,
    initialSubcategory,
    initialTopic
}: AISettingsModalProps) {
    const [activeTab, setActiveTab] = useState<'api' | 'base' | 'context'>('api');
    const [apiKey, setApiKey] = useState(currentApiKey);
    const [prompts, setPrompts] = useState<GlobalPrompts>(globalPrompts);

    // Context Selection State
    const [selectedCategory, setSelectedCategory] = useState<string>('quantitative');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
    const [selectedTopic, setSelectedTopic] = useState<string>('');

    // Sync state with props when opening
    useEffect(() => {
        if (isOpen) {
            if (initialCategory) setSelectedCategory(initialCategory);
            if (initialSubcategory) setSelectedSubcategory(initialSubcategory);
            if (initialTopic) setSelectedTopic(initialTopic);
        }
    }, [isOpen, initialCategory, initialSubcategory, initialTopic]);

    useEffect(() => {
        setApiKey(currentApiKey);
    }, [currentApiKey]);

    useEffect(() => {
        setPrompts(globalPrompts);
    }, [globalPrompts]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSaveApiKey(apiKey);
        onSaveGlobalPrompts(prompts);
        onClose();
    };

    const handleGenerateDefault = () => {
        const defaultBasePrompt = `Generate a psycho-technical test question in Hebrew.
Output STRICT JSON format.
Format:
{
  "questions": [
    {
      "questionText": "Question description",
      "answer1": "Option 1",
      "answer2": "Option 2",
      "answer3": "Option 3",
      "answer4": "Option 4",
      "correctAnswer": 1, // 1-4
      "explanation": "Detailed explanation in Hebrew",
      "difficulty": "medium" // easy/medium/hard
    }
  ]
}
Ensure high quality academic Hebrew.`;

        setPrompts(prev => ({ ...prev, base_prompt: defaultBasePrompt }));
    };

    const getContextKey = () => {
        let key = selectedCategory;
        if (selectedSubcategory) key += `_${selectedSubcategory}`;
        if (selectedTopic && selectedCategory === 'quantitative') key += `_${selectedTopic}`;
        return key;
    };

    const handlePromptChange = (val: string) => {
        const key = activeTab === 'base' ? 'base_prompt' : getContextKey();

        if (activeTab === 'base') {
            setPrompts(prev => ({ ...prev, base_prompt: val }));
        } else {
            setPrompts(prev => ({
                ...prev,
                categories: {
                    ...prev.categories,
                    [key]: val
                }
            }));
        }
    };

    const getCurrentPromptValue = () => {
        if (activeTab === 'base') return prompts.base_prompt;
        const key = getContextKey();
        return prompts.categories[key] || '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold">הגדרות AI</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('api')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'api' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        מפתח API
                    </button>
                    <button
                        onClick={() => setActiveTab('base')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'base' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        הנחיית בסיס
                    </button>
                    <button
                        onClick={() => setActiveTab('context')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'context' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        הנחיות לפי נושא
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'api' && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium">Gemini API Key</label>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-gray-50 border-gray-300"
                                placeholder="AIzaSy..."
                                dir="ltr"
                            />
                            <p className="text-xs text-gray-500">המפתח נשמר בצורה מאובטחת בפרופיל המשתמש שלך.</p>
                        </div>
                    )}

                    {activeTab !== 'api' && (
                        <div className="space-y-4 h-full flex flex-col">
                            {activeTab === 'context' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                                    <Select
                                        label="קטגוריה"
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value);
                                            setSelectedSubcategory('');
                                            setSelectedTopic('');
                                        }}
                                        options={[
                                            { label: 'כמותי', value: 'quantitative' },
                                            { label: 'מילולי', value: 'verbal' },
                                            { label: 'אנגלית', value: 'english' },
                                        ]}
                                    />
                                    <Select
                                        label="תת-קטגוריה"
                                        value={selectedSubcategory}
                                        onChange={(e) => {
                                            setSelectedSubcategory(e.target.value);
                                            setSelectedTopic('');
                                        }}
                                        options={
                                            (selectedCategory && selectedCategory in SUBCATEGORY_OPTIONS)
                                                ? SUBCATEGORY_OPTIONS[selectedCategory as keyof typeof SUBCATEGORY_OPTIONS]
                                                : []
                                        }
                                        disabled={!selectedCategory}
                                        placeholder="בחר תת-קטגוריה..."
                                        dir="rtl"
                                    />
                                    {selectedCategory === 'quantitative' && (
                                        <Select
                                            label="נושא"
                                            value={selectedTopic}
                                            onChange={(e) => setSelectedTopic(e.target.value)}
                                            options={selectedSubcategory && TOPIC_OPTIONS[selectedSubcategory] ? TOPIC_OPTIONS[selectedSubcategory] : []}
                                            disabled={!selectedSubcategory}
                                            placeholder="בחר נושא..."
                                            dir="rtl"
                                        />
                                    )}
                                </div>
                            )}

                            <div className="flex-1 flex flex-col">
                                <div className="flex justify-between items-end mb-2">
                                    {activeTab === 'base' && !prompts.base_prompt && (
                                        <button
                                            onClick={handleGenerateDefault}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            צור הנחיית ברירת מחדל
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={getCurrentPromptValue()}
                                    onChange={(e) => handlePromptChange(e.target.value)}
                                    className="w-full flex-1 p-3 border rounded-lg bg-gray-50 border-gray-300 font-mono text-sm resize-none text-left"
                                    placeholder={activeTab === 'base' ? "הכנס הנחיות מערכת כלליות..." : "הכנס הנחיות ספציפיות לנושא זה..."}
                                    dir="ltr"
                                    style={{ minHeight: '200px' }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-start gap-3">
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                    >
                        שמור שינויים
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        </div>
    );
}

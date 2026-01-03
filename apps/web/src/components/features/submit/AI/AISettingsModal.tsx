import React, { useState, useEffect } from 'react';
import { Select } from '@/components/ui/Select';
import { SUBCATEGORY_OPTIONS, TOPIC_OPTIONS } from '@/types/submit';

interface GlobalPrompts {
    base_prompt: string;
    refinement_prompt?: string;
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
    selectedModel?: string;
    onSaveModel: (model: string) => void;
}

export function AISettingsModal(props: AISettingsModalProps) {
    const {
        isOpen,
        onClose,
        currentApiKey,
        globalPrompts,
        onSaveApiKey,
        onSaveGlobalPrompts,
        initialCategory,
        initialSubcategory,
        initialTopic,
        selectedModel,
        onSaveModel
    } = props;
    const [activeTab, setActiveTab] = useState<'api' | 'base' | 'context' | 'refinement'>('api');
    const [apiKey, setApiKey] = useState(currentApiKey);
    const [prompts, setPrompts] = useState<GlobalPrompts>(globalPrompts);

    // Context Selection State
    const [selectedCategory, setSelectedCategory] = useState<string>('quantitative');
    const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
    const [selectedTopic, setSelectedTopic] = useState<string>('');

    // Sync state with props when opening
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

    useEffect(() => {
        if (isOpen) {
            setSaveStatus('idle');
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
        setSaveStatus('saved');
        setTimeout(() => {
            onClose();
        }, 1000);
    };

    const handleGenerateDefault = () => {
        const defaultBasePrompt = `Generate a psycho-technical test question in Hebrew.
Context:
Category: {{category}}
Subcategory: {{subcategory}}
Topic: {{topic}}
Difficulty Level: {{difficulty}}

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
      "difficulty": "medium" // Must match the requested Difficulty Level above
    }
  ]
}
Ensure high quality academic Hebrew.`;

        setPrompts(prev => ({ ...prev, base_prompt: defaultBasePrompt }));
    };

    const handleGenerateRefinementDefault = () => {
        const defaultRefinement = `Role: Expert Psychometric Editor.
Goal: Modify the existing questions based on User Instructions.

Refinement Rules:
1. Return a JSON array of objects.
2. Each object MUST have an "id" matching the original question.
3. Only include fields that CHANGED.
4. If no changes are needed for a question, omit it.
5. Maintain the difficulty level and style requested in the original Context unless instructed otherwise.

Input Context:
Category: {{category}}
Subcategory: {{subcategory}}
Topic: {{topic}}
Difficulty: {{difficulty}}

Current Questions Data:
{{current_questions}}`;

        setPrompts(prev => ({ ...prev, refinement_prompt: defaultRefinement }));
    };

    const getContextKey = () => {
        let key = selectedCategory;
        if (selectedSubcategory && selectedSubcategory !== 'none') key += `_${selectedSubcategory}`;
        if (selectedTopic && selectedCategory === 'quantitative' && selectedSubcategory !== 'none') key += `_${selectedTopic}`;
        return key;
    };

    const handlePromptChange = (val: string) => {
        if (activeTab === 'base') {
            setPrompts(prev => ({ ...prev, base_prompt: val }));
        } else if (activeTab === 'refinement') {
            setPrompts(prev => ({ ...prev, refinement_prompt: val }));
        } else {
            const key = getContextKey();
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
        if (activeTab === 'refinement') return prompts.refinement_prompt || '';
        const key = getContextKey();
        return prompts.categories[key] || '';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" dir="rtl">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold">הגדרות AI</h2>
                    <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveTab('api')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'api' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        כללי
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('base')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'base' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        הנחיית בסיס
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('refinement')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'refinement' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        הנחיית שינויים (Refinement)
                    </button>
                    <button
                        type="button"
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

                            <div className="mt-8 pt-4 border-t border-gray-100">
                                <label className="block text-sm font-medium mb-2">מודל AI</label>
                                <Select
                                    value={props.selectedModel || 'gemini-3.0-flash'}
                                    onChange={(e) => props.onSaveModel(e.target.value)}
                                    options={[
                                        { label: 'Gemini 3.0 Pro (Preview)', value: 'gemini-3-pro-preview' },
                                        { label: 'Gemini 3.0 Flash (Preview)', value: 'gemini-3-flash-preview' },
                                        { label: 'Gemini 2.0 Flash (Experimental)', value: 'gemini-2.0-flash-exp' },
                                        { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' },
                                        { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
                                    ]}
                                    disabled={false}
                                    dir="ltr"
                                />
                                <p className="text-xs text-gray-400 mt-1">בחר את המודל שישמש ליצירת השאלות.</p>
                            </div>
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
                                        options={[
                                            { label: 'כללי (קטגוריה בלבד)', value: 'none' }, // Special value for category-only editing
                                            ...((selectedCategory && selectedCategory in SUBCATEGORY_OPTIONS)
                                                ? SUBCATEGORY_OPTIONS[selectedCategory as keyof typeof SUBCATEGORY_OPTIONS]
                                                : [])
                                        ]}
                                        disabled={!selectedCategory}
                                        placeholder="בחר תת-קטגוריה..."
                                        dir="rtl"
                                    />
                                    {selectedCategory === 'quantitative' && selectedSubcategory !== 'none' && (
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
                                            type="button"
                                            onClick={handleGenerateDefault}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            צור הנחיית ברירת מחדל
                                        </button>
                                    )}
                                    {activeTab === 'refinement' && !prompts.refinement_prompt && (
                                        <button
                                            type="button"
                                            onClick={handleGenerateRefinementDefault}
                                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                                        >
                                            צור הנחיית שינויים ברירת מחדל
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={getCurrentPromptValue()}
                                    onChange={(e) => handlePromptChange(e.target.value)}
                                    className="w-full flex-1 p-3 border rounded-lg bg-gray-50 border-gray-300 font-mono text-sm resize-none text-left"
                                    placeholder={activeTab === 'base' ? "הכנס הנחיות מערכת כלליות..." : activeTab === 'refinement' ? "הכנס הנחיית מערכת לשינוי שאלות קיימות..." : "הכנס הנחיות ספציפיות לנושא זה..."}
                                    dir="ltr"
                                    style={{ minHeight: '200px' }}
                                />
                                <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                                    <p className="font-semibold mb-1">משתנים זמינים לשימוש (יוחלפו אוטומטית):</p>
                                    <div className="flex flex-wrap gap-2" dir="ltr">
                                        <code className="bg-white px-1 rounded border">{'{{difficulty}}'}</code>
                                        <code className="bg-white px-1 rounded border">{'{{category}}'}</code>
                                        <code className="bg-white px-1 rounded border">{'{{subcategory}}'}</code>
                                        <code className="bg-white px-1 rounded border">{'{{topic}}'}</code>
                                        {activeTab === 'refinement' && <code className="bg-white px-1 rounded border">{'{{current_questions}}'}</code>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex justify-start gap-3 items-center">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saveStatus === 'saved'}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-all ${saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {saveStatus === 'saved' ? (
                            <div className="flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                נשמר!
                            </div>
                        ) : 'שמור שינויים'}
                    </button>
                    <button
                        type="button"
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

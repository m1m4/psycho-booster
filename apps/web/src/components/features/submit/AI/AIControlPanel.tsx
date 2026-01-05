import React, { useState } from 'react';
import { AISettingsModal } from './AISettingsModal';

interface AIControlPanelProps {
    category: string;
    subcategory: string;
    topic: string;
    difficulty?: string;
    onGenerate: (instructions: string) => void;
    // Data props would come from parent (e.g. React Query)
    apiKey?: string;
    globalPrompts?: any;
    onSaveApiKey?: (key: string) => void;
    onSaveGlobalPrompts?: (prompts: any) => void;
    isGenerating?: boolean;
    selectedModel?: string;
    onSaveModel?: (model: string) => void;
}

export function AIControlPanel({
    category,
    subcategory,
    topic,
    difficulty = '',
    onGenerate,
    apiKey = '',
    globalPrompts = { base_prompt: '', categories: {} },
    onSaveApiKey = () => { },
    onSaveGlobalPrompts = () => { },
    isGenerating = false,
    selectedModel = 'gemini-3.0-flash',
    onSaveModel = () => { },
    questions = [] // New prop
}: AIControlPanelProps & { questions?: any[] }) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const [error, setError] = useState<string | null>(null);

    // Prompt Construction State
    const [fullPromptPreview, setFullPromptPreview] = useState('');
    const [isPreviewMode, setIsPreviewMode] = useState(false);
    const [isEditingPreview, setIsEditingPreview] = useState(false);

    // Check if we are in "Refinement Mode" (editing existing data)
    // We consider it refinement if there are questions and it's not just a single empty default question
    const isRefinementMode = React.useMemo(() => {
        if (!questions || questions.length === 0) return false;
        if (questions.length > 1) return true;
        const q = questions[0];
        // Check if the single question has meaningful data
        return !!(q.questionText || q.answer1 || q.answer2);
    }, [questions]);

    // Default instruction
    const DEFAULT_INSTRUCTION = isRefinementMode
        ? "Describe what you want to change in the existing questions..."
        : "Find a unique question that is based on the Israeli psychometry exam";

    // Effect to construct full prompt whenever dependencies change
    React.useEffect(() => {
        if (isEditingPreview) return; // Don't overwrite if user is manually editing

        let promptParts = [];

        // Helper to replace placeholders
        const replacePlaceholders = (text: string) => {
            if (!text) return '';
            let result = text;
            result = result.replace(/{difficulty}/g, difficulty || 'medium');
            result = result.replace(/{category}/g, category || '');
            result = result.replace(/{subcategory}/g, subcategory || '');
            result = result.replace(/{topic}/g, topic || '');

            // Also support double curly braces {{...}}
            result = result.replace(/{{difficulty}}/g, difficulty || 'medium');
            result = result.replace(/{{category}}/g, category || '');
            result = result.replace(/{{subcategory}}/g, subcategory || '');
            result = result.replace(/{{topic}}/g, topic || '');

            return result;
        };

        // 1. Prompt Selection (Base or Refinement)
        if (isRefinementMode) {
            // REFINEMENT MODE
            let refinementPrompt = globalPrompts.refinement_prompt;

            // Default if missing
            if (!refinementPrompt) {
                refinementPrompt = `Role: Expert Psychometric Editor.
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
            }

            // Replace variables in refinement prompt
            let processedRefinementPrompt = replacePlaceholders(refinementPrompt);

            // 2. Prepare Question Data
            const questionsJson = JSON.stringify(questions, (key, value) => {
                // Filter out heavy fields if needed, like base64 images, to save tokens
                if (key.includes('Image') && typeof value === 'string' && value.length > 500) {
                    return "[Image Data Omitted]";
                }
                return value;
            }, 2);

            // 3. Inject Question Data
            if (processedRefinementPrompt.includes('{{current_questions}}')) {
                processedRefinementPrompt = processedRefinementPrompt.replace('{{current_questions}}', questionsJson);
            } else {
                // Fallback: Append if placeholder is missing
                processedRefinementPrompt += `\n\nCurrent Questions Data:\n${questionsJson}`;
            }

            promptParts.push(processedRefinementPrompt);

        } else {
            // CREATION MODE
            if (globalPrompts.base_prompt) {
                promptParts.push(replacePlaceholders(globalPrompts.base_prompt));
            }
        }

        // 2. Category Prompt (Common to both, provides potential extra context)
        // Only include if we want category specific instructions in refinement too.
        // Usually yes, as "Context Prompt" might have style guidelines.
        if (category) {
            const categoryPrompt = globalPrompts.categories?.[category];
            if (categoryPrompt) promptParts.push(replacePlaceholders(categoryPrompt));
        }

        // 3. Subcategory/Topic Prompt
        let contextKey = '';
        if (subcategory) {
            contextKey = `${category}_${subcategory}`;
            if (topic && category === 'quantitative') {
                contextKey += `_${topic}`;
            }
            const contextPrompt = globalPrompts.categories?.[contextKey];
            if (contextPrompt) promptParts.push(replacePlaceholders(contextPrompt));
        }

        // 4. Instructions
        const userInstructions = instructions.trim() || DEFAULT_INSTRUCTION;
        // User instructions can also use variables
        promptParts.push(`User Instructions:\n${replacePlaceholders(userInstructions)}`);

        const constructed = promptParts.join('\n\n-----------------\n\n');
        setFullPromptPreview(constructed);

    }, [category, subcategory, topic, difficulty, globalPrompts, instructions, isEditingPreview, isRefinementMode, questions]);

    // Initialize default instructions if empty logic is handled dynamically above, 
    // but we want the placeholder to show emptiness until user types.
    // Actually, per requirement, if user didn't type, we use default.
    // If we want the UI to *show* the default when empty, we can placeholder it.

    const handleResetInstructions = () => {
        setInstructions('');
        setIsEditingPreview(false); // Enable auto-update again
        // Trigger re-calc is automatic via effect
    };

    const handleGenerateClick = () => {
        setError(null);
        if (!apiKey) {
            setError('נדרש מפתח API');
            setIsSettingsOpen(true);
            return;
        }
        if (!category) {
            setError('נא לבחור קטגוריה');
            return;
        }
        if (!subcategory) {
            setError('נא לבחור תת-קטגוריה');
            return;
        }
        if (category === 'quantitative' && subcategory !== 'chart_inference' && !topic) {
            setError('נא לבחור נושא');
            return;
        }
        if (questions && questions.length === 0 && !difficulty) { // Allow no difficulty if refining? No, still good to have.
            if (!difficulty) {
                setError('נא לבחור רמת קושי');
                return;
            }
        }

        // Send the final prompt (either auto-constructed or user-edited)
        // We pass it via the 'instructions' argument but we might need to change the interface
        // OR we can just pass the full prompt string if the parent handles it.
        // The parent expects (instructions: string) currently. 
        // We will pass the FULL prompt string here.
        onGenerate(fullPromptPreview);
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-8" dir="rtl">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-4">

                    {/* Main Action Area */}
                    <div className="flex-1 flex items-center gap-4">
                        <button
                            type="button"
                            onClick={handleGenerateClick}
                            disabled={isGenerating}
                            className={`flex items-center gap-2 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base whitespace-nowrap border-none outline-none
                                ${isRefinementMode
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                }`}
                        >
                            {isGenerating ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{isRefinementMode ? 'מעדכן...' : 'מייצר...'}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    <span>{isRefinementMode ? 'שנה עם AI' : 'צור עם AI'}</span>
                                </>
                            )}
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
                            >
                                {isExpanded ? 'הסתר הנחיות' : 'הוסף הנחיות'}
                                <svg className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isExpanded && (
                                <button
                                    type="button"
                                    onClick={handleResetInstructions}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="אפס הנחיות לברירת מחדל"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {!apiKey && (
                            <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                נדרש מפתח API
                            </span>
                        )}

                        {error && (
                            <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded font-medium animate-in fade-in slide-in-from-right-2">
                                {error}
                            </span>
                        )}
                    </div>

                    {/* Settings Button */}
                    <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white/50 rounded-full transition-colors"
                        title="הגדרות AI"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>

                {/* Expandable Instructions Area */}
                {isExpanded && (
                    <div className="space-y-3 animate-in slide-in-from-top-2 fade-in duration-200">
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder={DEFAULT_INSTRUCTION}
                            className={`w-full p-3 rounded-lg border ${error && error.includes('הנחיה') ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'} focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[80px]`}
                            dir="ltr"
                        />

                        {/* Full Prompt Preview Toggle */}
                        <div>
                            <button
                                type="button"
                                onClick={() => setIsPreviewMode(!isPreviewMode)}
                                className="text-xs text-gray-500 hover:text-blue-600 flex items-center gap-1 mb-2"
                            >
                                <svg className={`w-3 h-3 transform transition-transform ${isPreviewMode ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                {isPreviewMode ? 'הסתר תצוגה מקדימה מלאה' : 'הצג תצוגה מקדימה מלאה (מתקדם)'}
                            </button>

                            {isPreviewMode && (
                                <div className="relative">
                                    <textarea
                                        value={fullPromptPreview}
                                        onChange={(e) => {
                                            setFullPromptPreview(e.target.value);
                                            setIsEditingPreview(true);
                                        }}
                                        disabled={!isEditingPreview}
                                        className={`w-full p-3 rounded-lg border border-gray-200 bg-gray-50 font-mono text-xs text-left min-h-[150px] ${isEditingPreview ? 'focus:ring-2 focus:ring-amber-500 border-amber-300' : 'opacity-80'}`}
                                        dir="ltr"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingPreview(!isEditingPreview)}
                                        className={`absolute top-2 right-2 p-1.5 rounded-full ${isEditingPreview ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                        title={isEditingPreview ? "סיים עריכה" : "ערוך פרומפט מלא ידנית"}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {isEditingPreview ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            )}
                                        </svg>
                                    </button>
                                    {isEditingPreview && (
                                        <div className="absolute bottom-2 right-2 text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                            עריכה ידנית פעילה - עדכונים אוטומטיים מושהים
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <AISettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                currentApiKey={apiKey}
                globalPrompts={globalPrompts}
                onSaveApiKey={onSaveApiKey}
                onSaveGlobalPrompts={onSaveGlobalPrompts}
                initialCategory={category}
                initialSubcategory={subcategory}
                initialTopic={topic}
                selectedModel={selectedModel}
                onSaveModel={onSaveModel}
            />
        </div>
    );
}

import React, { useState } from 'react';
import { AISettingsModal } from './AISettingsModal';

interface AIControlPanelProps {
    category: string;
    subcategory: string;
    topic: string;
    onGenerate: (instructions: string) => void;
    // Data props would come from parent (e.g. React Query)
    apiKey?: string;
    globalPrompts?: any;
    onSaveApiKey?: (key: string) => void;
    onSaveGlobalPrompts?: (prompts: any) => void;
    isGenerating?: boolean;
}

export function AIControlPanel({
    category,
    subcategory,
    topic,
    onGenerate,
    apiKey = '',
    globalPrompts = { base_prompt: '', categories: {} },
    onSaveApiKey = () => { },
    onSaveGlobalPrompts = () => { },
    isGenerating = false
}: AIControlPanelProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [instructions, setInstructions] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    // Pre-fill instructions from saved context prompts when context changes
    React.useEffect(() => {
        let key = category;
        if (subcategory) key += `_${subcategory}`;
        if (topic && category === 'quantitative') key += `_${topic}`;

        const savedContextPrompt = globalPrompts.categories?.[key] || '';
        if (savedContextPrompt) {
            setInstructions(savedContextPrompt);
            // Optional: Auto-expand if you want the user to see it immediately
            // setIsExpanded(true); 
        } else {
            setInstructions('');
        }
    }, [category, subcategory, topic, globalPrompts]);

    // Reset instructions to default for current context
    const handleResetInstructions = () => {
        let key = category;
        if (subcategory) key += `_${subcategory}`;
        if (topic && category === 'quantitative') key += `_${topic}`;
        const savedContextPrompt = globalPrompts.categories?.[key] || '';
        setInstructions(savedContextPrompt);
    };

    const handleGenerateClick = () => {
        if (!apiKey) {
            setIsSettingsOpen(true);
            return;
        }
        onGenerate(instructions);
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 mb-8" dir="rtl">
            <div className="flex items-center justify-between gap-4">

                {/* Main Action Area */}
                <div className="flex-1 flex items-center gap-4">
                    <button
                        onClick={handleGenerateClick}
                        disabled={isGenerating}
                        className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base whitespace-nowrap"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>מייצר...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                <span>צור שאלות עם AI</span>
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
                </div>

                {/* Settings Button */}
                <button
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
                <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
                    <textarea
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        placeholder="הכנס הנחיות ספציפיות ליצירת השאלות (אופציונלי)..."
                        className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[80px]"
                    />
                </div>
            )}

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
            />
        </div>
    );
}

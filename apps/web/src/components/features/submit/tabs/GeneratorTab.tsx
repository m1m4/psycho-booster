'use client';

import React, { useState } from 'react';

interface GeneratorTabProps {
    onGenerate: (prompt: string, category: string) => void;
}

export function GeneratorTab({ onGenerate }: GeneratorTabProps) {
    const [prompt, setPrompt] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [category, setCategory] = useState('quantitative');

    // Load API Key from localStorage on mount
    React.useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);
    }, []);

    const handleGenerate = () => {
        if (!apiKey) {
            alert('אנא הזן מפתח API');
            return;
        }
        localStorage.setItem('gemini_api_key', apiKey);
        // Call parent handler
        onGenerate(prompt, category);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6" dir="rtl">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-bold mb-2">מחולל שאלות (AI)</h3>
                <p className="text-sm mb-4">
                    הזן נושא או הנחיות, והמערכת תיצור עבורך סט שאלות חדש.
                    נדרש מפתח Gemini API.
                </p>
                <div className="space-y-2">
                    <label className="text-sm font-semibold">Gemini API Key</label>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full p-2 rounded border bg-white border-gray-300 ltr"
                        placeholder="AIzaSy..."
                        dir="ltr"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block mb-2 font-semibold">קטגוריה</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 rounded border bg-white border-gray-300"
                    >
                        <option value="quantitative">חשיבה כמותית</option>
                        <option value="verbal">חשיבה מילולית</option>
                        <option value="english">אנגלית</option>
                    </select>
                </div>

                <div>
                    <label className="block mb-2 font-semibold">הנחיות למחולל (System Prompt)</label>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full p-4 h-32 rounded border bg-white border-gray-300"
                        placeholder="לדוגמה: צור 3 שאלות קשות בנושא גיאומטריה, משולשים ישרי זווית."
                    />
                </div>

                <button
                    onClick={handleGenerate}
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition"
                >
                    צור שאלות
                </button>
            </div>
        </div>
    );
}

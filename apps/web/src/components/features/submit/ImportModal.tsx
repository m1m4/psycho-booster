import React, { useState } from 'react';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (data: any) => void;
    isEnglish: boolean;
}

export function ImportModal({ isOpen, onClose, onImport, isEnglish }: ImportModalProps) {
    const [jsonText, setJsonText] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const EXAMPLE_JSON = {
        category: "quantitative",
        subcategory: "algebra",
        topic: "expressions",
        difficulty: "medium",
        questions: [
            {
                questionText: "אם $x + y = 10$ ו-$x - y = 4$, מהו הערך של $x^2 - y^2$?",
                answer1: "40",
                answer2: "14",
                answer3: "24",
                answer4: "60",
                correctAnswer: "1",
                explanation: "לפי נוסחת כפל מקוצר: $x^2 - y^2 = (x+y)(x-y)$. נציב את הנתונים: $10 \cdot 4 = 40$."
            },
            {
                questionText: "ערכה של איזו מהביטויים הבאים הוא הגדול ביותר כאשר $a > 1$?",
                answer1: "$a^2$",
                answer2: "$a$",
                answer3: "$\sqrt{a}$",
                answer4: "$1/a$",
                correctAnswer: "1",
                explanation: "עבור מספר הגדול מ-1, ככל שנעלה אותו בחזקה גבוהה יותר, ערכו יגדל. לכן $a^2 > a$."
            }
        ]
    };

    const handleCopyExample = () => {
        const json = JSON.stringify(EXAMPLE_JSON, null, 2);
        setJsonText(json);
        navigator.clipboard.writeText(json);
        setCopied(true);
        setError(null);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleImportClick = () => {
        try {
            const parsed = JSON.parse(jsonText);

            // Basic validation: Check for subcategory and topic if category is quantitative
            if (!parsed.subcategory) {
                setError(isEnglish ? 'Subcategory is required' : 'תת-קטגוריה היא שדה חובה');
                return;
            }

            if (parsed.category === 'quantitative' && !parsed.topic && parsed.subcategory !== 'chart_inference') {
                setError(isEnglish ? 'Topic is required for quantitative questions' : 'נושא הוא שדה חובה לשאלות כמותיות');
                return;
            }

            onImport(parsed);
            onClose();
            setJsonText('');
            setError(null);
        } catch (e) {
            setError(isEnglish ? 'Invalid JSON format' : 'פורמט JSON לא תקין');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6" dir={isEnglish ? 'ltr' : 'rtl'}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isEnglish ? 'Import from JSON' : 'ייבוא מ-JSON'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {isEnglish ? 'Paste your JSON text below to fill the form' : 'הדבק את טקסט ה-JSON למטה כדי למלא את הטופס'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div className="relative group">
                        <textarea
                            value={jsonText}
                            onChange={(e) => setJsonText(e.target.value)}
                            placeholder='{ "category": "quantitative", "subcategory": "number_properties", ... }'
                            className="w-full h-64 p-4 font-mono text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all"
                            dir="ltr"
                        />

                        {/* Tooltip Guide */}
                        <div className="absolute top-2 right-2 flex items-center">
                            <div className="relative group/tooltip">
                                <button className="p-1.5 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                                <div className="invisible group-hover/tooltip:visible absolute z-10 w-64 p-4 mt-2 bg-gray-900 text-white text-xs rounded-xl shadow-xl -right-2 top-full transition-all">
                                    <p className="font-bold mb-2 underline">{isEnglish ? 'Import Rules:' : 'כללי ייבוא:'}</p>
                                    <ul className="space-y-1 list-disc list-inside opacity-90">
                                        <li>{isEnglish ? 'Property names must match form fields' : 'שמות המאפיינים חייבים להתאים לשדות הטופס'}</li>
                                        <li>{isEnglish ? 'Mandatory: subcategory, topic (for quantitative)' : 'חובה: subcategory, topic (לכמותי)'}</li>
                                        <li>{isEnglish ? 'Partial JSON is supported' : 'ניתן להזין JSON חלקי'}</li>
                                        <li>{isEnglish ? 'Asset: assetText (for reading sets)' : 'כללי: assetText (לקטעי קריאה)'}</li>
                                        <li>{isEnglish ? 'Difficulty: easy, medium, hard' : 'קושי: easy, medium, hard'}</li>
                                        <li>{isEnglish ? 'Questions should be in an array' : 'שאלות צריכות להיות במערך (array)'}</li>
                                        <li>{isEnglish ? 'Question Fields: questionText, answer1-4, explanation, correctAnswer (1-4)' : 'שדות שאלה: questionText, answer1-4, explanation, correctAnswer (1-4)'}</li>
                                    </ul>
                                    <div className="absolute -top-1 right-3 w-3 h-3 bg-gray-900 rotate-45" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm font-medium animate-pulse">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-start">
                        <button
                            type="button"
                            onClick={handleCopyExample}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium underline transition-colors flex items-center gap-1"
                        >
                            {copied ? (
                                <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    {isEnglish ? 'Copied to clipboard!' : 'הועתק ללוח!'}
                                </>
                            ) : (
                                isEnglish ? 'Show example & copy to clipboard' : 'הצג דוגמה והעתק ללוח'
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50/50 flex justify-start gap-3">
                    <button
                        onClick={handleImportClick}
                        disabled={!jsonText.trim()}
                        className="px-8 py-2 rounded-xl bg-[#4169E1] text-white font-bold hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed order-1"
                    >
                        {isEnglish ? 'Confirm' : 'אישור'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-100 transition-colors order-2"
                    >
                        {isEnglish ? 'Cancel' : 'ביטול'}
                    </button>
                </div>
            </div>
        </div>
    );
}

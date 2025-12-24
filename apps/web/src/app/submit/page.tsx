'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LatexPreview } from '@/components/ui/LatexPreview';
import { Slider } from '@/components/ui/Slider';
const CameraIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
    </svg>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
    </svg>
);

interface QuestionItem {
    id: number;
    questionText: string;
    questionImage: File | null;
    answer1: string;
    answer1Image: File | null;
    answer2: string;
    answer2Image: File | null;
    answer3: string;
    answer3Image: File | null;
    answer4: string;
    answer4Image: File | null;
    correctAnswer: string;
    explanation: string;
    difficulty: string;
}

const DEFAULT_QUESTION: QuestionItem = {
    id: 1,
    questionText: '',
    questionImage: null,
    answer1: '',
    answer1Image: null,
    answer2: '',
    answer2Image: null,
    answer3: '',
    answer3Image: null,
    answer4: '',
    answer4Image: null,
    correctAnswer: '',
    explanation: '',
    difficulty: '',
};

export default function SubmitPage() {
    const [formData, setFormData] = useState({
        category: '',
        subcategory: '',
        assetFile: null as File | null,
        assetText: '', // For reading comprehension passage
        questions: [DEFAULT_QUESTION] as QuestionItem[],
    });

    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

    // Helpers
    const isEnglish = formData.category === 'english';
    const isChartInference = formData.subcategory === 'chart_inference';
    const isReadingComprehension =
        formData.subcategory === 'reading_comprehension_verbal' ||
        formData.subcategory === 'reading_comprehension_eng';

    // Check if this is a "Question Set" mode (RC or Chart)
    const isQuestionSet = isChartInference || isReadingComprehension;

    // Reset active index when switching valid questions (safety)
    useEffect(() => {
        if (activeQuestionIndex >= formData.questions.length) {
            setActiveQuestionIndex(0);
        }
    }, [formData.questions.length]);

    // Handle initial switch to Question Set
    useEffect(() => {
        if (isQuestionSet && formData.questions.length === 1) {
            // Default to 3 questions when entering a set mode
            setFormData(prev => ({
                ...prev,
                questions: [
                    { ...DEFAULT_QUESTION, id: 1 },
                    { ...DEFAULT_QUESTION, id: 2 },
                    { ...DEFAULT_QUESTION, id: 3 }
                ]
            }));
        } else if (!isQuestionSet && formData.questions.length > 1) {
            // Revert to single question if leaving set mode
            setFormData(prev => ({
                ...prev,
                questions: [{ ...prev.questions[0], id: 1 }]
            }));
        }
    }, [isQuestionSet]);

    const subcategoryOptions = {
        verbal: [
            { label: 'אנלוגיות', value: 'analogies' },
            { label: 'השלמת משפטים', value: 'sentence_completions' },
            { label: 'טענות', value: 'logic' },
            { label: 'הבנת משפט', value: 'sentence_understanding' },
            { label: 'הבנת פסקה', value: 'paragraph_understanding' },
            { label: 'משלים והשוואות', value: 'fables_comparisons' },
            { label: 'מחזק/מחליש', value: 'strengthen_weaken' },
            { label: 'חשיבה מדעית', value: 'scientific_thinking' },
            { label: 'כללים ושיבוצים', value: 'rules_assignments' },
            { label: 'הבנת הנקרא', value: 'reading_comprehension_verbal' },
        ],
        quantitative: [
            { label: 'אלגברה', value: 'algebra' },
            { label: 'בעיות', value: 'problems' },
            { label: 'גאומטריה', value: 'geometry' },
            { label: 'הסקה מתרשים', value: 'chart_inference' },
        ],
        english: [
            { label: 'Sentence Completions', value: 'sentence_completions_eng' },
            { label: 'Restatements', value: 'restatements' },
            { label: 'Reading Comprehension', value: 'reading_comprehension_eng' },
        ],
    };

    const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        handleMetadataChange(e);
        // Reset subcategory and questions logic triggers on subcategory change, so just clearing subcategory is enough
        setFormData(prev => ({ ...prev, subcategory: '', category: e.target.value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({ ...prev, assetFile: e.target.files![0] }));
        }
    };

    // Update specific field for the ACTIVE question
    const handleQuestionChange = (field: keyof QuestionItem, value: any) => {
        setFormData(prev => {
            const newQuestions = [...prev.questions];
            const currentQ = { ...newQuestions[activeQuestionIndex] };

            // Exclusive logic: if typing in answer text, clear the answer image
            if (typeof value === 'string' && value.length > 0) {
                if (field === 'answer1' || field === 'answer2' || field === 'answer3' || field === 'answer4') {
                    const imgField = `${field}Image` as keyof QuestionItem;
                    (currentQ as any)[imgField] = null;
                }
            }

            (currentQ as any)[field] = value;
            newQuestions[activeQuestionIndex] = currentQ;
            return { ...prev, questions: newQuestions };
        });
    };

    const handleImageChange = (field: keyof QuestionItem, file: File | null) => {
        setFormData(prev => {
            const newQuestions = [...prev.questions];
            const currentQ = { ...newQuestions[activeQuestionIndex] };

            // Exclusive logic: if setting answer image, clear the answer text
            if (file && (field === 'answer1Image' || field === 'answer2Image' || field === 'answer3Image' || field === 'answer4Image')) {
                const textField = field.replace('Image', '') as keyof QuestionItem;
                (currentQ as any)[textField] = '';
            }

            (currentQ as any)[field] = file;
            newQuestions[activeQuestionIndex] = currentQ;
            return { ...prev, questions: newQuestions };
        });
    };

    const handleSliderChange = (count: number) => {
        setFormData(prev => {
            const currentCount = prev.questions.length;
            let newQuestions = [...prev.questions];

            if (count > currentCount) {
                // Add questions
                for (let i = currentCount; i < count; i++) {
                    newQuestions.push({ ...DEFAULT_QUESTION, id: i + 1 });
                }
            } else if (count < currentCount) {
                // Remove questions (from end)
                newQuestions = newQuestions.slice(0, count);
            }

            return { ...prev, questions: newQuestions };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const errors: Record<string, boolean> = {};
        let firstErrorId = '';

        const setError = (id: string, qIdx?: number) => {
            errors[id] = true;
            if (!firstErrorId) {
                firstErrorId = id;
                if (qIdx !== undefined) {
                    setActiveQuestionIndex(qIdx);
                }
            }
        };

        // Validate Metadata
        if (!formData.category) setError('category-select');
        if (!formData.subcategory) setError('subcategory-select');

        // Validate Shared Asset
        if (isReadingComprehension && !formData.assetText) setError('asset-text');
        if (isChartInference && !formData.assetFile) setError('asset-file-container');

        // Validate Questions
        formData.questions.forEach((q, idx) => {
            const prefix = `q${idx}`;
            if (!q.difficulty) setError(`${prefix}-difficulty`, idx);
            if (!q.questionText) setError(`${prefix}-text`, idx);

            if (!q.answer1 && !q.answer1Image) setError(`${prefix}-ans1`, idx);
            if (!q.answer2 && !q.answer2Image) setError(`${prefix}-ans2`, idx);
            if (!q.answer3 && !q.answer3Image) setError(`${prefix}-ans3`, idx);
            if (!q.answer4 && !q.answer4Image) setError(`${prefix}-ans4`, idx);

            if (!q.correctAnswer) setError(`${prefix}-correct-container`, idx);
            if (!q.explanation) setError(`${prefix}-explanation`, idx);
        });

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);

            // Small delay to allow tab switch/DOM update if needed
            setTimeout(() => {
                const element = document.getElementById(firstErrorId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);

            // Clear errors after 1 second
            setTimeout(() => {
                setFormErrors({});
            }, 1000);

            return;
        }

        console.log('Form Submitted', formData);
        alert(`Question set submitted with ${formData.questions.length} questions`);
    };

    // UI Labels based on language
    const labels = {
        question: isEnglish ? 'Question' : 'שאלה',
        answers: isEnglish ? 'Answers' : 'תשובות',
        explanation: isEnglish ? 'Explanation' : 'הסבר לתשובה',
        answerPlaceholder: isEnglish ? 'Answer' : 'תשובה',
        correctIndicator: isEnglish ? 'Correct' : 'נכון',
        category: 'קטגוריה', // Keep metadata labels Hebrew for admin consistency? user requested "guiding text should switch to english"
        // Let's switch metadata labels too if English category? No, user mainly said "in each question".
        // But for consistency:
    };

    // Actually user said: "When picking the subcategory "Reading Comprehension" in "אנגלית" category, the guiding text should switch to english in each question"
    // He didn't explicitly say metadata labels. I'll focus on the question set area.

    // Check if we should show Latex Preview (Only for Quantitative)
    const showLatex = formData.category === 'quantitative';

    const isSubCategorySelected = !!formData.subcategory;

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white pb-20">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
                <div className="space-y-2 text-center sm:text-right">
                    <h1 className="text-3xl font-bold tracking-tight">הוספת שאלה חדשה</h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        מלא את הפרטים הבאים כדי להוסיף שאלה או סט שאלות למאגר
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8" dir="rtl">
                    {/* Metadata Section - Always RTL for Admin convenience unless English category forces LTR? 
                        User: "the text box should be LTR [if english]". 
                        Metadata dropdowns are mixed. Let's keep Metadata container RTL for now, but Selects handle their internal dir. 
                    */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl space-y-6 border border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-semibold">פרטי השאלה</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Select
                                label="קטגוריה"
                                name="category"
                                id="category-select"
                                value={formData.category}
                                onChange={handleCategoryChange}
                                placeholder="בחר קטגוריה..."
                                options={[
                                    { label: 'כמותי', value: 'quantitative' },
                                    { label: 'מילולי', value: 'verbal' },
                                    { label: 'אנגלית', value: 'english' },
                                ]}
                                required
                                error={formErrors['category-select'] ? ' ' : undefined}
                            />
                            <Select
                                label="תת-קטגוריה"
                                name="subcategory"
                                id="subcategory-select"
                                value={formData.subcategory}
                                onChange={handleMetadataChange}
                                placeholder={isEnglish ? 'Select Subcategory...' : 'בחר תת-קטגוריה...'}
                                options={formData.category ? subcategoryOptions[formData.category as keyof typeof subcategoryOptions] || [] : []}
                                required
                                disabled={!formData.category}
                                dir={isEnglish ? 'ltr' : 'rtl'}
                                error={formErrors['subcategory-select'] ? ' ' : undefined}
                            />
                            {/* Difficulty is per question? User said "Everything ... should be individual to the number of question set". 
                                So Difficulty moves to Question Form. 
                                Removing Difficulty from here. 
                            */}
                        </div>

                        {/* Question Set Logic: Slider */}
                        {isQuestionSet && (
                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                                <label className={`block text-sm font-medium mb-4 ${isEnglish ? 'text-left' : ''}`}>
                                    {isEnglish ? 'Number of Questions:' : 'מספר שאלות:'}
                                </label>
                                <Slider
                                    min={3}
                                    max={6}
                                    value={formData.questions.length}
                                    onChange={handleSliderChange}
                                    disabled={!isSubCategorySelected}
                                />
                            </div>
                        )}
                    </div>

                    {/* Shared Asset Section (Only for RC / Chart) */}
                    {isQuestionSet && (
                        <div className={`bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl space-y-6 border border-gray-200 dark:border-gray-800 ${!isSubCategorySelected ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h2 className={`text-xl font-semibold ${isEnglish ? 'text-left' : ''}`}>
                                {isChartInference ? 'קובץ תרשים משותף' : (isEnglish ? 'Reading Passage' : 'קטע קריאה')}
                            </h2>

                            {isChartInference ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-1">
                                            <div
                                                id="asset-file-container"
                                                className={`
                                                relative border-2 border-dashed rounded-xl p-8 transition-all hover:border-[#4169E1]/50 flex flex-col items-center justify-center gap-4
                                                ${formData.assetFile ? 'bg-[#4169E1]/5 border-[#4169E1]/30' : ''}
                                                ${formErrors['asset-file-container'] ? 'border-red-500 bg-red-50/5' : 'border-gray-200 dark:border-gray-800'}
                                            `}>
                                                {formData.assetFile ? (
                                                    <div className="relative w-full aspect-video max-h-[300px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black">
                                                        <img
                                                            src={URL.createObjectURL(formData.assetFile)}
                                                            className="w-full h-full object-contain"
                                                            alt="Shared Chart"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData(prev => ({ ...prev, assetFile: null }))}
                                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors z-10"
                                                            disabled={!isSubCategorySelected}
                                                        >
                                                            <XIcon className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <input
                                                            type="file"
                                                            id="asset-file"
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                            accept="image/*"
                                                            onChange={handleFileChange}
                                                            disabled={!isSubCategorySelected}
                                                        />
                                                        <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                                                            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                                <CameraIcon className="w-8 h-8" />
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="font-medium">{isEnglish ? "Click to upload chart photo" : "לחץ להעלאת תמונת התרשים"}</p>
                                                                <p className="text-sm opacity-60">{isEnglish ? "PNG, JPG up to 10MB" : "PNG, JPG עד 10MB"}</p>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <Textarea
                                        name="assetText"
                                        id="asset-text"
                                        value={formData.assetText}
                                        onChange={handleMetadataChange}
                                        placeholder={isEnglish ? 'Enter passage text here...' : 'הזן את קטע הקריאה כאן...'}
                                        dir={isEnglish ? 'ltr' : 'rtl'}
                                        disabled={!isSubCategorySelected}
                                        error={formErrors['asset-text'] ? ' ' : undefined}
                                    />
                                    {showLatex && <LatexPreview content={formData.assetText} />}
                                </>
                            )}
                        </div>
                    )}


                    {/* Question Content Area */}
                    <div
                        className={`flex flex-col md:flex-row gap-6 ${!isSubCategorySelected ? 'opacity-50 pointer-events-none' : ''}`}
                        dir={isEnglish ? 'ltr' : 'rtl'}
                    >

                        {/* Vertical Tabs (Only visible if Question Set) */}
                        {isQuestionSet && (
                            <div className={`w-full md:w-48 flex-shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 z-10 bg-white dark:bg-black md:bg-transparent md:dark:bg-transparent sticky top-4 h-fit`}>
                                {formData.questions.map((q, idx) => (
                                    <button
                                        key={q.id}
                                        type="button"
                                        onClick={() => {
                                            setActiveQuestionIndex(idx);
                                            // Scroll to question form top
                                            document.getElementById('question-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }}
                                        disabled={!isSubCategorySelected}
                                        className={`
                                            px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap text-start
                                            ${activeQuestionIndex === idx
                                                ? 'bg-[#4169E1] text-white shadow-md'
                                                : 'bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                                        `}
                                    >
                                        {isEnglish ? `Question ${idx + 1}` : `שאלה ${idx + 1}`}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Active Question Form */}
                        <div
                            id="question-form-container"
                            className="flex-1 bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl space-y-6 border border-gray-200 dark:border-gray-800 scroll-mt-20"
                            dir={isEnglish ? 'ltr' : 'rtl'}
                        >
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold">
                                    {isQuestionSet
                                        ? (isEnglish ? `Question ${activeQuestionIndex + 1}` : `שאלה ${activeQuestionIndex + 1}`)
                                        : (isEnglish ? 'Question Details' : 'פרטי השאלה')
                                    }
                                </h2>
                                {/* Moved Difficulty Here */}
                                <div className="w-40">
                                    <Select
                                        id={`q${activeQuestionIndex}-difficulty`}
                                        options={[
                                            { label: 'קל', value: 'easy' },
                                            { label: 'בינוני', value: 'medium' },
                                            { label: 'קשה', value: 'hard' },
                                        ]}
                                        placeholder="רמה..."
                                        value={formData.questions[activeQuestionIndex].difficulty}
                                        onChange={(e) => handleQuestionChange('difficulty', e.target.value)}
                                        dir="rtl"
                                        disabled={!isSubCategorySelected}
                                        error={formErrors[`q${activeQuestionIndex}-difficulty`] ? ' ' : undefined}
                                    />
                                </div>
                            </div>

                            <Textarea
                                id={`q${activeQuestionIndex}-text`}
                                value={formData.questions[activeQuestionIndex].questionText}
                                onChange={(e) => handleQuestionChange('questionText', e.target.value)}
                                placeholder={isEnglish ? 'Type question here...' : 'הקלד את השאלה כאן...'}
                                required
                                dir={isEnglish ? 'ltr' : undefined}
                                disabled={!isSubCategorySelected}
                                error={formErrors[`q${activeQuestionIndex}-text`] ? ' ' : undefined}
                            />
                            {showLatex && (
                                <LatexPreview content={formData.questions[activeQuestionIndex].questionText} />
                            )}

                            {/* Question Image (for single questions or additional context) */}
                            {!isQuestionSet && (
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <CameraIcon className="w-4 h-4" />
                                        {isEnglish ? "Attach Image to Question (Optional)" : "צרף תמונה לשאלה (אופציונלי)"}
                                    </label>
                                    <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl transition-all hover:border-[#4169E1]/50 bg-white dark:bg-black overflow-hidden min-h-[160px] flex items-center justify-center">
                                        {formData.questions[activeQuestionIndex].questionImage ? (
                                            <div className="relative w-full h-full flex items-center justify-center p-2">
                                                <img
                                                    src={URL.createObjectURL(formData.questions[activeQuestionIndex].questionImage as File)}
                                                    className="max-w-full max-h-[400px] object-contain rounded-lg"
                                                    alt="Question Content"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleImageChange('questionImage', null)}
                                                    className="absolute top-4 right-4 bg-red-500 text-white rounded-full p-2 shadow-md hover:bg-red-600 transition-colors z-10"
                                                    disabled={!isSubCategorySelected}
                                                >
                                                    <XIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <input
                                                    type="file"
                                                    id="question-image"
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        handleImageChange('questionImage', file);
                                                    }}
                                                    disabled={!isSubCategorySelected}
                                                />
                                                <div className="flex flex-col items-center justify-center gap-2 text-gray-500 p-8">
                                                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-full">
                                                        <CameraIcon className="w-8 h-8" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="font-medium">{isEnglish ? "Click or drag to upload photo" : "לחץ או גרור להעלאת תמונה"}</p>
                                                        <p className="text-xs opacity-60">PNG, JPG</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 className={`text-lg font-medium mb-4 ${isEnglish ? 'text-left' : ''}`}>{labels.answers}</h3>
                                <div id={`q${activeQuestionIndex}-correct-container`} className={`rounded-xl transition-all ${formErrors[`q${activeQuestionIndex}-correct-container`] ? 'ring-2 ring-red-500 ring-offset-2 p-2' : ''}`}>
                                    <div className="space-y-4">
                                        {[1, 2, 3, 4].map((num) => {
                                            const q = formData.questions[activeQuestionIndex];
                                            const isCorrect = q.correctAnswer === num.toString();
                                            const hasSelection = q.correctAnswer !== '';

                                            return (
                                                <div key={num} className="space-y-2">
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            onClick={() => isSubCategorySelected && handleQuestionChange('correctAnswer', num.toString())}
                                                            className={`
                                                            w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all flex-shrink-0
                                                            ${isCorrect
                                                                    ? 'border-green-500 bg-green-500'
                                                                    : 'border-gray-200 dark:border-gray-800 hover:border-green-500'}
                                                            ${!isSubCategorySelected ? 'opacity-50 cursor-not-allowed' : ''}
                                                        `}
                                                        >
                                                            {isCorrect && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                        </div>
                                                        <div className="flex-1 flex gap-2">
                                                            {!(q as any)[`answer${num}Image`] ? (
                                                                <Input
                                                                    id={`q${activeQuestionIndex}-ans${num}`}
                                                                    placeholder={`${labels.answerPlaceholder} ${num}`}
                                                                    value={(q as any)[`answer${num}`]}
                                                                    onChange={(e) => handleQuestionChange(`answer${num}` as keyof QuestionItem, e.target.value)}
                                                                    required
                                                                    className={`transition-all ${hasSelection
                                                                        ? isCorrect
                                                                            ? 'border-2 border-green-500 bg-green-50/5 dark:bg-green-500/10'
                                                                            : 'border-2 border-red-500 bg-red-50/5 dark:bg-red-500/10'
                                                                        : ''
                                                                        }`}
                                                                    dir={isEnglish ? 'ltr' : undefined}
                                                                    disabled={!isSubCategorySelected}
                                                                    error={formErrors[`q${activeQuestionIndex}-ans${num}`] ? ' ' : undefined}
                                                                />
                                                            ) : (
                                                                <div className={`
                                                                flex-1 relative rounded-lg border-2 overflow-hidden bg-white dark:bg-black p-1 transition-all h-[42px] flex items-center
                                                                ${hasSelection
                                                                        ? isCorrect
                                                                            ? 'border-green-500 bg-green-50/5'
                                                                            : 'border-red-500 bg-red-50/5'
                                                                        : 'border-gray-200 dark:border-gray-800'
                                                                    }
                                                            `}>
                                                                    <img
                                                                        src={URL.createObjectURL((q as any)[`answer${num}Image`] as File)}
                                                                        className="h-full w-auto object-contain mx-auto"
                                                                        alt=""
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleImageChange(`answer${num}Image` as keyof QuestionItem, null)}
                                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                                                                        disabled={!isSubCategorySelected}
                                                                    >
                                                                        <XIcon className="w-3 h-3" />
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {/* Compact Image Upload Button - Only visible if no image or when active? 
                                                            Actually, always show the camera icon to allow switching, unless we want to hide it.
                                                            User said "the text box should disappear, only showing the preview".
                                                            If image exists, I show the preview in the space of the text box.
                                                         */}
                                                            {!(q as any)[`answer${num}Image`] && (
                                                                <div className="flex-shrink-0 flex items-center gap-2">
                                                                    <input
                                                                        type="file"
                                                                        id={`ans-image-${num}`}
                                                                        className="hidden"
                                                                        accept="image/*"
                                                                        onChange={(e) => {
                                                                            const file = e.target.files?.[0] || null;
                                                                            handleImageChange(`answer${num}Image` as keyof QuestionItem, file);
                                                                        }}
                                                                        disabled={!isSubCategorySelected}
                                                                    />
                                                                    <label
                                                                        htmlFor={`ans-image-${num}`}
                                                                        className={`p-2 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center text-gray-400 opacity-60 ${!isSubCategorySelected ? 'cursor-not-allowed pointer-events-none' : ''}`}
                                                                        title={isEnglish ? "Upload Image" : "העלה תמונה"}
                                                                    >
                                                                        <CameraIcon className="w-5 h-5" />
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Answer Preview - Moved directly under input */}
                                                    {showLatex && !(q as any)[`answer${num}Image`] && (
                                                        <div className={isEnglish ? 'pl-10' : 'pr-10'}>
                                                            <LatexPreview
                                                                content={(q as any)[`answer${num}`]}
                                                                label={isEnglish ? `Preview Answer ${num}` : `תצוגה מקדימה לתשובה ${num}`}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div dir="rtl">
                                    <Textarea
                                        id={`q${activeQuestionIndex}-explanation`}
                                        label="הסבר לתשובה"
                                        value={formData.questions[activeQuestionIndex].explanation}
                                        onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                                        placeholder="הסבר מדוע התשובה הנכונה היא נכונה..."
                                        required
                                        dir="rtl"
                                        disabled={!isSubCategorySelected}
                                        error={formErrors[`q${activeQuestionIndex}-explanation`] ? ' ' : undefined}
                                    />
                                    {showLatex && <LatexPreview content={formData.questions[activeQuestionIndex].explanation} />}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-800">
                        <button
                            type="submit"
                            disabled={!isSubCategorySelected}
                            className="bg-[#4169E1] text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                        >
                            {isEnglish ? 'Submit Question(s)' : 'שמור שאלה'}
                        </button>
                        <Link
                            href="/"
                            className="border border-gray-200 dark:border-gray-800 text-black dark:text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-900 active:scale-95 transition-all text-center"
                        >
                            {isEnglish ? 'Back to Dashboard' : 'חזרה למסך הראשי'}
                        </Link>
                    </div>
                </form>
            </main>
        </div>
    );
}

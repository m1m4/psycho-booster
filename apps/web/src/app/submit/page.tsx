'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { LatexPreview } from '@/components/ui/LatexPreview';
import { Slider } from '@/components/ui/Slider';

interface QuestionItem {
    id: number;
    questionText: string;
    answer1: string;
    answer2: string;
    answer3: string;
    answer4: string;
    correctAnswer: string;
    explanation: string;
    difficulty: string;
}

const DEFAULT_QUESTION: QuestionItem = {
    id: 1,
    questionText: '',
    answer1: '',
    answer2: '',
    answer3: '',
    answer4: '',
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
    const handleQuestionChange = (field: keyof QuestionItem, value: string) => {
        setFormData(prev => {
            const newQuestions = [...prev.questions];
            newQuestions[activeQuestionIndex] = {
                ...newQuestions[activeQuestionIndex],
                [field]: value
            };
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
                                value={formData.category}
                                onChange={handleCategoryChange}
                                placeholder="בחר קטגוריה..."
                                options={[
                                    { label: 'כמותי', value: 'quantitative' },
                                    { label: 'מילולי', value: 'verbal' },
                                    { label: 'אנגלית', value: 'english' },
                                ]}
                                required
                            />
                            <Select
                                label="תת-קטגוריה"
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleMetadataChange}
                                placeholder={isEnglish ? 'Select Subcategory...' : 'בחר תת-קטגוריה...'}
                                options={formData.category ? subcategoryOptions[formData.category as keyof typeof subcategoryOptions] || [] : []}
                                required
                                disabled={!formData.category}
                                dir={isEnglish ? 'ltr' : 'rtl'}
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
                                />
                            </div>
                        )}
                    </div>

                    {/* Shared Asset Section (Only for RC / Chart) */}
                    {isQuestionSet && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl space-y-6 border border-gray-200 dark:border-gray-800">
                            <h2 className={`text-xl font-semibold ${isEnglish ? 'text-left' : ''}`}>
                                {isChartInference ? 'קובץ תרשים משותף' : (isEnglish ? 'Reading Passage' : 'קטע קריאה')}
                            </h2>

                            {isChartInference ? (
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="block w-full text-sm text-gray-500
                                        file:mr-4 file:py-2 file:px-4
                                        file:rounded-full file:border-0
                                        file:text-sm file:font-semibold
                                        file:bg-[#4169E1] file:text-white
                                        hover:file:bg-blue-600
                                        dark:file:bg-[#4169E1]
                                    "
                                />
                            ) : (
                                <>
                                    <Textarea
                                        name="assetText"
                                        value={formData.assetText}
                                        onChange={handleMetadataChange}
                                        placeholder={isEnglish ? 'Enter passage text here...' : 'הזן את קטע הקריאה כאן...'}
                                        dir={isEnglish ? 'ltr' : 'rtl'}
                                    />
                                    {showLatex && <LatexPreview content={formData.assetText} />}
                                </>
                            )}
                        </div>
                    )}


                    {/* Question Content Area */}
                    <div
                        className="flex flex-col md:flex-row gap-6"
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
                                        options={[
                                            { label: 'קל', value: 'easy' },
                                            { label: 'בינוני', value: 'medium' },
                                            { label: 'קשה', value: 'hard' },
                                        ]}
                                        placeholder="רמה..."
                                        value={formData.questions[activeQuestionIndex].difficulty}
                                        onChange={(e) => handleQuestionChange('difficulty', e.target.value)}
                                        dir="rtl"
                                    />
                                </div>
                            </div>

                            <Textarea
                                value={formData.questions[activeQuestionIndex].questionText}
                                onChange={(e) => handleQuestionChange('questionText', e.target.value)}
                                placeholder={isEnglish ? 'Type question here...' : 'הקלד את השאלה כאן...'}
                                required
                                dir={isEnglish ? 'ltr' : undefined}
                            />
                            {showLatex && <LatexPreview content={formData.questions[activeQuestionIndex].questionText} />}

                            <div>
                                <h3 className={`text-lg font-medium mb-4 ${isEnglish ? 'text-left' : ''}`}>{labels.answers}</h3>
                                <div className="space-y-4">
                                    {[1, 2, 3, 4].map((num) => {
                                        const q = formData.questions[activeQuestionIndex];
                                        const isCorrect = q.correctAnswer === num.toString();
                                        const hasSelection = q.correctAnswer !== '';

                                        return (
                                            <div key={num} className="space-y-2">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        onClick={() => handleQuestionChange('correctAnswer', num.toString())}
                                                        className={`
                                                            w-6 h-6 rounded-full border-2 cursor-pointer flex items-center justify-center transition-all flex-shrink-0
                                                            ${isCorrect
                                                                ? 'border-green-500 bg-green-500'
                                                                : 'border-gray-200 dark:border-gray-800 hover:border-green-500'}
                                                        `}
                                                    >
                                                        {isCorrect && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <Input
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
                                                        />
                                                    </div>
                                                </div>

                                                {/* Answer Preview - Moved directly under input */}
                                                {showLatex && (
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
                                    label="הסבר לתשובה"
                                    value={formData.questions[activeQuestionIndex].explanation}
                                    onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                                    placeholder="הסבר מדוע התשובה הנכונה היא נכונה..."
                                    required
                                    dir="rtl"
                                />
                                {showLatex && <LatexPreview content={formData.questions[activeQuestionIndex].explanation} />}
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-800">
                        <button
                            type="submit"
                            className="bg-[#4169E1] text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 active:scale-95 transition-all"
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

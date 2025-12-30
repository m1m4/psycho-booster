import React from 'react';
import { QuestionSet } from '@/types/submit';
import { QuestionPreview } from '@/components/features/submit/QuestionPreview';

interface ExportTemplateProps {
    questions: QuestionSet[];
}

export function ExportTemplate({ questions }: ExportTemplateProps) {
    return (
        <div id="printable-area" className="p-4 bg-white text-black min-h-screen w-[800px]">
            {/* Part 1: Questions */}
            <div id="export-questions-section">
                <h1 className="text-3xl font-bold mb-8 text-center border-b pb-4">מבחן לדוגמה</h1>
                {questions.map((q, index) => (
                    <div key={`param-q-${q.id}`} className="export-question-item mb-8 pb-8 border-b border-gray-200 page-break-inside-avoid">
                        <div className="flex items-start gap-4">
                            <span className="text-xl font-bold text-gray-500 min-w-[30px]">{index + 1}.</span>
                            <div className="flex-1">
                                <QuestionPreview
                                    formData={{
                                        ...q,
                                        assetFile: null,
                                        assetText: q.assetText || '',
                                        questions: q.questions
                                    }}
                                    isEnglish={q.category === 'english'}
                                    hideCorrectAnswer={true}
                                    viewMode="question_only"
                                    isExport={true}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Part 2: Answer Key - Will be captured as a separate block */}
            <div id="export-answers-section" className="mt-8">
                <h2 className="text-2xl font-bold mb-6 text-center border-b pb-2">מפתח תשובות</h2>
                <div id="export-answers-grid" className="grid grid-cols-5 gap-4 text-sm p-1">
                    {questions.map((q, index) => (
                        <div key={`key-${q.id}`} className="flex items-center justify-between p-2 border rounded bg-gray-50 page-break-inside-avoid shadow-sm print:shadow-none">
                            <span className="font-bold text-gray-500">{index + 1}</span>
                            <span className="font-bold">({q.questions[0].correctAnswer})</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Part 3: Explanations - Will be captured individually */}
            <div id="export-explanations-section" className="mt-12">
                <h2 className="text-2xl font-bold mb-8 text-center border-b pb-4">הסברים</h2>
                {questions.map((q, index) => (
                    <div key={`expl-${q.id}`} className="export-explanation-item mb-8 pb-8 border-b border-gray-100 page-break-inside-avoid">
                        <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center min-w-[40px]">
                                <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
                                <span className="text-xs text-gray-400">({q.questions[0].correctAnswer})</span>
                            </div>
                            <div className="flex-1">
                                <QuestionPreview
                                    formData={{
                                        ...q,
                                        assetFile: null,
                                        assetText: q.assetText || '',
                                        questions: q.questions
                                    }}
                                    isEnglish={q.category === 'english'}
                                    hideCorrectAnswer={false} // Show correct answer in context of explanation if needed, or we rely on viewMode
                                    viewMode="explanation_only"
                                    isExport={true}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
                /* Ensure consistent rendering for capture */
                .page-break-inside-avoid {
                    break-inside: avoid;
                }
            `}</style>
        </div>
    );
}

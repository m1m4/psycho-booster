import React from 'react';
import { QuestionSet } from '@/types/submit';
import { QuestionPreview } from '@/components/features/submit/QuestionPreview';

interface ExportTemplateProps {
    questions: QuestionSet[];
}

export function ExportTemplate({ questions }: ExportTemplateProps) {
    return (
        <div id="printable-area" className="p-4 bg-white text-black w-[790px] mx-auto">
            {/* Part 1: Questions */}
            <div id="export-questions-section">
                <h1 className="text-3xl font-bold mb-8 text-center border-b pb-4">מבחן לדוגמה</h1>
                {questions.map((q, index) => {
                    const hasAsset = !!q.assetText || !!(q as any).assetImageUrl;
                    
                    return (
                        <div key={`param-group-${q.id}`}>
                            {/* First Item: Asset + First Question */}
                            <div 
                                className="export-question-item mb-8 pb-8 border-b border-gray-200"
                                data-break-after={q.questions.length > 1 ? "true" : "false"}
                            >
                                {hasAsset && (
                                    <div className="mb-6 w-full">
                                        <QuestionPreview
                                            formData={{
                                                ...q,
                                                assetText: q.assetText || '',
                                                assetFile: null
                                            }}
                                            isEnglish={q.category === 'english'}
                                            viewMode="asset_only"
                                            isExport={true}
                                        />
                                    </div>
                                )}

                                {/* Question 1 */}
                                {q.questions.length > 0 && (
                                    <div className="flex items-start gap-4">
                                        <span className="text-xl font-bold text-gray-500 min-w-[30px]">
                                            {q.questions.length > 1 ? `${index + 1}.1` : `${index + 1}.`}
                                        </span>
                                        <div className="flex-1">
                                            <QuestionPreview
                                                formData={{
                                                    ...q,
                                                    assetFile: null,
                                                    assetImageUrl: null,
                                                    assetText: '',
                                                    questions: [q.questions[0]]
                                                }}
                                                isEnglish={q.category === 'english'}
                                                hideCorrectAnswer={true}
                                                viewMode="question_only"
                                                isExport={true}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Remaining Questions - Each in their own block */}
                            {q.questions.length > 1 && q.questions.slice(1).map((subQ, subIndex) => (
                                <div 
                                    key={`subq-${q.id}-${subIndex + 1}`} 
                                    className="export-question-item mb-8 pb-8 border-b border-gray-200"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-xl font-bold text-gray-500 min-w-[30px]">
                                            {`${index + 1}.${subIndex + 2}`}
                                        </span>
                                        <div className="flex-1">
                                            <QuestionPreview
                                                formData={{
                                                    ...q,
                                                    assetFile: null,
                                                    assetImageUrl: null,
                                                    assetText: '',
                                                    questions: [subQ]
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
                    );
                })}
            </div>

            {/* Part 2: Answer Key - Will be captured as a separate block */}
            <div id="export-answers-section" className="mt-8">
                <h2 className="text-2xl font-bold mb-6 text-center border-b pb-2">מפתח תשובות</h2>
                <div id="export-answers-grid" className="grid grid-cols-5 gap-4 text-sm p-1">
                    {questions.flatMap((q, index) => 
                        q.questions.map((subQ, subIndex) => {
                            const label = q.questions.length > 1 ? `${index + 1}.${subIndex + 1}` : `${index + 1}`;
                            return (
                                <div key={`key-${q.id}-${subIndex}`} className="flex items-center justify-between p-2 border rounded bg-gray-50 page-break-inside-avoid shadow-sm print:shadow-none">
                                    <span className="font-bold text-gray-500">{label}</span>
                                    <span className="font-bold">({subQ.correctAnswer})</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Part 3: Explanations - Will be captured individually */}
            <div id="export-explanations-section" className="mt-12">
                <h2 className="text-2xl font-bold mb-8 text-center border-b pb-4">הסברים</h2>
                {questions.flatMap((q, index) => 
                    q.questions.map((subQ, subIndex) => {
                         const label = q.questions.length > 1 ? `${index + 1}.${subIndex + 1}` : `${index + 1}`;
                         return (
                            <div key={`expl-${q.id}-${subIndex}`} className="export-explanation-item mb-8 pb-8 border-b border-gray-100 page-break-inside-avoid">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center min-w-[40px]">
                                        <span className="text-lg font-bold text-gray-500">#{label}</span>
                                        <span className="text-xs text-gray-400">({subQ.correctAnswer})</span>
                                    </div>
                                    <div className="flex-1">
                                        <QuestionPreview
                                            formData={{
                                                ...q,
                                                assetFile: null,
                                                assetImageUrl: null,
                                                assetText: '',
                                                questions: [subQ]
                                            }}
                                            isEnglish={q.category === 'english'}
                                            hideCorrectAnswer={false} 
                                            viewMode="explanation_only"
                                            isExport={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
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

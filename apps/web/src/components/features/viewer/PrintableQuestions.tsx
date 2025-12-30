import React from 'react';
import { QuestionSet } from '@/types/submit';
import { QuestionPreview } from '@/components/features/submit/QuestionPreview';

interface PrintableQuestionsProps {
    questions: QuestionSet[];
}

export const PrintableQuestions = ({ questions }: PrintableQuestionsProps) => {
    return (
        <div id="printable-area" className="bg-white text-black p-8 w-[800px] mx-auto">


            <div className="flex flex-col gap-12">
                {questions.map((q) => {
                    const isEnglish = q.category === 'english';

                    return (
                        <div key={q.id} className="border-b border-gray-200 pb-8 mb-4 last:border-0 page-break-inside-avoid">
                            <QuestionPreview
                                formData={{
                                    category: q.category || '',
                                    subcategory: q.subcategory || '',
                                    topic: q.topic,
                                    assetFile: null,
                                    assetImageUrl: null,
                                    assetText: q.assetText || '',
                                    questions: q.questions || []
                                }}
                                isEnglish={isEnglish}
                                hideCorrectAnswer={true}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

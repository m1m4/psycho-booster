'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QuestionSetEditor } from '@/components/features/submit/QuestionSetEditor';
import { useQuery } from '@tanstack/react-query';
import { getQuestionSet } from '@/lib/firebase/db';

function SubmitPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const editId = searchParams.get('id');

    // Fetch the question set if we're in edit mode
    const { data: initialData, isLoading } = useQuery({
        queryKey: ['questionSet', editId],
        queryFn: () => editId ? getQuestionSet(editId) : null,
        enabled: !!editId,
    });

    const handleEditorSuccess = (newId: string) => {
        // Redirect to viewer after success
        router.push('/viewer');
    };

    if (editId && isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">טוען שאלה...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                {/* Header Navigation */}
                <div className="flex justify-between items-center mb-12" dir="rtl">
                    <h1 className="text-3xl font-bold">
                        {editId ? 'עריכת שאלה' : 'הוספת שאלה חדשה'}
                    </h1>

                </div>

                <div className="min-h-[500px]">
                    <QuestionSetEditor
                        initialData={initialData}
                        onSuccess={handleEditorSuccess}
                        key={editId || 'new'}
                    />
                </div>
            </main>
        </div>
    );
}

export default function SubmitPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        }>
            <SubmitPageContent />
        </Suspense>
    );
}

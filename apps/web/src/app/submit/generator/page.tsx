'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function GeneratorPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to submit page since generator is disabled
        router.push('/submit');
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-black dark:text-white">
            <div className="text-center space-y-4">
                <h1 className="text-2xl font-bold">המחולל אינו זמין כרגע</h1>
                <p className="text-gray-500">מעביר אותך לעורך...</p>
            </div>
        </div>
    );
}

'use client';

import React, { useEffect, useState } from 'react';
import { QuestionSet } from '@/types/submit';
import { ExportTemplate } from '@/components/features/viewer/ExportTemplate';

/**
 * Print Page - Dedicated page for PDF export via native print dialog.
 * 
 * This page receives question data from sessionStorage, renders the ExportTemplate,
 * waits for images to load, then triggers the native print dialog.
 * 
 * On iOS Safari, users can tap "Options" -> "PDF" to save as PDF.
 */
export default function PrintPage() {
    const [questions, setQuestions] = useState<QuestionSet[] | null>(null);
    const [status, setStatus] = useState<string>('טוען נתונים...');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // Retrieve questions from sessionStorage
        try {
            const data = sessionStorage.getItem('exportQuestions');
            if (!data) {
                setStatus('לא נמצאו שאלות לייצוא. נא לחזור ולנסות שוב.');
                return;
            }
            
            const parsed = JSON.parse(data) as QuestionSet[];
            setQuestions(parsed);
            setStatus(`נטענו ${parsed.length} שאלות. ממתין לטעינת תמונות...`);
            
            // Set document title with random code for unique filename
            const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
            document.title = `Psycho-Booster-Test-${randomCode}`;
        } catch (err) {
            console.error('Failed to parse export data:', err);
            setStatus('שגיאה בטעינת הנתונים.');
        }
    }, []);

    useEffect(() => {
        if (!questions || questions.length === 0) return;

        // Wait for all images to load before enabling print
        const waitForImages = async () => {
            // Give React time to render
            await new Promise(r => setTimeout(r, 500));

            const images = document.querySelectorAll('#print-content img');
            console.log(`Found ${images.length} images to wait for`);

            if (images.length === 0) {
                setReady(true);
                setStatus('מוכן להדפסה!');
                return;
            }

            let loaded = 0;
            const total = images.length;

            const checkComplete = () => {
                loaded++;
                setStatus(`טוען תמונות: ${loaded}/${total}`);
                if (loaded >= total) {
                    setReady(true);
                    setStatus('מוכן להדפסה!');
                }
            };

            images.forEach((img) => {
                const imgEl = img as HTMLImageElement;
                if (imgEl.complete && imgEl.naturalHeight !== 0) {
                    checkComplete();
                } else {
                    imgEl.onload = checkComplete;
                    imgEl.onerror = checkComplete;
                    // Timeout fallback
                    setTimeout(checkComplete, 10000);
                }
            });
        };

        waitForImages();
    }, [questions]);

    const handlePrint = () => {
        window.print();
    };

    if (!questions) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
                    <p className="text-gray-600 text-lg">{status}</p>
                    <button 
                        onClick={() => window.close()}
                        className="mt-4 text-blue-600 underline"
                    >
                        סגור חלון
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Control Bar - hidden when printing */}
            <div className="print:hidden sticky top-0 z-50 bg-blue-600 text-white p-4 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-lg">ייצוא שאלות</h1>
                        <p className="text-blue-100 text-sm">{status}</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handlePrint}
                            disabled={!ready}
                            className={`px-6 py-2 rounded-lg font-bold transition-all ${
                                ready 
                                    ? 'bg-white text-blue-600 hover:bg-blue-50' 
                                    : 'bg-blue-400 text-blue-200 cursor-not-allowed'
                            }`}
                        >
                            {ready ? '🖨️ הדפס / שמור כ-PDF' : 'ממתין...'}
                        </button>
                        <button
                            onClick={() => window.close()}
                            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-400 transition-all"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* Print Content - Using a narrower container that fits on A4 */}
            <div id="print-content" className="w-full max-w-[700px] mx-auto p-4 print:p-0 print:max-w-full print:w-full">
                <ExportTemplate questions={questions} />
            </div>

            {/* Print-specific styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    @page {
                        size: A4;
                        margin: 0; /* Hides browser default header/footer */
                    }
                    
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        margin: 0;
                        padding: 0;
                    }
                    
                    .print\\:hidden {
                        display: none !important;
                    }
                    
                    #print-content {
                        padding: 5mm 15mm 15mm 15mm !important; /* Minimal top margin */
                        max-width: none !important;
                        width: 100% !important;
                    }
                    
                    /* Ensure images print */
                    img {
                        max-width: 100% !important;
                        page-break-inside: avoid;
                    }
                    
                    /* Page break controls */
                    .export-question-item {
                        page-break-inside: avoid;
                    }
                    
                    .export-explanation-item {
                        page-break-inside: avoid;
                    }
                }
            `}} />
        </div>
    );
}

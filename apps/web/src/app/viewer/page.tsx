'use client';

import { QuestionsTable } from '@/components/features/viewer/QuestionsTable';
import { TesterManager } from '@/components/features/admin/TesterManager';
import { useState } from 'react';

export default function ViewerPage() {
    const [isTesterManagerOpen, setIsTesterManagerOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 text-black" dir="rtl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                
                {/* Collapsible Tester Manager */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <button
                        onClick={() => setIsTesterManagerOpen(!isTesterManagerOpen)}
                        className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                            <div className="text-right">
                                <h2 className="text-lg font-bold text-gray-900">ניהול בוחנים</h2>
                                <p className="text-sm text-gray-500">הוספה והסרה של הרשאות גישה לבוחנים</p>
                            </div>
                        </div>
                        <svg 
                            className={`w-6 h-6 text-gray-400 transition-transform duration-200 ${isTesterManagerOpen ? 'rotate-180' : ''}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    <div 
                        className={`transition-all duration-300 ease-in-out ${
                            isTesterManagerOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                        }`}
                    >
                        <div className="p-6 pt-0 border-t border-gray-100">
                             <TesterManager />
                        </div>
                    </div>
                </div>

                <QuestionsTable />
            </main>
        </div>
    );
}

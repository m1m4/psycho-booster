import { QuestionsTable } from '@/components/features/viewer/QuestionsTable';

export default function ViewerPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black text-black dark:text-white" dir="rtl">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <h1 className="text-xl font-bold">ניהול שאלות</h1>
                    <a
                        href="/"
                        className="text-sm text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                        חזרה לדף הבית
                    </a>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            צפייה בריכוז כל השאלות שהועלו למערכת
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            className="flex-1 md:flex-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:border-[#4169E1] hover:text-[#4169E1] transition-all shadow-sm flex items-center justify-center"
                            title="סינון"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </button>
                        <button
                            className="flex-1 md:flex-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3 rounded-xl text-gray-700 dark:text-gray-300 hover:border-[#4169E1] hover:text-[#4169E1] transition-all shadow-sm flex items-center justify-center"
                            title="עריכה"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                        <a
                            href="/submit"
                            className="flex-1 md:flex-none bg-[#4169E1] hover:bg-[#3151b5] text-white p-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center"
                            title="הוספת שאלה חדשה"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                        </a>
                    </div>
                </div>

                <QuestionsTable />
            </main>
        </div>
    );
}

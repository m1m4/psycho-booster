import { ActionCard } from '@/components/features/home/ActionCard';

/**
 * The root landing page for the application (Admin Dashboard).
 */
export default function Home() {
    return (
        <div className="min-h-screen bg-white" dir="rtl">
            <main className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-3xl mx-auto space-y-16">
                    <div className="text-center space-y-3">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black tracking-tight">
                            ברוכים הבאים
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
                            נהלו את מאגר השאלות של Psycho Booster בקלות ובמקום אחד
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <ActionCard
                            title="הוספה"
                            description="הוספת שאלות חדשות למאגר"
                            href="/submit"
                            icon={
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                            }
                        />

                        <ActionCard
                            title="תיבת דואר"
                            description="בדיקת שאלות ואישורים"
                            href="/inbox"
                            icon={
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            }
                        />

                        <ActionCard
                            title="אוטומציה"
                            description="מחולל שאלות (AI)"
                            href="/automation"
                            icon={
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                </svg>
                            }
                        />

                        <ActionCard
                            title="צפייה"
                            description="צפייה וניהול שאלות קיימות"
                            href="/viewer"
                            icon={
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            }
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

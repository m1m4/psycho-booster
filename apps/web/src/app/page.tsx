import { ActionCard } from '@/components/features/home/ActionCard';

/**
 * The root landing page for the application (Admin Dashboard).
 */
export default function Home() {
    return (
        <div className="min-h-screen bg-white dark:bg-black" dir="rtl">
            <main className="flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
                <div className="w-full max-w-3xl mx-auto space-y-16">
                    <div className="text-center space-y-3">
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black dark:text-white tracking-tight">
                            ברוכים הבאים
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 font-medium max-w-lg mx-auto leading-relaxed">
                            נהלו את מאגר השאלות של Psycho Booster בקלות ובמקום אחד
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

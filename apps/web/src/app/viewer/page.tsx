import { QuestionsTable } from '@/components/features/viewer/QuestionsTable';

export default function ViewerPage() {
    return (
        <div className="min-h-screen bg-gray-50 text-black" dir="rtl">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <QuestionsTable />
            </main>
        </div>
    );
}

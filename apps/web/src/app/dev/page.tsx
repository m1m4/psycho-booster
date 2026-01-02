import { DatabaseSeeder } from '@/components/features/dev/DatabaseSeeder';

export default function DevPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-8" dir="ltr">
            <div className="max-w-4xl mx-auto space-y-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Developer Tools</h1>

                <section>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700 dark:text-gray-300">Database Management</h2>
                    <DatabaseSeeder />
                </section>
            </div>
        </div>
    );
}

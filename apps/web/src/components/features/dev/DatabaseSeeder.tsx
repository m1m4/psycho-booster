'use client';

import React, { useState } from 'react';
import { saveQuestionSet, recalculateStatistics } from '@/lib/firebase/db';
import { QuestionSet } from '@/types/submit';
import { useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const SEED_CATEGORIES = ['verbal', 'quantitative', 'english'];
const SEED_SUBCATEGORIES_MAP: Record<string, string[]> = {
    verbal: ['analogies', 'reading_comprehension_verbal'],
    quantitative: ['algebra', 'geometry'],
    english: ['sentence_completions', 'reading_comprehension_eng']
};
const SEED_DIFFICULTIES = ['easy', 'medium', 'hard'];

export function DatabaseSeeder() {
    const queryClient = useQueryClient();
    const [isSeeding, setIsSeeding] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [`${new Date().toLocaleTimeString()}: ${msg}`, ...prev]);

    const handleSyncStats = async () => {
        setIsSyncing(true);
        addLog('Starting statistics verification...');
        try {
            const newStats = await recalculateStatistics();
            addLog(`Statistics synchronized! Total questions: ${newStats.totalQuestions}`);
        } catch (error) {
            console.error(error);
            addLog(`Error syncing: ${(error as Error).message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    const generateRandomQuestion = (): Omit<QuestionSet, 'id' | 'createdAt'> => {
        const category = SEED_CATEGORIES[Math.floor(Math.random() * SEED_CATEGORIES.length)];
        const subcategories = SEED_SUBCATEGORIES_MAP[category];
        const subcategory = subcategories[Math.floor(Math.random() * subcategories.length)];
        const difficulty = SEED_DIFFICULTIES[Math.floor(Math.random() * SEED_DIFFICULTIES.length)];
        const isSet = Math.random() > 0.8; // 20% chance of being a set

        return {
            category,
            subcategory,
            difficulty,
            topic: 'general',
            assetText: isSet ? 'This is a sample text for a question set.' : '', // Empty string instead of undefined
            assetImageUrl: null,
            questions: Array.from({ length: isSet ? 3 : 1 }).map((_, idx) => ({
                id: Date.now() + idx,
                difficulty,
                questionText: `This is a generated test question #${Math.floor(Math.random() * 1000)}`,
                questionImageUrl: null,
                answer1: 'Answer 1 (Correct)',
                answer1ImageUrl: null,
                answer2: 'Answer 2',
                answer2ImageUrl: null,
                answer3: 'Answer 3',
                answer3ImageUrl: null,
                answer4: 'Answer 4',
                answer4ImageUrl: null,
                correctAnswer: '1',
                explanation: 'This is a generated explanation.'
            })) as any, // Cast to any to bypass strict type check for mock data
            author: 'DatabaseSeeder',
            status: Math.random() > 0.5 ? 'pending' : (Math.random() > 0.5 ? 'initial' : 'approved'),
        };
    };

    const handleSeed = async (count: number) => {
        setIsSeeding(true);
        addLog(`Starting seed of ${count} items...`);
        try {
            for (let i = 0; i < count; i++) {
                const data = generateRandomQuestion();
                await saveQuestionSet(data as any);
                if (i % 5 === 0) addLog(`Seeded item ${i + 1}/${count}`);
            }
            queryClient.invalidateQueries({ queryKey: ['statistics'] });
            queryClient.invalidateQueries({ queryKey: ['questions'] });
            addLog('Seeding complete!');
        } catch (error) {
            console.error(error);
            addLog(`Error seeding: ${(error as Error).message}`);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleDeleteTestData = async () => {
        if (!confirm('Are you sure you want to delete all data created by DatabaseSeeder?')) return;

        setIsDeleting(true);
        addLog('Searching for test data...');

        try {
            const q = query(
                collection(db, "question_sets"),
                where("author", "==", "DatabaseSeeder")
            );

            const snapshot = await getDocs(q);
            addLog(`Found ${snapshot.size} test documents.`);

            if (snapshot.empty) {
                addLog('No test data found.');
                setIsDeleting(false);
                return;
            }

            const batch = writeBatch(db);
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            addLog(`Successfully deleted ${snapshot.size} documents.`);

        } catch (error) {
            console.error(error);
            addLog(`Error deleting: ${(error as Error).message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm max-w-lg mx-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Database Seeder</h2>

            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Generate Data</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleSeed(1)}
                            disabled={isSeeding || isDeleting}
                            className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 font-medium transition-colors"
                        >
                            +1
                        </button>
                        <button
                            onClick={() => handleSeed(10)}
                            disabled={isSeeding || isDeleting || isSyncing}
                            className="flex-1 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 font-medium transition-colors"
                        >
                            +10
                        </button>
                        <button
                            onClick={() => handleSeed(50)}
                            disabled={isSeeding || isDeleting || isSyncing}
                            className="flex-1 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 disabled:opacity-50 font-medium transition-colors"
                        >
                            +50
                        </button>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                    <button
                        onClick={handleSyncStats}
                        disabled={isSeeding || isDeleting || isSyncing}
                        className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {isSyncing ? 'Syncing...' : 'Verify & Fix Stats'}
                    </button>

                    <p className="text-[10px] text-gray-400 text-center italic">Recalculates stats from all documents in the database</p>

                    <button
                        onClick={handleDeleteTestData}
                        disabled={isSeeding || isDeleting || isSyncing}
                        className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 font-medium transition-colors flex items-center justify-center gap-2"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete All Test Data'}
                    </button>
                </div>
            </div>

            <div className="bg-gray-100 dark:bg-gray-950 p-4 rounded-lg h-60 overflow-y-auto text-xs font-mono border border-gray-200 dark:border-gray-800 custom-scrollbar">
                {log.length === 0 ? (
                    <span className="text-gray-400 italic">Ready.</span>
                ) : (
                    log.map((entry, i) => <div key={i} className="mb-1 text-gray-700 dark:text-gray-300 border-b border-gray-200/50 pb-1 last:border-0">{entry}</div>)
                )}
            </div>
        </div>
    );
}

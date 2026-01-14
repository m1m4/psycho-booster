'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getPaginatedQuestions, getQuestionSet } from '@/lib/firebase/db';
import { QuestionSet, TOPIC_OPTIONS } from '@/types/submit';
import { ExamFilters } from './SelectionScreen';
import { QuestionCard } from './QuestionCard';
import { SummaryScreen } from './SummaryScreen';
import { QuestionSetEditor } from '../submit/QuestionSetEditor';

interface ExamManagerProps {
    filters: ExamFilters;
    onExit: () => void;
}

export function ExamManager({ filters, onExit }: ExamManagerProps) {
    const [loading, setLoading] = useState(true);
    const [questions, setQuestions] = useState<any[]>([]); // Flattened questions
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({}); // qId -> answerIndex
    const [isFinished, setIsFinished] = useState(false);
    
    // Editor State
    const [editingData, setEditingData] = useState<Partial<QuestionSet> | null>(null);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [loadingEditor, setLoadingEditor] = useState(false);

    // Timer State
    const [timeLeft, setTimeLeft] = useState<number>(
        filters.timeLimit === 'unlimited' ? 0 : (filters.timeLimit as number) * 60
    );

    // Timer Effect
    useEffect(() => {
        if (filters.timeLimit === 'unlimited' || isFinished || loading) return;

        if (timeLeft <= 0) {
            setIsFinished(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setIsFinished(true); // Auto submit
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [filters.timeLimit, isFinished, loading, timeLeft]);

    // Fetch questions on mount
    useEffect(() => {
        let isMounted = true;
        
        async function fetchQuestions() {
            try {
                // Prepare filters for DB
                // DB only supports 'in' with max 10 items and singular fields usually.
                // Our getPaginatedQuestions handles 'in' array for subcategory/topic.
                // But it logically ANDs them. 
                
                const dbFilters: any = {};

                if (filters.categories.length === 1) dbFilters.category = filters.categories[0];
                if (filters.subcategories.length > 0) dbFilters.subcategory = filters.subcategories;
                // Remove strict topic filtering from DB to allow mixed selections (Union logic)
                // if (filters.topics.length > 0) dbFilters.topic = filters.topics; 
                
                if (filters.difficulties.length === 1) dbFilters.difficulty = filters.difficulties[0];
                


                
                // Note: If multiple categories/difficulties are selected, but DB function only supports single value or specific 'in' logic, 
                // we might need to do client side filtering or multiple queries. 
                // Current `db.ts` implementation allows `subcategory` and `topic` to be arrays (using `where('...', 'in', ...)`)
                // It does NOT seem to support array for 'category' or 'difficulty' in the snippet I read (lines 311, 327 use '==').
                // Only subcategory/topic check `Array.isArray`.
                
                // LIMITATION: 'in' operator can be used only once per query in Firestore usually (or limited combination).
                // If we need complex OR logic across fields, we might need multiple queries.
                // For this MVP "Skeleton", let's attempt best effort or fetch wider and filter.
                
                const { questions: sets } = await getPaginatedQuestions(
                    200, // Fetch more than needed to shuffle/filter
                    null,
                    'createdAt',
                    'desc',
                    dbFilters
                );
                
                if (!isMounted) return;

                // Flatten sets to questions
                let allQuestions = sets.flatMap(set => set.questions.map((q, idx) => ({
                    ...q,
                    // Synthesize a unique ID if missing or duplicate
                    id: q.id || `${set.id}_${idx}`, 
                    _parentId: set.id,
                    _originalIndex: idx,
                    // Inject generic difficulty if missing on question but present on set
                    difficulty: q.difficulty || set.difficulty
                })));

                // Client-side filtering for Multi-select Category/Difficulty if DB didn't handle it
                if (filters.categories.length > 1) {
                     // Since we didn't pass category to DB if > 1, we filter here
                     // But wait, we query sets. Sets have category.
                     // Filter sets that match ANY of the categories
                     // Since we didn't filter by category in DB, we surely got mixed or we need to refine.
                     // Actually, if we didn't pass category, we got all. so we must filter.
                     // Wait, sets are the source.
                     const allowedCats = new Set(filters.categories);
                     allQuestions = allQuestions.filter(q => {
                         // We need the Set's category. 
                         // To do this efficiently, we should filter the Sets before flattening.
                         // But I already flattened. Let's filter Sets first.
                         return true; // placeholder
                     });
                }
                
                // Re-do Flattening with filtering
                const validSets = sets.filter(set => {
                    // Filter Category
                    if (filters.categories.length > 0 && !filters.categories.includes(set.category)) return false;
                    // Filter Difficulty
                    if (filters.difficulties.length > 0 && !filters.difficulties.includes(set.difficulty)) return false;
                    
                    // Smart Topic Filtering
                    // If the user selected ANY topics relevant to this set's subcategory, strict filtering applies.
                    // If the user selected NO topics for this subcategory (but maybe for others), we show all questions in this subcategory.
                    const subcategoryTopics = TOPIC_OPTIONS[set.subcategory]?.map(t => t.value) || [];
                    const userSelectedTopicsForThisSub = filters.topics.filter(t => subcategoryTopics.includes(t));
                    
                    if (userSelectedTopicsForThisSub.length > 0) {
                        // User wants specific topics for this subcategory
                        if (!set.topic || !userSelectedTopicsForThisSub.includes(set.topic)) {
                            return false;
                        }
                    }

                    return true;
                });

                // Shuffle Sets (Preserve internal order of questions within a set)
                const shuffledSets = validSets.sort(() => Math.random() - 0.5);

                const flatQuestions = shuffledSets.flatMap(set => set.questions.map((q, idx) => ({
                     ...q,
                     id: q.id || `${set.id}_${idx}`,
                     _parentId: set.id,
                     _originalIndex: idx,
                     // Inject Shared Assets
                     assetText: set.assetText,
                     assetImageUrl: set.assetImageUrl,
                     difficulty: q.difficulty || set.difficulty // Fallback
                })));

                // Apply Limit
                let finalQuestions = flatQuestions;
                if (filters.limit !== 'all') {
                    finalQuestions = flatQuestions.slice(0, filters.limit);
                }

                setQuestions(finalQuestions);
            } catch (err) {
                console.error("Failed to fetch questions", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        }

        fetchQuestions();
        return () => { isMounted = false; };
    }, [filters]);


    const handleAnswer = (idx: number) => {
        const currentQ = questions[currentIndex];
        // Only allow answering once
        if (answers[currentQ.id] !== undefined) return;

        setAnswers(prev => ({
            ...prev,
            [currentQ.id]: idx
        }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setIsFinished(true);
        }
    };
    
    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleEditClick = async () => {
        const currentQ = questions[currentIndex];
        if (!currentQ._parentId) return;

        setLoadingEditor(true);
        try {
            const data = await getQuestionSet(currentQ._parentId);
            if (data) {
                setEditingData(data);
                setIsEditorOpen(true);
            }
        } catch (error) {
            console.error("Failed to fetch question set for editing", error);
            alert("שגיאה בטעינת השאלה לעריכה");
        } finally {
            setLoadingEditor(false);
        }
    };

    const handleEditSuccess = async (updatedId: string) => {
        // Fetch updated data to refresh the view
        try {
            const updatedSet = await getQuestionSet(updatedId);
            if (updatedSet) {
                 setQuestions(prevQuestions => {
                    return prevQuestions.map(q => {
                        if (q._parentId === updatedId) {
                            // Match by original index in the set
                            // This assumes the user didn't reorder or delete questions in the editor (which might shift indices).
                            // But usually users just edit text. If they deleted, we might index out of bounds.
                            
                            const idx = q._originalIndex;
                            if (idx !== undefined && idx >= 0 && idx < updatedSet.questions.length) {
                                const newQ = updatedSet.questions[idx];
                                return {
                                    ...newQ,
                                    id: q.id, // Keep execution ID (or we could update it, but keeping it ensures state consistency for `answers`)
                                               // Actually, if we keep old ID, next answer logic might be fine, but if ID was synthesised?
                                               // If the user answers, we track by ID. If we update content, ID can stay same for UI consistency.
                                    _parentId: updatedId,
                                    _originalIndex: idx, 
                                    difficulty: newQ.difficulty || updatedSet.difficulty
                                };
                            }
                        }
                        return q;
                    });
                 });
                 
                 // Also update current editing data if we were to keep modal open, but we close it.
            }
        } catch (error) {
            console.error("Failed to refresh question after edit", error);
        }
        
        setIsEditorOpen(false);
        setEditingData(null);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-medium">טוען שאלות...</p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="text-center py-20 px-4">
                <h3 className="text-xl font-bold text-gray-900 mb-2">לא נמצאו שאלות</h3>
                <p className="text-gray-500 mb-8">נסו לשנות את אפשרויות הסינון</p>
                <button 
                    onClick={onExit}
                    className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                    חזרה למסך הבחירה
                </button>
            </div>
        );
    }

    if (isFinished) {
        const correctCount = questions.reduce((acc, q) => {
            const userAnswer = answers[q.id];
            if (userAnswer !== undefined && String(userAnswer) === String(q.correctAnswer)) {
                return acc + 1;
            }
            return acc;
        }, 0);

        return (
            <SummaryScreen 
                results={{
                    totalQuestions: questions.length,
                    correctCount,
                    answers,
                    questions
                }}
                onRestart={onExit}
                onHome={() => window.location.href = '/'}
            />
        );
    }

    const currentQ = questions[currentIndex];
    const isAnswered = answers[currentQ.id] !== undefined;
    const progress = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
        <div className="space-y-6">
            {/* Header / Progress */}
            <div className="flex items-center justify-between px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
                 <button 
                    onClick={onExit}
                    className="text-sm text-gray-500 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100"
                >
                    יציאה
                </button>
                <div className="flex flex-col items-center justify-center min-w-[100px]">
                    {filters.timeLimit !== 'unlimited' && (
                        <div className={`text-xl font-bold font-mono leading-none mb-0.5 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{(timeLeft % 60).toString().padStart(2, '0')}
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-400 uppercase tracking-wider">
                        <span>שאלה</span>
                        <span className="text-gray-900">{currentIndex + 1}</span>
                        <span>/</span>
                        <span>{questions.length}</span>
                    </div>
                </div>
                <div className="w-20 flex justify-end">
                    <button
                        onClick={handleEditClick}
                        disabled={loadingEditor}
                        className="text-sm text-blue-600 hover:text-blue-800 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-1 disabled:opacity-50"
                        title="עריכה"
                    >
                        {loadingEditor ? (
                            <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <>
                                <span className="hidden sm:inline">עריכה</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden" dir="ltr">
                <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Card */}
            <QuestionCard 
                key={currentQ.id} // Reset state on change
                question={currentQ}
                selectedAnswer={answers[currentQ.id] ?? null}
                onSelectAnswer={handleAnswer}
                showExplanation={isAnswered}
                isEnglish={filters.categories.includes('english')} 
                assetText={currentQ.assetText}
                assetImageUrl={currentQ.assetImageUrl}
            />

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 px-4 pb-20 md:pb-0">
                <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`px-6 py-2 rounded-lg font-bold transition-all ${
                        currentIndex === 0
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                >
                    הקודם
                </button>

                {isAnswered && (
                     <button
                        onClick={handleNext}
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                    >
                        {currentIndex === questions.length - 1 ? 'סיים בוחן' : 'השאלה הבאה'}
                    </button>
                )}
            </div>

            {/* Edit Modal */}
            {isEditorOpen && editingData && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 overflow-hidden">
                    <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-h-[90vh] sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-w-5xl overflow-hidden transition-all duration-300 transform translate-y-0">
                        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-white z-10">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900">עריכת שאלה</h2>
                            <button 
                                onClick={() => {
                                    setIsEditorOpen(false);
                                    setEditingData(null);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <QuestionSetEditor 
                                initialData={editingData}
                                onSuccess={handleEditSuccess}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

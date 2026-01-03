'use client';

import React, { useState, useEffect } from 'react';
import { QuestionItem, DEFAULT_QUESTION, QuestionSet, SUBCATEGORY_OPTIONS } from '@/types/submit';
import { QuestionMetadata } from '@/components/features/submit/QuestionMetadata';
import { SharedAsset } from '@/components/features/submit/SharedAsset';
import { QuestionTabs } from '@/components/features/submit/QuestionTabs';
import { SingleQuestionForm } from '@/components/features/submit/SingleQuestionForm';
import { QuestionModal } from '@/components/features/submit/QuestionModal';
import { uploadFile } from '@/lib/firebase/upload';
import { saveQuestionSet, updateQuestionSet, getUserApiKey, saveUserApiKey, getGlobalPrompts, saveGlobalPrompts } from '@/lib/firebase/db';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { compressImage } from '@/lib/utils/image-compression';
import { AIControlPanel } from '@/components/features/submit/AI/AIControlPanel';
import { generateQuestions } from '@/lib/ai/gemini';
import { Toast } from '@/components/ui/Toast';
import { ImportModal } from '@/components/features/submit/ImportModal';

interface QuestionSetEditorProps {
    initialData?: Partial<QuestionSet> | null;
    onSuccess?: (id: string) => void;
}

interface FormDataState {
    category: string;
    subcategory: string;
    topic: string;
    difficulty: string;
    assetFile: File | null;
    assetImageUrl?: string | null;
    assetText: string;
    questions: QuestionItem[];
    [key: string]: any;
}

const DRAFT_KEY = 'psycho_booster_submit_draft';

const cleanForStorage = (data: any): any => {
    if (typeof window !== 'undefined' && data instanceof File) return null;
    if (Array.isArray(data)) return data.map(cleanForStorage);
    if (data !== null && typeof data === 'object') {
        const obj: any = {};
        for (const key in data) {
            // Skip large objects or circular refs if any (none expected here)
            obj[key] = cleanForStorage(data[key]);
        }
        return obj;
    }
    return data;
};

export function QuestionSetEditor({ initialData, onSuccess }: QuestionSetEditorProps) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [formData, setFormData] = useState<FormDataState>(() => {
        // 1. If we have initialData (Edit mode), use it
        if (initialData) {
            return {
                category: initialData?.category || '',
                subcategory: initialData?.subcategory || '',
                topic: initialData?.topic || '',
                difficulty: initialData?.difficulty || '',
                assetFile: null,
                assetText: initialData?.assetText || '',
                ...(initialData as any),
                questions: (initialData?.questions && initialData.questions.length > 0
                    ? initialData.questions.map((q: any) => ({
                        ...q,
                        questionImage: q.questionImage || q.questionImageUrl || null,
                        answer1Image: q.answer1Image || q.answer1ImageUrl || null,
                        answer2Image: q.answer2Image || q.answer2ImageUrl || null,
                        answer3Image: q.answer3Image || q.answer3ImageUrl || null,
                        answer4Image: q.answer4Image || q.answer4ImageUrl || null,
                    }))
                    : [DEFAULT_QUESTION]) as QuestionItem[]
            };
        }

        // 2. If no initialData (Creation mode), check for draft in localStorage
        if (typeof window !== 'undefined') {
            const savedDraft = localStorage.getItem(DRAFT_KEY);
            if (savedDraft) {
                try {
                    const parsed = JSON.parse(savedDraft);
                    if (parsed && typeof parsed === 'object') {
                        return {
                            ...parsed,
                            assetFile: null,
                            questions: parsed.questions?.map((q: any) => ({
                                ...q,
                                questionImage: typeof q.questionImage === 'string' ? q.questionImage : null,
                                answer1Image: typeof q.answer1Image === 'string' ? q.answer1Image : null,
                                answer2Image: typeof q.answer2Image === 'string' ? q.answer2Image : null,
                                answer3Image: typeof q.answer3Image === 'string' ? q.answer3Image : null,
                                answer4Image: typeof q.answer4Image === 'string' ? q.answer4Image : null,
                            })) || [DEFAULT_QUESTION]
                        };
                    }
                } catch (e) {
                    console.error('Failed to parse draft from localStorage:', e);
                }
            }
        }

        // 3. Default state if no initialData and no draft
        return {
            category: '',
            subcategory: '',
            topic: '',
            difficulty: '',
            assetFile: null,
            assetText: '',
            questions: [DEFAULT_QUESTION]
        };
    });

    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // AI State
    const [aiApiKey, setAiApiKey] = useState('');
    const [globalPrompts, setGlobalPrompts] = useState({ base_prompt: '', categories: {} });
    const [aiModel, setAiModel] = useState('gemini-3-flash-preview');
    const [isGenerating, setIsGenerating] = useState(false);

    // Load AI model from local storage on mount
    useEffect(() => {
        const savedModel = localStorage.getItem('ai_model_preference');
        if (savedModel) {
            setAiModel(savedModel);
        }
    }, []);

    const handleSaveAiModel = (model: string) => {
        setAiModel(model);
        localStorage.setItem('ai_model_preference', model);
    };

    // Save draft to local storage when formData changes (Creation Mode Only)
    // Debounced to avoid excessive writes during typing
    useEffect(() => {
        if (!initialData) {
            const timer = setTimeout(() => {
                const cleanData = cleanForStorage(formData);
                localStorage.setItem(DRAFT_KEY, JSON.stringify(cleanData));
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [formData, initialData]);

    // Fetch user preferences and prompts
    useEffect(() => {
        if (user?.email) {
            getUserApiKey(user.email).then(key => {
                if (key) setAiApiKey(key);
            });
        }
        getGlobalPrompts().then(prompts => {
            if (prompts) setGlobalPrompts(prompts as any);
        });
    }, [user?.email]);

    const handleSaveApiKey = async (key: string) => {
        if (user?.email) {
            await saveUserApiKey(user.email, key);
            setAiApiKey(key);
        }
    };

    const handleSaveGlobalPrompts = async (prompts: any) => {
        await saveGlobalPrompts(prompts);
        setGlobalPrompts(prompts);
    };

    const handleGenerate = async (instructions: string) => {
        if (!aiApiKey) {
            alert("No API Key found. Please configure it in settings.");
            return;
        }

        setIsGenerating(true);
        try {
            // Determine relevant context prompt key
            let contextKey = formData.category;
            if (formData.subcategory) contextKey += `_${formData.subcategory}`;
            if (formData.topic && formData.category === 'quantitative') contextKey += `_${formData.topic}`;

            const basePrompt = globalPrompts.base_prompt || '';

            // Check if we are in refinement mode (matching AIControlPanel logic)
            const isRefinementMode = formData.questions.length > 1 || (
                formData.questions.length === 1 && (
                    !!formData.questions[0].questionText ||
                    !!formData.questions[0].answer1 ||
                    !!formData.questions[0].answer2
                )
            );

            const generatedQuestions = await generateQuestions({
                apiKey: aiApiKey,
                instructions: '', // ignored when fullPrompt is present
                basePrompt: globalPrompts.base_prompt,
                contextPrompt: '', // ignored
                category: formData.category,
                subcategory: formData.subcategory,
                topic: formData.topic,
                model: aiModel,
                fullPrompt: instructions, // instructions argument here is actually the full prompt from AIControlPanel
                currentQuestions: isRefinementMode ? formData.questions : undefined
            });

            // Merge questions logic
            setFormData(prev => {
                // If in refinement mode, the generatedQuestions array IS the new state (merged in gemini.ts)
                if (isRefinementMode) {
                    return { ...prev, questions: generatedQuestions };
                }

                // Creation Mode Logic (Append or Replace Default)
                const currentQuestions = prev.questions;
                const isOnlyDefault = currentQuestions.length === 1 &&
                    !currentQuestions[0].questionText &&
                    !currentQuestions[0].answer1;

                let newQuestions;
                if (isOnlyDefault) {
                    newQuestions = generatedQuestions;
                } else {
                    // Update IDs to continue from current count
                    const startId = currentQuestions.length + 1;
                    const reindexedGenerated = generatedQuestions.map((q, i) => ({
                        ...q,
                        id: startId + i
                    }));
                    newQuestions = [...currentQuestions, ...reindexedGenerated];
                }

                return { ...prev, questions: newQuestions };
            });

            // Ensure first question is active if we replaced
            if (formData.questions.length <= 1) {
                setActiveQuestionIndex(0);
            }

        } catch (error: any) {
            console.error("Generation error:", error);
            const msg = error.message || "Failed to generate questions.";
            setErrorMessage(msg.includes("parse") ? "Error: AI response format invalid. Try refining your prompt." : msg);
        } finally {
            setIsGenerating(false);
        }
    };

    useEffect(() => {
        if (initialData) {
            // Transform SavedQuestionItem[] to QuestionItem[]
            const mappedQuestions = (initialData.questions || []).map((q: any) => ({
                ...q,
                questionImage: q.questionImage || q.questionImageUrl || null,
                answer1Image: q.answer1Image || q.answer1ImageUrl || null,
                answer2Image: q.answer2Image || q.answer2ImageUrl || null,
                answer3Image: q.answer3Image || q.answer3ImageUrl || null,
                answer4Image: q.answer4Image || q.answer4ImageUrl || null,
            })) as QuestionItem[];

            // Infer difficulty from first question if missing at top level (legacy support)
            let inferredDifficulty = initialData.difficulty || '';
            if (!inferredDifficulty && mappedQuestions.length > 0 && mappedQuestions[0].difficulty) {
                inferredDifficulty = mappedQuestions[0].difficulty;
            }

            setFormData(prev => ({
                ...prev,
                ...initialData,
                difficulty: inferredDifficulty,
                questions: mappedQuestions
            }));
        }
    }, [initialData]);


    const isEnglish = formData.category === 'english';
    const isChartInference = formData.subcategory === 'chart_inference';
    const isReadingComprehension =
        formData.subcategory === 'reading_comprehension_verbal' ||
        formData.subcategory === 'reading_comprehension_eng';

    const isQuestionSet = isChartInference || isReadingComprehension;

    useEffect(() => {
        if (activeQuestionIndex >= formData.questions.length) {
            setActiveQuestionIndex(0);
        }
    }, [formData.questions.length, activeQuestionIndex]);

    useEffect(() => {
        if (isQuestionSet && formData.questions.length === 1 && !initialData) { // Only auto-expand if not editing
            setFormData(prev => ({
                ...prev,
                questions: [
                    { ...DEFAULT_QUESTION, id: 1 },
                    { ...DEFAULT_QUESTION, id: 2 },
                    { ...DEFAULT_QUESTION, id: 3 }
                ]
            }));
        } else if (!isQuestionSet && formData.questions.length > 1 && !initialData) {
            // Only auto-collapse if not editing
            setFormData(prev => ({
                ...prev,
                questions: [{ ...prev.questions[0], id: 1 }]
            }));
        }
    }, [isQuestionSet, formData.questions.length, initialData]);

    const handleMetadataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const newState = { ...prev, [name]: value };

            // If it's a single question and we're changing the top-level difficulty, sync with question
            if (name === 'difficulty' && !isQuestionSet) {
                newState.questions = prev.questions.map((q, idx) =>
                    idx === 0 ? { ...q, difficulty: value } : q
                );
            }

            return newState;
        });
    };

    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            category: value,
            subcategory: '',
            topic: '',
            // Clear questions and reset to default to avoid carryover logic issues
            questions: [DEFAULT_QUESTION]
        }));
        setActiveQuestionIndex(0);
    };

    const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, subcategory: e.target.value, topic: '' }));
        setActiveQuestionIndex(0);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                const compressed = await compressImage(e.target.files[0]);
                setFormData((prev) => ({ ...prev, assetFile: compressed }));
            } catch (error) {
                console.error("Compression failed:", error);
                // Fallback to original if compression fails
                setFormData((prev) => ({ ...prev, assetFile: e.target.files![0] }));
            }
        }
    };

    const handleQuestionChange = (field: keyof QuestionItem, value: any) => {
        setFormData(prev => {
            const newQuestions = [...prev.questions];
            const currentQ = { ...newQuestions[activeQuestionIndex] };

            if (typeof value === 'string' && value.length > 0) {
                if (field === 'answer1' || field === 'answer2' || field === 'answer3' || field === 'answer4') {
                    const imgField = `${field}Image` as keyof QuestionItem;
                    (currentQ as any)[imgField] = null;
                }
            }

            (currentQ as any)[field] = value;
            newQuestions[activeQuestionIndex] = currentQ;
            return { ...prev, questions: newQuestions };
        });
    };

    const handleImageChange = async (field: keyof QuestionItem, file: File | null) => {
        let finalFile = file;

        if (file) {
            try {
                finalFile = await compressImage(file);
            } catch (error) {
                console.error("Compression failed:", error);
            }
        }

        setFormData(prev => {
            const newQuestions = [...prev.questions];
            const currentQ = { ...newQuestions[activeQuestionIndex] };

            if (finalFile && (field === 'answer1Image' || field === 'answer2Image' || field === 'answer3Image' || field === 'answer4Image')) {
                const textField = field.replace('Image', '') as keyof QuestionItem;
                (currentQ as any)[textField] = '';
            }

            (currentQ as any)[field] = finalFile;
            newQuestions[activeQuestionIndex] = currentQ;
            return { ...prev, questions: newQuestions };
        });
    };

    const handleSliderChange = (count: number) => {
        setFormData(prev => {
            const currentCount = prev.questions.length;
            let newQuestions = [...prev.questions];

            if (count > currentCount) {
                for (let i = currentCount; i < count; i++) {
                    newQuestions.push({ ...DEFAULT_QUESTION, id: i + 1 });
                }
            } else if (count < currentCount) {
                newQuestions = newQuestions.slice(0, count);
            }

            return { ...prev, questions: newQuestions };
        });
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate
        if (!validateForm()) {
            // Scroll to error
            const firstError = document.querySelector('[class*="border-red-500"]');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        // Open preview
        setIsPreviewOpen(true);
    };

    const validateForm = () => {
        const errors: Record<string, boolean> = {};
        let firstErrorId = '';

        const setError = (id: string, qIdx?: number) => {
            errors[id] = true;
            console.log(`Validation error: ${id} at index ${qIdx}`); // Debugging
            if (!firstErrorId) {
                firstErrorId = id;
                if (qIdx !== undefined) {
                    setActiveQuestionIndex(qIdx);
                }
            }
        };

        if (!formData.category) setError('category-select');
        if (!formData.subcategory) setError('subcategory-select');
        if (!formData.difficulty) setError('difficulty-select');
        if (formData.category === 'quantitative' && !formData.topic && formData.subcategory !== 'chart_inference') {
            setError('topic-select');
        }

        if (isReadingComprehension && !formData.assetText) setError('asset-text');
        if (isChartInference && !formData.assetFile && !formData.assetImageUrl) setError('asset-file-container'); // Allow if URL exists

        formData.questions.forEach((q, idx) => {
            const prefix = `q${idx}`;
            if (!q.difficulty) setError(`${prefix}-difficulty`, idx);
            if (!q.questionText) setError(`${prefix}-text`, idx);

            const hasAns1 = q.answer1 || q.answer1Image || (q as any).answer1ImageUrl;
            if (!hasAns1) setError(`${prefix}-ans1`, idx);

            const hasAns2 = q.answer2 || q.answer2Image || (q as any).answer2ImageUrl;
            if (!hasAns2) setError(`${prefix}-ans2`, idx);

            const hasAns3 = q.answer3 || q.answer3Image || (q as any).answer3ImageUrl;
            if (!hasAns3) setError(`${prefix}-ans3`, idx);

            const hasAns4 = q.answer4 || q.answer4Image || (q as any).answer4ImageUrl;
            if (!hasAns4) setError(`${prefix}-ans4`, idx);

            if (!q.correctAnswer) setError(`${prefix}-correct-container`, idx);
            if (!q.explanation) setError(`${prefix}-explanation`, idx);
        });

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);

            setTimeout(() => {
                const element = document.getElementById(firstErrorId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 50);

            setTimeout(() => {
                setFormErrors({});
            }, 3000);

            return false;
        }
        return true;
    };

    const handleConfirmSubmit = async () => {
        setLoading(true);
        const submissionId = Date.now().toString();

        try {
            // Upload Asset File if exists
            let assetImageUrl = (formData as any).assetImageUrl || ''; // Keep existing URL if valid
            if (formData.assetFile) {
                const ext = formData.assetFile.name.split('.').pop();
                const path = `uploads/${submissionId}/asset.${ext}`;
                assetImageUrl = await uploadFile(formData.assetFile, path);
            }

            // Process Questions in parallel
            const processedQuestions = await Promise.all(formData.questions.map(async (q, idx) => {
                const qPrefix = `uploads/${submissionId}/q${idx}`;

                // Helper to upload if file exists
                const uploadIfFile = async (file: File | string | null, suffix: string) => {
                    if (!file || typeof file === 'string') return null;
                    const ext = file.name.split('.').pop();
                    return await uploadFile(file, `${qPrefix}_${suffix}.${ext}`);
                };

                const [qImg, a1Img, a2Img, a3Img, a4Img] = await Promise.all([
                    uploadIfFile(q.questionImage, 'question'),
                    uploadIfFile(q.answer1Image, 'ans1'),
                    uploadIfFile(q.answer2Image, 'ans2'),
                    uploadIfFile(q.answer3Image, 'ans3'),
                    uploadIfFile(q.answer4Image, 'ans4'),
                ]);

                return {
                    id: parseInt(submissionId) + idx,
                    difficulty: q.difficulty,
                    questionText: q.questionText,
                    questionImageUrl: qImg || (q as any).questionImageUrl || null,
                    answer1: q.answer1,
                    answer1ImageUrl: a1Img || (q as any).answer1ImageUrl || null,
                    answer2: q.answer2,
                    answer2ImageUrl: a2Img || (q as any).answer2ImageUrl || null,
                    answer3: q.answer3,
                    answer3ImageUrl: a3Img || (q as any).answer3ImageUrl || null,
                    answer4: q.answer4,
                    answer4ImageUrl: a4Img || (q as any).answer4ImageUrl || null,
                    correctAnswer: q.correctAnswer,
                    answersMode: q.answersMode,
                    explanation: q.explanation,
                };
            }));

            const overallDifficulty = formData.difficulty;

            // Determine Author - Preserve original author unless it's 'unknown' or 'AI'
            let authorName = 'unknown';
            const originalAuthor = initialData?.author;

            if (originalAuthor && originalAuthor !== 'unknown' && originalAuthor !== 'AI') {
                authorName = originalAuthor;
            } else if (user?.email) {
                // Set to current user if original is unknown/AI or it's a new question
                authorName = user.email.split('@')[0];
            } else if (originalAuthor) {
                // Fallback to original if no current user (unlikely but safe)
                authorName = originalAuthor;
            }

            // Determine Status
            let status: QuestionSet['status'] = 'pending';
            if (initialData && initialData.id && initialData.id !== 'new') {
                if (initialData.status === 'pending') {
                    const currentUserAuthorName = user?.email?.split('@')[0];
                    // Trigger initial review if:
                    // 1. Someone else edits it (preserving the original author)
                    // 2. Someone takes ownership of an 'unknown' or 'AI' question
                    const isOtherUser = currentUserAuthorName && authorName !== currentUserAuthorName;
                    const wasAutoAuthor = initialData.author === 'unknown' || initialData.author === 'AI';

                    if (isOtherUser || wasAutoAuthor) {
                        status = 'initial';
                    }
                } else if (initialData.status) {
                    status = initialData.status;
                }
            }

            const finalData = {
                category: formData.category,
                subcategory: formData.subcategory,
                topic: formData.topic,
                difficulty: formData.difficulty,
                assetText: formData.assetText,
                assetImageUrl: assetImageUrl || null,
                questions: processedQuestions,
                author: authorName,
                status: status,
            };

            let newId = '';

            if (initialData && initialData.id && initialData.id !== 'new') {
                // UPDATE Mode
                newId = initialData.id;
                const updateData = {
                    ...finalData,
                };

                await updateQuestionSet(newId, updateData);
                console.log('Form Updated', { ...updateData, id: newId });
            } else {
                // CREATE Mode
                newId = await saveQuestionSet(finalData);
                console.log('Form Submitted to Firebase', { ...finalData, id: newId });
            }

            // Ensure cache is updated before navigating
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ['statistics'] }),
                queryClient.invalidateQueries({ queryKey: ['questions'] }),
                queryClient.invalidateQueries({ queryKey: ['inboxCount'] })
            ]);

            // Close modal first to ensure clean state
            setIsPreviewOpen(false);

            if (onSuccess) {
                onSuccess(newId);
            }

            if (!initialData) {
                // Creation Mode: Reset form but keep metadata, and show success message
                setFormData(prev => {
                    // Re-calculate isQuestionSet based on preserved subcategory
                    const isChart = prev.subcategory === 'chart_inference';
                    const isReading = prev.subcategory === 'reading_comprehension_verbal' || prev.subcategory === 'reading_comprehension_eng';
                    const isSet = isChart || isReading;

                    return {
                        ...prev,
                        assetFile: null,
                        assetText: '',
                        assetImageUrl: null, // Clear uploaded asset url
                        questions: [{
                            ...DEFAULT_QUESTION,
                            // If it's a single question, apply the preserved difficulty immediately
                            difficulty: !isSet ? prev.difficulty : DEFAULT_QUESTION.difficulty
                        }],
                    };
                });
                setActiveQuestionIndex(0);

                const message = formData.category === 'english'
                    ? 'Question set submitted successfully! Form reset.'
                    : 'השאלה נשמרה בהצלחה! הטופס אופס.';

                setSuccessMessage(message);

                // Clear success message after 5 seconds
                setTimeout(() => {
                    setSuccessMessage(null);
                }, 5000);
            } else if (!onSuccess) {
                // Fallback if no onSuccess provided and it is edit mode (unlikely but safe)
                alert(`Question set updated! ID: ${newId}`);
            }

        } catch (error) {
            console.error("Submission failed:", error);
            alert("Failed to submit question set. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleImport = (importedData: any) => {
        setFormData(prev => {
            let category = importedData.category || prev.category;

            // Infer category from subcategory if missing
            if (!importedData.category && importedData.subcategory) {
                const cats = SUBCATEGORY_OPTIONS as Record<string, any[]>;
                for (const cat in cats) {
                    if (cats[cat].some(opt => opt.value === importedData.subcategory)) {
                        category = cat;
                        break;
                    }
                }
            }

            const newState = { ...prev, ...importedData, category };

            // Handle questions mapping if present
            if (importedData.questions && Array.isArray(importedData.questions)) {
                newState.questions = importedData.questions.map((q: any, idx: number) => ({
                    ...DEFAULT_QUESTION,
                    difficulty: newState.difficulty || DEFAULT_QUESTION.difficulty,
                    ...q,
                    id: idx + 1
                }));
            }

            return newState;
        });
        setActiveQuestionIndex(0);
        setSuccessMessage(isEnglish ? 'Data imported successfully!' : 'הנתונים יובאו בהצלחה!');
    };

    const labels = {
        question: isEnglish ? 'Question' : 'שאלה',
        answers: isEnglish ? 'Answers' : 'תשובות',
        explanation: isEnglish ? 'Explanation' : 'הסבר לתשובה',
        answerPlaceholder: isEnglish ? 'Answer' : 'תשובה',
        correctIndicator: isEnglish ? 'Correct' : 'נכון',
        category: 'קטגוריה',
    };

    const showLatex = true; // Show preview for everything as requested
    const isSubCategorySelected = !!formData.subcategory;

    return (
        <form onSubmit={handleSubmit} className="space-y-8" dir="rtl">
            <Toast
                message={successMessage || ''}
                isVisible={!!successMessage}
                onClose={() => setSuccessMessage(null)}
                duration={3000}
            />
            <Toast
                message={errorMessage || ''}
                isVisible={!!errorMessage}
                onClose={() => setErrorMessage(null)}
                duration={6000}
                type="error"
            />
            <QuestionMetadata
                category={formData.category}
                subcategory={formData.subcategory}
                topic={formData.topic}
                difficulty={formData.difficulty}
                onCategoryChange={handleCategoryChange}
                onMetadataChange={handleMetadataChange}
                onSubcategoryChange={handleSubcategoryChange}
                questionCount={formData.questions.length}
                onSliderChange={handleSliderChange}
                isQuestionSet={isQuestionSet}
                isSubCategorySelected={isSubCategorySelected}
                errors={formErrors}
                isEnglish={isEnglish}
                onImportOpen={() => setIsImportModalOpen(true)}
            />

            {isSubCategorySelected && (
                <AIControlPanel
                    category={formData.category}
                    subcategory={formData.subcategory}
                    topic={formData.topic}
                    difficulty={formData.difficulty}
                    onGenerate={handleGenerate}
                    apiKey={aiApiKey}
                    globalPrompts={globalPrompts}
                    onSaveApiKey={handleSaveApiKey}
                    onSaveGlobalPrompts={handleSaveGlobalPrompts}
                    isGenerating={isGenerating}
                    selectedModel={aiModel}
                    onSaveModel={handleSaveAiModel}
                    questions={formData.questions}
                />
            )}

            {isQuestionSet && (
                <SharedAsset
                    isChartInference={isChartInference}
                    isEnglish={isEnglish}
                    assetFile={formData.assetFile}
                    assetText={formData.assetText}
                    onFileChange={handleFileChange}
                    onTextChange={handleMetadataChange}
                    onClearFile={() => setFormData(prev => ({ ...prev, assetFile: null }))}
                    isSubCategorySelected={isSubCategorySelected}
                    error={formErrors['asset-file-container']}
                    showLatex={showLatex}
                    textError={formErrors['asset-text']}
                />
            )}

            <div
                className={`flex flex-col md:flex-row gap-6 ${!isSubCategorySelected ? 'opacity-50 pointer-events-none' : ''}`}
                dir={isEnglish ? 'ltr' : 'rtl'}
            >
                {isQuestionSet && (
                    <QuestionTabs
                        questions={formData.questions}
                        activeQuestionIndex={activeQuestionIndex}
                        onQuestionSelect={(idx) => {
                            setActiveQuestionIndex(idx);
                            document.getElementById('question-form-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        isEnglish={isEnglish}
                        isSubCategorySelected={isSubCategorySelected}
                    />
                )}

                <SingleQuestionForm
                    question={formData.questions[activeQuestionIndex]}
                    activeQuestionIndex={activeQuestionIndex}
                    isQuestionSet={isQuestionSet}
                    isEnglish={isEnglish}
                    isSubCategorySelected={isSubCategorySelected}
                    showLatex={showLatex}
                    formErrors={formErrors}
                    handleQuestionChange={handleQuestionChange}
                    handleImageChange={handleImageChange}
                    labels={labels}
                />
            </div>

            <div className="flex justify-center sm:justify-start pt-8 border-t border-gray-200">
                <button
                    type="submit"
                    disabled={!isSubCategorySelected || loading}
                    className="w-full sm:w-auto bg-[#4169E1] text-white px-12 py-4 rounded-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-blue-500/20"
                >
                    {loading
                        ? (isEnglish ? 'Processing...' : 'מעבד...')
                        : (initialData ? (isEnglish ? 'Update Question Set' : 'עדכן ערכה') : (isEnglish ? 'Preview & Submit' : 'תצוגה מקדימה ושליחה'))
                    }
                </button>
            </div>

            <QuestionModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                onConfirm={handleConfirmSubmit}
                formData={formData}
                isEnglish={isEnglish}
                isSubmitting={loading}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImport={handleImport}
                isEnglish={isEnglish}
            />
        </form>
    );
}

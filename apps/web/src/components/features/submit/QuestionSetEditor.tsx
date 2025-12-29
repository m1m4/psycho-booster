'use client';

import React, { useState, useEffect } from 'react';
import { QuestionItem, DEFAULT_QUESTION, QuestionSet } from '@/types/submit';
import { QuestionMetadata } from '@/components/features/submit/QuestionMetadata';
import { SharedAsset } from '@/components/features/submit/SharedAsset';
import { QuestionTabs } from '@/components/features/submit/QuestionTabs';
import { SingleQuestionForm } from '@/components/features/submit/SingleQuestionForm';
import { PreviewModal } from '@/components/features/submit/PreviewModal';
import { uploadFile } from '@/lib/firebase/upload';
import { saveQuestionSet, updateQuestionSet } from '@/lib/firebase/db';
import { useQueryClient } from '@tanstack/react-query';

interface QuestionSetEditorProps {
    initialData?: Partial<QuestionSet> | null;
    onSuccess?: (id: string) => void;
}

interface FormDataState {
    category: string;
    subcategory: string;
    topic: string;
    assetFile: File | null;
    assetText: string;
    questions: QuestionItem[];
    [key: string]: any;
}

export function QuestionSetEditor({ initialData, onSuccess }: QuestionSetEditorProps) {
    const queryClient = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [formData, setFormData] = useState<FormDataState>({
        category: initialData?.category || '',
        subcategory: initialData?.subcategory || '',
        topic: initialData?.topic || '',
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
    });

    const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
    const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

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

            setFormData(prev => ({
                ...prev,
                ...initialData,
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
        setFormData((prev) => ({ ...prev, [name]: value }));
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData((prev) => ({ ...prev, assetFile: e.target.files![0] }));
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

    const handleImageChange = (field: keyof QuestionItem, file: File | null) => {
        setFormData(prev => {
            const newQuestions = [...prev.questions];
            const currentQ = { ...newQuestions[activeQuestionIndex] };

            if (file && (field === 'answer1Image' || field === 'answer2Image' || field === 'answer3Image' || field === 'answer4Image')) {
                const textField = field.replace('Image', '') as keyof QuestionItem;
                (currentQ as any)[textField] = '';
            }

            (currentQ as any)[field] = file;
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

            const overallDifficulty = processedQuestions.length > 0 ? processedQuestions[0].difficulty : 'medium';

            const finalData = {
                category: formData.category,
                subcategory: formData.subcategory,
                topic: formData.topic,
                difficulty: overallDifficulty,
                assetText: formData.assetText,
                assetImageUrl: assetImageUrl || null,
                questions: processedQuestions,
                author: 'unknown',
                status: 'pending' as const,
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

            queryClient.invalidateQueries({ queryKey: ['statistics'] });
            queryClient.invalidateQueries({ queryKey: ['questions'] });

            if (onSuccess) {
                onSuccess(newId);
            } else {
                alert(initialData ? `Question set updated! ID: ${newId}` : `Question set submitted! ID: ${newId}`);

                if (!initialData) {
                    setFormData({
                        category: '',
                        subcategory: '',
                        topic: '',
                        assetFile: null,
                        assetText: '',
                        questions: [DEFAULT_QUESTION],
                    });
                    setActiveQuestionIndex(0);
                }
                setIsPreviewOpen(false);
            }

        } catch (error) {
            console.error("Submission failed:", error);
            alert("Failed to submit question set. Please try again.");
        } finally {
            setLoading(false);
        }
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
            <QuestionMetadata
                category={formData.category}
                subcategory={formData.subcategory}
                topic={formData.topic}
                onCategoryChange={handleCategoryChange}
                onMetadataChange={handleMetadataChange}
                onSubcategoryChange={handleSubcategoryChange}
                questionCount={formData.questions.length}
                onSliderChange={handleSliderChange}
                isQuestionSet={isQuestionSet}
                isSubCategorySelected={isSubCategorySelected}
                errors={formErrors}
                isEnglish={isEnglish}
            />

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

            <div className="flex justify-center sm:justify-start pt-8 border-t border-gray-200 dark:border-gray-800">
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

            <PreviewModal
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
                onConfirm={handleConfirmSubmit}
                formData={formData}
                isEnglish={isEnglish}
                isSubmitting={loading}
            />
        </form>
    );
}

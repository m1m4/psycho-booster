export interface QuestionItem {
    id: number;
    questionText: string;
    questionImage: File | null;
    answer1: string;
    answer1Image: File | null;
    answer2: string;
    answer2Image: File | null;
    answer3: string;
    answer3Image: File | null;
    answer4: string;
    answer4Image: File | null;
    correctAnswer: string;
    explanation: string;
    difficulty: string;
}

export const DEFAULT_QUESTION: QuestionItem = {
    id: 1,
    questionText: '',
    questionImage: null,
    answer1: '',
    answer1Image: null,
    answer2: '',
    answer2Image: null,
    answer3: '',
    answer3Image: null,
    answer4: '',
    answer4Image: null,
    correctAnswer: '',
    explanation: '',
    difficulty: '',
};

export const SUBCATEGORY_OPTIONS = {
    verbal: [
        { label: 'אנלוגיות', value: 'analogies' },
        { label: 'השלמת משפטים', value: 'sentence_completions' },
        { label: 'טענות', value: 'logic' },
        { label: 'הבנת משפט', value: 'sentence_understanding' },
        { label: 'הבנת פסקה', value: 'paragraph_understanding' },
        { label: 'משלים והשוואות', value: 'fables_comparisons' },
        { label: 'מחזק/מחליש', value: 'strengthen_weaken' },
        { label: 'חשיבה מדעית', value: 'scientific_thinking' },
        { label: 'כללים ושיבוצים', value: 'rules_assignments' },
        { label: 'הבנת הנקרא', value: 'reading_comprehension_verbal' },
    ],
    quantitative: [
        { label: 'אלגברה', value: 'algebra' },
        { label: 'בעיות', value: 'problems' },
        { label: 'גאומטריה', value: 'geometry' },
        { label: 'הסקה מתרשים', value: 'chart_inference' },
    ],
    english: [
        { label: 'Sentence Completions', value: 'sentence_completions_eng' },
        { label: 'Restatements', value: 'restatements' },
        { label: 'Reading Comprehension', value: 'reading_comprehension_eng' },
    ],
};

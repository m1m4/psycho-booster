export interface QuestionItem {
    id: number;
    questionText: string;
    questionImage: File | string | null;
    answersMode: 'text' | 'image';
    answer1: string;
    answer1Image: File | string | null;
    answer2: string;
    answer2Image: File | string | null;
    answer3: string;
    answer3Image: File | string | null;
    answer4: string;
    answer4Image: File | string | null;
    correctAnswer: string;
    explanation: string;
    difficulty: string;
}

export const DEFAULT_QUESTION: QuestionItem = {
    id: 1,
    questionText: '',
    questionImage: null,
    answersMode: 'text',
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
        { label: 'משלים והשוואות', value: 'comparisons' },
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

export const TOPIC_OPTIONS: Record<string, { label: string; value: string }[]> = {
    algebra: [
        { label: 'שברים', value: 'fractions' },
        { label: 'ביטויים', value: 'expressions' },
        { label: 'משוואות', value: 'equations' },
        { label: 'חזקות ושורשים', value: 'powers_roots' },
        { label: 'אי שוויונות', value: 'inequalities' },
        { label: 'ערך מוחלט', value: 'absolute_value' },
        { label: 'מספרים ראשוניים', value: 'prime_numbers' },
        { label: 'חלוקה ושארית', value: 'division_remainder' },
        { label: 'מספרים שלמים', value: 'integers' },
        { label: 'ציר המספרים', value: 'number_line' },
        { label: 'תרגילים באותיות', value: 'letter_exercises' },
        { label: 'הגדרת פעולה', value: 'functions' },
        { label: 'הבנה אלגברית', value: 'algebra_understanding' },
    ],
    problems: [
        { label: 'ניסוי וטעייה', value: 'trial_and_error' },
        { label: 'כלליות', value: 'ratios' },
        { label: 'אחוזים', value: 'percentages' },
        { label: 'חפיפה', value: 'overlap' },
        { label: 'ממוצעים', value: 'averages' },
        { label: 'הספק', value: 'production' },
        { label: 'תנועה', value: 'motion' },
        { label: 'צרופים', value: 'combinations' },
        { label: 'הסתברות', value: 'probability' },
    ],
    geometry: [
        { label: 'ישרים', value: 'lines' },
        { label: 'משולשים', value: 'triangles' },
        { label: 'מרובעים', value: 'quads' },
        { label: 'מעגלים', value: 'circles' },
        { label: 'מצולעים', value: 'polygons' },
        { label: 'תלת-ממד', value: '3d' },
        { label: 'דמיון', value: 'similarity' },
        { label: 'מערכת צירים', value: 'coord_system' },
    ],
};

export interface SavedQuestionItem extends Omit<QuestionItem, 'questionImage' | 'answer1Image' | 'answer2Image' | 'answer3Image' | 'answer4Image'> {
    questionImageUrl: string | null;
    answer1ImageUrl: string | null;
    answer2ImageUrl: string | null;
    answer3ImageUrl: string | null;
    answer4ImageUrl: string | null;
}

export interface QuestionSet {
    id: string; // Auto-generated ID
    category: string;
    subcategory: string;
    topic?: string;
    difficulty: string; // Added for sorting
    assetText?: string;
    assetImageUrl?: string | null;
    questions: SavedQuestionItem[]; // Using SavedQuestionItem
    author: string;
    status: 'draft' | 'pending' | 'initial' | 'approved';
    createdAt?: any; // Firestore Timestamp
}


export interface QuestionFilters {
    startDate?: Date | null;
    endDate?: Date | null;
    timeRange?: 'all' | 'today' | 'lastWeek' | 'lastMonth'; // UI helper
    creator?: string;
    status?: string;
    category?: string;
    subcategory?: string;
    difficulty?: string;
    excludeAuthor?: string;
}

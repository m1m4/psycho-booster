
import { QuestionItem, DEFAULT_QUESTION } from '@/types/submit';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface GenerationParams {
    apiKey: string;
    instructions: string; // User instructions (ignored if fullPrompt is present)
    basePrompt: string; // Global base prompt (ignored if fullPrompt is present)
    contextPrompt: string; // Category prompt (ignored if fullPrompt is present)
    category: string;
    subcategory: string;
    topic?: string;
    model?: string;
    fullPrompt?: string; // New: Full system prompt constructed by UI
}

export async function generateQuestions(params: GenerationParams): Promise<QuestionItem[]> {
    const { apiKey, instructions, basePrompt, contextPrompt, category, subcategory, topic, model: modelName, fullPrompt } = params;

    if (!apiKey) {
        throw new Error("Missing API Key");
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: modelName || "gemini-2.0-flash-exp" });

        let systemPrompt = fullPrompt;

        if (!systemPrompt) {
            systemPrompt = `
${basePrompt}

Context:
Category: ${category}
Subcategory: ${subcategory}
${topic ? `Topic: ${topic}` : ''}

Specific Context Rules:
${contextPrompt}

User Additional Instructions:
${instructions}
        `;
        }

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();

        // Parse JSON
        const jsonStart = responseText.indexOf('{'); // Or '[' if array
        const jsonEnd = responseText.lastIndexOf('}') + 1; // Or ']'

        let validJson = responseText;
        if (jsonStart !== -1 && jsonEnd !== -1) {
            validJson = responseText.substring(jsonStart, jsonEnd);
        }

        // Clean markdown code blocks if any
        validJson = validJson.replace(/```json/g, '').replace(/```/g, '');

        let parsedData;
        try {
            parsedData = JSON.parse(validJson);
        } catch (e) {
            console.error("JSON Parse Error:", e, "Raw Text:", responseText);
            throw new Error("Failed to parse AI response. Please try again.");
        }

        // Handle both single object (wrapped in array) or array
        const questionsArray = Array.isArray(parsedData) ? parsedData : (parsedData.questions || [parsedData]);

        // Map to internal QuestionItem format
        return questionsArray.map((q: any, idx: number) => ({
            ...DEFAULT_QUESTION,
            id: idx + 1,
            difficulty: q.difficulty || 'medium',
            questionText: q.questionText || '',
            answer1: q.answer1 || '',
            answer2: q.answer2 || '',
            answer3: q.answer3 || '',
            answer4: q.answer4 || '',
            correctAnswer: (q.correctAnswer || 1).toString(),
            explanation: q.explanation || '',
            answersMode: 'text' // Auto-assume text for AI generated for now
        }));

    } catch (error) {
        console.error("AI Generation Failed:", error);
        throw error;
    }
}

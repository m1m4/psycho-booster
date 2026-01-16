'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDictionaryItems, addDictionaryItem, bulkAddDictionaryItems, deleteDictionaryItem, removeNikud, bulkDeleteDictionaryItems } from '@/lib/firebase/db';
import { DictionaryItem } from '@/types/submit';

export function DictionaryManager() {
    const [selectedLanguage, setSelectedLanguage] = useState<'he' | 'en'>('he');
    const [selectedSet, setSelectedSet] = useState<number>(1);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [importText, setImportText] = useState('');
    const [importSet, setImportSet] = useState<number>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    
    const queryClient = useQueryClient();

    // Fetch Dictionary Words
    const { data: words, isLoading } = useQuery({
        queryKey: ['dictionary', selectedLanguage, selectedSet],
        queryFn: () => getDictionaryItems(selectedLanguage, selectedSet, 200), // Get up to 200 words
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: deleteDictionaryItem,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['dictionary'] });
        }
    });
    
    // Bulk Delete Mutation
    const bulkDeleteMutation = useMutation({
        mutationFn: bulkDeleteDictionaryItems,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['dictionary'] });
             setIsImportOpen(false);
             setImportText('');
             alert('המילים נמחקו בהצלחה!');
        },
        onError: (err) => {
            console.error(err);
            alert('שגיאה במחיקת המילים.');
        }
    });

    const handleBulkDelete = async () => {
        setIsProcessing(true);
        try {
            const lines = importText.split('\n').filter(l => l.trim());
            const itemsToDelete: string[] = [];

            // Helper to check if two items are the same (reusing the logic from duplicate prevention)
            const areSame = (a: any, b: any) => {
                if (a.language !== b.language) return false;
                const wordMatch = removeNikud(a.word) === removeNikud(b.word);
                const translationMatch = removeNikud(a.translation) === removeNikud(b.translation);
                const nikudMatch = (a.nikud || '') === (b.nikud || '');
                
                if (a.language === 'he') {
                    return wordMatch && translationMatch && nikudMatch;
                } else {
                    return wordMatch && translationMatch;
                }
            };

            for (const line of lines) {
                const parts = line.split('|').map(s => s.trim());
                let parsedItem: any = null;

                if (selectedLanguage === 'he' && parts.length >= 2) {
                     let nikud = '';
                     let definition = '';
                     if (parts.length === 3) {
                         nikud = parts[1];
                         definition = parts[2];
                     } else {
                         definition = parts[1];
                     }
                     parsedItem = { word: parts[0], nikud, translation: definition, language: 'he' };
                } else if (selectedLanguage === 'en' && parts.length >= 2) {
                     parsedItem = { word: parts[0], translation: parts[1], language: 'en' };
                }

                if (parsedItem) {
                    const found = words?.find(w => areSame(w, parsedItem));
                    if (found) itemsToDelete.push(found.id);
                }
            }

            if (itemsToDelete.length === 0) {
                alert('לא נמצאו מילים תואמות למחיקה.');
                setIsProcessing(false);
                return;
            }

            if (!confirm(`נמצאו ${itemsToDelete.length} מילים למחיקה. להמשיך?`)) {
                setIsProcessing(false);
                return;
            }

            await bulkDeleteMutation.mutateAsync(itemsToDelete);

        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    // Bulk Add Mutation
    const bulkAddMutation = useMutation({
        mutationFn: bulkAddDictionaryItems,
        onSuccess: () => {
             queryClient.invalidateQueries({ queryKey: ['dictionary'] });
             setIsImportOpen(false);
             setImportText('');
             alert('המילים נוספו בהצלחה!');
        },
        onError: (err) => {
            console.error(err);
            alert('שגיאה בהוספת המילים.');
        }
    });

    const handleBulkImport = async () => {
        setIsProcessing(true);
        try {
            const lines = importText.split('\n').filter(l => l.trim());
            const items: Omit<DictionaryItem, 'id' | 'createdAt'>[] = [];

            for (const line of lines) {
                const parts = line.split('|').map(s => s.trim());
                if (selectedLanguage === 'he') {
                    // Hebrew: Word | Nikud | Definition
                    if (parts.length >= 2) { // Allow omitting definition if needed, but schema requires it. Let's say min 2 parts for simplicity or strictly 3.
                         // Flexible parsing
                         const [word, part2, part3] = parts;
                         // If 3 parts: Word, Nikud, Def
                         // If 2 parts: Word, Def (No Nikud?) or Word, Nikud (No Def?) - Let's assume Word, Def if 2 parts for simplicity or ask user?
                         // Current plan: Hebrew: Word | Nikud | Definition
                         
                         let nikud = '';
                         let definition = '';
                         
                         if (parts.length === 3) {
                             nikud = part2;
                             definition = part3;
                         } else if (parts.length === 2) {
                             // Fallback: assume Word | Definition
                             definition = part2;
                         }

                         items.push({
                             word: removeNikud(word),
                             nikud,
                             translation: definition,
                             language: 'he',
                             set: importSet
                         });
                    }
                } else {
                    // English: Word | Translation
                    if (parts.length >= 2) {
                        items.push({
                            word: parts[0],
                            translation: parts[1],
                            language: 'en',
                            set: importSet
                        });
                    }
                }
            }

            // Duplicate prevention
            const filteredItems = items.filter(item => {
                const normalizedWord = removeNikud(item.word);
                const currentNikud = item.nikud || '';
                const normalizedDefinition = removeNikud(item.translation);
                
                // Helper to check if two items are the same based on all 3 parameters
                const areSame = (a: any, b: any) => {
                    if (a.language !== b.language) return false;
                    const wordMatch = removeNikud(a.word) === removeNikud(b.word);
                    const translationMatch = removeNikud(a.translation) === removeNikud(b.translation);
                    const nikudMatch = (a.nikud || '') === (b.nikud || '');
                    
                    if (a.language === 'he') {
                        return wordMatch && translationMatch && nikudMatch;
                    } else {
                        // English only has word and translation
                        return wordMatch && translationMatch;
                    }
                };

                // Check against already existing words in the set
                const isDuplicate = words?.some(existing => areSame(item, existing));

                // Also check against other items in the same import batch to avoid internal duplicates
                const isBatchDuplicate = items.indexOf(item) !== items.findIndex(other => areSame(item, other));

                return !isDuplicate && !isBatchDuplicate;
            });

            if (filteredItems.length === 0) {
                if (items.length > 0) {
                    alert('כל המילים כבר קיימות (לפי ההגדרה).');
                } else {
                    alert('לא זוהו מילים תקינות. בדוק את הפורמט.');
                }
                setIsProcessing(false);
                return;
            }

            if (filteredItems.length < items.length) {
                const skipped = items.length - filteredItems.length;
                if (!confirm(`נמצאו ${skipped} מילים כפולות שיושמטו. להמשיך?`)) {
                    setIsProcessing(false);
                    return;
                }
            }

            await bulkAddMutation.mutateAsync(filteredItems);

        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">ניהול מילון</h2>
                <div className="flex gap-4">
                     <select 
                        value={selectedLanguage} 
                        onChange={(e) => setSelectedLanguage(e.target.value as 'he' | 'en')}
                        className="p-2 rounded-lg border border-gray-300"
                    >
                        <option value="he">עברית (אנלוגיות)</option>
                        <option value="en">אנגלית</option>
                    </select>

                    <select 
                        value={selectedSet} 
                        onChange={(e) => setSelectedSet(Number(e.target.value))}
                        className="p-2 rounded-lg border border-gray-300"
                    >
                        {[...Array(10)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>סט {i + 1}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 min-h-[400px]">
                <div className="flex justify-between mb-4">
                    <h3 className="font-bold text-gray-700">רשימת מילים (סט {selectedSet})</h3>
                    <button 
                        onClick={() => {
                            setImportSet(selectedSet);
                            setIsImportOpen(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        ייבוא/הוספה/מחיקה
                    </button>
                </div>

                <div className="overflow-auto max-h-[500px]">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="p-3">מילה</th>
                                {selectedLanguage === 'he' && <th className="p-3">ניקוד</th>}
                                <th className="p-3">{selectedLanguage === 'he' ? 'פירוש' : 'תרגום'}</th>
                                <th className="p-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">טוען...</td>
                                </tr>
                            ) : words && words.length > 0 ? (
                                words.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="p-3 font-medium">{item.word}</td>
                                        {selectedLanguage === 'he' && <td className="p-3 font-serif text-lg">{item.nikud}</td>}
                                        <td className="p-3 text-gray-600">{item.translation}</td>
                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => {
                                                    if(confirm('למחוק?')) deleteMutation.mutate(item.id);
                                                }}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-400">אין מילים בסט זה</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Import Modal */}
            {isImportOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">ייבוא מילים ({selectedLanguage === 'he' ? 'עברית' : 'אנגלית'})</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">בחר סט יעד</label>
                            <select 
                                value={importSet} 
                                onChange={(e) => setImportSet(Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg"
                            >
                                {[...Array(10)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>סט {i + 1}</option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                הדבק רשימה
                                {selectedLanguage === 'he' ? (
                                    <span className="text-gray-500 font-normal mr-2">(פורמט: מילה | ניקוד | פירוש)</span>
                                ) : (
                                    <span className="text-gray-500 font-normal mr-2">(פורמט: מילה | תרגום)</span>
                                )}
                            </label>
                            <textarea
                                value={importText}
                                onChange={(e) => setImportText(e.target.value)}
                                className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
                                placeholder={selectedLanguage === 'he' 
                                    ? "אבסורדי | אַבְּסוּרְדִי | לא הגיוני\nבדיוני | בִּדְיוֹנִי | דמיוני"
                                    : "Absurd | לא הגיוני\nFiction | דמיוני"
                                }
                                dir="rtl"
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={() => setIsImportOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                ביטול
                            </button>
                            <button 
                                onClick={handleBulkDelete}
                                disabled={isProcessing || !importText.trim()}
                                className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 disabled:opacity-50 font-bold"
                            >
                                {isProcessing ? 'מעבד...' : 'מחק מילים מהרשימה'}
                            </button>
                            <button 
                                onClick={handleBulkImport}
                                disabled={isProcessing || !importText.trim()}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isProcessing ? 'מעבד...' : 'ייבא מילים'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

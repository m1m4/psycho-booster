'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { QuestionSet } from '@/types/submit';

interface InboxTabProps {
    onEdit: (data: QuestionSet) => void;
}

export function InboxTab({ onEdit }: InboxTabProps) {
    const { user } = useAuth();
    const [packs, setPacks] = useState<QuestionSet[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        // Query user's packs
        // Note: 'status' might be useful to filter, but for Inbox we show all?
        // Index requirement: author + createdAt.
        const q = query(
            collection(db, 'question_packs'),
            where('author', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedPacks = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as QuestionSet[];
            setPacks(fetchedPacks);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching inbox:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this pack?')) return;
        try {
            await deleteDoc(doc(db, 'question_packs', id));
        } catch (error) {
            console.error("Error deleting pack:", error);
            alert("Failed to delete pack");
        }
    };

    const formatDate = (date: any) => {
        if (!date) return '';
        // Handle Firestore Timestamp
        const d = date instanceof Timestamp ? date.toDate() : new Date(date);
        return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'טיוטה';
            case 'pending': return 'ממתין';
            case 'approved': return 'אושר';
            default: return status;
        }
    };

    if (loading) return <div className="text-center p-8">טוען...</div>;

    if (packs.length === 0) {
        return (
            <div className="text-center p-12 text-gray-500">
                <h3 className="text-xl">אין הודעות בתיבת הדואר</h3>
                <p>צור ערכה חדשה בכרטיסייה "מחולל" או צור ידנית.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4" dir="rtl">
            <h2 className="text-2xl font-bold mb-6">תיבת דואר (שעורי בית)</h2>
            <div className="grid gap-4">
                {packs.map((pack) => (
                    <div key={pack.id} className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-800 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold 
                                    ${pack.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                        pack.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'}`}>
                                    {getStatusLabel(pack.status)}
                                </span>
                                <span className="text-sm text-gray-400">{formatDate(pack.createdAt)}</span>
                            </div>
                            <h3 className="font-semibold text-lg">{pack.topic || pack.subcategory || pack.category}</h3>
                            <p className="text-sm text-gray-500">
                                {pack.questions?.length || 0} שאלות • {pack.difficulty}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onEdit(pack)}
                                className="bg-blue-50 text-blue-600 px-4 py-2 rounded hover:bg-blue-100 transition-colors"
                            >
                                ערוך
                            </button>
                            <button
                                onClick={() => handleDelete(pack.id)}
                                className="text-red-500 p-2 hover:bg-red-50 rounded"
                            >
                                מחק
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

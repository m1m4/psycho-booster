'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

export function TesterManager() {
    const [email, setEmail] = useState('');
    const [testers, setTesters] = useState<{ email: string; role: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const q = query(collection(db, "admin_users"), where("role", "==", "tester"));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({
                email: doc.id,
                role: doc.data().role
            }));
            setTesters(list);
            setFetching(false);
        });

        return () => unsubscribe();
    }, []);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) return;

        setLoading(true);
        try {
            const userDoc = doc(db, "admin_users", email.trim().toLowerCase());
            await setDoc(userDoc, {
                role: 'tester',
                createdAt: new Date().toISOString()
            }, { merge: true });
            setEmail('');
        } catch (error) {
            console.error("Error adding tester:", error);
            alert("שגיאה בהוספת בוחן");
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (testerEmail: string) => {
        if (!confirm(`האם להסיר את ${testerEmail}?`)) return;

        try {
            await deleteDoc(doc(db, "admin_users", testerEmail));
        } catch (error) {
            console.error("Error removing tester:", error);
            alert("שגיאה בהסרת בוחן");
        }
    };

    return (
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900">ניהול בוחנים</h3>
                    <p className="text-gray-500 text-sm mt-1">נהל את רשימת בודקי המערכת שיש להם גישה למצב בוחן בלבד</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-2xl text-orange-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
            </div>

            <form onSubmit={handleAdd} className="flex gap-2">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="הכנס אימייל (Google Account)"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-orange-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 active:scale-95"
                >
                    {loading ? 'מוסיף...' : 'הוסף בוחן'}
                </button>
            </form>

            <div className="space-y-2">
                <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">בוחנים פעילים ({testers.length})</h4>
                {fetching ? (
                    <p className="text-gray-400 text-sm p-4 text-center italic">טוען רשימה...</p>
                ) : testers.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">אין בוחנים רשומים כרגע</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-1">
                        {testers.map((tester) => (
                            <div key={tester.email} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl group hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-100 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-orange-500 font-bold text-xs ring-1 ring-gray-100">
                                        {tester.email.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-900 font-medium text-sm">{tester.email}</span>
                                </div>
                                <button
                                    onClick={() => handleRemove(tester.email)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                    title="הסר בוחן"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

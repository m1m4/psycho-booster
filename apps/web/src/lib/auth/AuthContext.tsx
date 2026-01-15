"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthorized: boolean;
    role: 'admin' | 'tester' | null;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<'admin' | 'tester' | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const mountedRef = useRef(false);

    useEffect(() => {
        mountedRef.current = true;
        console.log("AuthProvider: Mounted");

        // 1. Dev Auto-Login (Safe check)
        const devEmail = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL;
        const devPassword = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN_PASSWORD;

        if (
            process.env.NODE_ENV === "development" &&
            devEmail &&
            devPassword &&
            !auth.currentUser
        ) {
            // Check if we already tried this session (simple obscure flag on window to avoid hooks issues in strict mode)
            if (!(window as any).__dev_auto_login_attempted) {
                (window as any).__dev_auto_login_attempted = true;
                console.log("AuthProvider: Attempting Dev Auto-Login...");
                signInWithEmailAndPassword(auth, devEmail, devPassword).catch((e) => console.error("Dev login failed", e));
            }
        }

        // 2. Main Auth Listener
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!mountedRef.current) return;

            console.log("AuthProvider: Auth state changed:", currentUser?.email);

            if (currentUser && currentUser.email) {
                // Determine Authorization and Role
                let currentRole: 'admin' | 'tester' | null = null;
                let authorized = false;

                // Dev Bypass
                if (process.env.NODE_ENV === "development" &&
                    currentUser.email === process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL) {
                    currentRole = 'admin';
                    authorized = true;
                } else {
                    try {
                        const adminDoc = await getDoc(doc(db, "admin_users", currentUser.email));
                        if (adminDoc.exists()) {
                            authorized = true;
                            const data = adminDoc.data();
                            currentRole = data.role || 'admin'; // Default to admin for existing users
                        }
                    } catch (e) {
                        console.error("AuthProvider: Role check error", e);
                    }
                }

                if (mountedRef.current) {
                    setUser(currentUser);
                    setIsAuthorized(authorized);
                    setRole(currentRole);
                }
            } else {
                if (mountedRef.current) {
                    setUser(null);
                    setIsAuthorized(false);
                    setRole(null);
                }
            }

            if (mountedRef.current) {
                setLoading(false);
            }
        });

        return () => {
            mountedRef.current = false;
            unsubscribe();
        };
    }, []);

    const signInWithGoogle = async () => {
        console.log("signInWithGoogle started");
        const provider = new GoogleAuthProvider();
        try {
            // Ensure persistence is set to LOCAL for PWAs
            await setPersistence(auth, browserLocalPersistence);
            console.log("Persistence set, starting popup...");
            await signInWithPopup(auth, provider);
            // Result handling is done in onAuthStateChanged
        } catch (error: any) {
            console.error("Error signing in with Google", error);
            if (error.code === 'auth/popup-blocked') {
                alert("Login popup was blocked. Please allow popups for this site.");
            } else if (error.code === 'auth/popup-closed-by-user') {
                console.log("Popup closed by user");
            } else {
                alert("Login failed: " + error.message);
            }
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setIsAuthorized(false);
            setRole(null);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthorized, role, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}

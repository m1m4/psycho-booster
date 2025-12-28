"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword
} from "firebase/auth";
import { auth } from "../firebase/config";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const autoLoginAttempted = useRef(false);

    useEffect(() => {
        // Dev Mode Auto-Login
        const devEmail = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL;
        const devPassword = process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN_PASSWORD;

        if (
            process.env.NODE_ENV === "development" &&
            devEmail &&
            devPassword &&
            !auth.currentUser &&
            !autoLoginAttempted.current
        ) {
            autoLoginAttempted.current = true;
            console.log("Attempting Dev Auto-Login...");
            signInWithEmailAndPassword(auth, devEmail, devPassword)
                .catch((error) => {
                    // Ignore "already signed in" or similar conflict errors during dev auto-login
                    if (error.code !== 'auth/instance-id-abi-mismatch') {
                        console.error("Auto-login failed:", error);
                    }
                });
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/");
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
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

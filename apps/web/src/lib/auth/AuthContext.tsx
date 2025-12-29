"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
    User,
    GoogleAuthProvider,
    signInWithRedirect,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    getRedirectResult,
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
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const autoLoginAttempted = useRef(false);

    useEffect(() => {
        console.log("AuthProvider: Initializing...");

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
            console.log("AuthProvider: Attempting Dev Auto-Login...");
            setPersistence(auth, browserLocalPersistence)
                .then(() => signInWithEmailAndPassword(auth, devEmail, devPassword))
                .catch((error) => {
                    if (error.code !== 'auth/instance-id-abi-mismatch') {
                        console.error("AuthProvider: Auto-login failed:", error);
                    }
                });
        }

        // Initialize session handling
        const init = async () => {
            try {
                // Ensure persistence is set for the session
                await setPersistence(auth, browserLocalPersistence);

                // Prioritize processing the redirect result
                const result = await getRedirectResult(auth);
                if (result) {
                    console.log("AuthProvider: Redirect login success", result.user.email);
                }
            } catch (error) {
                console.error("AuthProvider: Init/Redirect error:", error);
            }

            // Start observing auth state changes
            const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
                console.log("AuthProvider: onAuthStateChanged", currentUser?.email || "null");

                if (currentUser && currentUser.email) {
                    try {
                        // Dev Mode Bypass
                        if (process.env.NODE_ENV === "development" &&
                            currentUser.email === process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN_EMAIL) {
                            console.log("AuthProvider: Dev user authorized");
                            setIsAuthorized(true);
                            setUser(currentUser);
                            setLoading(false);
                            return;
                        }

                        // Check authorization
                        const adminDoc = await getDoc(doc(db, "admin_users", currentUser.email));
                        if (adminDoc.exists()) {
                            console.log("AuthProvider: User authorized via Firestore");
                            setIsAuthorized(true);
                            setUser(currentUser);
                        } else {
                            console.warn("AuthProvider: User not in admin_users list");
                            setIsAuthorized(false);
                            setUser(currentUser);
                        }
                    } catch (error) {
                        console.error("AuthProvider: Authorization check failed", error);
                        setIsAuthorized(false);
                        setUser(currentUser);
                    }
                } else {
                    setUser(null);
                    setIsAuthorized(false);
                }

                // Only mark as finished loading AFTER we've checked everything
                setLoading(false);
            });

            return unsubscribe;
        };

        const unsubPromise = init();
        return () => {
            unsubPromise.then(unsub => unsub?.());
        };
    }, []);

    const signInWithGoogle = async () => {
        console.log("signInWithGoogle started");
        const provider = new GoogleAuthProvider();
        try {
            // Ensure persistence is set to LOCAL for PWAs
            await setPersistence(auth, browserLocalPersistence);
            console.log("Persistence set, starting redirect...");
            await signInWithRedirect(auth, provider);
        } catch (error: any) {
            console.error("Error signing in with Google", error);
            alert("Login failed: " + error.message);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setIsAuthorized(false);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAuthorized, signInWithGoogle, logout }}>
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

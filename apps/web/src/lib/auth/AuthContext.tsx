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
            setPersistence(auth, browserLocalPersistence)
                .then(() => signInWithEmailAndPassword(auth, devEmail, devPassword))
                .catch((error) => {
                    if (error.code !== 'auth/instance-id-abi-mismatch') {
                        console.error("Auto-login failed:", error);
                    }
                });
        }

        // Handle the result of a redirect sign-in
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    console.log("Redirect sign-in successful", result.user.email);
                }
            })
            .catch((error) => {
                console.error("Redirect sign-in error:", error);
                // On mobile, sometimes an alert is the only way to see the error
                if (process.env.NODE_ENV !== 'production') {
                    alert("Sign-in error: " + error.message);
                }
            });

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser && currentUser.email) {
                try {
                    // Force a check against the database. 
                    // If the user isn't an admin, Firestore Rules will throw an error here.
                    const adminDoc = await getDoc(doc(db, "admin_users", currentUser.email));
                    if (adminDoc.exists()) {
                        setIsAuthorized(true);
                        setUser(currentUser);
                    } else {
                        console.error("User document does not exist in admin_users");
                        setIsAuthorized(false);
                        setUser(currentUser); // Still set user so we know who they are, but isAuthorized is false
                    }
                } catch (error) {
                    console.error("Authorization check failed:", error);
                    setIsAuthorized(false);
                    setUser(currentUser);
                }
            } else {
                setUser(null);
                setIsAuthorized(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
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

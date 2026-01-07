"use client";

import { useAuth } from "./AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading, isAuthorized, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Skip auth check for login and print pages
        if (!loading && !user && pathname !== "/login" && pathname !== "/print") {
            router.push("/login");
        }
    }, [user, loading, router, pathname]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                    <p className="animate-pulse text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // Allow access to login and print pages
    if (pathname === "/login" || pathname === "/print") {
        return <>{children}</>;
    }

    // If not loading, no user, and not on the login page, don't render anything while redirecting
    if (!user) {
        return null;
    }

    // Show Access Denied if logged in but not in the admin collection
    if (user && !isAuthorized && pathname !== "/login") {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-900 px-4 text-center text-white">
                <div className="w-full max-w-md rounded-xl bg-gray-800 p-8 shadow-2xl border border-red-500/30">
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-red-500/10 p-4 font-bold text-red-500 text-6xl">
                            !
                        </div>
                    </div>
                    <h1 className="mb-4 text-3xl font-bold text-white">Access Denied</h1>
                    <p className="mb-8 text-gray-400">
                        The account <span className="font-semibold text-white">{user.email}</span> is not authorized to access this panel.
                    </p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => logout()}
                            className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
                        >
                            Log out and switch account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}

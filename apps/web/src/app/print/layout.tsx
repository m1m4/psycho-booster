import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "ייצוא שאלות - Psycho Booster",
    description: "דף הדפסה לייצוא שאלות",
};

/**
 * Print layout - no navbar, minimal chrome for print-optimized view.
 */
export default function PrintLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}

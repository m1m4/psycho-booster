import React from 'react';
import Link from 'next/link';

/**
 * Props for the ActionCard component.
 */
interface ActionCardProps {
    /** Title of the card */
    title: string;
    /** Description text of the card */
    description: string;
    /** Icon element to display */
    icon: React.ReactNode;
    /** Callback fired when the card is clicked (if href is not provided) */
    onClick?: () => void;
    /** URL to navigate to when the card is clicked */
    href?: string;
}

/**
 * A generic card component used for primary actions on the dashboard.
 * Supports both link navigation and button clicks.
 */
export function ActionCard({ title, description, icon, onClick, href }: ActionCardProps) {
    const content = (
        <div className="space-y-4">
            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center group-hover:bg-[#4169E1] transition-colors shadow-sm">
                <div className="w-6 h-6 flex items-center justify-center [&_svg]:w-6 [&_svg]:h-6 [&_svg]:text-white group-hover:[&_svg]:text-white [&_svg]:transition-colors">
                    {icon}
                </div>
            </div>
            <div className="text-start">
                <h3 className="text-xl font-semibold text-black mb-2">{title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );

    const className = "group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#4169E1] hover:shadow-xl hover:shadow-blue-500/5 active:scale-[0.98] transition-all duration-300 text-start touch-manipulation w-full block shadow-sm";

    if (href) {
        return (
            <Link href={href} className={className}>
                {content}
            </Link>
        );
    }

    return (
        <button
            onClick={onClick}
            className={className}
        >
            {content}
        </button>
    );
}

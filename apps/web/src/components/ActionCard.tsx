import React from 'react';
import Link from 'next/link';

interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick?: () => void;
    href?: string;
}

export function ActionCard({ title, description, icon, onClick, href }: ActionCardProps) {
    const content = (
        <div className="space-y-4">
            <div className="w-10 h-10 bg-black dark:bg-white rounded flex items-center justify-center group-hover:bg-[#4169E1] transition-colors">
                <div className="w-5 h-5 flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5 [&_svg]:text-white dark:[&_svg]:text-black group-hover:[&_svg]:text-white [&_svg]:transition-colors">
                    {icon}
                </div>
            </div>
            <div className="text-start">
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    {description}
                </p>
            </div>
        </div>
    );

    const className = "group relative bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg p-8 hover:border-[#4169E1] dark:hover:border-[#4169E1] active:scale-[0.98] active:bg-gray-100 dark:active:bg-gray-800 transition-all duration-200 text-start touch-manipulation w-full block";

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

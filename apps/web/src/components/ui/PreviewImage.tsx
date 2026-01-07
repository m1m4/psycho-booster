'use client';

import React, { useState, useEffect } from 'react';

interface PreviewImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onClick'> {
    src: File | string | null | undefined;
    alt: string;
    onClick?: (src: string) => void;
    useCors?: boolean;
}

// Helper component to handle File -> Blob URL conversion with cleanup
export function PreviewImage({
    src,
    alt,
    className,
    onClick,
    useCors = false,
    ...props
}: PreviewImageProps) {
    const [displaySrc, setDisplaySrc] = useState<string | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
        if (src instanceof File) {
            const url = URL.createObjectURL(src);
            setDisplaySrc(url);
            return () => URL.revokeObjectURL(url);
        } else {
            setDisplaySrc(typeof src === 'string' ? src : null);
        }
    }, [src]);

    if (!displaySrc) return null;

    if (hasError) {
        return (
            <div className={`flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center ${className}`}>
                <span className="text-gray-400 mb-1">
                    <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </span>
                <span className="text-xs text-gray-500 font-medium">Image Unavailable</span>
            </div>
        );
    }

    const isBlob = displaySrc.startsWith('blob:');

    return (
        <img
            src={displaySrc}
            alt={alt}
            className={className}
            onClick={() => onClick?.(src instanceof File ? displaySrc : (src as string))}
            onError={() => {
                console.warn('Image failed to load (likely CORS). Switching to placeholder.', displaySrc);
                setHasError(true);
            }}
            {...((useCors && !isBlob) ? { crossOrigin: "anonymous" } : {})}
            {...props}
        />
    );
}

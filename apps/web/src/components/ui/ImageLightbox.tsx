import React, { useEffect, useState, useRef, useCallback } from 'react';

interface ImageLightboxProps {
    src: string;
    alt?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
    const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 });

    // Refs for gesture state to avoid stale closures and ensure atomic updates
    const stateRef = useRef({ scale: 1, x: 0, y: 0 });

    // Refs for gesture start points
    const gestureStartRef = useRef<{
        scale: number;
        x: number;
        y: number;
        distance: number;
        midpoint: { x: number; y: number };
    } | null>(null);

    const isDragging = useRef(false);
    const dragStartRef = useRef<{ x: number, y: number, imgX: number, imgY: number } | null>(null);

    const imgRef = useRef<HTMLImageElement>(null);

    const updateTransform = (newScale: number, newX: number, newY: number) => {
        // Clamp scale
        const clampedScale = Math.min(Math.max(newScale, 1), 5);
        stateRef.current = { scale: clampedScale, x: newX, y: newY };
        setTransform({ scale: clampedScale, x: newX, y: newY });
    };

    const resetView = useCallback(() => {
        updateTransform(1, 0, 0);
    }, []);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
            resetView();
        }
        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose, resetView]);

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const { scale, x, y } = stateRef.current;
        const delta = e.deltaY > 0 ? -0.2 : 0.2;
        const newScale = Math.min(Math.max(scale + delta, 1), 5);

        if (newScale === 1) {
            updateTransform(1, 0, 0);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            // Calculate mouse position relative to center of image container
            const mouseX = e.clientX - rect.left - rect.width / 2;
            const mouseY = e.clientY - rect.top - rect.height / 2;

            // Formula: NewPos = MousePos - (MousePos - OldPos) * (NewScale / OldScale)
            const ratio = newScale / scale;
            const newX = mouseX - (mouseX - x) * ratio;
            const newY = mouseY - (mouseY - y) * ratio;

            updateTransform(newScale, newX, newY);
        }
    };

    // ----------------------------------------------------
    // Robust Touch Handling using "Start State" Logic
    // ----------------------------------------------------
    const handleTouchStart = (e: React.TouchEvent) => {
        const { scale, x, y } = stateRef.current;

        if (e.touches.length === 1 && scale > 1) {
            // Single finger panning (only when zoomed)
            isDragging.current = true;
            dragStartRef.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                imgX: x,
                imgY: y
            };
        } else if (e.touches.length === 2) {
            // Two finger pinch - Capture SNAPSHOT of the entire state
            isDragging.current = false;

            const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

            const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const midpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

            // Save absolute start conditions
            gestureStartRef.current = {
                scale: scale,
                x: x,
                y: y,
                distance: distance,
                midpoint: midpoint
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && isDragging.current && dragStartRef.current) {
            // Panning Logic: Simple Delta
            const dx = e.touches[0].clientX - dragStartRef.current.x;
            const dy = e.touches[0].clientY - dragStartRef.current.y;

            updateTransform(
                stateRef.current.scale,
                dragStartRef.current.imgX + dx,
                dragStartRef.current.imgY + dy
            );
        } else if (e.touches.length === 2 && gestureStartRef.current) {
            const start = gestureStartRef.current;
            const rect = e.currentTarget.getBoundingClientRect();

            const p1 = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            const p2 = { x: e.touches[1].clientX, y: e.touches[1].clientY };

            const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
            const mid = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

            // 1. Calculate new scale based on distance ratio
            const scaleRatio = dist / start.distance;
            const tempScale = start.scale * scaleRatio;

            // 2. Calculate Translation
            // Formula: T_new = M_curr_rel - (M_start_rel - T_start) * Ratio
            // We need points relative to the container center

            const containerCenter = {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };

            const M_start_rel = {
                x: start.midpoint.x - containerCenter.x,
                y: start.midpoint.y - containerCenter.y
            };

            const M_curr_rel = {
                x: mid.x - containerCenter.x,
                y: mid.y - containerCenter.y
            };

            // The magic formula that respects both Panning (midpoint move) and Zooming
            const newX = M_curr_rel.x - (M_start_rel.x - start.x) * scaleRatio;
            const newY = M_curr_rel.y - (M_start_rel.y - start.y) * scaleRatio;

            updateTransform(tempScale, newX, newY);
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        gestureStartRef.current = null;
        dragStartRef.current = null;

        // Snap back if scale < 1 (optional bounce back)
        if (stateRef.current.scale < 1) {
            updateTransform(1, 0, 0);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200 select-none touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={onClose}
        >
            <div className="absolute top-6 right-6 z-[110]">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="p-3 rounded-full bg-black/50 hover:bg-white/10 text-white transition-all active:scale-95 border border-white/10 shadow-xl"
                >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div
                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                onWheel={handleWheel}
            >
                <img
                    ref={imgRef}
                    src={src}
                    alt={alt || 'Image Preview'}
                    className={`max-w-[90vw] max-h-[90vh] w-auto h-auto transition-transform ${stateRef.current.scale > 1 ? 'cursor-grab' : 'cursor-zoom-in'}`}
                    style={{
                        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                        transition: gestureStartRef.current || isDragging.current ? 'none' : 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transformOrigin: '50% 50%' // Critical: ensure transforms happen from center
                    }}
                    onMouseDown={(e) => {
                        // Desktop panning support
                        if (stateRef.current.scale > 1) {
                            isDragging.current = true;
                            dragStartRef.current = {
                                x: e.clientX,
                                y: e.clientY,
                                imgX: stateRef.current.x,
                                imgY: stateRef.current.y
                            };
                        }
                    }}
                    onMouseMove={(e) => {
                        if (isDragging.current && dragStartRef.current) {
                            const dx = e.clientX - dragStartRef.current.x;
                            const dy = e.clientY - dragStartRef.current.y;
                            updateTransform(stateRef.current.scale, dragStartRef.current.imgX + dx, dragStartRef.current.imgY + dy);
                        }
                    }}
                    onMouseUp={() => isDragging.current = false}
                    onMouseLeave={() => isDragging.current = false}
                    onClick={(e) => e.stopPropagation()}
                    draggable={false}
                />
            </div>

            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none">
                <div className="bg-black/50 px-6 py-2 rounded-full backdrop-blur-md border border-white/10 text-white/70 text-sm shadow-2xl">
                    <span className="hidden md:inline">Use Scroll to Zoom • Drag to Pan</span>
                    <span className="md:hidden">Pinch to Zoom • Drag to Pan</span>
                </div>
                {stateRef.current.scale > 1 && (
                    <button
                        className="bg-white/10 hover:bg-white/20 px-4 py-1 rounded-full text-white/50 text-xs transition-all pointer-events-auto active:scale-95 border border-white/5"
                        onClick={(e) => {
                            e.stopPropagation();
                            resetView();
                        }}
                    >
                        Reset Zoom
                    </button>
                )}
            </div>
        </div>
    );
}

import React from 'react';
import { Textarea } from '@/components/ui/Textarea';
import { LatexPreview } from '@/components/ui/LatexPreview';
import { CameraIcon, XIcon } from './SubmitIcons';

interface SharedAssetProps {
    isChartInference: boolean;
    isEnglish: boolean;
    assetFile: File | null;
    assetText: string;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onTextChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onClearFile: () => void;
    isSubCategorySelected: boolean;
    error?: boolean;
    showLatex: boolean;
    textError?: boolean;
}

export function SharedAsset({
    isChartInference,
    isEnglish,
    assetFile,
    assetText,
    onFileChange,
    onTextChange,
    onClearFile,
    isSubCategorySelected,
    error,
    showLatex,
    textError
}: SharedAssetProps) {
    return (
        <div className={`bg-gray-50 dark:bg-gray-900/50 p-6 rounded-2xl space-y-6 border border-gray-200 dark:border-gray-800 ${!isSubCategorySelected ? 'opacity-50 pointer-events-none' : ''}`}>
            <h2 className={`text-xl font-semibold ${isEnglish ? 'text-left' : ''}`}>
                {isChartInference ? 'קובץ תרשים משותף' : (isEnglish ? 'Reading Passage' : 'קטע קריאה')}
            </h2>

            {isChartInference ? (
                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="flex-1">
                            <div
                                id="asset-file-container"
                                className={`
                                relative border-2 border-dashed rounded-xl p-8 transition-all hover:border-[#4169E1]/50 flex flex-col items-center justify-center gap-4
                                ${assetFile ? 'bg-[#4169E1]/5 border-[#4169E1]/30' : ''}
                                ${error ? 'border-red-500 bg-red-50/5' : 'border-gray-200 dark:border-gray-800'}
                            `}>
                                {assetFile ? (
                                    <div className="relative w-full aspect-video max-h-[300px] rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-black">
                                        <img
                                            src={URL.createObjectURL(assetFile)}
                                            className="w-full h-full object-contain"
                                            alt="Shared Chart"
                                        />
                                        <button
                                            type="button"
                                            onClick={onClearFile}
                                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition-colors z-10"
                                            disabled={!isSubCategorySelected}
                                        >
                                            <XIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="file"
                                            id="asset-file"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*"
                                            onChange={onFileChange}
                                            disabled={!isSubCategorySelected}
                                        />
                                        <div className="flex flex-col items-center justify-center gap-3 text-gray-500">
                                            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full">
                                                <CameraIcon className="w-8 h-8" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium">{isEnglish ? "Click to upload chart photo" : "לחץ להעלאת תמונת התרשים"}</p>
                                                <p className="text-sm opacity-60">{isEnglish ? "PNG, JPG up to 10MB" : "PNG, JPG עד 10MB"}</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <Textarea
                        name="assetText"
                        id="asset-text"
                        value={assetText}
                        onChange={onTextChange}
                        placeholder={isEnglish ? 'Enter passage text here...' : 'הזן את קטע הקריאה כאן...'}
                        dir={isEnglish ? 'ltr' : 'rtl'}
                        disabled={!isSubCategorySelected}
                        error={textError ? ' ' : undefined}
                    />
                    {showLatex && <LatexPreview content={assetText} />}
                </>
            )}
        </div>
    );
}

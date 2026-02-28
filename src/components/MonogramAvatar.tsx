import React from 'react';

interface MonogramAvatarProps {
    name: string;
    className?: string; // Should include width/height and rounding if not using default
}

const BRAND_PALETTE = [
    '#083A2A', // primary-900
    '#0C4A34', // primary-800
    '#0F5A3F', // primary-700
    '#137353', // primary-600
    '#19A974', // accent-600
    '#22C58B', // accent-500
];

const getMonogram = (name: string) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getDeterministicColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % BRAND_PALETTE.length;
    return BRAND_PALETTE[index];
};

export const MonogramAvatar: React.FC<MonogramAvatarProps> = ({ name, className = "w-12 h-12" }) => {
    const monogram = getMonogram(name);
    const backgroundColor = getDeterministicColor(name);

    return (
        <div
            className={`flex items-center justify-center text-white font-black overflow-hidden shrink-0 shadow-inner transition-transform ${className}`}
            style={{ backgroundColor }}
            aria-label={`Patient avatar: ${name}`}
        >
            <span className="select-none tracking-tighter">
                {monogram}
            </span>
        </div>
    );
};

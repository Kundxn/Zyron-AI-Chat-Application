import React from 'react';

interface OllamaIconProps {
  className?: string;
  size?: number;
}

export const OllamaIcon: React.FC<OllamaIconProps> = ({ className = 'w-16 h-16', size }) => {
  return (
    <svg
      width={size || 64}
      height={size || 64}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      stroke="currentColor"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Left Ear */}
      <path d="M34 32 C30 20, 32 10, 36 10 C40 10, 42 20, 40 30" />
      {/* Right Ear */}
      <path d="M66 32 C70 20, 68 10, 64 10 C60 10, 58 20, 60 30" />
      {/* Head Fluff & Face Outline */}
      <path d="M38 32 C32 30, 24 38, 26 48 C22 55, 25 66, 30 72 C33 76, 36 84, 38 90 M62 32 C68 30, 76 38, 74 48 C78 55, 75 66, 70 72 C67 76, 64 84, 62 90" />
      {/* Head Top Fluff */}
      <path d="M38 32 C42 27, 46 27, 50 28 C54 27, 58 27, 62 32" />
      {/* Left Eye */}
      <circle cx="41" cy="50" r="2.5" fill="currentColor" stroke="none" />
      {/* Right Eye */}
      <circle cx="59" cy="50" r="2.5" fill="currentColor" stroke="none" />
      {/* Muzzle / Snout Outline */}
      <path d="M43 62 C43 56, 57 56, 57 62 C57 68, 43 68, 43 62 Z" />
      {/* Nose & Mouth (Y shape) */}
      <path d="M50 59 L50 63 M48 60 L50 62 L52 60" />
    </svg>
  );
};

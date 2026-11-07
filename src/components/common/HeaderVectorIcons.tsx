import React from 'react';
import { WeatherData } from '../../types';

/**
 * 1. WEATHER VECTOR ICON
 * Dual-color SVG vector:
 * - Golden Yellow Sun (#facc15)
 * - Crisp White Cloud (#ffffff in dark theme, #334155 in light theme)
 * - Blue droplets if raining (#38bdf8)
 */
export const WeatherVectorIcon: React.FC<{
  data?: WeatherData | null;
  className?: string;
}> = ({ data, className = 'w-8 h-8' }) => {
  const isRaining = data?.isRaining || (data?.rainMm && data.rainMm > 0.2);

  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0 transition-all`}
    >
      {/* Golden Yellow Sun & Rays */}
      <g>
        <circle cx="12" cy="11" r="5" fill="#FACC15" />
        <line x1="12" y1="2" x2="12" y2="4" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
        <line x1="18.36" y1="4.64" x2="16.95" y2="6.05" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
        <line x1="21" y1="11" x2="19" y2="11" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
        <line x1="5.64" y1="4.64" x2="7.05" y2="6.05" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
        <line x1="3" y1="11" x2="5" y2="11" stroke="#FACC15" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Cloud (White in dark theme / Slate in light theme) */}
      <path
        d="M20 25H11C8.23858 25 6 22.7614 6 20C6 17.5858 7.71212 15.5714 10.0232 15.0976C10.5962 12.1834 13.149 10 16.2 10C19.2618 10 21.8217 12.1983 22.3853 15.1278C24.4286 15.6322 26 17.4727 26 19.7C26 22.6272 23.3137 25 20 25Z"
        className="fill-slate-700 dark:fill-white transition-colors"
        stroke="#94a3b8"
        strokeWidth="0.5"
      />

      {/* Rain Droplets if Raining */}
      {isRaining && (
        <g stroke="#38BDF8" strokeWidth="2" strokeLinecap="round">
          <line x1="10" y1="27" x2="9" y2="29" />
          <line x1="15" y1="27" x2="14" y2="29" />
          <line x1="20" y1="27" x2="19" y2="29" />
        </g>
      )}
    </svg>
  );
};

/**
 * 2. ORANGE EXPENSE VECTOR ICON (Nuova Spesa - Entirely Orange Outline Style)
 * Sleek orange vector icon: Orange wallet with outgoing cash bill and indicator arrow, clean without white dots.
 */
export const ExpenseWalletVectorIcon: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      {/* Wallet Body in Vivid Orange (#f97316) */}
      <rect
        x="6"
        y="16"
        width="34"
        height="22"
        rx="4"
        stroke="#F97316"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fill-orange-500/10 dark:fill-orange-500/20"
      />

      {/* Wallet Flap in Orange without white dot */}
      <path
        d="M28 22H40V32H28C25.2386 32 23 29.7614 23 27V27C23 24.2386 25.2386 22 28 22Z"
        fill="#F97316"
        stroke="#EA580C"
        strokeWidth="1.5"
      />

      {/* Outgoing Cash Banknote coming out of top left slot in Orange (no white dots) */}
      <rect
        x="12"
        y="8"
        width="20"
        height="12"
        rx="2.5"
        fill="#FB923C"
        stroke="#EA580C"
        strokeWidth="1.5"
      />
      {/* Banknote Inner subtle line */}
      <line x1="17" y1="14" x2="27" y2="14" stroke="#C2410C" strokeWidth="1.8" strokeLinecap="round" />

      {/* Outgoing spending indicator arrow top right */}
      <path
        d="M36 6L42 12M42 12H37M42 12V7"
        stroke="#F97316"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

/**
 * 3. NEW INTERVENTION VECTOR ICON (Inspired by user reference image_9968b099.png and image_31999f0e.png)
 * Worker silhouette + magnifying glass with green leaf.
 */
export const PruningShearsVectorIcon: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      {/* Person/Worker Head Circle (Ref image_9968b099.png) */}
      <circle
        cx="28"
        cy="14"
        r="7"
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth="2.5"
      />

      {/* Worker Shoulder & Torso Outline */}
      <path
        d="M17 38C17 30.5 21.5 27 28 27C34.5 27 39 30.5 39 38"
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Magnifying Glass Circle overlapping bottom left (Ref image_9968b099.png) */}
      <circle
        cx="16"
        cy="30"
        r="8"
        className="fill-slate-100 dark:fill-slate-900 stroke-emerald-500 dark:stroke-emerald-400"
        strokeWidth="2.5"
      />

      {/* Magnifying Glass Handle */}
      <line
        x1="10.5"
        y1="35.5"
        x2="6"
        y2="40"
        className="stroke-emerald-500 dark:stroke-emerald-400"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Green Leaf inside Magnifying Glass */}
      <path
        d="M14 32C14 28 18 27 19 26C19 29 17 33 13 33C14.5 31.5 16.5 30 19 28.5"
        fill="#10B981"
        stroke="#047857"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * 4. INSERT WORKED DAY VECTOR ICON (Inserisci Giornata - Emerald Green Calendar Plus)
 */
export const InsertDayVectorIcon: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      {/* Calendar Outer Sheet in Emerald Green */}
      <rect
        x="8"
        y="10"
        width="32"
        height="30"
        rx="4"
        className="stroke-emerald-600 dark:stroke-emerald-400 fill-emerald-500/10 dark:fill-emerald-500/20"
        strokeWidth="2.8"
      />
      {/* Calendar Top Binders */}
      <line x1="16" y1="6" x2="16" y2="12" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="6" x2="32" y2="12" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
      {/* Calendar Header Line */}
      <line x1="8" y1="18" x2="40" y2="18" stroke="#10B981" strokeWidth="2" />
      
      {/* Big Plus Stamp in Center */}
      <circle cx="24" cy="29" r="7" fill="#10B981" />
      <path
        d="M24 25V33M20 29H28"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * 5. NEW WORKER VECTOR ICON (Nuovo Operaio - User Plus)
 */
export const NewWorkerVectorIcon: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      {/* User Head */}
      <circle
        cx="20"
        cy="16"
        r="7"
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth="2.8"
      />
      {/* User Shoulder */}
      <path
        d="M8 38C8 30.5 13.5 27 20 27C23.5 27 26.5 28 28.5 30"
        className="stroke-emerald-600 dark:stroke-emerald-400"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Plus Badge Top Right */}
      <circle cx="34" cy="28" r="8" fill="#10B981" />
      <path
        d="M34 23V33M29 28H39"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * 6. WORKER SUMMARY VECTOR ICON (Riepilogo Compensi - Amber Bar Chart)
 */
export const WorkerSummaryVectorIcon: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8',
}) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} shrink-0`}
    >
      <rect x="8" y="26" width="6" height="14" rx="2" fill="#F59E0B" />
      <rect x="18" y="18" width="6" height="22" rx="2" fill="#F59E0B" />
      <rect x="28" y="10" width="6" height="30" rx="2" fill="#F59E0B" />
      <path
        d="M8 20L18 12L28 16L38 6"
        stroke="#F59E0B"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};




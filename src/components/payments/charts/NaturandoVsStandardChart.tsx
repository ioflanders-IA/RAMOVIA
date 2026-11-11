import React, { useState, useMemo } from 'react';
import { Job, User } from '../../../types';
import { getJobLaborSummary } from '../../clients/ClientsView';
import { TrendingUp, Layers, Award, Sparkles, Filter } from 'lucide-react';

interface NaturandoVsStandardChartProps {
  jobs: Job[];
  users: User[];
}

export const NaturandoVsStandardChart: React.FC<NaturandoVsStandardChartProps> = ({ jobs, users }) => {
  const [showStandardLine, setShowStandardLine] = useState(true);
  const [showNaturandoLine, setShowNaturandoLine] = useState(true);
  const [showStandardMargin, setShowStandardMargin] = useState(true);
  const [showNaturandoMargin, setShowNaturandoMargin] = useState(true);
  const [showBestMarginTrend, setShowBestMarginTrend] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calcola e ordina tutti i lavori cronologicamente
  const points = useMemo(() => {
    const sorted = [...jobs].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

    let cumRevStd = 0;
    let cumRevNat = 0;
    let cumCostStd = 0;
    let cumCostNat = 0;

    let bestMarginRunningMax = 0;

    return sorted.map((job, idx) => {
      const isNat = !!job.isNaturando;
      const price = Number(job.price) || 0;
      const costs = (job.costs || []).reduce((s, c) => s + (Number(c.amount) || 0), 0);
      const labor = getJobLaborSummary(job, jobs, users).totalLaborCost;

      const naturandoBase = job.naturandoAmount !== undefined && job.naturandoAmount > 0
        ? job.naturandoAmount
        : price;
      const naturandoPct = job.naturandoPercentage !== undefined && job.naturandoPercentage > 0
        ? job.naturandoPercentage
        : 20;
      const naturandoFee = isNat ? Math.round(((naturandoBase * naturandoPct) / 100) * 100) / 100 : 0;

      const totalJobCost = costs + labor + naturandoFee;
      const margin = price - totalJobCost;
      const marginPct = price > 0 ? Math.max(0, Math.min(100, Math.round((margin / price) * 100))) : 0;

      if (isNat) {
        // Per Naturando il ricavo netto Ramovia è (prezzo - quota naturando)
        cumRevNat += Math.max(0, price - naturandoFee);
        cumCostNat += costs + labor;
      } else {
        cumRevStd += price;
        cumCostStd += costs + labor;
      }

      if (marginPct > bestMarginRunningMax) {
        bestMarginRunningMax = marginPct;
      }

      // Data display
      const dateParts = (job.date || '').split('-');
      const shortDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}` : job.date || `L${idx + 1}`;

      return {
        index: idx,
        jobId: job.id,
        title: job.title || 'Lavoro',
        clientName: job.clientName || 'Cliente',
        date: job.date || '',
        shortDate,
        isNaturando: isNat,
        price,
        margin,
        marginPct,
        cumRevStd,
        cumRevNat,
        bestMarginRunningMax,
      };
    });
  }, [jobs, users]);

  // Overall statistics
  const stats = useMemo(() => {
    const stdJobs = points.filter((p) => !p.isNaturando);
    const natJobs = points.filter((p) => p.isNaturando);

    const stdTotalRev = stdJobs.reduce((s, p) => s + p.price, 0);
    const natTotalRev = natJobs.reduce((s, p) => s + p.price, 0);

    const stdAvgMargin = stdJobs.length > 0
      ? Math.round(stdJobs.reduce((s, p) => s + p.marginPct, 0) / stdJobs.length)
      : 0;
    const natAvgMargin = natJobs.length > 0
      ? Math.round(natJobs.reduce((s, p) => s + p.marginPct, 0) / natJobs.length)
      : 0;

    const bestJob = [...points].sort((a, b) => b.marginPct - a.marginPct)[0];

    return {
      stdCount: stdJobs.length,
      natCount: natJobs.length,
      stdTotalRev,
      natTotalRev,
      stdAvgMargin,
      natAvgMargin,
      bestMarginPct: bestJob ? bestJob.marginPct : 0,
      bestJobName: bestJob ? `${bestJob.clientName} (${bestJob.marginPct}%)` : 'N/D',
    };
  }, [points]);

  // Coordinates for SVG (viewBox 0 0 500 220)
  const svgWidth = 500;
  const svgHeight = 220;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 26;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxRev = useMemo(() => {
    const maxVal = Math.max(
      ...points.map((p) => Math.max(p.cumRevStd, p.cumRevNat)),
      500
    );
    return Math.ceil(maxVal / 500) * 500;
  }, [points]);

  // Convert points to SVG coordinates
  const coords = useMemo(() => {
    if (points.length === 0) return [];
    const count = points.length;

    return points.map((p, i) => {
      const x = count === 1 ? padLeft + chartW / 2 : padLeft + (i / (count - 1)) * chartW;
      const yRevStd = padTop + chartH - (p.cumRevStd / maxRev) * chartH;
      const yRevNat = padTop + chartH - (p.cumRevNat / maxRev) * chartH;
      // Per i margini scaliamo su 0 - 100%
      const yMarginStd = padTop + chartH - (p.isNaturando ? 0 : (p.marginPct / 100) * chartH);
      const yMarginNat = padTop + chartH - (!p.isNaturando ? 0 : (p.marginPct / 100) * chartH);
      const yBestMargin = padTop + chartH - (p.bestMarginRunningMax / 100) * chartH;

      return {
        ...p,
        x,
        yRevStd,
        yRevNat,
        yMarginStd,
        yMarginNat,
        yBestMargin,
      };
    });
  }, [points, chartW, chartH, maxRev, padLeft, padTop]);

  // Helper for SVG path
  const makePath = (key: 'yRevStd' | 'yRevNat' | 'yBestMargin') => {
    if (coords.length === 0) return '';
    return coords.reduce((acc, pt, idx) => {
      if (idx === 0) return `M ${pt.x.toFixed(1)} ${pt[key].toFixed(1)}`;
      const prev = coords[idx - 1];
      const cx1 = prev.x + (pt.x - prev.x) / 2;
      const cy1 = prev[key];
      const cx2 = prev.x + (pt.x - prev.x) / 2;
      const cy2 = pt[key];
      return `${acc} C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${pt.x.toFixed(1)} ${pt[key].toFixed(1)}`;
    }, '');
  };

  const pathRevStd = useMemo(() => makePath('yRevStd'), [coords]);
  const pathRevNat = useMemo(() => makePath('yRevNat'), [coords]);
  const pathBestMargin = useMemo(() => makePath('yBestMargin'), [coords]);

  const activeHover = hoveredIndex !== null && coords[hoveredIndex] ? coords[hoveredIndex] : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] shadow-xs space-y-[3px]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1 px-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0" />
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider truncate">
            Analisi lavori per conto terzi
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500">
          <span>Top Margine:</span>
          <span className="text-amber-500 font-extrabold">{stats.bestMarginPct}%</span>
        </div>
      </div>

      {/* 4 Financial KPI Stat Cards - SU UN SOLO RIGO A 3PX */}
      <div className="grid grid-cols-4 gap-[3px] text-center">
        <div className="p-1 px-1 rounded-[5px] bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-between">
          <span className="text-[8.5px] uppercase font-bold text-emerald-700 dark:text-emerald-400 truncate">
            Diretti ({stats.stdCount})
          </span>
          <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">
            € {stats.stdTotalRev}
          </span>
          <span className="font-mono font-semibold text-[9px] text-emerald-600 dark:text-emerald-400 truncate">
            μ {stats.stdAvgMargin}%
          </span>
        </div>

        <div className="p-1 px-1 rounded-[5px] bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 flex flex-col justify-between">
          <span className="text-[8.5px] uppercase font-bold text-purple-700 dark:text-purple-400 truncate">
            Naturando ({stats.natCount})
          </span>
          <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">
            € {stats.natTotalRev}
          </span>
          <span className="font-mono font-semibold text-[9px] text-purple-600 dark:text-purple-400 truncate">
            μ {stats.natAvgMargin}%
          </span>
        </div>

        <div className="p-1 px-1 rounded-[5px] bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 flex flex-col justify-between">
          <span className="text-[8.5px] uppercase font-bold text-amber-700 dark:text-amber-400 truncate">
            Top Margine
          </span>
          <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-xs truncate">
            {stats.bestMarginPct}%
          </span>
          <span className="text-[8.5px] text-slate-500 truncate" title={stats.bestJobName}>
            {stats.bestJobName.split(' ')[0]}
          </span>
        </div>

        <div className="p-1 px-1 rounded-[5px] bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <span className="text-[8.5px] uppercase font-bold text-slate-500 dark:text-slate-400 truncate">
            Spread
          </span>
          <span className="font-mono font-extrabold text-slate-900 dark:text-slate-100 text-xs truncate">
            {stats.stdAvgMargin >= stats.natAvgMargin ? '+' : ''}{stats.stdAvgMargin - stats.natAvgMargin}%
          </span>
          <span className="text-[8.5px] text-slate-500 truncate">
            {stats.stdAvgMargin >= stats.natAvgMargin ? 'Diretti +' : 'Naturando +'}
          </span>
        </div>
      </div>

      {/* SVG Financial Canvas */}
      <div className="relative w-full overflow-hidden select-none bg-slate-950/90 rounded-[5px] border border-slate-800/80 p-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-56 cursor-crosshair overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            // Trova il punto più vicino
            let closestIdx = 0;
            let minDist = Infinity;
            coords.forEach((pt, i) => {
              const dist = Math.abs(pt.x - mouseX);
              if (dist < minDist) {
                minDist = dist;
                closestIdx = i;
              }
            });
            setHoveredIndex(closestIdx);
          }}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="gradStdRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradNatRev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Minimal Financial Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padTop + chartH * (1 - pct);
            const val = Math.round(maxRev * pct);
            return (
              <g key={i}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="0.6"
                  strokeDasharray="2,3"
                  opacity="0.4"
                />
                <text
                  x={padLeft - 4}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9.5"
                  fontWeight="600"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  €{val}
                </text>
              </g>
            );
          })}

          {/* Area Fill under Standard Curve */}
          {showStandardLine && coords.length > 1 && (
            <path
              d={`${pathRevStd} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`}
              fill="url(#gradStdRev)"
            />
          )}

          {/* Area Fill under Naturando Curve */}
          {showNaturandoLine && coords.length > 1 && (
            <path
              d={`${pathRevNat} L ${coords[coords.length - 1].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} L ${coords[0].x.toFixed(1)} ${(padTop + chartH).toFixed(1)} Z`}
              fill="url(#gradNatRev)"
            />
          )}

          {/* Line 1: Standard Revenue Trend */}
          {showStandardLine && (
            <path
              d={pathRevStd}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Line 2: Naturando Revenue Trend */}
          {showNaturandoLine && (
            <path
              d={pathRevNat}
              fill="none"
              stroke="#a855f7"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Line 5: Best Margin Trajectory Envelope */}
          {showBestMarginTrend && (
            <path
              d={pathBestMargin}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.3"
              strokeDasharray="3,2"
              strokeLinecap="round"
            />
          )}

          {/* Discrete Margins Data Points */}
          {coords.map((pt, i) => {
            const isNat = pt.isNaturando;
            const yM = isNat ? pt.yMarginNat : pt.yMarginStd;

            return (
              <g key={i}>
                {/* Standard Margins Points */}
                {!isNat && showStandardMargin && (
                  <circle
                    cx={pt.x}
                    cy={yM}
                    r={hoveredIndex === i ? 4 : 2.5}
                    fill="#14b8a6"
                    stroke="#042f2e"
                    strokeWidth="1"
                    className="transition-all"
                  />
                )}
                {/* Naturando Margins Points */}
                {isNat && showNaturandoMargin && (
                  <circle
                    cx={pt.x}
                    cy={yM}
                    r={hoveredIndex === i ? 4 : 2.5}
                    fill="#d946ef"
                    stroke="#3b0764"
                    strokeWidth="1"
                    className="transition-all"
                  />
                )}
              </g>
            );
          })}

          {/* X Axis Dates */}
          {coords.map((pt, i) => {
            // Show every Nth label to prevent clutter
            const step = Math.max(1, Math.floor(coords.length / 6));
            if (i % step !== 0 && i !== coords.length - 1) return null;
            return (
              <text
                key={i}
                x={pt.x}
                y={svgHeight - 8}
                textAnchor="middle"
                fontSize="9"
                fontWeight="600"
                fill="#94a3b8"
                fontFamily="monospace"
              >
                {pt.shortDate}
              </text>
            );
          })}

          {/* Crosshair on Hover */}
          {activeHover && (
            <g>
              <line
                x1={activeHover.x}
                y1={padTop}
                x2={activeHover.x}
                y2={padTop + chartH}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle
                cx={activeHover.x}
                cy={activeHover.isNaturando ? activeHover.yRevNat : activeHover.yRevStd}
                r="4.5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Dynamic Financial Tooltip Card */}
        {activeHover && (
          <div
            className="absolute z-20 pointer-events-none p-1.5 rounded-[5px] bg-slate-900/95 border border-slate-700 text-white shadow-xl text-[10px] space-y-0.5 animate-in fade-in duration-75"
            style={{
              left: `${Math.min(svgWidth - 140, Math.max(10, (activeHover.x / svgWidth) * 100))}%`,
              top: '8px',
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-0.5 font-bold">
              <span className="truncate max-w-[110px]">{activeHover.clientName}</span>
              <span className={`px-1 py-0.2 rounded text-[8px] uppercase ${activeHover.isNaturando ? 'bg-purple-900/80 text-purple-200' : 'bg-emerald-900/80 text-emerald-200'}`}>
                {activeHover.isNaturando ? 'Naturando' : 'Diretto'}
              </span>
            </div>
            <div className="flex justify-between gap-3 font-mono">
              <span className="text-slate-400">Prezzo Lavoro:</span>
              <span className="font-bold text-slate-100">€ {activeHover.price}</span>
            </div>
            <div className="flex justify-between gap-3 font-mono">
              <span className="text-slate-400">Margine Utile:</span>
              <span className="font-bold text-emerald-400">€ {activeHover.margin} ({activeHover.marginPct}%)</span>
            </div>
            <div className="flex justify-between gap-3 font-mono text-[9px] pt-0.5 border-t border-slate-800/80">
              <span className="text-amber-400">Top Envelope:</span>
              <span className="font-bold text-amber-300">{activeHover.bestMarginRunningMax}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Financial Controls / Toggles - SU UN SOLO RIGO A 5 COLONNE */}
      <div className="grid grid-cols-5 gap-[2px] pt-0.5 text-[8px] sm:text-[9.5px]">
        <button
          type="button"
          onClick={() => setShowStandardLine(!showStandardLine)}
          className={`px-1 py-1 rounded-[4px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
            showStandardLine
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
          }`}
          title="Mostra/Nascondi curva Lavori Diretti"
        >
          <span className="w-1.5 h-0.5 bg-emerald-500 rounded shrink-0" />
          <span className="truncate">Diretti</span>
        </button>

        <button
          type="button"
          onClick={() => setShowNaturandoLine(!showNaturandoLine)}
          className={`px-1 py-1 rounded-[4px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
            showNaturandoLine
              ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300'
              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
          }`}
          title="Mostra/Nascondi curva Lavori Naturando"
        >
          <span className="w-1.5 h-0.5 bg-purple-500 rounded shrink-0" />
          <span className="truncate">Naturando</span>
        </button>

        <button
          type="button"
          onClick={() => setShowStandardMargin(!showStandardMargin)}
          className={`px-1 py-1 rounded-[4px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
            showStandardMargin
              ? 'bg-teal-500/15 border-teal-500 text-teal-700 dark:text-teal-300'
              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
          }`}
          title="Mostra/Nascondi punti Margini Diretti"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
          <span className="truncate">Marg. Dir</span>
        </button>

        <button
          type="button"
          onClick={() => setShowNaturandoMargin(!showNaturandoMargin)}
          className={`px-1 py-1 rounded-[4px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
            showNaturandoMargin
              ? 'bg-fuchsia-500/15 border-fuchsia-500 text-fuchsia-700 dark:text-fuchsia-300'
              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
          }`}
          title="Mostra/Nascondi punti Margini Naturando"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shrink-0" />
          <span className="truncate">Marg. Nat</span>
        </button>

        <button
          type="button"
          onClick={() => setShowBestMarginTrend(!showBestMarginTrend)}
          className={`px-1 py-1 rounded-[4px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-0.5 min-w-0 ${
            showBestMarginTrend
              ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300'
              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
          }`}
          title="Mostra/Nascondi picco massimo margine"
        >
          <Sparkles className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          <span className="truncate">Top Peak</span>
        </button>
      </div>
    </div>
  );
};

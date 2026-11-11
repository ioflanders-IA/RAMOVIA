import React, { useState, useMemo } from 'react';
import { Job, User, ExpenseRecord, WorkerPayout, WorkedDay } from '../../../types';
import { Wallet, TrendingUp, DollarSign, Activity, Zap, CheckCircle2 } from 'lucide-react';

interface CashflowPerformanceChartProps {
  jobs: Job[];
  users: User[];
  allCombinedExpenses: ExpenseRecord[];
  payouts: WorkerPayout[];
  workedDays: WorkedDay[];
}

export const CashflowPerformanceChart: React.FC<CashflowPerformanceChartProps> = ({
  jobs,
  users,
  allCombinedExpenses,
  payouts,
  workedDays,
}) => {
  const [showInflow, setShowInflow] = useState(true);
  const [showOutflow, setShowOutflow] = useState(true);
  const [showNetCash, setShowNetCash] = useState(true);
  const [showLaborEfficiency, setShowLaborEfficiency] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Costruisci la timeline cronologica di cassa aggregando incassi e spese
  const timelineData = useMemo(() => {
    // 1. Raccogli tutti gli eventi finanziari con data
    const dateMap = new Map<
      string,
      {
        date: string;
        inflow: number;
        expenseOutflow: number;
        laborOutflow: number;
        jobsPriceTotal: number;
        laborCostTotal: number;
      }
    >();

    const getOrInit = (d: string) => {
      const cleanDate = d.slice(0, 10);
      if (!dateMap.has(cleanDate)) {
        dateMap.set(cleanDate, {
          date: cleanDate,
          inflow: 0,
          expenseOutflow: 0,
          laborOutflow: 0,
          jobsPriceTotal: 0,
          laborCostTotal: 0,
        });
      }
      return dateMap.get(cleanDate)!;
    };

    // Incassi da acconti o lavori completati
    jobs.forEach((job) => {
      if (job.installments && job.installments.length > 0) {
        job.installments.forEach((inst) => {
          if (inst.date) {
            const entry = getOrInit(inst.date);
            entry.inflow += Number(inst.amount) || 0;
          }
        });
      } else if (job.paymentStatus === 'paid' && job.date) {
        const entry = getOrInit(job.date);
        entry.inflow += Number(job.price) || 0;
      } else if (job.paidAmount && job.paidAmount > 0 && job.date) {
        const entry = getOrInit(job.date);
        entry.inflow += Number(job.paidAmount) || 0;
      }

      // Valore prodotto per calcolo efficienza
      if (job.date) {
        const entry = getOrInit(job.date);
        entry.jobsPriceTotal += Number(job.price) || 0;
      }
    });

    // Spese cantiere combinate (smaltimento, carburante, manutenzioni)
    allCombinedExpenses.forEach((exp) => {
      const d = exp.date || exp.createdAt?.slice(0, 10);
      if (d) {
        const entry = getOrInit(d);
        entry.expenseOutflow += Number(exp.amount) || 0;
      }
    });

    // Costo manodopera operai per data
    workedDays.forEach((wd) => {
      if (wd.date) {
        const entry = getOrInit(wd.date);
        const worker = users.find((u) => u.uid === wd.workerId);
        const dayRate = worker?.dailyRate || (wd.dayType === 'half' ? 40 : 80);
        const cost = wd.dayType === 'half' ? Math.round(dayRate / 2) : dayRate;
        entry.laborOutflow += cost;
        entry.laborCostTotal += cost;
      }
    });

    // Se non ci sono date, crea punti default
    if (dateMap.size === 0) {
      const today = new Date().toISOString().slice(0, 10);
      getOrInit(today);
    }

    // Ordina cronologicamente
    const sortedDates = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Calcola traiettorie cumulative e indice di efficienza
    let runningInflow = 0;
    let runningOutflow = 0;
    let runningJobsVal = 0;
    let runningLaborCost = 0;

    return sortedDates.map((item, idx) => {
      runningInflow += item.inflow;
      runningOutflow += item.expenseOutflow + item.laborOutflow;
      runningJobsVal += item.jobsPriceTotal;
      runningLaborCost += item.laborCostTotal;

      const netCash = runningInflow - runningOutflow;

      // Moltiplicatore resa manodopera: (valore prodotto / costo operai). Benchmark sano > 2.5x
      const laborMultiplier =
        runningLaborCost > 0
          ? Math.round((runningJobsVal / runningLaborCost) * 10) / 10
          : 3.0;

      const parts = item.date.split('-');
      const shortDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : item.date;

      return {
        index: idx,
        date: item.date,
        shortDate,
        inflowDaily: item.inflow,
        outflowDaily: item.expenseOutflow + item.laborOutflow,
        cumInflow: runningInflow,
        cumOutflow: runningOutflow,
        netCash,
        laborMultiplier,
      };
    });
  }, [jobs, users, allCombinedExpenses, workedDays]);

  // Financial Summary Stats
  const summary = useMemo(() => {
    if (timelineData.length === 0) {
      return {
        totalInflow: 0,
        totalOutflow: 0,
        netLiquidity: 0,
        avgMultiplier: 1.0,
        isPositive: true,
      };
    }
    const last = timelineData[timelineData.length - 1];
    return {
      totalInflow: last.cumInflow,
      totalOutflow: last.cumOutflow,
      netLiquidity: last.netCash,
      avgMultiplier: last.laborMultiplier,
      isPositive: last.netCash >= 0,
    };
  }, [timelineData]);

  // SVG Dimension Constants
  const svgWidth = 500;
  const svgHeight = 220;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 26;

  const chartW = svgWidth - padLeft - padRight;
  const chartH = svgHeight - padTop - padBottom;

  const maxVal = useMemo(() => {
    const vals = timelineData.map((d) => Math.max(d.cumInflow, d.cumOutflow, Math.abs(d.netCash)));
    const top = Math.max(...vals, 500);
    return Math.ceil(top / 500) * 500;
  }, [timelineData]);

  const minVal = useMemo(() => {
    const netMins = timelineData.map((d) => d.netCash);
    const lowest = Math.min(...netMins, 0);
    return lowest < 0 ? Math.floor(lowest / 500) * 500 : 0;
  }, [timelineData]);

  const valueRange = maxVal - minVal || 1;

  // Coordinate computation
  const coords = useMemo(() => {
    const count = timelineData.length;
    return timelineData.map((d, i) => {
      const x = count === 1 ? padLeft + chartW / 2 : padLeft + (i / (count - 1)) * chartW;
      const yInflow = padTop + chartH - ((d.cumInflow - minVal) / valueRange) * chartH;
      const yOutflow = padTop + chartH - ((d.cumOutflow - minVal) / valueRange) * chartH;
      const yNetCash = padTop + chartH - ((d.netCash - minVal) / valueRange) * chartH;
      // Resa operai scalata su asse destro (0x - 5x)
      const yMultiplier = padTop + chartH - (Math.min(5, d.laborMultiplier) / 5) * chartH;

      return {
        ...d,
        x,
        yInflow,
        yOutflow,
        yNetCash,
        yMultiplier,
      };
    });
  }, [timelineData, chartW, chartH, padLeft, padTop, minVal, valueRange]);

  // Curve Generator
  const makePath = (key: 'yInflow' | 'yOutflow' | 'yNetCash' | 'yMultiplier') => {
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

  const pathInflow = useMemo(() => makePath('yInflow'), [coords]);
  const pathOutflow = useMemo(() => makePath('yOutflow'), [coords]);
  const pathNetCash = useMemo(() => makePath('yNetCash'), [coords]);
  const pathMultiplier = useMemo(() => makePath('yMultiplier'), [coords]);

  const activeHover = hoveredIdx !== null && coords[hoveredIdx] ? coords[hoveredIdx] : null;

  // Zero-line Y coordinate for net cash
  const zeroY = padTop + chartH - ((0 - minVal) / valueRange) * chartH;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[7px] p-[3px] shadow-xs space-y-[3px]">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <Wallet className="w-4 h-4 text-sky-500 shrink-0" />
          <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider truncate">
            Analisi redditività
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold">
          <span className="text-slate-500">Saldo Netto:</span>
          <span className={summary.isPositive ? 'text-emerald-500' : 'text-rose-500'}>
            € {summary.netLiquidity.toFixed(0)}
          </span>
        </div>
      </div>

      {/* 4 Financial KPI Stat Cards - SU UN SOLO RIGO A 3PX */}
      <div className="grid grid-cols-4 gap-[3px] text-center">
        <div className="p-1 px-1 rounded-[5px] bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-between">
          <span className="text-[8.5px] uppercase font-bold text-emerald-700 dark:text-emerald-400 truncate">
            Incassi
          </span>
          <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs truncate">
            € {summary.totalInflow.toFixed(0)}
          </span>
          <span className="text-[8.5px] text-slate-500 font-semibold truncate">
            Entrate
          </span>
        </div>

        <div className="p-1 px-1 rounded-[5px] bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 flex flex-col justify-between">
          <span className="text-[8.5px] uppercase font-bold text-rose-700 dark:text-rose-400 truncate">
            Uscite
          </span>
          <span className="font-mono font-extrabold text-rose-600 dark:text-rose-400 text-xs truncate">
            € {summary.totalOutflow.toFixed(0)}
          </span>
          <span className="text-[8.5px] text-slate-500 font-semibold truncate">
            Spese
          </span>
        </div>

        <div className="p-1 px-1 rounded-[5px] bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/50 flex flex-col justify-between">
          <span className="text-[8.5px] uppercase font-bold text-sky-700 dark:text-sky-400 truncate">
            Saldo Netto
          </span>
          <span className={`font-mono font-extrabold text-xs truncate ${summary.isPositive ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'}`}>
            € {summary.netLiquidity.toFixed(0)}
          </span>
          <span className="text-[8.5px] text-slate-500 font-semibold truncate">
            {summary.isPositive ? 'Attivo' : 'Deficit'}
          </span>
        </div>

        <div className="p-1 px-1 rounded-[5px] bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50 flex flex-col justify-between">
          <span className="text-[8.5px] uppercase font-bold text-amber-700 dark:text-amber-400 truncate">
            Resa
          </span>
          <span className="font-mono font-extrabold text-amber-600 dark:text-amber-400 text-xs truncate">
            {summary.avgMultiplier}x
          </span>
          <span className="text-[8.5px] text-slate-500 font-semibold truncate">
            Manodopera
          </span>
        </div>
      </div>

      {/* SVG Canvas Stile TradingView Asset */}
      <div className="relative w-full overflow-hidden select-none bg-slate-950/90 rounded-[5px] border border-slate-800/80 p-1">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-56 cursor-crosshair overflow-visible"
          onMouseLeave={() => setHoveredIdx(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - rect.left) / rect.width) * svgWidth;
            let closest = 0;
            let minD = Infinity;
            coords.forEach((pt, i) => {
              const d = Math.abs(pt.x - mouseX);
              if (d < minD) {
                minD = d;
                closest = i;
              }
            });
            setHoveredIdx(closest);
          }}
        >
          <defs>
            <linearGradient id="gradNetCash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradInflow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padTop + chartH * (1 - pct);
            const val = Math.round(minVal + valueRange * pct);
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
                  opacity="0.35"
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

          {/* Zero Break-even line if negative values exist */}
          {minVal < 0 && (
            <line
              x1={padLeft}
              y1={zeroY}
              x2={svgWidth - padRight}
              y2={zeroY}
              stroke="#e2e8f0"
              strokeWidth="0.8"
              strokeDasharray="4,2"
              opacity="0.6"
            />
          )}

          {/* Area Fill for Net Cash */}
          {showNetCash && coords.length > 1 && (
            <path
              d={`${pathNetCash} L ${coords[coords.length - 1].x.toFixed(1)} ${zeroY.toFixed(1)} L ${coords[0].x.toFixed(1)} ${zeroY.toFixed(1)} Z`}
              fill="url(#gradNetCash)"
            />
          )}

          {/* Line 1: Inflow Trend (Emerald) */}
          {showInflow && (
            <path
              d={pathInflow}
              fill="none"
              stroke="#10b981"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Line 2: Outflow Trend (Coral Red) */}
          {showOutflow && (
            <path
              d={pathOutflow}
              fill="none"
              stroke="#f43f5e"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Line 3: Net Cashflow (Sky Blue) */}
          {showNetCash && (
            <path
              d={pathNetCash}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Line 4: Labor Efficiency Multiplier (Gold Dash) */}
          {showLaborEfficiency && (
            <path
              d={pathMultiplier}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.2"
              strokeDasharray="3,2"
              strokeLinecap="round"
            />
          )}

          {/* Data Points on Hover / Ends */}
          {coords.map((pt, i) => (
            <g key={i}>
              {showNetCash && (
                <circle
                  cx={pt.x}
                  cy={pt.yNetCash}
                  r={hoveredIdx === i ? 4 : 2}
                  fill="#38bdf8"
                  stroke="#082f49"
                  strokeWidth="1"
                />
              )}
            </g>
          ))}

          {/* X Axis Dates */}
          {coords.map((pt, i) => {
            const step = Math.max(1, Math.floor(coords.length / 6));
            if (i % step !== 0 && i !== coords.length - 1) return null;
            return (
              <text
                key={i}
                x={pt.x}
                y={svgHeight - 10}
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

          {/* Interactive Crosshair */}
          {activeHover && (
            <g>
              <line
                x1={activeHover.x}
                y1={padTop}
                x2={activeHover.x}
                y2={padTop + chartH}
                stroke="#94a3b8"
                strokeWidth="0.8"
                strokeDasharray="2,2"
              />
              <circle
                cx={activeHover.x}
                cy={activeHover.yNetCash}
                r="4.5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Dynamic Tooltip */}
        {activeHover && (
          <div
            className="absolute z-20 pointer-events-none p-1.5 rounded-[5px] bg-slate-900/95 border border-slate-700 text-white shadow-xl text-[10px] space-y-0.5 animate-in fade-in duration-75"
            style={{
              left: `${Math.min(svgWidth - 140, Math.max(10, (activeHover.x / svgWidth) * 100))}%`,
              top: '8px',
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-0.5 font-bold">
              <span>{activeHover.date}</span>
              <span className={`font-mono ${activeHover.netCash >= 0 ? 'text-sky-400' : 'text-rose-400'}`}>
                Net: €{activeHover.netCash.toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between gap-3 font-mono">
              <span className="text-emerald-400">Incassato Cum.:</span>
              <span className="font-bold">€ {activeHover.cumInflow.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-3 font-mono">
              <span className="text-rose-400">Uscite Cum.:</span>
              <span className="font-bold">€ {activeHover.cumOutflow.toFixed(0)}</span>
            </div>
            <div className="flex justify-between gap-3 font-mono text-[9px] pt-0.5 border-t border-slate-800/80">
              <span className="text-amber-400">Resa Manodopera:</span>
              <span className="font-bold text-amber-300">{activeHover.laborMultiplier}x</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Financial Toggles - SU UN SOLO RIGO A 4 COLONNE */}
      <div className="grid grid-cols-4 gap-[2px] pt-0.5 text-[8px] sm:text-[9.5px]">
        <button
          type="button"
          onClick={() => setShowInflow(!showInflow)}
          className={`px-1 py-1 rounded-[4px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
            showInflow
              ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300'
              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
          }`}
          title="Mostra/Nascondi Incassi"
        >
          <span className="w-1.5 h-0.5 bg-emerald-500 rounded shrink-0" />
          <span className="truncate">Incassi</span>
        </button>

        <button
          type="button"
          onClick={() => setShowOutflow(!showOutflow)}
          className={`px-1 py-1 rounded-[4px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
            showOutflow
              ? 'bg-rose-500/15 border-rose-500 text-rose-700 dark:text-rose-300'
              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
          }`}
          title="Mostra/Nascondi Uscite"
        >
          <span className="w-1.5 h-0.5 bg-rose-500 rounded shrink-0" />
          <span className="truncate">Uscite</span>
        </button>

        <button
          type="button"
          onClick={() => setShowNetCash(!showNetCash)}
          className={`px-1 py-1 rounded-[4px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
            showNetCash
              ? 'bg-sky-500/15 border-sky-500 text-sky-700 dark:text-sky-300'
              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
          }`}
          title="Mostra/Nascondi Saldo Cassa"
        >
          <span className="w-1.5 h-0.5 bg-sky-400 rounded shrink-0" />
          <span className="truncate">Saldo Cassa</span>
        </button>

        <button
          type="button"
          onClick={() => setShowLaborEfficiency(!showLaborEfficiency)}
          className={`px-1 py-1 rounded-[4px] font-bold border transition-colors cursor-pointer flex items-center justify-center gap-1 min-w-0 ${
            showLaborEfficiency
              ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300'
              : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400 opacity-60'
          }`}
          title="Mostra/Nascondi Resa Operai"
        >
          <Zap className="w-2.5 h-2.5 text-amber-500 shrink-0" />
          <span className="truncate">Resa Operai</span>
        </button>
      </div>
    </div>
  );
};

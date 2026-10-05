import { motion, useReducedMotion } from 'framer-motion';

interface TopBarProps {
    title: string;
    status: string;
    isLive: boolean;
    showTestCluster: boolean;
    onToggleTestCluster: () => void;
    showTestClusterToggle: boolean;
    sourceCounts: Record<string, number>;
    lastIngestion: string | null;
    sourceStatuses: Record<string, string>;
}

export default function TopBar({
    title,
    status,
    isLive,
    showTestCluster,
    onToggleTestCluster,
    showTestClusterToggle,
    sourceCounts,
    lastIngestion,
    sourceStatuses,
}: TopBarProps) {
    const reduceMotion = useReducedMotion();
    const telegramState = sourceStatuses.telegram || (isLive ? 'LIVE' : 'STALE');
    return (
        <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight">{title}</h2>

            <div className="flex items-center gap-3">
                {showTestClusterToggle && (
                    <button
                        onClick={onToggleTestCluster}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${showTestCluster
                                ? 'bg-slate-200 border-slate-300 text-slate-700'
                                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                            }`}
                    >
                        {showTestCluster ? '✓ Test cluster injected' : 'Inject test cluster'}
                    </button>
                )}
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${isLive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                    {status}
                </span>
                <span className="text-[10px] text-slate-500 hidden lg:inline">
                    <span className={telegramState === 'LIVE' ? 'text-emerald-700' : telegramState === 'ERROR' ? 'text-rose-700' : 'text-amber-700'}><motion.span key={telegramState} initial={reduceMotion ? false : { opacity: 0.45, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: reduceMotion ? 0 : 0.24, ease: 'easeOut' }} className="mr-1 inline-block">●</motion.span>{telegramState} Telegram {sourceCounts.telegram || 0}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-slate-600">◉ SIMULATION Scenario Stream {sourceCounts.demo || 0}</span>
                    {lastIngestion ? ` · Last ingestion: ${new Date(lastIngestion).toLocaleTimeString()}` : ''}
                </span>
            </div>
        </div>
    );
}

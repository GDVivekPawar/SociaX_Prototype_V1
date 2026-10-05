interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: '◱' },
    { id: 'feed', label: 'News Feed', icon: '☰' },
    { id: 'network', label: 'Network', icon: '◈' },
    { id: 'narratives', label: 'Early Warning', icon: '◉' },
    { id: 'whatif', label: 'What-If Simulator', icon: '◆' },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
    return (
        <aside className="w-56 bg-[#152238] flex flex-col flex-shrink-0 h-screen sticky top-0">
            <div className="px-5 py-5 border-b border-white/10">
                <h1 className="text-lg font-semibold text-white tracking-tight">SociaX</h1>
                <p className="text-xs text-slate-400 mt-0.5">Narrative Intelligence</p>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV_ITEMS.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                            }`}
                    >
                        <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div className="px-5 py-4 border-t border-white/10">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                    SIH 2026 · PS 26152
                    <br />Team CodeCatalysts
                </p>
            </div>
        </aside>
    );
}

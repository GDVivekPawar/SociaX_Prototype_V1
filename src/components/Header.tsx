interface HeaderProps {
  status: string;
  isLive: boolean;
}

export default function Header({ status, isLive }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight">SociaX</h1>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">Narrative Intelligence</span>
      </div>
      
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
        <a href="#feed" className="hover:text-amber-600 transition-colors">News Feed</a>
        <a href="#graphs" className="hover:text-amber-600 transition-colors">Graphs</a>
        <a href="#whatif" className="hover:text-amber-600 transition-colors">What-If Simulator</a>
      </nav>

      <div className="flex items-center gap-4">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
          isLive 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-amber-50 text-amber-700 border border-amber-200'
        }`}>
          {status}
        </span>
      </div>
    </header>
  );
}

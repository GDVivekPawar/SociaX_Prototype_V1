import type { CoordinationResult } from '../types';

interface CoordinationAlertProps {
  coordination: CoordinationResult;
  showTestCluster: boolean;
}

export default function CoordinationAlert({ coordination, showTestCluster }: CoordinationAlertProps) {
  return (
    <div className="card p-4">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">Top 3 Coordination Signals</h2>

      {!coordination.detected ? (
        <div className="py-6 text-center">
          <div className="text-2xl mb-2 opacity-40">🔍</div>
          <p className="text-sm text-slate-400">{coordination.summary}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">{coordination.summary}</p>
          {coordination.clusters.slice(0, 3).map(cluster => {
            const isSynthetic = cluster.posts.some(p => p._synthetic);
            return (
              <div
                key={cluster.id}
                className={`p-3 rounded-lg ${
                  isSynthetic && showTestCluster
                    ? 'border-2 border-dashed border-slate-300 bg-slate-50'
                    : 'border border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Cluster #{cluster.id}
                  </span>
                  {isSynthetic && showTestCluster && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-500 font-medium">
                      Synthetic test cluster
                    </span>
                  )}
                </div>

                {/* Evidence */}
                <div className="grid grid-cols-4 gap-2 mb-2">
                  <div className="text-center p-2 rounded bg-amber-50">
                    <div className="text-xs font-semibold text-amber-700">{Math.round((cluster.evidence.coordinationScore || 0) * 100)}%</div>
                    <div className="text-[10px] text-slate-400">Coordination</div>
                  </div>
                  <div className="text-center p-2 rounded bg-slate-50">
                    <div className="text-xs font-semibold text-slate-700">
                      {cluster.evidence.timeWindow}
                    </div>
                    <div className="text-[10px] text-slate-400">Time Window</div>
                  </div>
                  <div className="text-center p-2 rounded bg-slate-50">
                    <div className="text-xs font-semibold text-slate-700">
                      {Math.round(cluster.evidence.avgSimilarity * 100)}%
                    </div>
                    <div className="text-[10px] text-slate-400">Avg Similarity</div>
                  </div>
                  <div className="text-center p-2 rounded bg-slate-50">
                    <div className="text-xs font-semibold text-slate-700">
                      {cluster.evidence.pairCount}
                    </div>
                    <div className="text-[10px] text-slate-400">Pairs</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">Shared signal: <span className="font-medium text-slate-700">{cluster.evidence.sharedTopic || 'similar language'}</span></p>

                {/* Accounts */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                    Accounts involved
                  </span>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {cluster.accounts.map(account => (
                      <span
                        key={account}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        {account}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

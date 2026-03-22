const STYLES: Record<string, { badge: string; label: string }> = {
  pending: { badge: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400", label: "PENDING" },
  reviewed: { badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "REVIEWED" },
  ok: { badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", label: "OK" },
  fail: { badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "FAIL" },
};

export function StatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? STYLES.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-xs font-medium ${s.badge}`}>
      {s.label}
    </span>
  );
}

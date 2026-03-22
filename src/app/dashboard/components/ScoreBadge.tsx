export function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) {
    return <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">--</span>;
  }
  const color =
    score >= 80
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : score >= 60
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
  return (
    <span className={`rounded px-1.5 py-0.5 font-mono text-xs font-medium ${color}`}>
      {score}
    </span>
  );
}

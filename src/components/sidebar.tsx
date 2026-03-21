"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n, localeLabels, type Locale } from "@/lib/i18n";

const environmentKeys = ["default", "storeA", "storeB", "team1"] as const;
const environmentIds: Record<(typeof environmentKeys)[number], string> = {
  default: "default",
  storeA: "store-a",
  storeB: "store-b",
  team1: "team-1",
};

const navKeys = ["dashboard", "staff", "tasks", "evaluations", "agent", "settings"] as const;
const navPaths: Record<(typeof navKeys)[number], string> = {
  dashboard: "",
  staff: "/staff",
  tasks: "/tasks",
  evaluations: "/evaluations",
  agent: "/agent",
  settings: "/settings",
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();

  const segments = pathname.split("/").filter(Boolean);
  const currentId = segments.length >= 2 ? segments[1] : "default";
  const basePath = `/dashboard/${currentId}`;

  useEffect(() => {
    for (const key of environmentKeys) {
      for (const nav of navKeys) {
        router.prefetch(`/dashboard/${environmentIds[key]}${navPaths[nav]}`);
      }
    }
  }, [router]);

  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    router.push(`/dashboard/${e.target.value}`);
  };

  return (
    <aside className="flex w-60 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center border-b border-zinc-200 px-5 dark:border-zinc-800">
        <select
          value={currentId}
          onChange={handleEnvironmentChange}
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm font-bold dark:border-zinc-700 dark:bg-zinc-900"
        >
          {environmentKeys.map((key) => (
            <option key={key} value={environmentIds[key]}>
              {t.env[key]}
            </option>
          ))}
        </select>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navKeys.map((key) => {
          const href = `${basePath}${navPaths[key]}`;
          const isActive = pathname === href;
          return (
            <Link
              key={key}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              {t.nav[key]}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <select
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          {(Object.keys(localeLabels) as Locale[]).map((l) => (
            <option key={l} value={l}>
              {localeLabels[l]}
            </option>
          ))}
        </select>
      </div>
    </aside>
  );
}

"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const environments = [
  { id: "default", label: "Default" },
  { id: "store-a", label: "Store A" },
  { id: "store-b", label: "Store B" },
  { id: "team-1", label: "Team 1" },
];

const navItems = [
  { label: "Dashboard", path: "" },
  { label: "Staff", path: "/staff" },
  { label: "Evaluations", path: "/evaluations" },
  { label: "Rewards", path: "/rewards" },
  { label: "Settings", path: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Extract current id from pathname: /dashboard/[id]/...
  const segments = pathname.split("/").filter(Boolean);
  const currentId = segments.length >= 2 ? segments[1] : "default";
  const basePath = `/dashboard/${currentId}`;

  // Prefetch all environment + nav combinations
  useEffect(() => {
    for (const env of environments) {
      for (const item of navItems) {
        router.prefetch(`/dashboard/${env.id}${item.path}`);
      }
    }
  }, [router]);

  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    router.push(`/dashboard/${newId}`);
  };

  return (
    <aside className="flex w-60 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center border-b border-zinc-200 px-5 dark:border-zinc-800">
        <select
          value={currentId}
          onChange={handleEnvironmentChange}
          className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm font-bold dark:border-zinc-700 dark:bg-zinc-900"
        >
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.label}
            </option>
          ))}
        </select>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const href = `${basePath}${item.path}`;
          const isActive = pathname === href;
          return (
            <Link
              key={item.path}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

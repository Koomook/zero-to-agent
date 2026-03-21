"use client";

import { useI18n } from "@/lib/i18n";

const mockStaff = [
  { id: "1", name: "Taro Tanaka" },
  { id: "2", name: "Hanako Sato" },
  { id: "3", name: "Ichiro Suzuki" },
  { id: "4", name: "Misaki Takahashi" },
  { id: "5", name: "Kenta Ito" },
];

export default function StaffPage() {
  const { t } = useI18n();

  return (
    <div className="flex-1 p-8">
      <h1 className="mb-6 text-2xl font-bold">{t.staffPage.title}</h1>
      <ul className="space-y-2">
        {mockStaff.map((staff) => (
          <li
            key={staff.id}
            className="rounded-md border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
          >
            {staff.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

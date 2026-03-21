"use client";

import { use } from "react";
import { useI18n } from "@/lib/i18n";

type Props = {
  params: Promise<{ id: string }>;
};

export default function DashboardDetailPage({ params }: Props) {
  const { id } = use(params);
  const { t } = useI18n();

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-bold">{t.nav.dashboard} — {id}</h1>
    </div>
  );
}

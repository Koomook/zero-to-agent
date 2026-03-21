type Props = {
  params: Promise<{ id: string }>;
};

export default async function DashboardDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="flex-1 p-8">
      <h1 className="text-2xl font-bold">Dashboard — {id}</h1>
    </div>
  );
}

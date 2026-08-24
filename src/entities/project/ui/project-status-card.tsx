type ProjectStatusCardProps = {
  label: string;
  value: string;
};

export function ProjectStatusCard({ label, value }: ProjectStatusCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

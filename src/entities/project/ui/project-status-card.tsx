type ProjectStatusCardProps = {
  label: string;
  value: string;
};

export function ProjectStatusCard({ label, value }: ProjectStatusCardProps) {
  return (
    <div className="border-line bg-surface rounded-2xl border p-5">
      <p className="text-muted text-sm">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

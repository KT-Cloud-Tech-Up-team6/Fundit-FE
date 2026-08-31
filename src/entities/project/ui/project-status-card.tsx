type ProjectStatusCardProps = {
  label: string;
  value: string;
};

export function ProjectStatusCard({ label, value }: ProjectStatusCardProps) {
  return (
    <div className="border-border-default bg-layer-surface-default rounded-md border p-5">
      <p className="text-body-s text-text-secondary">{label}</p>
      <p className="text-heading-m mt-2">{value}</p>
    </div>
  );
}

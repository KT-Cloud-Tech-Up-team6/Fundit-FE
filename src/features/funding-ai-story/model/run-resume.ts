export async function resolveFundingStoryRunId(
  pendingRunId: string | null,
  createRun: () => Promise<{ run_id: string }>,
) {
  if (pendingRunId) return pendingRunId;
  return (await createRun()).run_id;
}

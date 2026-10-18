export function mergeRemote<T extends { updatedAt: number }>(
  local: T | null,
  remote: T,
  localOnly: readonly string[],
): T | null {
  if (local && local.updatedAt >= remote.updatedAt) return null;
  const merged: Record<string, unknown> = { ...remote };
  for (const col of localOnly) merged[col] = (local as Record<string, unknown> | null)?.[col] ?? null;
  return merged as T;
}

export function stripLocal(row: Record<string, unknown>, localOnly: readonly string[]) {
  const out = { ...row };
  for (const col of localOnly) delete out[col];
  return out;
}

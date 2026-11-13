/** Ids shared by server and client goal components (no "use client" here). */
export function goalTitleId(goalId: string): string {
  return `goal-${goalId}-title`;
}

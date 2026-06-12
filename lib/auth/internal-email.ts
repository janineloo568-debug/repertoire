/** Placeholder email so legacy schema constraints stay satisfied without collecting real emails. */
export function internalEmailForUsername(username: string) {
  return `${username}@repertoire.local`;
}

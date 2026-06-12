/** Prototype mock feed & profiles (set NEXT_PUBLIC_PROTOTYPE_MOCK=false to use real data only). */
export function isPrototypeMockEnabled() {
  return process.env.NEXT_PUBLIC_PROTOTYPE_MOCK !== "false";
}

export function isMockId(id: string) {
  return id.startsWith("mock-");
}

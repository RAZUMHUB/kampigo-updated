/**
 * Central place responsible for stripping private/sensitive fields before
 * data leaves the backend. `privateDetails` (ownership verification answers)
 * must NEVER appear in a public item payload - only surfaced to the owner
 * via an explicit, separately-authorized endpoint (see ClaimsModule for the
 * analogous rule on verification answers).
 */
export function toPublicLostItem(item: any, includeOwnerOnlyFields = false) {
  console.log("\n===== LOST ITEM =====");
  console.dir(item, { depth: null });

  const { privateDetails, ...rest } = item;
  return {
    ...rest,
    ...(includeOwnerOnlyFields ? { hasPrivateDetails: Boolean(privateDetails) } : {}),
  };
}

export function toPublicFoundItem(item: any) {
  console.log("\n===== FOUND ITEM =====");
  console.dir(item, { depth: null });

  return { ...item };
}

/**
 * The report package: the offline atlas, print plates and data files that
 * come with every report (Kyle, 23 November 2026; Climate Home Inspection
 * D47, `tools/package/package.py --buyer`). It is one zip in the private
 * "reports" bucket, next to the PDF, at <user_id>/<order_id>-package.zip.
 *
 * No database column: the path follows from the order, and the account page
 * looks in the buyer's folder to see whether a package is there yet. That way
 * a package can be added or replaced after delivery (an update, D3) without
 * a migration or a state change.
 */

export const PACKAGE_SUFFIX = "-package.zip";

/** Object path of an order's package in the "reports" bucket. */
export function packagePath(userId: string, orderId: string): string {
  return `${userId}/${orderId}${PACKAGE_SUFFIX}`;
}

/** File name the buyer's browser saves, without the order id or the address. */
export function packageDownloadName(deliveredAt: string | null): string {
  const day = deliveredAt && /^\d{4}-\d{2}-\d{2}/.test(deliveredAt) ? deliveredAt.slice(0, 10) : null;
  return day ? `house-report-atlas-${day}.zip` : "house-report-atlas.zip";
}

/** Order ids in a list of object names from the buyer's folder that have a package. */
export function ordersWithPackage(names: readonly string[]): Set<string> {
  const ids = new Set<string>();
  for (const n of names) {
    if (n.endsWith(PACKAGE_SUFFIX)) ids.add(n.slice(0, -PACKAGE_SUFFIX.length));
  }
  return ids;
}

/** A zip starts with PK\x03\x04 (or PK\x05\x06 when empty, which we refuse). */
export function looksLikeZip(bytes: Uint8Array): boolean {
  return bytes.length > 22 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
}

/**
 * The atlas opens from START-HERE.html (D47). A zip's central directory lists
 * every name in plain bytes, so a search for the name is enough to catch a
 * wrong folder being zipped. It is a guard for the person delivering, not a
 * parser.
 */
export function hasStartHere(bytes: Uint8Array): boolean {
  const needle = Buffer.from("START-HERE.html");
  return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength).includes(needle);
}

/** Supabase's default upload limit on the free plan is 50 MB per file. */
export const PACKAGE_MAX_BYTES = 50 * 1024 * 1024;

import { test } from "node:test";
import assert from "node:assert/strict";
import { versionPath, parseVersion, versionsByOrder, nextVersion, updateAllowed } from "./versions";

const U = "11111111-1111-1111-1111-111111111111";
const O = "22222222-2222-2222-2222-222222222222";
const P = "33333333-3333-3333-3333-333333333333";

test("v1.0 is the delivered PDF; later versions sit beside it", () => {
  assert.equal(versionPath(U, O, "1.0"), `${U}/${O}.pdf`);
  assert.equal(versionPath(U, O, "1.1"), `${U}/${O}-v1.1.pdf`);
});

test("a query string version is checked, never used raw", () => {
  assert.equal(parseVersion("1.1")?.label, "1.1");
  assert.equal(parseVersion("2.0")?.major, 2);
  for (const bad of ["../x", "1", "1.1.1", "0.9", "", null, "1.1/../../a"]) assert.equal(parseVersion(bad), null);
});

test("versions are read from the buyer's folder, oldest first, package ignored", () => {
  const m = versionsByOrder([`${O}-v1.2.pdf`, `${O}.pdf`, `${O}-package.zip`, `${O}-v1.1.pdf`, `${P}.pdf`, `${O}-v2.0.pdf`]);
  assert.deepEqual(m.get(O)?.map((v) => v.label), ["1.0", "1.1", "1.2", "2.0"]);
  assert.deepEqual(m.get(P)?.map((v) => v.label), ["1.0"]);
});

test("a correction or change bumps the minor; a new hazard the major", () => {
  const have = versionsByOrder([`${O}.pdf`, `${O}-v1.1.pdf`]).get(O)!;
  assert.equal(nextVersion(have, "correction").label, "1.2");
  assert.equal(nextVersion(have, "change").label, "1.2");
  assert.equal(nextVersion(have, "hazard").label, "2.0");
  assert.equal(nextVersion([], "change").label, "1.1");
});

test("corrections always go; other updates for 12 months and not after opting out", () => {
  const now = new Date("2027-06-01T00:00:00Z");
  assert.equal(updateAllowed("correction", "delivered", "2025-01-01T00:00:00Z", now, true).ok, true);
  assert.equal(updateAllowed("change", "delivered", "2026-12-01T00:00:00Z", now, false).ok, true);
  assert.equal(updateAllowed("hazard", "delivered", "2026-05-01T00:00:00Z", now, false).ok, false);
  assert.equal(updateAllowed("change", "delivered", "2026-12-01T00:00:00Z", now, true).ok, false);
  assert.equal(updateAllowed("correction", "in_progress", null, now, false).ok, false);
});

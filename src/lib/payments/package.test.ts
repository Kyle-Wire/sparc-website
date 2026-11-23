import { test } from "node:test";
import assert from "node:assert/strict";
import { packagePath, packageDownloadName, ordersWithPackage, looksLikeZip, hasStartHere } from "./package";

const U = "11111111-1111-1111-1111-111111111111";
const O = "22222222-2222-2222-2222-222222222222";

test("the package sits next to the PDF in the buyer's folder", () => {
  assert.equal(packagePath(U, O), `${U}/${O}-package.zip`);
});

test("the saved file name carries the day, not the order id or address", () => {
  assert.equal(packageDownloadName("2026-12-08T15:00:00Z"), "house-report-atlas-2026-12-08.zip");
  assert.equal(packageDownloadName(null), "house-report-atlas.zip");
  assert.ok(!packageDownloadName("2026-12-08").includes(O));
});

test("only package objects count, not the PDF", () => {
  const ids = ordersWithPackage([`${O}.pdf`, `${O}-package.zip`, "33333333-3333-3333-3333-333333333333.pdf"]);
  assert.deepEqual([...ids], [O]);
});

test("zip guard: magic bytes and START-HERE.html", () => {
  const fake = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(30), Buffer.from("atlas/START-HERE.html")]);
  assert.ok(looksLikeZip(fake));
  assert.ok(hasStartHere(fake));
  assert.ok(!looksLikeZip(Buffer.from("%PDF-1.7 not a zip at all, really not")));
  assert.ok(!looksLikeZip(Buffer.from([0x50, 0x4b, 0x05, 0x06, ...Array(18).fill(0)])));
  assert.ok(!hasStartHere(Buffer.concat([fake.subarray(0, 34), Buffer.from("plates/a.pdf")])));
});

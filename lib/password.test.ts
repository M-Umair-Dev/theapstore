import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, verifyPassword } from "./password.ts";

test("correct password verifies", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", hash), true);
});

test("wrong password is rejected", async () => {
  const hash = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("Correct horse battery staple", hash), false);
  assert.equal(await verifyPassword("", hash), false);
});

test("same password hashes differently each time", async () => {
  const a = await hashPassword("hunter2");
  const b = await hashPassword("hunter2");
  assert.notEqual(a, b);
});

test("malformed stored hash is rejected, not thrown", async () => {
  for (const bad of ["", "plaintext", "scrypt::", "bcrypt:aa:bb", "scrypt:aa"]) {
    assert.equal(await verifyPassword("hunter2", bad), false);
  }
});

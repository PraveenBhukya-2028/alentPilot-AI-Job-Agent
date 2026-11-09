import test from "node:test";
import assert from "node:assert/strict";
import { scoreJob } from "../src/services/ai.js";

test("scoreJob returns transparent matched and missing skills", () => {
  const result = scoreJob("I build React and TypeScript applications.", { title: "Frontend Engineer", skills: ["React", "TypeScript", "Node.js"] });
  assert.equal(result.score > 0, true);
  assert.deepEqual(result.matched.sort(), ["React", "TypeScript"].sort());
  assert.equal(result.missing.includes("Node.js"), true);
});

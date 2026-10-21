import assert from "node:assert/strict";
import test from "node:test";
import { analyzeLyricRhymes, estimateSyllables } from "../src/components/studio/studio-utilities.ts";

test("syllable estimate handles common one- and multi-syllable words", () => {
  assert.equal(estimateSyllables("dreams"), 1);
  assert.equal(estimateSyllables("music"), 2);
  assert.equal(estimateSyllables("attikid"), 3);
});

test("empty lyrics return zeroed rhyme counters", () => {
  const analysis = analyzeLyricRhymes("");
  assert.deepEqual(analysis.counts, {
    perfect: 0,
    slant: 0,
    near: 0,
    multi: 0,
    internal: 0,
  });
  assert.equal(analysis.lines.length, 1);
});

test("perfect rhyme pairs are counted once per pair", () => {
  const analysis = analyzeLyricRhymes("light bright\nnight");
  assert.equal(analysis.counts.perfect, 3);
  assert.equal(analysis.counts.internal, 1);
});

test("slant rhymes and internal rhymes are distinguished", () => {
  const analysis = analyzeLyricRhymes("bad bed\nmad");
  assert.equal(analysis.counts.slant, 2);
  assert.equal(analysis.counts.internal, 1);
});

test("multisyllabic matching is surfaced independently from perfect rhyme", () => {
  const analysis = analyzeLyricRhymes("conversation\nalteration");
  assert.equal(analysis.counts.multi, 1);
  assert.equal(analysis.counts.perfect, 1);
});

test("rhyme marks retain source character offsets for editor highlighting", () => {
  const analysis = analyzeLyricRhymes("bright");
  assert.deepEqual(analysis.lines[0][0], {
    start: 0,
    end: 6,
    word: "bright",
    types: [],
  });
});

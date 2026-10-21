export type RhymeType = "perfect" | "slant" | "near" | "multi" | "internal";

export type RhymeWordMark = {
  start: number;
  end: number;
  word: string;
  types: RhymeType[];
};

export type LyricRhymeAnalysis = {
  lines: RhymeWordMark[][];
  counts: Record<RhymeType, number>;
};

type WordRecord = RhymeWordMark & {
  lineIndex: number;
  normalized: string;
  rhymeKey: string;
  multiKey: string;
  syllables: number;
  consonantTail: string;
};

const wordPattern = /[A-Za-z]+(?:['’][A-Za-z]+)?/g;
const vowelPattern = /[aeiouy]+/g;

function normalizeWord(word: string) {
  return word.toLowerCase().replace(/[’']/g, "").replace(/[^a-z]/g, "");
}

function speechSpelling(word: string) {
  let value = normalizeWord(word);
  if (value.length > 3 && /[^aeiouy]e$/.test(value) && !/(?:le|ye|ee|oe|ue)$/.test(value)) {
    value = value.slice(0, -1);
  }
  return value;
}

function rhymeKey(word: string) {
  const value = speechSpelling(word);
  const matches = [...value.matchAll(/[aeiouy]/g)];
  if (!matches.length) return "";
  return value.slice(matches[matches.length - 1].index ?? value.length - 1);
}

function vowelGroups(word: string) {
  const value = normalizeWord(word);
  return [...value.matchAll(vowelPattern)].map((match) => ({
    start: match.index ?? 0,
    text: match[0],
  }));
}

function multisyllableKey(word: string) {
  const value = normalizeWord(word);
  const groups = vowelGroups(word);
  if (groups.length < 2) return "";
  return value.slice(groups[groups.length - 2].start);
}

function consonantTail(word: string) {
  const value = speechSpelling(word);
  const lastVowel = Math.max(value.lastIndexOf("a"), value.lastIndexOf("e"), value.lastIndexOf("i"), value.lastIndexOf("o"), value.lastIndexOf("u"), value.lastIndexOf("y"));
  return lastVowel >= 0 ? value.slice(lastVowel + 1) : "";
}

export function estimateSyllables(input: string): number {
  const word = normalizeWord(input);
  if (!word) return 0;
  if (word.length <= 3) {
    const groups = vowelGroups(word).length;
    return Math.max(1, groups);
  }

  let value = word;
  if (/[^aeiouy]e$/.test(value) && !/(?:le|ye|ee|oe|ue)$/.test(value)) value = value.slice(0, -1);
  let count = vowelGroups(value).length;

  if (/[^aeiou]le$/.test(word) && !/[aeiou]le$/.test(word)) count += 1;
  if (/(?:tion|sion)$/.test(word) && count > 1) count = Math.max(1, count - 1);
  return Math.max(1, count);
}

export function analyzeLyricRhymes(text: string): LyricRhymeAnalysis {
  const sourceLines = text.split("\n");
  const counts: Record<RhymeType, number> = {
    perfect: 0,
    slant: 0,
    near: 0,
    multi: 0,
    internal: 0,
  };

  const records: WordRecord[] = [];
  const lines: RhymeWordMark[][] = sourceLines.map((line, lineIndex) => {
    const marks: RhymeWordMark[] = [];
    for (const match of line.matchAll(wordPattern)) {
      const word = match[0];
      const start = match.index ?? 0;
      const record: WordRecord = {
        start,
        end: start + word.length,
        word,
        types: [],
        lineIndex,
        normalized: normalizeWord(word),
        rhymeKey: rhymeKey(word),
        multiKey: multisyllableKey(word),
        syllables: estimateSyllables(word),
        consonantTail: consonantTail(word),
      };
      marks.push(record);
      records.push(record);
    }
    return marks;
  });

  const markPair = (type: RhymeType, first: WordRecord, second: WordRecord) => {
    counts[type] += 1;
    if (!first.types.includes(type)) first.types.push(type);
    if (!second.types.includes(type)) second.types.push(type);
  };

  for (let firstIndex = 0; firstIndex < records.length; firstIndex += 1) {
    const first = records[firstIndex];
    for (let secondIndex = firstIndex + 1; secondIndex < records.length; secondIndex += 1) {
      const second = records[secondIndex];
      if (!first.normalized || !second.normalized || first.normalized === second.normalized) continue;

      const perfect = first.rhymeKey.length > 1 && first.rhymeKey === second.rhymeKey;
      const multi = first.syllables >= 2 && second.syllables >= 2 &&
        first.multiKey.length >= 3 && first.multiKey === second.multiKey;

      let near = false;
      let slant = false;
      if (!perfect && first.normalized.length >= 3 && second.normalized.length >= 3) {
        near = first.normalized.slice(-2) === second.normalized.slice(-2);
        slant = !near && first.consonantTail.length > 0 &&
          first.consonantTail === second.consonantTail;
      }

      if (perfect) markPair("perfect", first, second);
      if (multi) markPair("multi", first, second);
      if (near) markPair("near", first, second);
      else if (slant) markPair("slant", first, second);

      if (first.lineIndex === second.lineIndex && (perfect || near || slant)) {
        markPair("internal", first, second);
      }
    }
  }

  return {
    lines: lines.map((line) => line.map(({ start, end, word, types }) => ({ start, end, word, types }))),
    counts,
  };
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (!navigator.clipboard?.writeText) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function downloadText(filename: string, text: string, mimeType = "text/plain;charset=utf-8") {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

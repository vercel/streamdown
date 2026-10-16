import { countDoublePairs, getScan, REGION } from "./scan";

const countDollarPairs = (text: string): number => countDoublePairs(text, "$");

// Pairs $$ markers the same way countDoublePairs does, so with an odd count
// the last prose marker is the one still open.
const findLastDollarPair = (text: string): number => {
  const scan = getScan(text);
  let last = -1;

  for (let i = text.indexOf("$$"); i !== -1; i = text.indexOf("$$", i)) {
    if (scan.regions[i] === REGION.PROSE) {
      last = i;
      i += 2;
    } else {
      i += 1;
    }
  }
  return last;
};

// Excludes $$ pairs and any $ inside code regions.
const countSingleDollars = (text: string): number => {
  const scan = getScan(text);
  let count = 0;

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "\\") {
      i += 1;
      continue;
    }

    if (scan.regions[i] !== REGION.PROSE) {
      continue;
    }

    if (text[i] === "$") {
      if (i + 1 < text.length && text[i + 1] === "$") {
        i += 1;
      } else {
        count += 1;
      }
    }
  }

  return count;
};

// Helper function to add closing $$ with appropriate formatting
const addClosingKatex = (text: string): string => {
  // If the text already ends with a partial closing $ (but not $$),
  // just append one more $ to complete the $$ marker.
  if (text.endsWith("$") && !text.endsWith("$$")) {
    return `${text}$`;
  }

  const openDollarIndex = findLastDollarPair(text);
  const hasNewlineAfterStart =
    openDollarIndex !== -1 && text.indexOf("\n", openDollarIndex) !== -1;

  if (hasNewlineAfterStart && !text.endsWith("\n")) {
    return `${text}\n$$`;
  }

  return `${text}$$`;
};

// Completes incomplete block KaTeX formatting ($$)
export const handleIncompleteBlockKatex = (text: string): string => {
  const dollarPairs = countDollarPairs(text);

  if (dollarPairs % 2 === 0) {
    return text;
  }

  return addClosingKatex(text);
};

// Completes incomplete inline KaTeX formatting ($...$)
export const handleIncompleteInlineKatex = (text: string): string => {
  const count = countSingleDollars(text);

  if (count % 2 === 1) {
    return `${text}$`;
  }

  return text;
};

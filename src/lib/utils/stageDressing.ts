export function wordToNumber(word: string): number {
  const numberWords: { [key: string]: number } = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };
  return numberWords[word.toLowerCase()] || 0;
}

export function parseStageDressing(stageDressing: string | null | undefined): { chairs: number; stools: number; other_props: string | null } {
  if (!stageDressing) return { chairs: 0, stools: 0, other_props: null };

  const lowerCase = stageDressing.toLowerCase();

  // Match both numeric and word-based numbers
  const chairMatch = lowerCase.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*chair/);
  const stoolMatch = lowerCase.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s*stool/);

  // Extract other props by removing chair and stool mentions
  let otherProps = stageDressing;
  if (chairMatch) {
    otherProps = otherProps.replace(chairMatch[0], '').trim();
  }
  if (stoolMatch) {
    otherProps = otherProps.replace(stoolMatch[0], '').trim();
  }

  // Clean up the other props string
  otherProps = otherProps
    .replace(/\s*,\s*/g, ', ') // Normalize comma spacing
    .replace(/^,\s*|,\s*$/g, '') // Remove leading/trailing commas
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  return {
    chairs: chairMatch ? (isNaN(parseInt(chairMatch[1])) ? wordToNumber(chairMatch[1]) : parseInt(chairMatch[1])) : 0,
    stools: stoolMatch ? (isNaN(parseInt(stoolMatch[1])) ? wordToNumber(stoolMatch[1]) : parseInt(stoolMatch[1])) : 0,
    other_props: otherProps || null
  };
}

export function formatStageDressing(chairs: number, stools: number, other_props: string | null): string {
  const parts = [];
  if (chairs > 0) {
    parts.push(`${chairs} chair${chairs !== 1 ? 's' : ''}`);
  }
  if (stools > 0) {
    parts.push(`${stools} stool${stools !== 1 ? 's' : ''}`);
  }
  if (other_props) {
    parts.push(other_props);
  }
  return parts.join(', ') || 'none';
}

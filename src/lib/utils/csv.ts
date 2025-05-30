import Papa from 'papaparse';
import { parseStageDressing } from './stageDressing';

// Polyfill for crypto.randomUUID in browsers that don't support it
if (typeof window !== 'undefined' && window.crypto && typeof window.crypto.randomUUID !== 'function') {
  window.crypto.randomUUID = function () {
    // https://stackoverflow.com/a/2117523/508355
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (window.crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) >> 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}

export interface SketchData {
  id: string;
  title: string;
  description: string;
  duration: number;
  chars: number;
  casted: number;
  locked: boolean;
  character_performers: { character_name: string; performer_name: string }[];
  raw_data: Record<string, string>;
  stage_dressing: string;
  chairs: number;
  stools: number;
  other_props: string | null;
}

export function parseCSV(csvText: string): Record<string, string>[] {
  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim().toLowerCase(),
    dynamicTyping: false,
    transform: (value) => value.trim()
  });

  if (result.errors.length > 0) {
    console.error("CSV Parsing Errors with Papaparse:", result.errors);
    // Filter out rows that might be null, undefined, or genuinely empty objects.
    const validData = result.data.filter(
      row => row && typeof row === 'object' && Object.keys(row).length > 0
    );
    return validData as Record<string, string>[];
  }

  // Ensure all data returned is in the expected Record<string, string>[] format
  // Papaparse with header:true should produce this, but an explicit cast can be safer
  // if there are rows that are not objects (e.g. if skipEmptyLines didn't catch everything)
  return result.data.filter(
    row => row && typeof row === 'object' && Object.keys(row).length > 0
  ) as Record<string, string>[];
}

export function processSketchData(sketchesData: Record<string, string>[]): SketchData[] {
  // Try to detect performer columns dynamically (columns after known fields)
  const knownFields = [
    '#', 'sketch name', 'stage needs (chairs etc)', 'duration', 'director',
    'title', 'time', 'chars', 'casted', 'description', 'stage dressing'
  ];

  // Find all unique performer columns in the data
  const allColumns = Array.from(
    new Set(sketchesData.flatMap(row => Object.keys(row)))
  );
  const performerColumns = allColumns.filter(
    col => !knownFields.map(f => f.toLowerCase()).includes(col.trim().toLowerCase()) && col.trim() !== ''
  );

  return sketchesData
    .filter(row => {
      // Use lowercased keys for all lookups
      const rowLc = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
      const title = rowLc['sketch name'] || rowLc['title'];
      return title && title.trim() && !['total', 'actors', 'chars/actor', 'min number', 'people with extra'].includes(title.trim().toLowerCase());
    })
    .map((row, idx) => {
      // Use lowercased keys for all lookups
      const rowLc = Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
      const title = rowLc['sketch name']?.trim() || rowLc['title']?.trim() || `Untitled ${idx + 1}`;
      let description = rowLc['stage needs (chairs etc)'] || rowLc['description'] || '';
      const director = rowLc['director']?.trim();
      if (director) {
        description = description ? `${description}\nDirector: ${director}` : `Director: ${director}`;
      }
      const durationStr = rowLc['duration'] || rowLc['time'] || '';
      let duration = 0;
      if (durationStr.includes(':')) {
        const [minutes, seconds] = durationStr.split(':').map(Number);
        duration = minutes + (seconds || 0) / 60;
      } else {
        duration = parseInt(durationStr || '0', 10);
      }
      // Stage dressing: try to pull from 'stage needs (chairs etc)' or 'stage dressing'
      const stage_dressing = rowLc['stage needs (chairs etc)'] || '';
      const { chairs, stools, other_props } = parseStageDressing(stage_dressing);
      // Build character_performers array
      const character_performers = performerColumns
        .filter(name => row[name] && row[name].trim() !== '')
        .map(name => ({
          character_name: row[name].trim(),
          performer_name: name
        }));

      return {
        id: crypto.randomUUID(),
        title,
        description,
        duration: Math.ceil(duration),
        chars: character_performers.length,
        casted: character_performers.length,
        locked: false,
        character_performers,
        stage_dressing,
        chairs,
        stools,
        other_props,
        raw_data: row
      };
    });
}

export async function readCSVFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const data = parseCSV(csvText);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

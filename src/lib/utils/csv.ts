import Papa from 'papaparse';

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
  const mergedData: Record<string, SketchData> = {};

  // List of summary/statistics titles to skip
  const summaryTitles = [
    "total", "actors", "chars/actor", "min number", "people with extra"
  ];

  // Process each row
  sketchesData.forEach(row => {
    const title = row['title']?.trim();
    const chars = parseInt(row['chars'] || '', 10);

    // Skip summary/statistics rows and invalid rows
    if (!title || summaryTitles.includes(title.toLowerCase()) || isNaN(chars) || chars <= 0) return;

    // Extract character-performer pairs
    const characterPerformers: { character_name: string; performer_name: string }[] = [];
    const columns = Object.keys(row);

    // Find the index of the 'casted' column
    const castedIndex = columns.findIndex(col => col.toLowerCase() === 'casted');
    console.log(`Processing sketch "${title}":`, { castedIndex, columns });

    // Process columns after 'casted' as character-performer pairs
    if (castedIndex !== -1) {
      for (let i = castedIndex + 1; i < columns.length; i++) {
        const performerName = columns[i].trim();
        const characterName = row[columns[i]]?.trim();
        if (performerName && characterName) {
          console.log(`Found character-performer pair:`, { performerName, characterName });
          characterPerformers.push({
            character_name: characterName,
            performer_name: performerName
          });
        }
      }
    }

    // Parse duration from time format (MM:SS)
    const timeStr = row['time'] || row['duration'] || '5:00';
    const [minutes, seconds] = timeStr.split(':').map(Number);
    const duration = minutes + (seconds || 0) / 60;

    mergedData[title] = {
      id: crypto.randomUUID(),
      title,
      description: row['description'] || '',
      duration: Math.ceil(duration), // Round up to nearest minute
      chars: parseInt(row['chars'] || '0', 10),
      casted: characterPerformers.length,
      locked: false, // Initialize all imported sketches as unlocked
      character_performers: characterPerformers.map(cp => ({
        character_name: cp.character_name,
        performer_name: cp.performer_name
      })),
      raw_data: row // Preserve the raw CSV data
    };
  });

  console.log('Processed sketches with character performers:',
    Object.values(mergedData).map(s => ({
      title: s.title,
      character_performers: s.character_performers
    }))
  );

  return Object.values(mergedData);
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

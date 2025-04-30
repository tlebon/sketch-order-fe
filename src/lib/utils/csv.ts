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
  const lines = csvText.split('\n').map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    return headers.reduce((obj, header, index) => {
      obj[header] = values[index] || '';
      return obj;
    }, {} as Record<string, string>);
  });
}

export function processSketchData(sketchesData: Record<string, string>[]): SketchData[] {
  const mergedData: Record<string, SketchData> = {};

  // Process each row
  sketchesData.forEach(row => {
    const title = row['title'];
    if (!title) return;

    // Extract character-performer pairs
    const characterPerformers: { character_name: string; performer_name: string }[] = [];
    const columns = Object.keys(row);
    
    // Find the index of the 'casted' column
    const castedIndex = columns.findIndex(col => col.toLowerCase() === 'casted');
    
    // Process columns after 'casted' as character-performer pairs
    if (castedIndex !== -1) {
      for (let i = castedIndex + 1; i < columns.length; i++) {
        const performerName = columns[i].trim();
        const characterName = row[columns[i]]?.trim();
        if (performerName && characterName) {
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
      description: row['description'] || `Characters: ${row['chars'] || '0'}`,
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
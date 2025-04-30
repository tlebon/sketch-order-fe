export interface SketchData {
  id: string;
  title: string;
  description: string;
  duration: number;
  cast: string[];
  chars: number;
  casted: number;
  locked: boolean;
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

    // Find the index of the 'casted' column
    const columns = Object.keys(row);
    const castedIndex = columns.findIndex(col => col.toLowerCase() === 'casted');
    
    // Extract cast members from columns after 'casted'
    const castMembers = columns
      .slice(castedIndex + 1) // Get all columns after 'casted'
      .map(col => row[col].trim()) // Get the value for each column
      .filter(Boolean); // Remove empty values

    mergedData[title] = {
      id: crypto.randomUUID(),
      title,
      description: row['description'] || `Characters: ${row['chars'] || '0'}`,
      duration: parseInt(row['time'] || row['duration'] || '5', 10),
      cast: castMembers,
      chars: parseInt(row['chars'] || '0', 10),
      casted: parseInt(row['casted'] || '0', 10),
      locked: false // Initialize all imported sketches as unlocked
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
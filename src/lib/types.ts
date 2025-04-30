export interface CharacterPerformer {
  id: string;
  sketch_id: string;
  character_name: string;
  performer_name: string;
  created_at: string;
  updated_at: string;
}

export interface Sketch {
  id: string;
  show_id: string;
  title: string;
  description: string | null;
  duration: number;
  chars: number;
  casted: number;
  locked: boolean;
  position: number;
  created_at: string;
  updated_at: string;
  character_performers?: CharacterPerformer[];
  raw_data?: Record<string, string>;
}

export interface SketchShow {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
} 
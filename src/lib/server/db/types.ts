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
  raw_data: string | null;
  created_at: string;
  updated_at: string;
}

export interface CharacterPerformer {
  id: string;
  sketch_id: string;
  character_name: string;
  performer_name: string;
  created_at: string;
  updated_at: string;
}

export interface Show {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

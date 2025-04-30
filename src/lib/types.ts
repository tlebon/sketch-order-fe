export interface Sketch {
  id: string;
  show_id: string;
  title: string;
  description: string;
  duration: number;
  chars: number;
  casted: number;
  locked: boolean;
  position: number;
  cast: string[];
  created_at?: string;
  updated_at?: string;
}

export interface SketchShow {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
} 
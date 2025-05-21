
export interface Note {
  id: string;
  title: string;
  contentHTML: string;
  createdAt: string;
  updatedAt: string;
  notebookId: string | null;
  tags: string[];
  isPinned: boolean;
  reminder?: string; // ISO date string
}

export interface Notebook {
  id: string;
  name: string;
  color: string; // Tailwind background color class e.g. 'bg-red-500'
  createdAt: string;
  // Add updatedAt to Notebook interface
updatedAt?: string; 
}

export interface Tag {
  id: string; // For consistency, though name might be enough for simple use
  name: string;
}

export interface AppSettings {
  fontSize: 'text-sm' | 'text-base' | 'text-lg' | 'text-xl';
  theme: 'light' | 'dark';
  allNotesSortBy: keyof Pick<Note, 'createdAt' | 'title' | 'updatedAt'>;
  allNotesSortOrder: 'asc' | 'desc';
}

export interface ExportData {
  notebooks: Notebook[];
  notes: Note[];
  settings?: AppSettings; // Optional: include settings in export
}

export type ActiveView = 'notebooks' | 'all-notes' | 'tags' | 'settings';

// Represents a selection within the contentEditable editor
export interface EditorSelection {
  start: number;
  end: number;
  collapsed: boolean;
  commonAncestorContainer: Node | null;
}
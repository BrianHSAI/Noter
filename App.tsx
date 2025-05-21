
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Note, Notebook, Tag, AppSettings, ActiveView, ExportData } from './types';
import { APP_NAME, DEFAULT_NOTEBOOK_COLORS, DEFAULT_SETTINGS, ICON_PLUS, ICON_BOOK_OPEN, ICON_DOCUMENT_TEXT, ICON_TAG, ICON_COG, ICON_TRASH, ICON_PIN, ICON_STAR_SOLID, ICON_STAR_OUTLINE, ICON_EDIT, ICON_SEARCH, ICON_SUN, ICON_MOON, ICON_ARROW_UP_TRAY, ICON_ARROW_DOWN_TRAY, FONT_SIZES, ICON_CALENDAR, ICON_CHEVRON_DOWN } from './constants';
import Modal from './components/Modal';
import ColorPicker from './components/ColorPicker';
import NoteEditor from './components/NoteEditor';

// Helper to get data from localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key "${key}":`, error);
    return defaultValue;
  }
};

// Helper to save data to localStorage
const saveToLocalStorage = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error setting localStorage key "${key}":`, error);
  }
};


const NotebookCard: React.FC<{ notebook: Notebook; noteCount: number; recentNotes: Note[]; onSelect: () => void; onDelete: (id: string) => void; onEdit: () => void; }> = ({ notebook, noteCount, recentNotes, onSelect, onDelete, onEdit }) => {
  return (
    <div className={`p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer relative ${notebook.color} text-white flex flex-col justify-between min-h-[180px]`} onClick={onSelect}>
      <div>
        <h3 className="text-xl font-semibold mb-1 truncate">{notebook.name}</h3>
        <p className="text-sm opacity-80 mb-2">{noteCount} note{noteCount !== 1 ? 's' : ''}</p>
        {recentNotes.length > 0 && (
          <div className="mt-2 text-xs opacity-90">
            <h4 className="font-medium mb-1">Recent:</h4>
            <ul className="space-y-1">
              {recentNotes.slice(0, 2).map(note => (
                <li key={note.id} className="truncate italic">- {note.title}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div className="absolute top-3 right-3 flex gap-1.5">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(); }} 
          className="p-1.5 bg-black/25 hover:bg-black/40 rounded-full transition-colors"
          title="Rediger notesbog"
          aria-label="Rediger notesbog"
        >
          {ICON_EDIT('w-4 h-4 text-white')}
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(notebook.id); }} 
          className="p-1.5 bg-black/25 hover:bg-black/40 rounded-full transition-colors"
          title="Slet notesbog"
          aria-label="Slet notesbog"
        >
          {ICON_TRASH('w-4 h-4 text-white')}
        </button>
      </div>
    </div>
  );
};

const NoteCard: React.FC<{ note: Note; notebookName?: string; notebookColor?: string; onSelect: () => void; onTogglePin: () => void; onDelete: (id: string) => void; settings: AppSettings; }> = ({ note, notebookName, notebookColor, onSelect, onTogglePin, onDelete, settings }) => {
  const contentPreview = note.contentHTML.replace(/<[^>]+>/g, '');
  const noteDate = new Date(note.updatedAt);

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col ${settings.fontSize}`}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 truncate" onClick={onSelect} title={note.title}>
          {note.title}
        </h3>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={(e) => { e.stopPropagation(); onTogglePin(); }} title={note.isPinned ? "Frigør note" : "Fastgør note"} aria-label={note.isPinned ? "Frigør note" : "Fastgør note"}>
            {note.isPinned ? ICON_STAR_SOLID('w-5 h-5 text-yellow-500') : ICON_STAR_OUTLINE('w-5 h-5 text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400')}
          </button>
        </div>
      </div>
      {notebookName && (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full self-start mb-2 ${notebookColor ? `${notebookColor.replace('bg-','text-').replace('-500', '-700')} dark:${notebookColor.replace('bg-','text-').replace('-500', '-200')} ${notebookColor.replace('bg-','bg-').replace('-500', '-100')} dark:${notebookColor.replace('bg-','bg-').replace('-500', '-700')} dark:bg-opacity-40` : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>
          {notebookName}
        </span>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex-grow break-words" dangerouslySetInnerHTML={{__html: contentPreview.length > 100 ? contentPreview.substring(0,100) + '...' : contentPreview }}></p>
      {note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {note.tags.map(tag => (
            <span key={tag} className="text-xs bg-sky-100 text-sky-700 dark:bg-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}
      {note.reminder && new Date(note.reminder) > new Date() && (
        <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 mb-2">
            {ICON_CALENDAR('w-4 h-4 mr-1')} Påmindelse: {new Date(note.reminder).toLocaleDateString()} {new Date(note.reminder).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </div>
      )}
      <div className="flex justify-between items-center mt-auto pt-2 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-500 dark:text-gray-500">
          Opdateret: {noteDate.toLocaleDateString()}
        </span>
        <div className="flex gap-1">
             <button onClick={(e) => { e.stopPropagation(); onSelect(); }} className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-colors" title="Rediger note" aria-label="Rediger note">
                {ICON_EDIT('w-4 h-4')}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-full transition-colors" title="Slet note" aria-label="Slet note">
                {ICON_TRASH('w-4 h-4')}
            </button>
        </div>
      </div>
    </div>
  );
};

const MainApp: React.FC = () => {
  const [notebooks, setNotebooks] = useState<Notebook[]>(() => loadFromLocalStorage('studyflow-notebooks', []));
  const [notes, setNotes] = useState<Note[]>(() => loadFromLocalStorage('studyflow-notes', []));
  const [settings, setSettings] = useState<AppSettings>(() => loadFromLocalStorage('studyflow-settings', DEFAULT_SETTINGS));

  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [newNotebookName, setNewNotebookName] = useState('');
  const [selectedNotebookColor, setSelectedNotebookColor] = useState(DEFAULT_NOTEBOOK_COLORS[0]);
  
  const [editingNotebook, setEditingNotebook] = useState<Notebook | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [currentNoteToEdit, setCurrentNoteToEdit] = useState<Note | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const getNotebookIdFromPath = useCallback(() => {
    const match = location.pathname.match(/^\/notebook\/([^/]+)/);
    return match ? match[1] : undefined;
  }, [location.pathname]);

  const currentActiveViewForNav = useMemo(() => {
    const notebookIdFromPath = getNotebookIdFromPath();
    if (location.pathname === '/all-notes') return 'all-notes';
    if (location.pathname === '/tags') return 'tags';
    if (location.pathname === '/settings') return 'settings';
    if (location.pathname.startsWith('/notebook/') && notebookIdFromPath) return 'notebook-notes';
    if (location.pathname === '/') return 'notebooks';
    if (location.pathname.startsWith('/note/')) {
        if (currentNoteToEdit?.notebookId) {
             const notebookExists = notebooks.some(nb => nb.id === currentNoteToEdit.notebookId);
             if (notebookExists) return 'notebook-notes'; 
        }
        return 'editor-open';
    }
    return 'notebooks'; 
  }, [location.pathname, currentNoteToEdit, notebooks, getNotebookIdFromPath]);


  useEffect(() => {
    saveToLocalStorage('studyflow-notebooks', notebooks);
  }, [notebooks]);

  useEffect(() => {
    saveToLocalStorage('studyflow-notes', notes);
  }, [notes]);

  useEffect(() => {
    saveToLocalStorage('studyflow-settings', settings);
    document.documentElement.className = settings.theme;
  }, [settings]);

  // Route-driven NoteEditor visibility
useEffect(() => {
  const newNoteMatch = location.pathname === '/note/new';
  const editNoteMatch = location.pathname.match(/^\/note\/([a-zA-Z0-9-]+)\/edit$/);

  if (newNoteMatch) {
    const isAlreadyEditingNew = currentNoteToEdit && currentNoteToEdit.id.startsWith('temp-new-note-');

    if (!isNoteEditorOpen || !isAlreadyEditingNew) {
      const tempId = `temp-new-note-${crypto.randomUUID()}`;
      setCurrentNoteToEdit({
        id: tempId,
        title: '',
        contentHTML: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notebookId: location.state?.notebookId || getNotebookIdFromPath() || null,
        tags: [],
        isPinned: false,
      });
      setIsNoteEditorOpen(true);
    }
  } else if (editNoteMatch) {
    const noteId = editNoteMatch[1];
    const note = notes.find(n => n.id === noteId);
    if (note) {
      if (!isNoteEditorOpen || currentNoteToEdit?.id !== noteId) {
        setCurrentNoteToEdit(note);
        setIsNoteEditorOpen(true);
      }
    } else { 
      setIsNoteEditorOpen(false);
      setCurrentNoteToEdit(null);
      navigate(getNotebookIdFromPath() ? `/notebook/${getNotebookIdFromPath()}` : '/all-notes', { replace: true });
    }
  } else {
    if (isNoteEditorOpen) {
        setIsNoteEditorOpen(false);
        setCurrentNoteToEdit(null);
    }
  }
}, [location.pathname, location.state, notes, navigate, isNoteEditorOpen, currentNoteToEdit, getNotebookIdFromPath]);


  const handleOpenNotebookModal = (notebookToEdit: Notebook | null = null) => {
    setEditingNotebook(notebookToEdit);
    setNewNotebookName(notebookToEdit ? notebookToEdit.name : '');
    setSelectedNotebookColor(notebookToEdit ? notebookToEdit.color : DEFAULT_NOTEBOOK_COLORS[0]);
    setIsNotebookModalOpen(true);
  };

  const handleSaveNotebook = () => {
    const name = newNotebookName.trim();
    if (!name) return;
    const now = new Date().toISOString();

    if (editingNotebook) {
      setNotebooks(prev => prev.map(nb => nb.id === editingNotebook.id ? { ...nb, name, color: selectedNotebookColor, updatedAt: now } : nb));
    } else {
      const newNotebook: Notebook = {
        id: crypto.randomUUID(),
        name,
        color: selectedNotebookColor,
        createdAt: now,
        updatedAt: now,
      };
      setNotebooks(prev => [...prev, newNotebook]);
    }
    setIsNotebookModalOpen(false);
    setNewNotebookName('');
    setSelectedNotebookColor(DEFAULT_NOTEBOOK_COLORS[0]);
    setEditingNotebook(null);
  };
  
  const handleDeleteNotebook = (notebookId: string) => {
    if (window.confirm("Er du sikker på, at du vil slette denne notesbog og alle dens noter? Handlingen kan ikke fortrydes.")) {
      setNotebooks(prev => prev.filter(nb => nb.id !== notebookId));
      setNotes(prev => prev.filter(note => note.notebookId !== notebookId));
      if (getNotebookIdFromPath() === notebookId) { 
        navigate('/'); 
      }
    }
  };

const handleSaveNote = (noteToSave: Note) => {
  let finalNote = { ...noteToSave, updatedAt: new Date().toISOString() }; 
  let isNewNoteInstance = !notes.some(n => n.id === finalNote.id);

  if (finalNote.id.startsWith('temp-new-note-') || isNewNoteInstance) {
    finalNote.id = crypto.randomUUID();
    finalNote.createdAt = finalNote.createdAt || new Date().toISOString(); 
    // If new note and notebookId came from location.state (e.g. new note in specific notebook)
    if (location.state?.notebookId && !finalNote.notebookId) {
        finalNote.notebookId = location.state.notebookId;
    } else if (getNotebookIdFromPath() && !finalNote.notebookId) { // Or from current notebook view
        finalNote.notebookId = getNotebookIdFromPath();
    }
  }


  setNotes(prev => {
    const index = prev.findIndex(n => n.id === finalNote.id);
    if (index > -1) { 
      const updatedNotes = [...prev];
      updatedNotes[index] = finalNote;
      return updatedNotes;
    }
    const tempIndex = prev.findIndex(n => n.id === noteToSave.id && noteToSave.id.startsWith('temp-new-note-'));
    if (tempIndex > -1) {
        const updatedNotes = [...prev];
        updatedNotes[tempIndex] = finalNote; 
        return updatedNotes;
    }
    return [...prev, finalNote]; 
  });
  
  if (finalNote.notebookId && notebooks.some(nb => nb.id === finalNote.notebookId)) {
      navigate(`/notebook/${finalNote.notebookId}`);
  } else {
      navigate('/all-notes');
  }
};


  const handleDeleteNote = (noteId: string) => {
     if (window.confirm("Er du sikker på, at du vil slette denne note? Handlingen kan ikke fortrydes.")) {
        const noteBeingDeleted = notes.find(n => n.id === noteId);
        setNotes(prevNotes => prevNotes.filter(n => n.id !== noteId));
        
        if (location.pathname === `/note/${noteId}/edit`) {
            if(noteBeingDeleted?.notebookId && notebooks.some(nb => nb.id === noteBeingDeleted.notebookId)) {
                navigate(`/notebook/${noteBeingDeleted.notebookId}`, { replace: true });
            } else {
                navigate('/all-notes', { replace: true });
            }
        }
     }
  };
  
  const handleTogglePinNote = (noteId: string) => {
    setNotes(prev => prev.map(n => n.id === noteId ? { ...n, isPinned: !n.isPinned } : n));
  };

  const handleNavigateToNewNote = (notebookIdForNewNote?: string | null) => {
    navigate('/note/new', { state: { notebookId: notebookIdForNewNote || getNotebookIdFromPath() } });
  };

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    notes.forEach(note => note.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort().map(tagName => ({ id: tagName, name: tagName }));
  }, [notes]);

  const filteredAndSortedNotes = useMemo(() => {
    let RfilteredNotes = [...notes];
    const notebookIdFromUrl = getNotebookIdFromPath();

    if (currentActiveViewForNav === 'notebook-notes' && notebookIdFromUrl) {
        RfilteredNotes = RfilteredNotes.filter(note => note.notebookId === notebookIdFromUrl);
    }
    
    if (activeTag && currentActiveViewForNav !== 'tags') { 
      RfilteredNotes = RfilteredNotes.filter(note => note.tags.includes(activeTag));
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      RfilteredNotes = RfilteredNotes.filter(note =>
        note.title.toLowerCase().includes(lowerSearchTerm) ||
        note.contentHTML.toLowerCase().replace(/<[^>]+>/g, '').includes(lowerSearchTerm)
      );
    }
    
    return RfilteredNotes.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1;
      }
      const valA = a[settings.allNotesSortBy];
      const valB = b[settings.allNotesSortBy];
      
      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        comparison = valA - valB;
      }
      
      return settings.allNotesSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [notes, searchTerm, activeTag, settings.allNotesSortBy, settings.allNotesSortOrder, currentActiveViewForNav, getNotebookIdFromPath]);


  const handleExportData = (notebookId?: string) => {
    let dataToExport: ExportData;
    let filename = `${APP_NAME}_export_${new Date().toISOString().split('T')[0]}.json`;

    if (notebookId) {
        const notebook = notebooks.find(nb => nb.id === notebookId);
        if (!notebook) return;
        const notesInNotebook = notes.filter(note => note.notebookId === notebookId);
        dataToExport = { notebooks: [notebook], notes: notesInNotebook };
        filename = `${notebook.name}_export_${new Date().toISOString().split('T')[0]}.json`;
    } else {
        dataToExport = { notebooks, notes, settings };
    }

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const imported = JSON.parse(e.target?.result as string) as ExportData;
                if (imported.notebooks && imported.notes) {
                    if (window.confirm("Import af data vil flette med eksisterende notesbøger og noter. Er du sikker? (Eksisterende elementer med samme ID kan blive overskrevet.)")) {
                        
                        const updatedNotebooks = [...notebooks];
                        const now = new Date().toISOString();
                        imported.notebooks.forEach(inb => {
                            const existingIdx = updatedNotebooks.findIndex(nb => nb.id === inb.id);
                            if (existingIdx > -1) updatedNotebooks[existingIdx] = {...updatedNotebooks[existingIdx], ...inb, updatedAt: inb.updatedAt || now}; 
                            else updatedNotebooks.push({...inb, updatedAt: inb.updatedAt || now, createdAt: inb.createdAt || now});
                        });
                        setNotebooks(updatedNotebooks);

                        const updatedNotes = [...notes];
                        imported.notes.forEach(inote => {
                            const existingIdx = updatedNotes.findIndex(n => n.id === inote.id);
                             if (existingIdx > -1) updatedNotes[existingIdx] = {...updatedNotes[existingIdx], ...inote, updatedAt: inote.updatedAt || now}; 
                            else updatedNotes.push({...inote, updatedAt: inote.updatedAt || now, createdAt: inote.createdAt || now });
                        });
                        setNotes(updatedNotes);

                        if (imported.settings) {
                            setSettings(prevSettings => ({ ...prevSettings, ...imported.settings }));
                        }
                        alert("Data importeret succesfuldt!");
                    }
                } else {
                    alert("Ugyldigt importfilformat. Mangler 'notebooks' eller 'notes' array.");
                }
            } catch (err) {
                console.error("Import error:", err);
                alert("Fejl ved import af data. Filen kan være korrupt eller ikke gyldig JSON.");
            }
        };
        reader.readAsText(file);
        event.target.value = ''; 
    }
  };

  const handlePrintNotebook = (notebookId: string) => {
    const notebook = notebooks.find(nb => nb.id === notebookId);
    if (!notebook) return;
    const notesInNotebook = notes
        .filter(note => note.notebookId === notebookId)
        .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    let printHtml = `
      <html>
        <head>
          <title>Udskrift: ${notebook.name}</title>
          <style>
            body { font-family: sans-serif; margin: 20px; line-height: 1.6; }
            .note-item { border: 1px solid #ccc; padding: 15px; margin-bottom: 20px; border-radius: 8px; page-break-inside: avoid; }
            .note-item h2 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px; font-size: 1.5em; }
            .note-item img { max-width: 100%; height: auto; border-radius: 4px; margin: 10px 0; }
            .note-item ul[data-type="checklist"] { list-style: none; padding-left: 0; }
            .note-item ul[data-type="checklist"] li { margin-bottom: 5px; }
            .note-item ul[data-type="checklist"] li::before { content: '☐ '; /* unchecked box */ }
            .note-item ul[data-type="checklist"] li[data-checked="true"]::before { content: '☑ '; /* checked box */ }
            .note-item ul[data-type="checklist"] li[data-checked="true"] { text-decoration: line-through; opacity: 0.7; }
            hr { border: 0; border-top: 1px dashed #ccc; margin: 20px 0; }
            @media print {
              body { margin: 0.5in; }
              .note-item { border: 1px solid #ddd; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Notesbog: ${notebook.name}</h1>
          <button onclick="window.print()" style="padding: 10px 15px; margin-bottom:20px; background-color: #007bff; color:white; border:none; border-radius:5px; cursor:pointer;">Udskriv</button>
          <hr />
    `;

    notesInNotebook.forEach(note => {
      printHtml += `
        <div class="note-item">
          <h2>${note.title}</h2>
          <div>${note.contentHTML}</div>
        </div>
      `;
    });

    printHtml += `</body></html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printHtml);
      printWindow.document.close();
      // printWindow.focus(); // Optional: focus the new window
      // printWindow.print(); // Optional: auto-trigger print dialog, might be blocked
    }
  };
  
  const renderCurrentView = () => {
    const notebookIdFromPath = getNotebookIdFromPath();
    const currentViewBasedOnPath = currentActiveViewForNav; 

    if (currentViewBasedOnPath === 'notebooks') {
      return (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Notesbøger</h1>
          </div>
          {notebooks.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">Ingen notesbøger endnu. Opret en for at komme i gang!</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {notebooks.map(nb => {
                const notesInNotebook = notes.filter(note => note.notebookId === nb.id);
                return (
                  <NotebookCard 
                    key={nb.id} 
                    notebook={nb} 
                    noteCount={notesInNotebook.length}
                    recentNotes={notesInNotebook.sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())}
                    onSelect={() => navigate(`/notebook/${nb.id}`)} 
                    onDelete={handleDeleteNotebook}
                    onEdit={() => handleOpenNotebookModal(nb)}
                  />
                );
              })}
            </div>
          )}
        </>
      );
    }
    
    if (currentViewBasedOnPath === 'all-notes' || currentViewBasedOnPath === 'notebook-notes') {
      const currentNotebook = notebookIdFromPath ? notebooks.find(nb => nb.id === notebookIdFromPath) : null;
      const viewTitle = currentNotebook ? currentNotebook.name : "Alle Noter";

      return (
        <>
          <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 truncate pr-4" title={viewTitle}>{viewTitle}</h1>
            <div className="flex items-center gap-2 flex-shrink-0">
                <div className="relative">
                    <input 
                        type="text"
                        placeholder="Søg noter..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        aria-label="Søg noter"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {ICON_SEARCH('w-5 h-5 text-gray-400 dark:text-gray-500')}
                    </div>
                </div>
                 <select
                    value={`${settings.allNotesSortBy}-${settings.allNotesSortOrder}`}
                    onChange={(e) => {
                        const [sortBy, sortOrder] = e.target.value.split('-');
                        setSettings(s => ({ ...s, allNotesSortBy: sortBy as AppSettings['allNotesSortBy'], allNotesSortOrder: sortOrder as AppSettings['allNotesSortOrder']}))
                    }}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    aria-label="Sortér noter efter"
                >
                    <option value="updatedAt-desc">Sortér: Nyest Opdateret</option>
                    <option value="updatedAt-asc">Sortér: Ældst Opdateret</option>
                    <option value="createdAt-desc">Sortér: Nyest Oprettet</option>
                    <option value="createdAt-asc">Sortér: Ældst Oprettet</option>
                    <option value="title-asc">Sortér: Titel (A-Å)</option>
                    <option value="title-desc">Sortér: Titel (Å-A)</option>
                </select>
                {currentViewBasedOnPath === 'notebook-notes' && currentNotebook && (
                    <button 
                        onClick={() => handlePrintNotebook(currentNotebook.id)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1.5 transition-colors"
                        title="Udskriv Notesbog"
                        aria-label="Udskriv Notesbog"
                    >
                        {ICON_DOCUMENT_TEXT('w-5 h-5')} Udskriv
                    </button>
                )}
            </div>
          </div>
          {filteredAndSortedNotes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {searchTerm ? 'Ingen noter matcher din søgning.' : activeTag ? `Ingen noter fundet for tag "${activeTag}".` : (currentViewBasedOnPath === 'notebook-notes' && !currentNotebook && notebookIdFromPath) ? 'Notesbog ikke fundet.' : 'Ingen noter endnu. Opret en!'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedNotes.map(note => {
                const notebook = note.notebookId ? notebooks.find(nb => nb.id === note.notebookId) : undefined;
                return (
                  <NoteCard 
                    key={note.id} 
                    note={note} 
                    notebookName={notebook?.name}
                    notebookColor={notebook?.color}
                    onSelect={() => navigate(`/note/${note.id}/edit`)} 
                    onTogglePin={() => handleTogglePinNote(note.id)}
                    onDelete={handleDeleteNote}
                    settings={settings}
                  />
                );
              })}
            </div>
          )}
        </>
      );
    }

    if (currentViewBasedOnPath === 'tags') {
        return (
            <>
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Tags</h1>
                    {activeTag && (
                        <button 
                            onClick={() => { setActiveTag(null); navigate('/all-notes'); }} 
                            className="px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-800 dark:hover:bg-red-700 dark:text-red-100 transition-colors flex items-center gap-1"
                        >
                            Ryd Filter: {activeTag} &times;
                        </button>
                    )}
                </div>
                {allTags.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">Ingen tags fundet. Tilføj tags til dine noter for at se dem her.</p>
                ) : (
                    <div className="flex flex-wrap gap-3">
                        {allTags.map(tag => (
                            <button 
                                key={tag.id}
                                onClick={() => { setActiveTag(tag.name); navigate('/all-notes'); }} 
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                                    ${activeTag === tag.name 
                                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200'}`}
                            >
                                {tag.name} ({notes.filter(n => n.tags.includes(tag.name)).length})
                            </button>
                        ))}
                    </div>
                )}
            </>
        );
    }
    
    if (currentViewBasedOnPath === 'settings') {
        return (
            <>
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-8">Indstillinger</h1>
                <div className="space-y-8 max-w-2xl">
                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Udseende</h2>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="fontSize" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Skriftstørrelse</label>
                                <select
                                    id="fontSize"
                                    value={settings.fontSize}
                                    onChange={(e) => setSettings(s => ({...s, fontSize: e.target.value as AppSettings['fontSize']}))}
                                    className="w-full max-w-xs p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    aria-label="Vælg skriftstørrelse"
                                >
                                    {FONT_SIZES.map(fs => <option key={fs.value} value={fs.value}>{fs.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <span className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Tema</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setSettings(s => ({...s, theme: 'light'}))}
                                        className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${settings.theme === 'light' ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'}`}
                                        aria-pressed={settings.theme === 'light'}
                                    >
                                        {ICON_SUN('w-5 h-5')} Lys
                                    </button>
                                    <button
                                        onClick={() => setSettings(s => ({...s, theme: 'dark'}))}
                                        className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${settings.theme === 'dark' ? 'bg-blue-500 text-white ring-2 ring-blue-300' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'}`}
                                        aria-pressed={settings.theme === 'dark'}
                                    >
                                        {ICON_MOON('w-5 h-5')} Mørk
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Datahåndtering</h2>
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-4">
                                <button onClick={() => handleExportData()} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors">
                                    {ICON_ARROW_DOWN_TRAY('w-5 h-5')} Eksportér Alle Data
                                </button>
                                <label className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2 transition-colors cursor-pointer">
                                    {ICON_ARROW_UP_TRAY('w-5 h-5')} Importér Data
                                    <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
                                </label>
                            </div>
                            <div>
                                <label htmlFor="exportNotebook" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Eksportér Enkelt Notesbog</label>
                                <div className="flex gap-2">
                                <select
                                    id="exportNotebook"
                                    value="" 
                                    onChange={(e) => { if (e.target.value) { handleExportData(e.target.value); e.target.value = ""; } }}
                                    className="w-full max-w-xs p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    aria-label="Vælg notesbog til eksport"
                                >
                                    <option value="" disabled>Vælg en notesbog...</option>
                                    {notebooks.map(nb => <option key={nb.id} value={nb.id}>{nb.name}</option>)}
                                </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }
    return <p className="text-gray-500 dark:text-gray-400">Indlæser visning...</p>;
  };


  return (
    <div className={`flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300 font-sans ${settings.fontSize}`}>
      {!isNoteEditorOpen && (
        <main className="flex-grow p-4 sm:p-6 lg:p-8 container mx-auto max-w-7xl w-full">
          {renderCurrentView()}
        </main>
      )}

      {!isNoteEditorOpen && (
        <div className="fixed bottom-[calc(4rem+1.5rem)] right-6 sm:right-8 z-30 flex items-center">
            <span id="new-note-fab-label" className="mr-3 px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-md shadow-md whitespace-nowrap ring-1 ring-gray-300 dark:ring-gray-600">
                Ny Note
            </span>
            <button
                onClick={() => handleNavigateToNewNote(currentActiveViewForNav === 'notebook-notes' ? getNotebookIdFromPath() : null)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-labelledby="new-note-fab-label"
            >
                {ICON_PLUS('w-7 h-7')}
            </button>
        </div>
      )}
      
      {!isNoteEditorOpen && currentActiveViewForNav === 'notebooks' && (
         <div className="fixed bottom-[calc(4rem+1.5rem+4.5rem)] right-6 sm:right-8 z-30 flex items-center"> 
            <span id="new-notebook-fab-label" className="mr-3 px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-semibold rounded-md shadow-md whitespace-nowrap ring-1 ring-gray-300 dark:ring-gray-600">
                Ny Notesbog
            </span>
            <button
                onClick={() => handleOpenNotebookModal()}
                className="bg-green-600 hover:bg-green-700 text-white rounded-full p-3.5 shadow-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                aria-labelledby="new-notebook-fab-label"
            >
                {ICON_BOOK_OPEN('w-6 h-6')}
            </button>
        </div>
      )}


      {!isNoteEditorOpen && (
          <nav className="sticky bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-t-lg z-30">
            <div className="max-w-md mx-auto flex justify-around items-center h-16">
              {[
                { path: "/", icon: ICON_BOOK_OPEN, label: "Notesbøger", view: 'notebooks' as ActiveView },
                { path: "/all-notes", icon: ICON_DOCUMENT_TEXT, label: "Alle Noter", view: 'all-notes' as ActiveView },
                { path: "/tags", icon: ICON_TAG, label: "Tags", view: 'tags' as ActiveView },
                { path: "/settings", icon: ICON_COG, label: "Indstillinger", view: 'settings' as ActiveView },
              ].map(item => {
                const isActiveNotebookView = currentActiveViewForNav === 'notebook-notes' && item.view === 'notebooks';
                const isActive = currentActiveViewForNav === item.view || isActiveNotebookView;
                return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => { if (!isActive) { setActiveTag(null); setSearchTerm('');} }}
                  className={`flex flex-col items-center justify-center w-1/4 h-full transition-colors
                    ${isActive
                      ? 'text-blue-600 dark:text-blue-400' 
                      : 'text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-300'}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {item.icon(`w-6 h-6 ${settings.fontSize === 'text-sm' ? 'mb-0.5' : 'mb-1'}`)}
                  <span className={`text-xs ${settings.fontSize === 'text-sm' ? 'text-[10px]' : ''}`}>{item.label}</span>
                </Link>
              )})}
            </div>
          </nav>
      )}

      <Modal
        isOpen={isNotebookModalOpen}
        onClose={() => {setIsNotebookModalOpen(false); setEditingNotebook(null);}}
        title={editingNotebook ? "Rediger Notesbog" : "Opret Ny Notesbog"}
      >
        <div className="space-y-4">
          <label htmlFor="notebookNameInput" className="sr-only">Navn på notesbog</label>
          <input
            id="notebookNameInput"
            type="text"
            placeholder="Navn på notesbog"
            value={newNotebookName}
            onChange={(e) => setNewNotebookName(e.target.value)}
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <ColorPicker selectedColor={selectedNotebookColor} onSelectColor={setSelectedNotebookColor} />
          <button
            onClick={handleSaveNotebook}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            {editingNotebook ? "Gem Ændringer" : "Opret Notesbog"}
          </button>
        </div>
      </Modal>
      
      {isNoteEditorOpen && currentNoteToEdit && (
        <NoteEditor
          noteToEdit={currentNoteToEdit}
          notebooks={notebooks}
          allNotes={notes}
          onSave={handleSaveNote}
          onClose={() => { 
            const noteBeingClosed = currentNoteToEdit;
            if (noteBeingClosed?.notebookId && notebooks.some(nb => nb.id === noteBeingClosed.notebookId)) {
                navigate(`/notebook/${noteBeingClosed.notebookId}`);
            } else if (location.pathname === '/note/new' && getNotebookIdFromPath()){
                 navigate(`/notebook/${getNotebookIdFromPath()}`);
            }
            else {
                navigate('/all-notes'); 
            }
          }}
          onDelete={currentNoteToEdit && !currentNoteToEdit.id.startsWith('temp-new-note-') && notes.some(n => n.id === currentNoteToEdit.id) ? handleDeleteNote : undefined}
          settings={settings}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <MainApp />
    </HashRouter>
  );
};

export default App;

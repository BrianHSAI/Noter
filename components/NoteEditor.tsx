

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Note, Notebook, AppSettings } from '../types';
import NoteEditorToolbar from './NoteEditorToolbar';
import { ICON_TRASH, ICON_CALENDAR } from '../constants'; // ICON_LINK removed
import Modal from './Modal';
import { useNavigate } from 'react-router-dom'; 


interface NoteEditorProps {
  noteToEdit?: Note | null;
  notebooks: Notebook[];
  allNotes: Note[]; 
  onSave: (note: Note) => void;
  onClose: () => void;
  onDelete?: (noteId: string) => void;
  settings: AppSettings;
}

const NoteEditor: React.FC<NoteEditorProps> = ({
  noteToEdit,
  notebooks,
  allNotes,
  onSave,
  onClose,
  onDelete,
  settings
}) => {
  const [title, setTitle] = useState('');
  const [contentHTML, setContentHTML] = useState('');
  const [selectedNotebookId, setSelectedNotebookId] = useState<string | null>(null);
  const [tagsString, setTagsString] = useState('');
  const [reminder, setReminder] = useState('');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Removed state related to Link Modal
  // const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  // const [linkSearchTerm, setLinkSearchTerm] = useState('');
  // const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const navigate = useNavigate(); 


  useEffect(() => {
    if (noteToEdit) {
      setTitle(noteToEdit.title);
      setContentHTML(noteToEdit.contentHTML); 
      setSelectedNotebookId(noteToEdit.notebookId);
      setTagsString(noteToEdit.tags?.join(', ') || '');
      setReminder(noteToEdit.reminder || '');
      
      if (editorRef.current) {
        if (editorRef.current.dataset.currentNoteId !== noteToEdit.id) {
          editorRef.current.innerHTML = noteToEdit.contentHTML;
          editorRef.current.dataset.currentNoteId = noteToEdit.id;
        } else if (!editorRef.current.innerHTML && noteToEdit.contentHTML) {
           editorRef.current.innerHTML = noteToEdit.contentHTML;
        }
      }
    } else { 
      setTitle('');
      setContentHTML('');
      setSelectedNotebookId(notebooks.length > 0 ? notebooks[0].id : null);
      setTagsString('');
      setReminder('');
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
        delete editorRef.current.dataset.currentNoteId;
      }
    }
  }, [noteToEdit, notebooks]);


  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleChecklistClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'LI' && target.parentElement?.dataset.type === 'checklist') {
        const isChecked = target.dataset.checked === 'true';
        target.dataset.checked = (!isChecked).toString();
        target.style.textDecoration = !isChecked ? 'line-through' : 'none';
        target.style.opacity = !isChecked ? '0.6' : '1';
        updateContentHTMLFromDOM(); 
      }
    };

    // Removed handleInternalLinkClick function and its event listener
    // const handleInternalLinkClick = (e: MouseEvent) => { ... };

    editor.addEventListener('click', handleChecklistClick);
    // editor.removeEventListener('click', handleInternalLinkClick); // Removed

    return () => {
        editor.removeEventListener('click', handleChecklistClick);
        // editor.removeEventListener('click', handleInternalLinkClick); // Removed
    };
  }, [navigate]); // navigate dependency might be removable if no other internal navigation logic is in this useEffect


  const updateContentHTMLFromDOM = () => {
    if (editorRef.current) {
      setContentHTML(editorRef.current.innerHTML);
    }
  };

  const handleSave = () => {
    if (!noteToEdit && !title && !(editorRef.current?.innerHTML)) {
        onClose(); 
        return;
    }

    const now = new Date().toISOString();
    const baseNoteData = noteToEdit || { 
        id: `temp-new-note-${crypto.randomUUID()}`, 
        title: '',
        contentHTML: '',
        createdAt: now,
        notebookId: null,
        tags: [],
        isPinned: false,
    };
    
    const noteData: Note = {
      ...baseNoteData, 
      title: title.trim() || 'Unavngiven Note',
      contentHTML: editorRef.current?.innerHTML || '', 
      updatedAt: now, 
      notebookId: selectedNotebookId,
      tags: tagsString.split(',').map(tag => tag.trim()).filter(tag => tag),
      isPinned: noteToEdit?.isPinned || false,
      reminder: reminder || undefined,
      createdAt: baseNoteData.id.startsWith('temp-new-note-') ? now : baseNoteData.createdAt,
    };
    onSave(noteData);
  };
  
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateContentHTMLFromDOM();
  };
  
  const handleToolbarCommand = (command: string, value?: string) => {
    if (command === 'formatBlock' && value) {
        if (['H1', 'H2', 'H3', 'P'].includes(value.toUpperCase())) {
             execCommand(command, value.toUpperCase());
        } else {
            execCommand(command, value);
        }
    } else {
        execCommand(command, value);
    }
    updateContentHTMLFromDOM();
  };

  const handleInsertImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Image = e.target?.result as string;
        const imgHTML = `<img src="${base64Image}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 0.375rem; margin: 0.5rem 0; display: block;" />`;
        document.execCommand('insertHTML', false, imgHTML);
        updateContentHTMLFromDOM();
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleInsertChecklist = () => {
    const listId = `checklist-${crypto.randomUUID().substring(0, 8)}`;
    const checklistHTML = `
      <ul data-type="checklist" id="${listId}" style="list-style: none; padding-left: 0;">
        <li data-checked="false" style="margin-bottom: 0.25rem; cursor: pointer;">Nyt punkt</li>
      </ul>
      <p><br></p>
    `;
    document.execCommand('insertHTML', false, checklistHTML);
    updateContentHTMLFromDOM();
  };

  // Removed handleOpenLinkModal, handleInsertLink, and filteredNotesForLinking

  const handleSetReminder = () => {
    if (reminder) {
      const [datePart, timePart] = reminder.split('T');
      setReminderDate(datePart || '');
      setReminderTime(timePart ? timePart.substring(0, 5) : '');
    } else {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 30); 
        setReminderDate(now.toISOString().split('T')[0]);
        setReminderTime(now.toTimeString().substring(0,5));
    }
    setIsReminderModalOpen(true);
  };
  
  const handleSaveReminder = () => {
    if (reminderDate && reminderTime) {
        const localDateTime = new Date(`${reminderDate}T${reminderTime}`);
        setReminder(localDateTime.toISOString());
    } else {
        setReminder(''); 
    }
    setIsReminderModalOpen(false);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const text = event.clipboardData.getData('text/plain');

    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const youtubeMatch = text.match(youtubeRegex);

    if (youtubeMatch && youtubeMatch[1]) {
      const videoId = youtubeMatch[1];
      const iframeHTML = `
        <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 0.5rem 0; border-radius: 0.375rem;">
          <iframe 
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:0; border-radius: 0.375rem;" 
            src="https://www.youtube.com/embed/${videoId}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
        </div>
        <p><br></p>
      `;
      document.execCommand('insertHTML', false, iframeHTML);
      updateContentHTMLFromDOM();
      return;
    }

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let lastIndex = 0;
    let combinedHTML = '';
    let match;

    const sanitizeText = (plainText: string) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerText = plainText;
        return tempDiv.innerHTML;
    }
    
    while ((match = urlRegex.exec(text)) !== null) {
      const plainTextBefore = text.substring(lastIndex, match.index);
      if (plainTextBefore) {
        combinedHTML += sanitizeText(plainTextBefore);
      }
      
      const url = match[0];
      let displayHost;
      try {
        displayHost = new URL(url).hostname.replace(/^www\./, '');
      } catch (e) { 
        displayHost = url.length > 30 ? url.substring(0, 27) + '...' : url;
      }
      combinedHTML += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-600 dark:text-blue-400 hover:underline">${sanitizeText(displayHost)}</a>`;
      lastIndex = urlRegex.lastIndex;
    }
    
    const plainTextAfter = text.substring(lastIndex);
    if (plainTextAfter) {
        combinedHTML += sanitizeText(plainTextAfter);
    }

    if (combinedHTML) {
        if (!text.includes('\n')) { 
            combinedHTML = `<p>${combinedHTML}</p>`; 
        } else {
            combinedHTML = combinedHTML.replace(/\n/g, '<br>');
        }
      document.execCommand('insertHTML', false, combinedHTML);
    } else { 
      document.execCommand('insertHTML', false, sanitizeText(text).replace(/\n/g, '<br>'));
    }
    updateContentHTMLFromDOM();
  };

  const isSavedNote = noteToEdit && !noteToEdit.id.startsWith('temp-new-note-') && allNotes.some(n => n.id === noteToEdit.id);

  return (
    <div className={`fixed inset-0 bg-white dark:bg-gray-900 p-4 sm:p-6 flex flex-col z-40 ${settings.fontSize} overflow-y-auto`}>
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          {noteToEdit?.id.startsWith('temp-new-note-') ? 'Opret Note' : 'Rediger Note'}
        </h2>
        <div className="flex items-center gap-2">
           {isSavedNote && onDelete && noteToEdit && ( 
            <button
              onClick={() => onDelete(noteToEdit.id)}
              className="p-2 text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400 transition-colors rounded-md"
              title="Slet Note"
              aria-label="Slet Note"
            >
              {ICON_TRASH('w-6 h-6')}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            Annuller
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Gem Note
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 flex-grow min-h-0">
        <input
          type="text"
          placeholder="Note Titel"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 text-xl font-medium border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          aria-label="Note Titel"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
                <label htmlFor="notebook" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notesbog</label>
                <select
                    id="notebook"
                    value={selectedNotebookId || ''}
                    onChange={(e) => setSelectedNotebookId(e.target.value || null)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    aria-label="Vælg notesbog"
                >
                    <option value="">Ingen Notesbog</option>
                    {notebooks.map(nb => (
                    <option key={nb.id} value={nb.id}>{nb.name}</option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tags (komma-separeret)</label>
                <input
                    type="text"
                    id="tags"
                    placeholder="fx vigtigt, eksamen, research"
                    value={tagsString}
                    onChange={(e) => setTagsString(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    aria-label="Note tags"
                />
            </div>
            <div>
                <label htmlFor="reminder-button" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Påmindelse</label>
                 <button 
                    id="reminder-button"
                    onClick={handleSetReminder}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-left flex items-center justify-between hover:border-gray-400"
                    aria-label="Sæt eller se påmindelse"
                >
                    <span className="truncate">{reminder ? new Date(reminder).toLocaleString([], { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute:'2-digit'}) : 'Sæt Påmindelse'}</span>
                    {ICON_CALENDAR('w-5 h-5')}
                </button>
            </div>
        </div>
        
        <div className="flex flex-col flex-grow min-h-0 border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
            <NoteEditorToolbar 
                onCommand={handleToolbarCommand} 
                onInsertImage={handleInsertImage}
                onInsertChecklist={handleInsertChecklist}
                onSetReminder={handleSetReminder}
                // onLinkNote prop removed
            />
            <div
                ref={editorRef}
                contentEditable
                onPaste={handlePaste}
                onInput={updateContentHTMLFromDOM} 
                className="p-4 flex-grow overflow-y-auto focus:outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 prose dark:prose-invert max-w-none"
                style={{ minHeight: '200px', direction: 'ltr', unicodeBidi: 'isolate' } as React.CSSProperties}
                aria-label="Noteindhold editor"
                data-current-note-id={noteToEdit?.id} 
            />
        </div>
      </div>
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" style={{ display: 'none' }} aria-hidden="true" />

      {/* Removed Link to Note Modal */}

      <Modal isOpen={isReminderModalOpen} onClose={() => setIsReminderModalOpen(false)} title="Sæt Påmindelse">
        <div className="space-y-4">
            <div>
                <label htmlFor="reminder-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Dato</label>
                <input 
                    type="date" 
                    id="reminder-date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
            </div>
            <div>
                <label htmlFor="reminder-time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tid</label>
                <input 
                    type="time" 
                    id="reminder-time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <button 
                    type="button"
                    onClick={() => { setReminder(''); setReminderDate(''); setReminderTime(''); setIsReminderModalOpen(false); handleSave(); }} 
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md"
                >
                    Ryd Påmindelse
                </button>
                <button 
                    type="button"
                    onClick={() => { handleSaveReminder(); handleSave(); }} 
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                    Sæt Påmindelse
                </button>
            </div>
        </div>
      </Modal>
    </div>
  );
};

export default NoteEditor;

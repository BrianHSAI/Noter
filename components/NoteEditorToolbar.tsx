
import React from 'react';
import { 
  ICON_IMAGE, ICON_LIST_BULLET, ICON_CHECKLIST, ICON_CALENDAR 
} from '../constants'; // ICON_LINK removed

interface NoteEditorToolbarProps {
  onCommand: (command: string, value?: string) => void;
  onInsertImage: () => void;
  onInsertChecklist: () => void;
  onSetReminder: () => void;
  // onLinkNote prop removed
}

const ToolbarButton: React.FC<{ onClick: () => void, title: string, children: React.ReactNode, isActive?: boolean}> = ({ onClick, title, children, isActive }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 ${isActive ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
  >
    {children}
  </button>
);

const NoteEditorToolbar: React.FC<NoteEditorToolbarProps> = ({ 
  onCommand, onInsertImage, onInsertChecklist, onSetReminder
  // onLinkNote prop destructured removed
}) => {
  const formatButton = (cmd: string, label: React.ReactNode, title?: string) => (
    <ToolbarButton onClick={() => onCommand(cmd)} title={title || cmd}>
        {typeof label === 'string' ? <span className={`font-semibold ${cmd === 'bold' ? 'font-bold' : cmd === 'italic' ? 'italic' : cmd === 'underline' ? 'underline' : ''}`}>{label}</span> : label}
    </ToolbarButton>
  );

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-1 p-2 border-b bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-t-md">
      {formatButton('bold', <span className="font-bold text-gray-700 dark:text-gray-200">B</span>, 'Fed (Ctrl+B)')}
      {formatButton('italic', <span className="italic text-gray-700 dark:text-gray-200">I</span>, 'Kursiv (Ctrl+I)')}
      {formatButton('underline', <span className="underline text-gray-700 dark:text-gray-200">U</span>, 'Understreget (Ctrl+U)')}
      
      <select 
        onChange={(e) => onCommand('formatBlock', e.target.value)} 
        className="p-2 rounded bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-100 border border-gray-300 dark:border-gray-500 hover:border-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        defaultValue="P"
        aria-label="Vælg tekstbloktype"
      >
        <option value="P">Afsnit</option>
        <option value="H1">O1</option>
        <option value="H2">O2</option>
        <option value="H3">O3</option>
      </select>

      {formatButton('insertUnorderedList', ICON_LIST_BULLET('w-5 h-5'), 'Punktliste')}
      {formatButton('insertOrderedList', <span className="font-mono text-gray-700 dark:text-gray-200">1.</span>, 'Nummereret Liste')}
      
      <ToolbarButton onClick={onInsertChecklist} title="Indsæt Tjekliste">
        {ICON_CHECKLIST('w-5 h-5')}
      </ToolbarButton>
      <ToolbarButton onClick={onInsertImage} title="Indsæt Billede">
        {ICON_IMAGE('w-5 h-5')}
      </ToolbarButton>
      {/* Removed Link to Note button
      <ToolbarButton onClick={onLinkNote} title="Link til Note">
        {ICON_LINK('w-5 h-5')}
      </ToolbarButton>
      */}
      <ToolbarButton onClick={onSetReminder} title="Sæt Påmindelse">
        {ICON_CALENDAR('w-5 h-5')}
      </ToolbarButton>
    </div>
  );
};

export default NoteEditorToolbar;

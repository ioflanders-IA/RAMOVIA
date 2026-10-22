import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Bold, Italic, Underline, X } from 'lucide-react';

interface RichNoteBoxProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export const RichNoteBox: React.FC<RichNoteBoxProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Note su ordini, materiali e dettagli lavorazione...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('sm');

  // Sync initial content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    handleInput();
  };

  const applyHighlight = (color: string | null) => {
    if (color) {
      executeCommand('hiliteColor', color);
    } else {
      executeCommand('hiliteColor', 'transparent');
    }
  };

  const applyTextColor = (color: string) => {
    executeCommand('foreColor', color);
  };

  const setFontSizeStyle = (size: 'sm' | 'md' | 'lg') => {
    setFontSize(size);
    const sizeMap = { sm: '2', md: '3', lg: '4' };
    executeCommand('fontSize', sizeMap[size]);
  };

  const handleReset = () => {
    executeCommand('removeFormat');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      onChange('');
    }
  };

  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
        {label}
      </label>

      <div className="border border-slate-300 dark:border-slate-700 rounded-[7px] overflow-hidden bg-white dark:bg-slate-900 shadow-xs flex flex-col">
        {/* Single-Line Clean Formatting Toolbar (No lines, No button backgrounds) */}
        <div className="p-1 px-2 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between gap-1 border-b border-slate-800 text-xs select-none overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Highlighter pens - clean dots */}
            <button
              type="button"
              title="Evidenziatore Verde Operativo"
              onClick={() => applyHighlight('#15803d44')}
              className="w-4 h-4 rounded-full bg-emerald-500 hover:scale-110 transition-transform cursor-pointer"
            />
            <button
              type="button"
              title="Evidenziatore Rosso Urgente"
              onClick={() => applyHighlight('#b91c1c44')}
              className="w-4 h-4 rounded-full bg-rose-500 hover:scale-110 transition-transform cursor-pointer"
            />
            <button
              type="button"
              title="Rimuovi Evidenziazione"
              onClick={() => applyHighlight(null)}
              className="p-0.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Font Sizes A A A */}
            <button
              type="button"
              title="Testo Piccolo"
              onClick={() => setFontSizeStyle('sm')}
              className={`px-1 font-bold transition-colors cursor-pointer ${
                fontSize === 'sm' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              A
            </button>
            <button
              type="button"
              title="Testo Medio"
              onClick={() => setFontSizeStyle('md')}
              className={`px-1 text-xs font-bold transition-colors cursor-pointer ${
                fontSize === 'md' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              A
            </button>
            <button
              type="button"
              title="Testo Grande"
              onClick={() => setFontSizeStyle('lg')}
              className={`px-1 text-sm font-bold transition-colors cursor-pointer ${
                fontSize === 'lg' ? 'text-emerald-400' : 'text-slate-300 hover:text-white'
              }`}
            >
              A
            </button>

            {/* Bold, Italic, Underline */}
            <button
              type="button"
              title="Grassetto"
              onClick={() => executeCommand('bold')}
              className="p-1 text-slate-300 hover:text-white font-bold transition-colors cursor-pointer"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Corsivo"
              onClick={() => executeCommand('italic')}
              className="p-1 text-slate-300 hover:text-white italic transition-colors cursor-pointer"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              title="Sottolineato"
              onClick={() => executeCommand('underline')}
              className="p-1 text-slate-300 hover:text-white underline transition-colors cursor-pointer"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Text Color Dots */}
            <button
              type="button"
              title="Colore Rosso"
              onClick={() => applyTextColor('#ef4444')}
              className="w-3.5 h-3.5 rounded-full bg-rose-500 hover:scale-110 transition-transform cursor-pointer"
            />
            <button
              type="button"
              title="Colore Verde"
              onClick={() => applyTextColor('#10b981')}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500 hover:scale-110 transition-transform cursor-pointer"
            />
            <button
              type="button"
              title="Colore Blu"
              onClick={() => applyTextColor('#3b82f6')}
              className="w-3.5 h-3.5 rounded-full bg-blue-500 hover:scale-110 transition-transform cursor-pointer"
            />
            <button
              type="button"
              title="Colore Bianco"
              onClick={() => applyTextColor('#f8fafc')}
              className="w-3.5 h-3.5 rounded-full bg-white hover:scale-110 transition-transform cursor-pointer"
            />
          </div>

          {/* Reset / Undo Icon */}
          <button
            type="button"
            title="Reset formattazione"
            onClick={handleReset}
            className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Notebook ContentEditable Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          data-placeholder={placeholder}
          className="notebook-paper-bg p-[7px] min-h-[90px] max-h-[200px] overflow-y-auto text-xs text-slate-900 dark:text-slate-100 focus:outline-none relative"
          style={{
            wordBreak: 'break-word',
          }}
        />
      </div>
    </div>
  );
};

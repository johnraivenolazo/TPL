interface ControlPanelProps {
  canLex: boolean
  canParse: boolean
  canCheck: boolean
  canClear: boolean
  onOpenFile: () => void
  onLexical: () => void
  onSyntax: () => void
  onSemantic: () => void
  onClear: () => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function ControlPanel({
  canLex,
  canParse,
  canCheck,
  canClear,
  onOpenFile,
  onLexical,
  onSyntax,
  onSemantic,
  onClear,
  fileInputRef,
  onFileChange,
}: ControlPanelProps) {
  return (
    <div className="flex lg:flex-col gap-2 lg:gap-3 lg:w-48 shrink-0">
      <button
        onClick={onOpenFile}
        className="flex-1 lg:flex-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 hover:border-slate-600 transition-all duration-200"
      >
        Open File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.js,.ts,.tsx,.json,.md"
        className="hidden"
        onChange={onFileChange}
      />

      <button
        onClick={onLexical}
        disabled={!canLex}
        className={`flex-1 lg:flex-none rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          canLex
            ? 'bg-sky-600 text-white hover:bg-sky-500 hover:scale-105 active:scale-95'
            : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
        }`}
      >
        Lexical Analysis
      </button>

      <button
        onClick={onSyntax}
        disabled={!canParse}
        className={`flex-1 lg:flex-none rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          canParse
            ? 'bg-purple-600 text-white hover:bg-purple-500 hover:scale-105 active:scale-95'
            : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
        }`}
      >
        Syntax Analysis
      </button>

      <button
        onClick={onSemantic}
        disabled={!canCheck}
        className={`flex-1 lg:flex-none rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          canCheck
            ? 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105 active:scale-95'
            : 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
        }`}
      >
        Semantic Analysis
      </button>

      <button
        onClick={onClear}
        disabled={!canClear}
        className={`flex-1 lg:flex-none rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          canClear
            ? 'border border-slate-700 text-slate-300 hover:bg-slate-900 hover:border-slate-600 hover:text-white'
            : 'text-slate-700 cursor-not-allowed border border-slate-800'
        }`}
      >
        Clear
      </button>
    </div>
  )
}

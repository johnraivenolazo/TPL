interface CodeTextAreaProps {
  source: string
  fileName: string
}

export function CodeTextArea({ source, fileName }: CodeTextAreaProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 relative">
      <textarea
        value={source}
        readOnly
        placeholder="No file selected. Click 'Open File' to load source code."
        className="flex-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-3 md:p-4 text-xs md:text-sm text-slate-300 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-slate-700"
      />
      {fileName && (
        <div className="absolute top-2 right-6 text-md text-slate-500 bg-slate-950 px-2 py-1 rounded border-none">
          {fileName}
        </div>
      )}
    </div>
  )
}

import { useCompiler } from './hooks/useCompiler'
import { ControlPanel } from './components/ControlPanel'
import { CodeTextArea } from './components/CodeTextArea'
import { ResultPanel } from './components/ResultPanel'
import { StatusIndicator } from './components/StatusIndicator'

function App() {
  const {
    fileInputRef,
    fileName,
    source,
    phase,
    tokens,
    ast,
    findings,
    phaseResults,
    canLex,
    canParse,
    canCheck,
    canClear,
    handleFilePick,
    handleFileChange,
    runLexical,
    runSyntax,
    runSemantic,
    handleClear,
  } = useCompiler()

  return (
    <div className="h-screen bg-black overflow-hidden">
      <main className="h-full mx-auto max-w-7xl p-4 md:p-6">
        <div className="h-full flex flex-col lg:flex-row gap-4">
          <ControlPanel
            canLex={canLex}
            canParse={canParse}
            canCheck={canCheck}
            canClear={canClear}
            onOpenFile={handleFilePick}
            onLexical={runLexical}
            onSyntax={runSyntax}
            onSemantic={runSemantic}
            onClear={handleClear}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
          />

          <div className="flex-1 flex flex-col gap-4 min-h-0">
            <CodeTextArea source={source} fileName={fileName} />
            <StatusIndicator results={phaseResults} />
            <ResultPanel phase={phase} tokens={tokens} ast={ast} findings={findings} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App

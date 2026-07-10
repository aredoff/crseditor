declare class Go {
  importObject: WebAssembly.Imports
  run(instance: WebAssembly.Instance): void
}

interface WasmTranslationResult {
  yaml?: string
  seclang?: string
  error?: string
}

interface Window {
  Go: typeof Go
  seclangToCRSLang: (content: string) => WasmTranslationResult
  crslangToSeclang: (yaml: string) => WasmTranslationResult
  corazaTest: (
    setupSecLang: string,
    userRules: string,
    request: string,
    response: string,
    dataFilesJson: string,
  ) => import('@/types/coraza').CorazaTestResult
}

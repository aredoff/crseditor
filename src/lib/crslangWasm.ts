import { parsedRulesToYaml, yamlToParsedRules } from '@/lib/ruleAdapters'
import type { ParsedRule, WasmResult } from '@/types/rules'

let initPromise: Promise<void> | null = null
let ready = false

function getBaseUrl(): string {
  const base = import.meta.env.BASE_URL
  return base.endsWith('/') ? base : `${base}/`
}

async function loadWasmRuntime(force = false): Promise<void> {
  if (ready && !force) return
  if (initPromise && !force) return initPromise

  if (force) {
    ready = false
    initPromise = null
  }

  initPromise = (async () => {
    const base = getBaseUrl()

    if (!document.querySelector(`script[src="${base}wasm/wasm_exec.js"]`)) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script')
        script.src = `${base}wasm/wasm_exec.js`
        script.onload = () => resolve()
        script.onerror = () => reject(new Error('Failed to load wasm_exec.js'))
        document.head.appendChild(script)
      })
    }

    const response = await fetch(`${base}wasm/crslang.wasm`)
    if (!response.ok) throw new Error('Failed to fetch crslang.wasm')

    const go = new window.Go()
    const wasmBuffer = await response.arrayBuffer()
    const result = await WebAssembly.instantiate(wasmBuffer, go.importObject)
    go.run(result.instance)
    ready = true
  })()

  return initPromise
}

function resetWasmRuntime(): void {
  ready = false
  initPromise = null
}

function ensureReady(): void {
  if (!ready) throw new Error('WASM module is not ready yet')
}

export function isSecLangInput(content: string): boolean {
  return /\bSecRule\b/.test(content)
    || /\bSecAction\b/.test(content)
    || /\bSecMarker\b/.test(content)
}

export function isCrslangYamlInput(content: string): boolean {
  const trimmed = content.trim()
  if (isSecLangInput(trimmed)) return false
  return /^directivelist\s*:/m.test(trimmed)
    || (trimmed.includes('directivelist') && /\bkind:\s*rule\b/.test(trimmed))
}

async function callWasm<T>(
  label: string,
  invoke: () => WasmTranslationResult,
  pick: (result: WasmTranslationResult) => T | undefined,
): Promise<WasmResult<T>> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await loadWasmRuntime(attempt > 0)
      ensureReady()
      const result = invoke()
      if (result.error) {
        return { ok: false, error: result.error }
      }
      const data = pick(result)
      if (data === undefined) {
        return { ok: false, error: `Empty ${label}` }
      }
      return { ok: true, data }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (attempt === 0 && (
        message.includes('Go program has already exited')
        || message.includes('exit code: 2')
        || message.includes('nil pointer dereference')
      )) {
        resetWasmRuntime()
        continue
      }
      return { ok: false, error: message }
    }
  }
  return { ok: false, error: 'WASM runtime failed' }
}

export async function initCrslangWasm(): Promise<void> {
  await loadWasmRuntime()
}

export function isCrslangWasmReady(): boolean {
  return ready
}

async function parseCrslangYaml(content: string): Promise<WasmResult<ParsedRule[]>> {
  const compileCheck = await callWasm(
    'SecLang output from CRSLang compile',
    () => window.crslangToSeclang(content),
    (result) => result.seclang,
  )
  if (!compileCheck.ok) return compileCheck

  const wasmRoundTrip = await callWasm(
    'CRSLang YAML from SecLang round-trip',
    () => window.seclangToCRSLang(compileCheck.data),
    (result) => result.yaml,
  )

  const yamlSource = wasmRoundTrip.ok ? wasmRoundTrip.data : content
  const rules = yamlToParsedRules(yamlSource)
  if (rules.length === 0) {
    return { ok: false, error: 'No rules found in CRSLang YAML' }
  }
  return { ok: true, data: rules }
}

export async function parseCrslang(content: string): Promise<WasmResult<ParsedRule[]>> {
  if (!isCrslangYamlInput(content)) {
    return { ok: false, error: 'Input does not look like CRSLang YAML' }
  }
  try {
    return await parseCrslangYaml(content)
  } catch (error) {
    resetWasmRuntime()
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to parse CRSLang' }
  }
}

export async function generateCrslang(rules: ParsedRule[]): Promise<WasmResult<string>> {
  try {
    const yaml = parsedRulesToYaml(rules)
    const roundTrip = await callWasm(
      'SecLang compile check',
      () => window.crslangToSeclang(yaml),
      (result) => result.seclang ?? '',
    )
    if (!roundTrip.ok) return roundTrip
    return { ok: true, data: yaml }
  } catch (error) {
    resetWasmRuntime()
    return { ok: false, error: error instanceof Error ? error.message : 'Failed to generate CRSLang' }
  }
}

export async function parseSecLang(content: string): Promise<WasmResult<ParsedRule[]>> {
  const parsed = await callWasm(
    'CRSLang YAML from SecLang parser',
    () => window.seclangToCRSLang(content),
    (result) => result.yaml,
  )
  if (!parsed.ok) return parsed

  const rules = yamlToParsedRules(parsed.data)
  if (rules.length === 0) {
    return { ok: false, error: 'No rules found in SecLang input' }
  }
  return { ok: true, data: rules }
}

export async function compileToSecLang(rules: ParsedRule[]): Promise<WasmResult<string>> {
  const yaml = parsedRulesToYaml(rules)
  return callWasm(
    'SecLang output',
    () => window.crslangToSeclang(yaml),
    (result) => result.seclang,
  )
}

export async function importText(content: string): Promise<WasmResult<ParsedRule[]>> {
  const trimmed = content.trim()
  if (!trimmed) return { ok: false, error: 'Input is empty' }

  if (isSecLangInput(trimmed)) {
    const seclangResult = await parseSecLang(trimmed)
    if (seclangResult.ok) return seclangResult
    if (isCrslangYamlInput(trimmed)) {
      return parseCrslang(trimmed)
    }
    return seclangResult
  }

  if (isCrslangYamlInput(trimmed)) {
    const crslangResult = await parseCrslang(trimmed)
    if (crslangResult.ok) return crslangResult
    return parseSecLang(trimmed)
  }

  const seclangResult = await parseSecLang(trimmed)
  if (seclangResult.ok) return seclangResult
  return parseCrslang(trimmed)
}

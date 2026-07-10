import { MINIMAL_SETUP_SECLANG } from '@/constants/defaultSetupSecLang'
import { stripSecLangComments } from '@/lib/seclangFormat'
import type { CorazaAnalysisResult, CorazaCollection, CorazaDataFile, CorazaRuleMatch, CorazaTestResult } from '@/types/coraza'

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

    const response = await fetch(`${base}wasm/coraza.wasm`)
    if (!response.ok) throw new Error('Failed to fetch coraza.wasm')

    const go = new window.Go()
    const wasmBuffer = await response.arrayBuffer()
    const result = await WebAssembly.instantiate(wasmBuffer, go.importObject)
    go.run(result.instance)
    ready = true
  })()

  return initPromise
}

export async function initCorazaWasm(): Promise<void> {
  await loadWasmRuntime()
}

export function isCorazaWasmReady(): boolean {
  return ready
}

export async function loadDefaultSetup(): Promise<string> {
  const base = getBaseUrl()
  try {
    const response = await fetch(`${base}coraza/default-setup.conf`)
    if (!response.ok) return stripSecLangComments(MINIMAL_SETUP_SECLANG)
    return stripSecLangComments(await response.text())
  } catch {
    return stripSecLangComments(MINIMAL_SETUP_SECLANG)
  }
}

function parseResult(raw: CorazaTestResult): CorazaAnalysisResult {
  if (raw.error) {
    throw new Error(raw.error)
  }

  let collections: CorazaCollection[] = []
  let matchedRules: CorazaRuleMatch[] = []
  let auditLog = raw.audit_log || ''

  try {
    collections = JSON.parse(raw.collections || '[]') as CorazaCollection[]
  } catch {
    collections = []
  }

  try {
    matchedRules = JSON.parse(raw.matched_data || '[]') as CorazaRuleMatch[]
  } catch {
    matchedRules = []
  }

  try {
    if (auditLog) {
      auditLog = JSON.stringify(JSON.parse(auditLog), null, 2)
    }
  } catch {
    // keep raw audit log
  }

  const disruptiveStatus = raw.disruptive_status || 0
  const disruptiveAction = raw.disruptive_action || 'none'

  return {
    transactionId: raw.transaction_id || '-',
    disruptiveAction: disruptiveStatus > 0 ? `${disruptiveAction} (${disruptiveStatus})` : disruptiveAction,
    disruptiveRule: raw.disruptive_rule || '-',
    disruptiveStatus,
    matchedRules,
    collections,
    auditLog,
    duration: raw.duration || 0,
    engineStatus: raw.engine_status || 'Unknown',
    rulesMatchedTotal: raw.rules_matched_total || '0',
  }
}

export async function runCorazaTest(
  setupSecLang: string,
  userRules: string,
  request: string,
  response: string,
  dataFiles: CorazaDataFile[] = [],
): Promise<CorazaAnalysisResult> {
  await loadWasmRuntime()
  if (!ready || typeof window.corazaTest !== 'function') {
    throw new Error('Coraza WASM is not ready')
  }

  const payload = JSON.stringify(
    dataFiles
      .filter((file) => file.name.trim() && file.content.trim())
      .map((file) => ({ name: file.name.trim(), content: file.content })),
  )

  try {
    const raw = window.corazaTest(setupSecLang, userRules, request, response, payload)
    return parseResult(raw)
  } catch (error) {
    ready = false
    initPromise = null
    throw error
  }
}

export const DEFAULT_REQUEST = `POST / HTTP/1.1
Host: localhost
User-Agent: CRSEditor
Content-Type: application/x-www-form-urlencoded
Content-Length: 10

param=value`

export const DEFAULT_RESPONSE = `HTTP/1.1 200 OK
Content-Type: text/html; charset=UTF-8
Content-Length: 12

Hello, world`

export const EXAMPLE_REQUEST = `POST /login HTTP/1.1
Host: example.com
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36
Content-Type: application/x-www-form-urlencoded
Content-Length: 53

username=admin'-- &password=test&submit=Login`

export const EXAMPLE_RESPONSE = `HTTP/1.1 200 OK
Server: nginx/1.18.0
Content-Type: text/html; charset=UTF-8
Content-Length: 145

<html><body><h1>Login</h1><p>Login successful!</p></body></html>`

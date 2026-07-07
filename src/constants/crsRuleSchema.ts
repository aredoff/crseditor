export type ParanoiaLevel = '1' | '2' | '3' | '4'

export interface NamedGroup<T extends string = string> {
  id: string
  items: readonly T[]
}

export interface OperatorDef {
  name: string
  hasArg: boolean
}

export interface OperatorGroup {
  id: string
  items: readonly OperatorDef[]
}

export interface ActionGroupDef {
  id: string
  category: 'disruptive' | 'non-disruptive' | 'flow' | 'data'
  items: readonly string[]
}

export const PHASES = ['1', '2', '3', '4', '5'] as const

export const SEVERITIES = [
  'EMERGENCY',
  'ALERT',
  'CRITICAL',
  'ERROR',
  'WARNING',
  'NOTICE',
  'INFO',
  'DEBUG',
] as const

export const PARANOIA_LEVELS: readonly ParanoiaLevel[] = ['1', '2', '3', '4']

export const CRS_ID_RANGES = {
  local: { min: 1, max: 99999 },
  crs: { min: 900000, max: 999999 },
} as const

export const TAG_PRESETS = {
  application: ['application-multi', 'application-php', 'application-java'],
  language: ['language-multi', 'language-php', 'language-java'],
  platform: ['platform-multi', 'platform-apache', 'platform-unix'],
  attack: ['attack-xss', 'attack-sqli', 'attack-rce', 'attack-lfi', 'attack-protocol'],
  owasp: ['OWASP_CRS'],
} as const

export const VARIABLE_GROUPS: readonly NamedGroup[] = [
  {
    id: 'request',
    items: [
      'ARGS_COMBINED_SIZE',
      'QUERY_STRING',
      'REQUEST_BASENAME',
      'REQUEST_BODY',
      'REQUEST_BODY_LENGTH',
      'REQUEST_FILENAME',
      'REQUEST_LINE',
      'REQUEST_METHOD',
      'REQUEST_PROTOCOL',
      'REQUEST_URI',
      'REQUEST_URI_RAW',
      'REQBODY_ERROR',
      'REQBODY_ERROR_MSG',
      'REQBODY_PROCESSOR',
      'REQBODY_PROCESSOR_ERROR',
      'REQBODY_PROCESSOR_ERROR_MSG',
      'URLENCODED_ERROR',
    ],
  },
  {
    id: 'response',
    items: [
      'RESPONSE_BODY',
      'RESPONSE_CONTENT_LENGTH',
      'RESPONSE_CONTENT_TYPE',
      'RESPONSE_PROTOCOL',
      'RESPONSE_STATUS',
      'OUTBOUND_DATA_ERROR',
    ],
  },
  {
    id: 'server',
    items: [
      'AUTH_TYPE',
      'REMOTE_ADDR',
      'REMOTE_HOST',
      'REMOTE_PORT',
      'REMOTE_USER',
      'SERVER_ADDR',
      'SERVER_NAME',
      'SERVER_PORT',
      'SCRIPT_BASENAME',
      'SCRIPT_FILENAME',
      'SCRIPT_GID',
      'SCRIPT_GROUPNAME',
      'SCRIPT_MODE',
      'SCRIPT_UID',
      'SCRIPT_USERNAME',
      'PATH_INFO',
      'USERAGENT_IP',
      'USERID',
      'WEBAPPID',
      'WEBSERVER_ERROR_LOG',
    ],
  },
  {
    id: 'time',
    items: [
      'TIME',
      'TIME_DAY',
      'TIME_EPOCH',
      'TIME_HOUR',
      'TIME_MIN',
      'TIME_MON',
      'TIME_SEC',
      'TIME_WDAY',
      'TIME_YEAR',
      'DURATION',
    ],
  },
  {
    id: 'miscellaneous',
    items: [
      'FILES_COMBINED_SIZE',
      'FILES_NAMES',
      'FILES_SIZES',
      'FILES_TMP_CONTENT',
      'FILES_TMPNAMES',
      'FULL_REQUEST',
      'FULL_REQUEST_LENGTH',
      'HIGHEST_SEVERITY',
      'INBOUND_DATA_ERROR',
      'MATCHED_VAR',
      'MATCHED_VAR_NAME',
      'MODSEC_BUILD',
      'MSC_PCRE_LIMITS_EXCEEDED',
      'MSC_PCRE_ERROR',
      'MULTIPART_CRLF_LF_LINES',
      'MULTIPART_FILENAME',
      'MULTIPART_NAME',
      'MULTIPART_STRICT_ERROR',
      'MULTIPART_UNMATCHED_BOUNDARY',
      'MULTIPART_BOUNDARY_QUOTED',
      'MULTIPART_BOUNDARY_WHITESPACE',
      'MULTIPART_DATA_AFTER',
      'MULTIPART_DATA_BEFORE',
      'MULTIPART_FILE_LIMIT_EXCEEDED',
      'MULTIPART_HEADER_FOLDING',
      'MULTIPART_INVALID_HEADER_FOLDING',
      'MULTIPART_INVALID_PART',
      'MULTIPART_INVALID_QUOTING',
      'MULTIPART_LF_LINE',
      'MULTIPART_MISSING_SEMICOLON',
      'MULTIPART_SEMICOLON_MISSING',
      'PERF_ALL',
      'PERF_COMBINED',
      'PERF_GC',
      'PERF_LOGGING',
      'PERF_PHASE1',
      'PERF_PHASE2',
      'PERF_PHASE3',
      'PERF_PHASE4',
      'PERF_PHASE5',
      'PERF_SREAD',
      'PERF_SWRITE',
      'SDBM_DELETE_ERROR',
      'SESSIONID',
      'STATUS',
      'STATUS_LINE',
      'STREAM_INPUT_BODY',
      'STREAM_OUTPUT_BODY',
      'UNIQUE_ID',
    ],
  },
] as const

export const COLLECTION_GROUPS: readonly NamedGroup[] = [
  {
    id: 'request',
    items: [
      'ARGS',
      'ARGS_GET',
      'ARGS_GET_NAMES',
      'ARGS_NAMES',
      'ARGS_POST',
      'ARGS_POST_NAMES',
      'REQUEST_COOKIES',
      'REQUEST_COOKIES_NAMES',
      'REQUEST_HEADERS',
      'REQUEST_HEADERS_NAMES',
      'FILES',
      'MULTIPART_PART_HEADERS',
    ],
  },
  {
    id: 'response',
    items: ['RESPONSE_HEADERS', 'RESPONSE_HEADERS_NAMES'],
  },
  {
    id: 'collections',
    items: ['TX', 'IP', 'SESSION', 'GEO', 'GLOBAL', 'USER', 'RESOURCE', 'ENV', 'RULE', 'XML'],
  },
  {
    id: 'miscellaneous',
    items: ['MATCHED_VARS', 'MATCHED_VARS_NAMES', 'PERF_RULES'],
  },
] as const

export const OPERATOR_GROUPS: readonly OperatorGroup[] = [
  {
    id: 'string',
    items: [
      { name: 'rx', hasArg: true },
      { name: 'pm', hasArg: true },
      { name: 'pmf', hasArg: true },
      { name: 'pmFromFile', hasArg: true },
      { name: 'beginsWith', hasArg: true },
      { name: 'contains', hasArg: true },
      { name: 'containsWord', hasArg: true },
      { name: 'endsWith', hasArg: true },
      { name: 'streq', hasArg: true },
      { name: 'strmatch', hasArg: true },
      { name: 'within', hasArg: true },
    ],
  },
  {
    id: 'numerical',
    items: [
      { name: 'eq', hasArg: true },
      { name: 'ge', hasArg: true },
      { name: 'gt', hasArg: true },
      { name: 'le', hasArg: true },
      { name: 'lt', hasArg: true },
    ],
  },
  {
    id: 'validation',
    items: [
      { name: 'validateByteRange', hasArg: true },
      { name: 'validateUrlEncoding', hasArg: false },
      { name: 'validateUtf8Encoding', hasArg: false },
      { name: 'validateSchema', hasArg: true },
      { name: 'validateDTD', hasArg: true },
      { name: 'validateHash', hasArg: true },
      { name: 'detectSQLi', hasArg: false },
      { name: 'detectXSS', hasArg: false },
      { name: 'verifyCC', hasArg: false },
      { name: 'verifyCPF', hasArg: false },
      { name: 'verifySSN', hasArg: false },
      { name: 'verifySVNR', hasArg: false },
    ],
  },
  {
    id: 'miscellaneous',
    items: [
      { name: 'rbl', hasArg: true },
      { name: 'geoLookup', hasArg: true },
      { name: 'gsbLookup', hasArg: true },
      { name: 'inspectFile', hasArg: true },
      { name: 'ipMatch', hasArg: true },
      { name: 'ipMatchF', hasArg: true },
      { name: 'ipMatchFromFile', hasArg: true },
      { name: 'fuzzyHash', hasArg: true },
      { name: 'rsub', hasArg: true },
      { name: 'rxGlobal', hasArg: true },
      { name: 'unconditionalMatch', hasArg: false },
    ],
  },
] as const

export const TRANSFORMATION_GROUPS: readonly NamedGroup[] = [
  {
    id: 'antiEvasion',
    items: [
      'none',
      'lowercase',
      'uppercase',
      'normalisePath',
      'normalizePath',
      'normalisePathWin',
      'normalizePathWin',
      'removeNulls',
      'replaceComments',
      'removeComments',
      'removeCommentsChar',
      'compressWhitespace',
      'removeWhitespace',
      'replaceNulls',
      'trim',
      'trimLeft',
      'trimRight',
    ],
  },
  {
    id: 'decoding',
    items: [
      'base64Decode',
      'base64DecodeExt',
      'hexDecode',
      'jsDecode',
      'urlDecode',
      'urlDecodeUni',
      'htmlEntityDecode',
      'cssDecode',
      'escapeSeqDecode',
      'sqlHexDecode',
      'cmdLine',
      'utf8toUnicode',
    ],
  },
  {
    id: 'encoding',
    items: ['base64Encode', 'hexEncode', 'urlEncode'],
  },
  {
    id: 'hashing',
    items: ['sha1', 'md5'],
  },
  {
    id: 'miscellaneous',
    items: ['length', 'parityEven7bit', 'parityOdd7bit', 'parityZero7bit'],
  },
] as const

export const ACTION_GROUPS: readonly ActionGroupDef[] = [
  {
    id: 'disruptive',
    category: 'disruptive',
    items: ['allow', 'block', 'deny', 'drop', 'pass', 'pause', 'proxy', 'redirect'],
  },
  {
    id: 'flow',
    category: 'flow',
    items: ['chain', 'skip', 'skipAfter'],
  },
  {
    id: 'data',
    category: 'data',
    items: ['status', 'xmlns'],
  },
  {
    id: 'variable',
    category: 'non-disruptive',
    items: ['capture', 'setvar', 'initcol', 'expirevar', 'deprecatevar', 'setenv', 'setuid', 'setsid', 'setrsc'],
  },
  {
    id: 'logging',
    category: 'non-disruptive',
    items: [
      'log',
      'nolog',
      'auditlog',
      'noauditlog',
      'logdata',
      'sanitiseArg',
      'sanitiseRequestHeader',
      'sanitiseResponseHeader',
      'sanitiseMatched',
      'sanitiseMatchedBytes',
    ],
  },
  {
    id: 'miscellaneous',
    category: 'non-disruptive',
    items: ['multiMatch', 'exec', 'append', 'prepend'],
  },
] as const

export const ACTION_ORDER = [
  'allow',
  'block',
  'deny',
  'drop',
  'pass',
  'pause',
  'proxy',
  'redirect',
  'status',
  'capture',
  'log',
  'nolog',
  'auditlog',
  'noauditlog',
  'logdata',
  'sanitiseArg',
  'sanitiseRequestHeader',
  'sanitiseResponseHeader',
  'sanitiseMatched',
  'sanitiseMatchedBytes',
  'ctl',
  'ver',
  'severity',
  'multiMatch',
  'initcol',
  'setenv',
  'setvar',
  'expirevar',
  'deprecatevar',
  'append',
  'prepend',
  'exec',
  'chain',
  'skip',
  'skipAfter',
] as const

export const ACTIONS_WITH_PARAMS = [
  'append',
  'deprecatevar',
  'exec',
  'expirevar',
  'initcol',
  'logdata',
  'prepend',
  'proxy',
  'redirect',
  'sanitiseArg',
  'sanitiseMatched',
  'sanitiseMatchedBytes',
  'sanitiseRequestHeader',
  'sanitiseResponseHeader',
  'setenv',
  'setrsc',
  'setsid',
  'setuid',
  'skip',
  'skipAfter',
  'status',
  'xmlns',
] as const

export type CtlValueMode = 'select' | 'text'

export interface CtlOptionDef {
  key: string
  values: readonly string[]
  valueMode: CtlValueMode
}

export const CTL_OPTIONS: readonly CtlOptionDef[] = [
  { key: 'ruleEngine', values: ['On', 'Off', 'DetectionOnly', 'RelevantOnly'], valueMode: 'select' },
  { key: 'auditEngine', values: ['On', 'Off', 'RelevantOnly'], valueMode: 'select' },
  { key: 'requestBodyAccess', values: ['On', 'Off'], valueMode: 'select' },
  { key: 'responseBodyAccess', values: ['On', 'Off'], valueMode: 'select' },
  { key: 'forceRequestBodyVariable', values: ['On', 'Off'], valueMode: 'select' },
  { key: 'requestBodyProcessor', values: ['JSON', 'XML', 'URLENCODED', 'MULTIPART'], valueMode: 'select' },
  { key: 'requestBodyLimit', values: ['13107200'], valueMode: 'text' },
  { key: 'requestBodyNoFilesLimit', values: ['131072'], valueMode: 'text' },
  { key: 'responseBodyLimit', values: ['524288'], valueMode: 'text' },
  { key: 'ruleRemoveById', values: ['920100', '913000-913999'], valueMode: 'text' },
  { key: 'ruleRemoveByTag', values: ['attack-xss', 'attack-sqli'], valueMode: 'text' },
  { key: 'ruleRemoveTargetById', values: ['920280;ARGS:user_id', '942440;!REQUEST_COOKIES:/^uid_.*/'], valueMode: 'text' },
  { key: 'ruleRemoveTargetByTag', values: ['attack-xss;ARGS'], valueMode: 'text' },
  { key: 'ruleRemoveByMsg', values: ['File Access'], valueMode: 'text' },
  { key: 'ruleRemoveTargetByMsg', values: ['SQL Injection;ARGS:id'], valueMode: 'text' },
] as const

export const SETVAR_COLLECTIONS = ['TX', 'IP', 'SESSION', 'USER', 'GLOBAL', 'RESOURCE'] as const
export const SETVAR_OPERATIONS = ['=', '=+', '=-'] as const

export const VARIABLES = VARIABLE_GROUPS.flatMap((group) => group.items)
export const COLLECTIONS = COLLECTION_GROUPS.flatMap((group) => group.items)
export const OPERATORS = OPERATOR_GROUPS.flatMap((group) => group.items)
export const TRANSFORMATIONS = TRANSFORMATION_GROUPS.flatMap((group) => group.items)

export const DISRUPTIVE_ACTIONS = ACTION_GROUPS.find((group) => group.id === 'disruptive')!.items
export const FLOW_ACTIONS = ACTION_GROUPS.find((group) => group.id === 'flow')!.items
export const DATA_ACTIONS = ACTION_GROUPS.find((group) => group.id === 'data')!.items
export const NON_DISRUPTIVE_ACTIONS = ACTION_GROUPS
  .filter((group) => group.category === 'non-disruptive')
  .flatMap((group) => group.items)

export function operatorLabel(name: string): string {
  return `@${name}`
}

export function getOperatorMeta(name: string): OperatorDef {
  return OPERATORS.find((op) => op.name === name) ?? OPERATORS.find((op) => op.name === 'rx')!
}

export function actionRequiresParam(key: string): boolean {
  return (ACTIONS_WITH_PARAMS as readonly string[]).includes(key) || key === 'setvar'
}

export function sortActionsByCrsOrder<T extends { key: string }>(actions: T[]): T[] {
  const rank = (action: T): number => {
    const keyRank = ACTION_ORDER.indexOf(action.key as typeof ACTION_ORDER[number])
    return keyRank === -1 ? 999 : keyRank
  }
  return [...actions].sort((left, right) => rank(left) - rank(right))
}

export function paranoiaTag(level: ParanoiaLevel): string {
  return `paranoia-level/${level}`
}

export function extractParanoiaLevel(tags: string[] | undefined): ParanoiaLevel | undefined {
  const match = tags?.find((tag) => tag.startsWith('paranoia-level/'))
  if (!match) return undefined
  const level = match.split('/')[1]
  return PARANOIA_LEVELS.includes(level as ParanoiaLevel) ? level as ParanoiaLevel : undefined
}

export function syncParanoiaTag(tags: string[] | undefined, level: ParanoiaLevel | undefined): string[] {
  const filtered = (tags ?? []).filter((tag) => !tag.startsWith('paranoia-level/'))
  if (!level) return filtered
  return [...filtered, paranoiaTag(level)]
}

export function isKnownIdRange(id: number): boolean {
  return (id >= CRS_ID_RANGES.local.min && id <= CRS_ID_RANGES.local.max)
    || (id >= CRS_ID_RANGES.crs.min && id <= CRS_ID_RANGES.crs.max)
}

export const DEFAULT_MAX_JOB_ATTEMPTS=3;
export const WORKER_COMMANDS={reminders:"workers/reminders.ts",insights:"workers/insights.ts",migration:"workers/migration.ts"} as const;
export type WorkerKind=keyof typeof WORKER_COMMANDS;
export function resolveWorkerCommand(kind:string):readonly [string,string]{if(!Object.hasOwn(WORKER_COMMANDS,kind))throw new Error("Unsupported worker kind.");return["tsx",WORKER_COMMANDS[kind as WorkerKind]]}
export function parseAttemptBound(value:string|undefined,fallback=DEFAULT_MAX_JOB_ATTEMPTS){const parsed=Number(value??fallback);if(!Number.isSafeInteger(parsed)||parsed<1||parsed>10)throw new Error("WORKER_MAX_ATTEMPTS must be an integer from 1 to 10.");return parsed}
export function canRetry(attempts:number,maxAttempts=DEFAULT_MAX_JOB_ATTEMPTS){return Number(attempts)<Number(maxAttempts)}
export function assertSafeWorkerPayload(payload:unknown,maxBytes=64_000):asserts payload is Record<string,unknown>{if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new Error("Worker payload must be an object.");const serialized=JSON.stringify(payload);if(Buffer.byteLength(serialized,"utf8")>maxBytes)throw new Error("Worker payload exceeds the allowed size.");const visit=(value:unknown):void=>{if(typeof value==="string"&&(value.includes("\0")||/^[=+@]/.test(value)))throw new Error("Worker payload contains unsafe text.");if(Array.isArray(value))value.forEach(visit);else if(value&&typeof value==="object")Object.entries(value).forEach(([key,item])=>{if(["__proto__","prototype","constructor"].includes(key))throw new Error("Worker payload contains a forbidden key.");visit(item)})};visit(payload)}
export const CLAIM_DUE_JOBS_SQL=`SELECT id, payload, attempts
FROM jobs
WHERE organization_id = $1 AND state = 'pending' AND attempts < $2
ORDER BY due_at, id
FOR UPDATE SKIP LOCKED
LIMIT $3`;
export function nextJobState(outcome:"succeeded"|"failed",attempts:number,maxAttempts=DEFAULT_MAX_JOB_ATTEMPTS){if(outcome==="succeeded")return"succeeded" as const;return canRetry(attempts,maxAttempts)?"pending" as const:"failed" as const}

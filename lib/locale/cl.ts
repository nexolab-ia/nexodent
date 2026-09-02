const rutBody=/^[0-9]{7,8}[0-9K]$/;
export function normalizeRut(value:string){return value.replace(/[.\-\s]/g,"").toUpperCase()}
export function calculateRutCheckDigit(body:string){let sum=0,multiplier=2;for(let index=body.length-1;index>=0;index--){sum+=Number(body[index])*multiplier;multiplier=multiplier===7?2:multiplier+1}const result=11-(sum%11);return result===11?"0":result===10?"K":String(result)}
export function isValidRut(value:string){const normalized=normalizeRut(value);if(!rutBody.test(normalized))return false;const body=normalized.slice(0,-1),digit=normalized.at(-1);return calculateRutCheckDigit(body)===digit}
export function formatRut(value:string){const normalized=normalizeRut(value),body=normalized.slice(0,-1),digit=normalized.at(-1);if(!body||!digit)return value;return `${new Intl.NumberFormat("es-CL").format(Number(body))}-${digit}`}
export function formatClp(value:number|string){return new Intl.NumberFormat("es-CL",{style:"currency",currency:"CLP",maximumFractionDigits:0}).format(Number(value))}
export function formatSantiagoDateTime(value:Date|string|number){return new Intl.DateTimeFormat("es-CL",{timeZone:"America/Santiago",dateStyle:"short",timeStyle:"short"}).format(new Date(value))}

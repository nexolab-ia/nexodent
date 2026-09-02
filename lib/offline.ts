const MUTATION_METHODS=new Set(["POST","PUT","PATCH","DELETE"]);
export class OfflineMutationError extends Error{constructor(){super("No puedes guardar cambios sin conexión. Recupera la conexión e inténtalo otra vez.");this.name="OfflineMutationError"}}
export function assertOnlineMutation(method:string,isOnline:boolean=typeof navigator==="undefined"||navigator.onLine){if(MUTATION_METHODS.has(method.toUpperCase())&&!isOnline)throw new OfflineMutationError()}
export async function safeMutationFetch(input:string|URL|Request,init:{method?:string}={}){assertOnlineMutation(init.method??"GET");return fetch(input,init)}
export async function registerServiceWorker(){if(typeof navigator!=="undefined"&&"serviceWorker" in navigator)await navigator.serviceWorker.register("/sw.js",{scope:"/"})}

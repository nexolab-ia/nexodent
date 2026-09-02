/** Service-worker source contract. Served build-equivalent lives at public/sw.js. */
export const SHELL_CACHE = "nexodent-shell-v1";
export const SHELL_ASSETS = ["/", "/offline", "/manifest.webmanifest", "/icons/icon.svg"] as const;
export const NEVER_CACHE_PATHS = ["/api/", "/agenda", "/patients", "/billing", "/estimates", "/login"] as const;
export function isSafeShellRequest(url:string,method="GET"){const {pathname}=new URL(url,"https://local.invalid");return method==="GET"&&!NEVER_CACHE_PATHS.some(path=>pathname.startsWith(path));}

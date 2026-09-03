import Link from "next/link";

export function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8.5 5.5 16 2l7.5 3.5 3 8-4 15-6.5-5-6.5 5-4-15 3-8Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="m11 10 5-2 5 2-1.5 7L16 14l-3.5 3L11 10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" className="brand" aria-label="NexoDent, inicio">
      <LogoMark />
      <span>NexoDent</span>
    </Link>
  );
}

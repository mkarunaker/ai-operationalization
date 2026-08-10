"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function AppNav({ children }: { children?: ReactNode }) {
  const pathname = usePathname();
  return <aside className="queue-sidebar"><Link className="brand" href="/"><span className="brand-mark">A</span><span>AI Editorial<br />Board</span></Link>{children}<nav className="app-nav"><Link aria-current={pathname === "/" ? "page" : undefined} className={pathname === "/" ? "nav-item active" : "nav-item"} href="/">Ideas</Link><Link aria-current={pathname === "/editorial-notebook" ? "page" : undefined} className={pathname === "/editorial-notebook" ? "nav-item active" : "nav-item"} href="/editorial-notebook">Editorial Notebook</Link><Link aria-current={pathname === "/content-status" ? "page" : undefined} className={pathname === "/content-status" ? "nav-item active" : "nav-item"} href="/content-status">Knowledge sources</Link></nav><p className="local-note"><i /> Local-only<br />Private to this machine</p></aside>;
}

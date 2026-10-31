"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/admin/actions";
import { cx } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", n: "00" },
  { href: "/admin/enquiries", label: "Enquiries", n: "01" },
  { href: "/admin/projects", label: "Projects", n: "02" },
  { href: "/admin/services", label: "Services", n: "03" },
  { href: "/admin/team", label: "Team", n: "04" },
  { href: "/admin/testimonials", label: "Testimonials", n: "05" },
  { href: "/admin/journal", label: "Journal", n: "06" },
  { href: "/admin/subscribers", label: "Subscribers", n: "07" },
  { href: "/admin/settings", label: "Settings", n: "08", admin: true },
  { href: "/admin/users", label: "Users", n: "09", admin: true },
];

export function Sidebar({ studio, user, newCount }: { studio: string; user: { name?: string | null; email?: string | null; role: string }; newCount: number }) {
  const path = usePathname();
  return (
    <aside className="a-side">
      <Link href="/admin" className="a-brand">
        <span>{studio}</span>
        <span className="a-mono">Studio dashboard</span>
      </Link>
      <nav aria-label="Dashboard">
        {NAV.filter((n) => !n.admin || user.role === "ADMIN").map((n) => {
          const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={cx("a-nav", active && "is-on")} aria-current={active ? "page" : undefined}>
              <span className="a-mono">{n.n}</span>
              {n.label}
              {n.href === "/admin/enquiries" && newCount > 0 && <span className="a-badge">{newCount}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="a-side__foot">
        <a href="/" target="_blank" rel="noopener noreferrer" className="a-mono a-link">
          View site ↗
        </a>
        <div className="a-user">
          <span>{user.name}</span>
          <span className="a-mono">
            {user.role} · {user.email}
          </span>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="a-btn a-btn--ghost a-btn--sm">
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}

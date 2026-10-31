import type { Metadata } from "next";
import "./admin.css";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s — Dashboard" }, robots: { index: false, follow: false } };

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return <div className="admin">{children}</div>;
}

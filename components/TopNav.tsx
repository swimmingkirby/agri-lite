"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { href: "/", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export default function TopNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qs = searchParams.toString();

  return (
    <nav className="border-b bg-white">
      <ul className="flex gap-1 px-4 md:px-8">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          const href = qs ? `${tab.href}?${qs}` : tab.href;
          return (
            <li key={tab.href}>
              <Link
                href={href}
                className={`block px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  active
                    ? "border-green-700 text-green-800"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

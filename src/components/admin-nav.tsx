import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="border-b">
      <div className="mx-auto flex max-w-4xl items-center gap-1 p-3">
        <Link href="/admin" className="rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-muted">
          Dashboard
        </Link>
      </div>
    </nav>
  );
}

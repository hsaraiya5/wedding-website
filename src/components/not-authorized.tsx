export function NotAuthorized({ email }: { email: string | undefined }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6">
      <div className="av-card max-w-sm p-8 text-center">
        <p className="text-muted-foreground">
          Signed in as {email}, but that account isn&apos;t on the admin allowlist.
        </p>
      </div>
    </main>
  );
}

export function NotAuthorized({ email }: { email: string | undefined }) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <p className="text-muted-foreground">
        Signed in as {email}, but that account isn&apos;t on the admin allowlist.
      </p>
    </main>
  );
}

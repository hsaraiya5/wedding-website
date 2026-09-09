import { CodeEntryForm } from "@/components/code-entry-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
          <CardDescription>
            Enter the invite code from your invitation to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CodeEntryForm />
        </CardContent>
      </Card>
    </main>
  );
}

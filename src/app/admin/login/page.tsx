import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Admin sign in</CardTitle>
          <CardDescription>
            Sign in with the Google account on the admin allowlist.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GoogleSignInButton />
        </CardContent>
      </Card>
    </main>
  );
}

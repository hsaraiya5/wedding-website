import { SiteNav } from "@/components/site-nav";

export default function GuestLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      {children}
    </>
  );
}

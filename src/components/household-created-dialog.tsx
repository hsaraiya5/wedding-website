"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Shown after creating a household from /admin/households/new, which
// redirects back here with ?created=<name> rather than straight to the
// household's edit page -- the admin can jump into editing it from its row
// in the list ("Edit invitations") if they want to.
export function HouseholdCreatedDialog() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const createdName = searchParams.get("created");

  const handleClose = () => router.replace("/admin");

  return (
    <Dialog open={Boolean(createdName)} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{createdName} created</DialogTitle>
          <DialogDescription>
            Find it in the list below to add more guests, set invitations, or edit its details.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={handleClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useActionState } from "react";
import { saveFaq } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Faq = { id: string; question: string; answer: string; order_index: number } | null;

export function FaqForm({ faq }: { faq: Faq }) {
  const [state, formAction, pending] = useActionState(saveFaq, { error: null });

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {faq ? <input type="hidden" name="faq_id" value={faq.id} /> : null}

      <div className="av-field">
        <Label htmlFor="question">Question</Label>
        <Input id="question" name="question" defaultValue={faq?.question} required />
      </div>

      <div className="av-field">
        <Label htmlFor="answer">Answer</Label>
        <Textarea id="answer" name="answer" defaultValue={faq?.answer} rows={3} required />
      </div>

      <div className="av-field">
        <Label htmlFor="order_index">Order</Label>
        <Input
          id="order_index"
          name="order_index"
          type="number"
          defaultValue={faq?.order_index ?? 0}
          className="w-24"
        />
        <p className="av-section-hint">Lower numbers appear first.</p>
      </div>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving..." : "Save"}
      </Button>
    </form>
  );
}

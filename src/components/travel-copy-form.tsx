"use client";

import { useState } from "react";
import { useActionState } from "react";
import { saveTravelCopy } from "@/app/actions/admin";
import { SectionHeading } from "@/components/section";
import {
  TravelCopy as TravelCopyText,
  DEFAULT_GETTING_HERE_TITLE,
  DEFAULT_GETTING_HERE_BODY,
  DEFAULT_NOTICE_TITLE,
  DEFAULT_NOTICE_BODY,
} from "@/components/travel-section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type TravelCopy = {
  travel_getting_here_title: string | null;
  travel_getting_here_body: string | null;
  travel_notice_title: string | null;
  travel_notice_body: string | null;
} | null;

export function TravelCopyForm({ copy }: { copy: TravelCopy }) {
  const [state, formAction, pending] = useActionState(saveTravelCopy, { error: null });

  const [gettingHereTitle, setGettingHereTitle] = useState(copy?.travel_getting_here_title ?? "");
  const [gettingHereBody, setGettingHereBody] = useState(copy?.travel_getting_here_body ?? "");
  const [noticeTitle, setNoticeTitle] = useState(copy?.travel_notice_title ?? "");
  const [noticeBody, setNoticeBody] = useState(copy?.travel_notice_body ?? "");

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="av-section-title">&quot;Getting to the venue&quot;</h3>
              <p className="av-section-hint">Shown to every guest, above the map.</p>
            </div>
            <div className="av-field">
              <Label htmlFor="getting_here_title">Intro line</Label>
              <Input
                id="getting_here_title"
                name="getting_here_title"
                value={gettingHereTitle}
                onChange={(e) => setGettingHereTitle(e.target.value)}
                placeholder={DEFAULT_GETTING_HERE_TITLE}
              />
            </div>
            <div className="av-field">
              <Label htmlFor="getting_here_body">Paragraph</Label>
              <Textarea
                id="getting_here_body"
                name="getting_here_body"
                value={gettingHereBody}
                onChange={(e) => setGettingHereBody(e.target.value)}
                rows={4}
                placeholder={DEFAULT_GETTING_HERE_BODY}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <div>
              <h3 className="av-section-title">&quot;Hotels&quot;</h3>
              <p className="av-section-hint">
                Shown above the hotel cards to guests who are not on a hosted stay.
              </p>
            </div>
            <div className="av-field">
              <Label htmlFor="notice_title">Intro line</Label>
              <Input
                id="notice_title"
                name="notice_title"
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                placeholder={DEFAULT_NOTICE_TITLE}
              />
            </div>
            <div className="av-field">
              <Label htmlFor="notice_body">Paragraph</Label>
              <Textarea
                id="notice_body"
                name="notice_body"
                value={noticeBody}
                onChange={(e) => setNoticeBody(e.target.value)}
                rows={6}
                placeholder={DEFAULT_NOTICE_BODY}
              />
            </div>
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <Button type="submit" disabled={pending} className="self-start">
            {pending ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div>
            <h3 className="av-section-title">Preview</h3>
            <p className="av-section-hint">Updates live. Blank fields fall back to the placeholder copy shown above.</p>
          </div>
          <div className="av-preview-grid flex flex-col gap-8">
            <div>
              <SectionHeading
                key={gettingHereTitle || DEFAULT_GETTING_HERE_TITLE}
                eyebrow="Getting here"
                title="Getting to the venue"
                intro={gettingHereTitle || DEFAULT_GETTING_HERE_TITLE}
              />
              <TravelCopyText>{gettingHereBody || DEFAULT_GETTING_HERE_BODY}</TravelCopyText>
            </div>
            <div>
              <SectionHeading
                key={noticeTitle || DEFAULT_NOTICE_TITLE}
                eyebrow="Where to stay"
                title="Hotels"
                intro={noticeTitle || DEFAULT_NOTICE_TITLE}
              />
              <TravelCopyText>{noticeBody || DEFAULT_NOTICE_BODY}</TravelCopyText>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { saveAboutUs } from "@/app/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { OurStory, DEFAULT_BODY_1, DEFAULT_BODY_2 } from "@/components/our-story";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Photo = { url: string; caption: string | null };

type PhotoRow = {
  key: string;
  existingUrl: string;
  caption: string;
  file: File | null;
  previewUrl: string;
  uploadStatus: "idle" | "uploading" | "error";
  uploadError: string | null;
};

function makeKey() {
  return crypto.randomUUID();
}

const ALLOWED_PHOTO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

// Uploads straight from the browser to Supabase Storage instead of sending
// the file through saveAboutUs -- Vercel's serverless function body-size
// cap sits below what several photos in one submission need, regardless of
// Next's own bodySizeLimit config, so routing the bytes through our Server
// Action isn't reliable. The admin's browser session already carries the
// same auth used by the "admin can manage design-assets" storage policy.
async function uploadAboutUsPhoto(file: File): Promise<string> {
  const supabase = createClient();
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `about-us/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("design-assets").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("design-assets").getPublicUrl(path).data.publicUrl;
}

export function AboutUsForm({ bodyOne, bodyTwo, photos }: { bodyOne: string | null; bodyTwo: string | null; photos: Photo[] }) {
  const [state, formAction, pending] = useActionState(saveAboutUs, { error: null });

  const [bodyOneValue, setBodyOneValue] = useState(bodyOne ?? "");
  const [bodyTwoValue, setBodyTwoValue] = useState(bodyTwo ?? "");
  const [rows, setRows] = useState<PhotoRow[]>(() =>
    // Keys for the initial rows must be deterministic (not crypto.randomUUID())
    // -- this component renders during SSR too, and a random key would differ
    // between the server-rendered HTML and the client's first render, causing
    // a hydration mismatch. Rows added later via `addRow` are client-only (a
    // click handler), so those can safely use a random key.
    photos.map((photo, index) => ({
      key: `initial-${index}`,
      existingUrl: photo.url,
      caption: photo.caption ?? "",
      file: null,
      previewUrl: photo.url,
      uploadStatus: "idle" as const,
      uploadError: null,
    }))
  );

  // Freshly chosen files get a local object URL so the preview can show
  // them before they're actually uploaded; these need explicit cleanup
  // since the browser won't garbage-collect them on its own. Kept in a ref
  // (rather than the effect's dep array) so the unmount cleanup always sees
  // the latest rows, not just the ones present at mount.
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  useEffect(() => {
    return () => {
      rowsRef.current.forEach((row) => {
        if (row.file) URL.revokeObjectURL(row.previewUrl);
      });
    };
  }, []);

  const updateRow = (key: string, patch: Partial<PhotoRow>) =>
    setRows((prev) => prev.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  const handleFileChange = (key: string, fileList: FileList | null) => {
    const file = fileList?.[0] ?? null;
    if (!file) return;

    if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
      updateRow(key, { uploadStatus: "error", uploadError: "Must be a PNG, JPEG, WebP, or GIF image." });
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      updateRow(key, { uploadStatus: "error", uploadError: "Photo must be under 8MB." });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setRows((prev) => {
      const existing = prev.find((row) => row.key === key);
      if (existing?.file) URL.revokeObjectURL(existing.previewUrl);
      return prev.map((row) =>
        row.key === key ? { ...row, file, previewUrl, uploadStatus: "uploading", uploadError: null } : row
      );
    });

    uploadAboutUsPhoto(file)
      .then((url) => updateRow(key, { existingUrl: url, uploadStatus: "idle", uploadError: null }))
      .catch(() =>
        updateRow(key, {
          uploadStatus: "error",
          uploadError: "Couldn't upload this photo -- the previous one (if any) was kept. Try again or use a smaller image.",
        })
      );
  };

  const addRow = () =>
    setRows((prev) => [
      ...prev,
      { key: makeKey(), existingUrl: "", caption: "", file: null, previewUrl: "", uploadStatus: "idle", uploadError: null },
    ]);

  const removeRow = (key: string) =>
    setRows((prev) => {
      const row = prev.find((r) => r.key === key);
      if (row?.file) URL.revokeObjectURL(row.previewUrl);
      return prev.filter((r) => r.key !== key);
    });

  const previewPhotos: Photo[] = rows
    .filter((row) => row.previewUrl)
    .map((row) => ({ url: row.previewUrl, caption: row.caption }));

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="photo_keys" value={rows.map((row) => row.key).join(",")} />

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="av-section-title">Story paragraphs</h3>
              <p className="av-section-hint">Shown under the photo carousel.</p>
            </div>
            <div className="av-field">
              <Label htmlFor="body_one">First paragraph</Label>
              <Textarea
                id="body_one"
                name="body_one"
                value={bodyOneValue}
                onChange={(e) => setBodyOneValue(e.target.value)}
                rows={5}
                placeholder={DEFAULT_BODY_1}
              />
            </div>
            <div className="av-field">
              <Label htmlFor="body_two">Second paragraph</Label>
              <Textarea
                id="body_two"
                name="body_two"
                value={bodyTwoValue}
                onChange={(e) => setBodyTwoValue(e.target.value)}
                rows={5}
                placeholder={DEFAULT_BODY_2}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 border-t border-border pt-6">
            <div>
              <h3 className="av-section-title">Photos</h3>
              <p className="av-section-hint">
                Shown in the carousel above the story, in this order. Leave empty to show the
                placeholder photos.
              </p>
            </div>

            {rows.map((row, index) => (
              <div key={row.key} className="av-household-card flex flex-col gap-3">
                <input type="hidden" name={`photo_${row.key}_existing_url`} value={row.existingUrl} />
                <div className="flex items-center justify-between gap-3">
                  <p className="av-section-hint">Photo {index + 1}</p>
                  <button
                    type="button"
                    className="text-sm font-medium text-destructive hover:underline"
                    onClick={() => removeRow(row.key)}
                  >
                    Remove
                  </button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {row.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- admin preview thumbnail, not worth Next/Image's config surface here
                    <img
                      src={row.previewUrl}
                      alt=""
                      className="h-20 w-20 flex-none rounded-md border border-border object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 flex-none rounded-md border border-dashed border-border" />
                  )}
                  <div className="flex flex-1 flex-col gap-3">
                    <PhotoFileInput onChange={(files) => handleFileChange(row.key, files)} />
                    {row.uploadStatus === "uploading" ? (
                      <p className="text-xs text-muted-foreground">Uploading...</p>
                    ) : null}
                    {row.uploadError ? <p className="text-xs text-destructive">{row.uploadError}</p> : null}
                    <div className="av-field">
                      <Label htmlFor={`caption_${row.key}`}>Caption</Label>
                      <Input
                        id={`caption_${row.key}`}
                        value={row.caption}
                        onChange={(e) => updateRow(row.key, { caption: e.target.value })}
                        placeholder="e.g. From the first hello"
                      />
                      <input type="hidden" name={`photo_${row.key}_caption`} value={row.caption} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addRow} className="self-start">
              Add another photo
            </Button>
          </div>

          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <Button
            type="submit"
            disabled={pending || rows.some((row) => row.uploadStatus === "uploading")}
            className="self-start"
          >
            {pending ? "Saving..." : rows.some((row) => row.uploadStatus === "uploading") ? "Uploading photos..." : "Save"}
          </Button>
        </div>

        <div className="flex flex-1 flex-col gap-3">
          <div>
            <h3 className="av-section-title">Preview</h3>
            <p className="av-section-hint">Updates live. Blank fields fall back to the placeholder copy shown above.</p>
          </div>
          <div className="av-preview-grid">
            <OurStory bodyOne={bodyOneValue} bodyTwo={bodyTwoValue} photos={previewPhotos} />
          </div>
        </div>
      </div>
    </form>
  );
}

function PhotoFileInput({ onChange }: { onChange: (files: FileList | null) => void }) {
  return (
    <Input
      type="file"
      // No `name` -- the file is uploaded straight to storage on selection
      // (see uploadAboutUsPhoto), so it's never part of the form's own
      // submission. Only the resulting URL (the hidden existing_url input)
      // travels through the Server Action.
      accept="image/png,image/jpeg,image/webp,image/gif"
      onChange={(e) => onChange(e.target.files)}
    />
  );
}

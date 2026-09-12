import type { SupabaseClient } from "@supabase/supabase-js";

// Distinct group tags already in use, for the household form's autocomplete
// suggestions (free text, not a fixed enum -- groups are specific to this
// wedding and may get added over time).
export async function getExistingGroupTags(supabase: SupabaseClient): Promise<string[]> {
  const { data } = await supabase
    .from("households")
    .select("group_tag")
    .not("group_tag", "is", null);

  const tags = new Set((data ?? []).map((row) => row.group_tag as string));
  return Array.from(tags).sort();
}

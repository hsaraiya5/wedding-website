// Shared "one item per line" textarea parsers for admin forms. Plain
// module (no "use server"/"use client") so both the saveEvent server
// action and the live event-card preview can import the same logic.

export function parsePalette(raw: string): { name: string; hex: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, hex] = line.split(":").map((part) => part.trim());
      return { name: name || "Color", hex: hex || "#000000" };
    })
    .filter((color) => /^#[0-9a-fA-F]{3,8}$/.test(color.hex));
}

export function parseTraditionList(raw: string): { label: string; text: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...rest] = line.split(":");
      return { label: label.trim(), text: rest.join(":").trim() };
    })
    .filter((item) => item.label && item.text);
}

// Fixed list of household groups for this wedding. A mandatory field on the
// household form -- every guest is invited by exactly one of these people or
// families, so a fixed select (rather than free text) keeps the admin
// dashboard's filtering/grouping consistent.
export const GROUP_TAGS = [
  "Manchella family",
  "Manchella friend",
  "Gayathri friend",
  "Saraiya family",
  "Saraiya friend",
  "Hrishikesh friend",
] as const;

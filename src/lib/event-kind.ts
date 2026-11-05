// Which of the four celebrations an event is, read from its name, so its
// colour and artwork follow the event rather than its place in a household's
// list (a household not invited to the Haldi would otherwise see the Garba in
// the Haldi's marigold, with the Haldi's outfit sketch). A name that matches
// none of them falls back to its position.
const KINDS = [/haldi/i, /sangeet|garba/i, /viv|wedding|ceremony/i, /reception/i];

export function eventKind(name: string, position: number): number {
  const kind = KINDS.findIndex((pattern) => pattern.test(name));
  return kind === -1 ? position % KINDS.length : kind;
}

export const ChangeType = {
  Set: "SET",
  Delete: "DELETE",
  Add: "ADD",
  Remove: "REMOVE",
  Sort: "SORT",
} as const;

export type ChangeType = typeof ChangeType[keyof typeof ChangeType];

export class ChangeEvent extends Event {
  constructor(
    public path: string,
    public kind: ChangeType,
    public previous?: unknown,
    public elements?: unknown,
  ) {
    super("change", { bubbles: true, composed: true });
  }
}

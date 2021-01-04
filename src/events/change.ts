export enum ChangeType {
  Set = 'SET',
  Delete = 'DELETE',
  Add = 'ADD',
  Remove = 'REMOVE',
  Sort = 'SORT',
}

interface IChangeEvent {
  path: string;
  type: ChangeType;
  previous?: any;
  elements?: any;
}

export class ChangeEvent extends CustomEvent<IChangeEvent> {
  static readonly eventName = 'change';
  constructor(detail: IChangeEvent) {
    super(ChangeEvent.eventName, { detail, bubbles: true, composed: true });
  }
}

declare global {
  interface ElementEventMap {
    change: ChangeEvent;
  }
}

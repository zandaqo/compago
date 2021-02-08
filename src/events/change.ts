export enum ChangeType {
  Set = 'SET',
  Delete = 'DELETE',
  Add = 'ADD',
  Remove = 'REMOVE',
  Sort = 'SORT',
}

type ChangeEventDetail = {
  path: string;
  type: ChangeType;
  previous?: any;
  elements?: any;
};

export class ChangeEvent extends CustomEvent<ChangeEventDetail> {
  static create(detail: ChangeEventDetail) {
    return new this('change', { detail, bubbles: true, composed: true });
  }
}

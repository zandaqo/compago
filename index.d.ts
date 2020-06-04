// Type definitions for compago
// Project: compago
// Definitions by: Maga D. Zandaqo <denelxan@gmail.com> (http://maga.name)
import { LitElement } from 'lit-element/ts3.4/lit-element';

interface Constructor<T> {
  new (...args): T;
}

export declare function Listener<T>(Base?: Constructor<T>): Constructor<T & EventTarget>;

interface CompagoOptions {
  silent?: boolean;
}

interface ModelOptions {
  collection?: object;
  storage?: object;
}

interface ModelReadWriteOptions extends CompagoOptions {
  skip?: boolean;
  method?: string;
}

interface ModelEraseOptions extends CompagoOptions {
  keep?: boolean;
}

interface ModelProxyHandler {
  set(target: object, property: any, value: any, receiver: object): boolean;
  deleteProperty(target: object, property: any): boolean;
}

export declare class Model extends EventTarget {
  id: any;
  static id: string;
  private static proxyHandler: ModelProxyHandler;

  constructor(attributes?: object, options?: ModelOptions);
  set(attributes: object): this;
  assign(attributes: object): this;
  merge(source: object, target: object): object;
  toJSON(): object;
  read(options?: ModelReadWriteOptions): Promise<Response>;
  write(options?: ModelReadWriteOptions): Promise<Response>;
  erase(options?: ModelEraseOptions): Promise<Response>;
  sync(method: string, options?: object): Promise<Response>;
  dispose(options?: CompagoOptions): this;
  static definePrivate(model: Model, properties: object): void;
  private static _emitChanges(model: Model, path: string, property: string, previous: any): void;
  private static _getProxy(target: object, path: string, model: Model, processed: any[]): object;
}

interface ControllerBond {
  to: string;
  parse?: Function;
  prevent?: boolean;
  property?: string;
  attribute?: string;
  value?: any;
}

export declare class Controller extends LitElement {
  model?: Model | ModelArray;
  binding?: ControllerBond;
  static get translator(): Translator;
  static translations: object;

  bond(event: Event): void;
  dispose(): this;
  onModelChange(event: Event): void;
  onLanguageChange(event: Event): void;
  navigate(event: Event): void;
  interpret(key: string, interpolation?: object): string;
}

interface Routes {
  [propName: string]: RegExp;
}

export declare class Router extends HTMLElement {
  root: string;
  routes?: Routes;
  private currentPath: string;
  private onPopstate(): void;
}

type Comparator = (a: any, b: any) => -1 | 0 | 1;
type Models = Model | Model[];
type ModelsOrObjects = Models | object | object[];

interface ModelArrayOptions {
  storage?: object;
  model?: Model;
  comparator?: string | Comparator;
}

interface ModelArraySetOptions {
  at?: number;
  keep?: boolean;
  skip?: boolean;
  silent?: boolean;
  unsorted?: boolean;
  save?: boolean;
}

interface ModelArrayUnsetOptions extends CompagoOptions {
  save?: boolean;
}

interface ModelArraySortOptions extends CompagoOptions {
  comparator?: string | Function;
  descending?: boolean;
}

export declare class ModelArray extends Array {
  storage?: object;
  Model: Model;
  comparator?: string | Comparator;
  private _byId: object;

  constructor(models?: object[], options?: ModelArrayOptions);
  set(models?: ModelsOrObjects, options?: ModelArraySetOptions): this;
  unset(models: Models, options?: ModelArrayUnsetOptions): this;
  sort(options?: Function | ModelArraySortOptions): this;
  get(id: string): Model;
  where(attributes: object, first?: boolean): Model | Model[];
  read(options?: CompagoOptions): Promise<Response>;
  toJSON(): object[];
  sync(method: string, options: object): Promise<Response>;
  dispose(options?: ModelArrayUnsetOptions): this;
  private _parseModels(
    models: object[],
    options: ModelArraySetOptions,
    sortable: boolean,
  ): object[];
  private _prepareModel(data: Model | object, options: ModelArrayOptions): Model;
  private _onModelEvent(event: Event): void;
  private _addReference(model: Model): void;
  private _removeReference(model: Model): void;
}

interface RemoteStorageOptions {
  url?: string;
  init?: object;
}

interface RemoteStorageSyncOptions extends CompagoOptions {
  patch?: boolean;
  url?: string;
  init?: object;
}

export declare class RemoteStorage extends EventTarget {
  url: string;
  init: object;

  static methods: object;
  static headers: object;

  constructor(options: RemoteStorageOptions);
  sync(
    method: string,
    model: Model | ModelArray,
    options: RemoteStorageSyncOptions,
  ): Promise<Response>;
  dispose(options: CompagoOptions): this;
  serialize(data: any): string;
  deserialize(response: Response): Promise<Object> | undefined;
  static fetch(url: string | Request, options: object): Promise<Response>;
  static isStored(model: Model): boolean;
}

interface TranslatorOptions {
  language?: string;
  languages: string[];
  globalPrefix?: string;
  translations?: object;
}

export declare class Translator extends EventTarget {
  language: string;
  languages: string[];
  globalPrefix: string;
  pluralRules: Intl.PluralRules;
  translations: object;

  constructor(options: TranslatorOptions);
  setLanguage(language: string): void;
  getLanguage(language?: string): string;
  translate(
    translations: object,
    key: string,
    interpolation?: object,
    componentName?: string,
  ): string;
  reportMissing(componentName: string, key: string, rule?: string): void;
  static initialize(options: TranslatorOptions, symbol: symbol): Translator;
  static interpolate(text: string, interpolation: object): string;
}

// Type definitions for compago
// Project: compago
// Definitions by: Maga D. Zandaqo <denelxan@gmail.com> (http://maga.name)
import { LitElement } from 'lit-element/ts3.4/lit-element';
import { Part } from 'lit-html/lib/part';

interface Constructor<T> {
  new (...args): T;
}

export declare function Listener<T>(Base?: Constructor<T>): Constructor<T & EventTarget>;

interface ModelReadWriteOptions {
  skip?: boolean;
  method?: string;
}

interface ModelProxyHandler {
  set(target: object, property: any, value: any, receiver: object): boolean;
  deleteProperty(target: object, property: any): boolean;
}

export declare class Model extends EventTarget {
  id: any;
  static id: string;
  static idAttribute: string;
  static storage: RemoteStorage;
  private static proxyHandler: ModelProxyHandler;

  constructor(attributes?: object);
  set(attributes: object): this;
  assign(attributes: object): this;
  merge(source: object, target: object): object;
  toJSON(): object;
  read(options?: ModelReadWriteOptions): Promise<Response>;
  write(options?: ModelReadWriteOptions): Promise<Response>;
  erase(options?: object): Promise<Response>;
  sync(method: string, options?: object): Promise<Response>;
  static definePrivate(model: Model, properties: object): void;
  private static emitChanges(model: Model, path: string, property: string, previous: any): void;
  private static getProxy(target: object, path: string, model: Model, processed: any[]): object;
}

interface ControllerBond {
  to: string;
  parse?: Function;
  prevent?: boolean;
  property?: string;
  attribute?: string;
  value?: any;
}

interface Routes {
  [propName: string]: RegExp;
}

export declare class Controller extends LitElement {
  model?: Model | ModelArray;
  rootPath?: string;
  routes?: Routes;
  static translations: object;
  static bond: (binding: ControllerBond) => (part: Part) => void;
  static navigate: (href?: string) => (part: Part) => void;
  static ts: (
    ctor: typeof Controller,
    key: string,
    interpolation?: TranslatorInterpolation,
  ) => (part: Part) => void;

  onModelChange(event: Event): void;
  onLanguageChange(event: Event): void;
  route(name: string, params: object, query: string, hash: string): void;
  private onPopstate(event: Event): void;
  static get translator(): Translator;
  static translate(key: string, interpolation?: TranslatorInterpolation);
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
  unsorted?: boolean;
}

interface ModelArraySortOptions {
  comparator?: string | Function;
  descending?: boolean;
}

export declare class ModelArray extends Array {
  storage?: RemoteStorage;
  Model: Model;
  comparator?: string | Comparator;
  private _byId: object;

  constructor(models?: ModelsOrObjects, options?: ModelArrayOptions);
  set(models?: ModelsOrObjects, options?: ModelArraySetOptions): this;
  unset(models: Models): this;
  sort(options?: Function | ModelArraySortOptions): this;
  get(id: string): Model;
  where(attributes: object, first?: boolean): Models;
  read(): Promise<Response>;
  toJSON(): object[];
  sync(method: string): Promise<Response>;
  private parseModels(models: object[], options: ModelArraySetOptions, sortable: boolean): object[];
  private prepareModel(data: Model | object, options: ModelArrayOptions): Model;
  private onModelEvent(event: Event): void;
  private addReference(model: Model): void;
  private removeReference(model: Model): void;
}

interface RemoteStorageOptions {
  url?: string;
  init?: object;
}

interface RemoteStorageSyncOptions {
  patch?: boolean;
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
  serialize(data: any): string;
  deserialize(response: Response): Promise<Object> | undefined;
  static fetch(url: string | Request, options: object): Promise<Response>;
  static isStored(model: Model): boolean;
}

interface PluralTranslation {
  [key: string]: string;
}

interface Translation {
  [key: string]:
    | string
    | PluralTranslation
    | Intl.DateTimeFormat
    | Intl.NumberFormat
    | Intl.ListFormat
    | Intl.RelativeTimeFormat;
}

interface Translations {
  [language: string]: Translation | PluralTranslation;
}

type TranslatorInterpolation = object | number | any[];

interface TranslatorOptions {
  language?: string;
  languages: string[];
  globalPrefix?: string;
  translations?: Translations;
}

export declare class Translator extends EventTarget {
  language: string;
  languages: string[];
  globalPrefix: string;
  pluralRules: Intl.PluralRules;
  translations: Translations;

  constructor(options: TranslatorOptions);
  setLanguage(language: string): void;
  getLanguage(language?: string): string;
  translate(
    translations: Translations,
    key: string,
    interpolation?: TranslatorInterpolation,
    componentName?: string,
  ): string;
  reportMissing(componentName: string, key: string, rule?: string): void;
  static initialize(options: TranslatorOptions, symbol: symbol): Translator;
  static interpolate(text: string, interpolation: object): string;
}

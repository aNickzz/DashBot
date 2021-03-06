import fs from 'fs';
import winston from 'winston';
import { Event, EventEmitter, EventHandler } from './Events';
import Storage from './Storage';

export interface DataStore<TData> {
	setData(data: TData): void;
	getData(): TData | undefined;
}

interface PersistentDataEvents<TData> {
	dataLoaded: TData | undefined;
}

export class PersistentData<TData>
	extends EventEmitter<PersistentDataEvents<TData>>
	implements DataStore<TData> {
	constructor(
		private readonly _name: string,
		private readonly _register: StorageRegister
	) {
		super();
	}
	setData(data: TData): void {
		this._register.setData(this._name, data);
	}
	clearData() {
		this._register.clearData(this._name);
	}

	getData(def: () => TData): Readonly<TData>;
	getData(): TData | undefined;
	getData(def?: () => TData) {
		const data = this._register.getData(this._name) as TData | undefined;

		if (data == undefined) {
			if (def) {
				this.setData(def());
				return this._register.getData(this._name);
			}
		}

		return data;
	}

	on<TEventName extends keyof PersistentDataEvents<TData>>(
		event: TEventName,
		handler: EventHandler<
			TEventName,
			PersistentDataEvents<TData>[TEventName]
		>,
		key?: any
	): void {
		super.on(event, handler, key);
		const current = this._register.getData(this._name) as TData | undefined;
		if (current) {
			this.emit(new Event('dataLoaded', current));
		}
	}

	emit = super.emit;
}

export default class StorageRegister {
	private _storage: Storage<Record<string, unknown>>;
	private _stores: Record<string, PersistentData<unknown>> = {};
	private _data: Record<string, unknown> = {};
	private _fileWatcher: fs.FSWatcher | null = null;
	private _changeTimeout: NodeJS.Timeout | null = null;

	constructor(file: string, watch = false) {
		this._storage = new Storage(file, () => ({}));

		this.load();
		if (watch) this.watch();
	}

	watch() {
		if (this._fileWatcher === null) {
			this._fileWatcher = fs.watch(
				this._storage.file,
				this.onChange.bind(this)
			);
		}
	}

	stopWatching() {
		this._fileWatcher?.close();
		this._fileWatcher = null;
	}

	private onChange(/* event: string, filename: string */) {
		if (this._changeTimeout !== null) {
			clearTimeout(this._changeTimeout);
		}

		this._changeTimeout = setTimeout(this.onChangeTimeout.bind(this), 2000);
	}

	private onChangeTimeout() {
		this._changeTimeout = null;
		this.load();
	}

	createStore<TData>(key: string, bindEvents = true) {
		const store = new PersistentData<TData>(key, this);

		if (bindEvents) {
			this._stores[key] = store as PersistentData<unknown>;
		}

		return store;
	}

	load() {
		this._data = this._storage.getData();

		for (const key in this._stores) {
			if (this._stores.hasOwnProperty(key)) {
				const store = this._stores[key];

				if (this._data[key]) {
					try {
						store.emit(new Event('dataLoaded', this._data[key]));
					} catch (e) {
						winston.error(e);
					}
				}
			}
		}
	}

	setData(key: string, data: unknown) {
		this._data[key] = data;

		this._storage.setData(this._data);
	}

	clearData(key: string) {
		delete this._data[key];

		this._storage.setData(this._data);
	}

	getData(key: string) {
		return this._data[key];
	}
}

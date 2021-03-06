import fs from 'fs';
import path from 'path';

export default class Storage<T extends unknown> {
	public static rootDir = '.';

	constructor(public readonly file: string, private readonly _def: () => T) {
		if (path.isAbsolute(file)) {
			this.file = file;
		} else {
			this.file = path.join(Storage.rootDir, file);
		}
	}

	private internalRead(): T {
		if (fs.existsSync(this.file)) {
			try {
				return JSON.parse(fs.readFileSync(this.file, 'utf8'));
			} catch (e) {
				const data = this._def();
				this.internalWrite(data);
				return data;
			}
		} else {
			const data = this._def();
			this.internalWrite(data);
			return data;
		}
	}

	private internalWrite(data: T) {
		fs.writeFileSync(this.file, JSON.stringify(data, null, '\t'));
	}

	getData() {
		return this.internalRead();
	}

	setData(data: T) {
		this.internalWrite(data);
	}
}

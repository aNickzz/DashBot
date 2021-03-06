import Message from './ChatServer/Message';
import StorageRegister, { PersistentData } from './StorageRegister';

/**
 * Keeps a state object based on the message channel ID and the message author ID.
 */
export default class SessionStore<TState> {
	constructor(protected readonly storage: StorageRegister) {}

	public getSession(message: Message): PersistentData<TState> {
		const id = message.channel.id + '/' + message.author.id;

		return this.storage.createStore<TState>(`Session-${id}`, false);
	}
}

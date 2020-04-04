import Rcon from 'modern-rcon';
import MinecraftLogClient from '../../MinecraftLogClient/MinecraftLogClient';
import StorageRegister from '../../StorageRegister';
import ChatServer, { ChatServerEvents } from '../ChatServer';
import IdentityService from '../IdentityService';
import MinecraftIdentity from './MinecraftIdentity';
import MinecraftIdentityCache from './MinecraftIdentityCache';
import MinecraftMessage from './MinecraftMessage';
import MinecraftTextChannel from './MinecraftTextChannel';

export default class MinecraftServer
	implements ChatServer<MinecraftIdentity, MinecraftTextChannel> {
	private _textChannel: MinecraftTextChannel;
	private _identityCache: MinecraftIdentityCache;

	constructor(
		private _logReader: MinecraftLogClient,
		private _rcon: Rcon | null,
		storage: StorageRegister,
		private _identityService: IdentityService
	) {
		this._textChannel = new MinecraftTextChannel(this, this._rcon);
		this._identityCache = new MinecraftIdentityCache(this, storage);
	}

	async getTextChannels() {
		return [this._textChannel];
	}

	async getAudioChannels() {
		return [];
	}

	async getTextChannel(id: string) {
		if (id === this._textChannel.id) {
			return this._textChannel;
		}

		return null;
	}

	getRcon() {
		return this._rcon;
	}

	async awaitConnected() {
		return this;
	}

	on<T extends keyof ChatServerEvents>(
		event: T,
		listener: (...args: ChatServerEvents[T]) => void
	): void;
	on(event: string, listener: (...args: any[]) => void) {
		switch (event) {
			case 'message':
				this._logReader.on('chatMessage', chatMessage => {
					this._identityCache.add({ name: chatMessage.author });

					listener(
						new MinecraftMessage(
							this._textChannel,
							this._identityCache.getByName(chatMessage.author)!,
							chatMessage.message
						)
					);
				});
				return;

			case 'presenceUpdate':
				this._logReader.on('logInOutMessage', message => {
					listener(
						this._identityCache.getByName(message.who),
						message.event === 'joined'
					);
				});
		}

		//TODO: other events
	}

	async getPrivateTextChannel(): Promise<null> {
		return null;
	}

	get id() {
		return 'Minecraft';
	}

	async connect() {
		this._logReader.start();
		await this._rcon?.connect();
	}

	async disconnect() {
		this._logReader.stop();
		await this._rcon?.disconnect();
	}

	async getIdentityById(id: string) {
		return this._identityCache.getById(id);
	}

	getIdentityService() {
		return this._identityService;
	}
}
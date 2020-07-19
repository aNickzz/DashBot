import ChatServer, {
	PresenceUpdateEventData,
} from '../../../ChatServer/ChatServer';
import IdentityService from '../../../ChatServer/IdentityService';
import Message from '../../../ChatServer/Message';
import { CancellableEvent, EventHandler } from '../../../Events';
import StorageRegister from '../../../StorageRegister';
import MinecraftLogClient from '../LogClient/MinecraftLogClient';
import DeathMessage from '../LogClient/PlayerDeathMessage';
import RconClient from '../Rcon/RconClient';
import MinecraftIdentity from './MinecraftIdentity';
import MinecraftIdentityCache from './MinecraftIdentityCache';
import MinecraftMessage from './MinecraftMessage';
import MinecraftTextChannel from './MinecraftTextChannel';

/**
 * Enables communication with a Minecraft server
 */
export interface MinecraftServerOptions {
	id: string;
	logClient: MinecraftLogClient;
	rcon: RconClient | null;
	storage: StorageRegister;
	identityService: IdentityService;
	botName: string;
}

export default class MinecraftServer
	implements ChatServer<MinecraftIdentity, MinecraftTextChannel> {
	private _textChannel: MinecraftTextChannel;
	private _identityCache: MinecraftIdentityCache;

	public readonly me: Readonly<MinecraftIdentity>;
	private _id: string;
	private _logReader: MinecraftLogClient;
	private _rcon: RconClient | null;
	private _identityService: IdentityService;

	constructor(options: MinecraftServerOptions) {
		({
			id: this._id,
			logClient: this._logReader,
			rcon: this._rcon,
			identityService: this._identityService,
		} = options);

		const { storage, botName } = options;

		this._textChannel = new MinecraftTextChannel(this, this._rcon);
		this._identityCache = new MinecraftIdentityCache(this, storage);
		this.me = new MinecraftIdentity(this, botName, '');
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

	on(event: string, handler: EventHandler<any>): void {
		switch (event) {
			case 'message':
				this._logReader.on('chatMessage', async event => {
					const chatMessage = event.data;
					await this._identityCache.addByName(chatMessage.author);

					handler(
						new CancellableEvent<Message>(
							'message',
							new MinecraftMessage(
								this._textChannel,
								this._identityCache.getByName(
									chatMessage.author
								)!,
								chatMessage.message
							)
						)
					);
				});
				return;

			case 'presenceUpdate':
				this._logReader.on('logInOutMessage', async event => {
					const message = event.data;
					await this._identityCache.addByName(message.who);

					handler(
						new CancellableEvent<PresenceUpdateEventData>(
							'presenceUpdate',
							{
								identity: this._identityCache.getByName(
									message.who
								)!,
								joined: message.event === 'joined',
							}
						)
					);
				});

				return;
			case 'game.death':
				this._logReader.on('deathMessage', async event => {
					const message = event.data;

					if (!message.player) return; //Intentional game design

					await this._identityCache.addByName(message.player!);

					handler(
						new CancellableEvent<{
							message: DeathMessage;
							server: ChatServer;
						}>('game.death', { message: message, server: this })
					);
				});

				return;
		}

		//TODO: other events
	}

	async getPrivateTextChannel(): Promise<null> {
		return null;
	}

	get id() {
		return this._id;
	}

	async connect() {
		this._logReader.start();
	}

	async disconnect() {
		this._logReader.stop();
		if (this._rcon) await this._rcon.disconnect();
	}

	async getIdentityById(id: string) {
		return this._identityCache.getById(id);
	}

	getIdentityService() {
		return this._identityService;
	}
}
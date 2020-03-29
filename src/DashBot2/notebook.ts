import { Logger } from 'winston';
import Message from './Message';
import ChatServer from './Server';

export class DashBot2 {
	constructor(private logger: Logger, private chatServers: ChatServer[]) {
		for (const chatServer of this.chatServers) {
			chatServer.on('message', this.onMessage.bind(this));
		}
	}

	public async connect() {
		for (const server of this.chatServers) {
			try {
				await server.connect();
			} catch (e) {
				this.logger.error("Couldn't connect to server");
			}
		}
	}

	public async disconnect() {
		for (const server of this.chatServers) {
			try {
				await server.disconnect();
			} catch (e) {
				this.logger.error("Couldn't disconnect to server");
			}
		}
	}

	private onMessage(message: Message) {
		// eslint-disable-next-line no-console
		console.log(
			`Message Received from ${message
				.getAuthor()
				.getName()} in ${message.getChannel().getName()} in ${message
				.getChannel()
				.getServer()
				.getName()}`
		);
		return;
	}
}
export type EventListener<T extends unknown[] = any[]> = (...args: T) => void;

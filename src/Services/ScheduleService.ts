import IdentityService from '../ChatServer/IdentityService';
import Message from '../ChatServer/Message';
import Command from '../Command';
import DashBot from '../DashBot';
import { Event, EventEmitter } from '../Events';
import Service from '../Service';
import StorageRegister, { DataStore } from '../StorageRegister';
import DateStringParser from '../util/DateStringParser';
import { PartialDefaults } from '../util/PartialDefaults';
import shallowMerge from '../util/shallowMerge';

interface Options {
	/**
	 * Delay between checking for events in milliseconds
	 */
	interval: number;
	storage: StorageRegister;
	identityService: IdentityService;
}
const defaultOptions = {
	interval: 5000,
};

export type ScheduleServiceOptions = PartialDefaults<
	Options,
	typeof defaultOptions
>;

interface ScheduleServiceData {
	events: { timestamp: number; event: Event<unknown> }[];
}
export default class ScheduleService extends EventEmitter implements Service {
	private _interval: number;
	private _intervalId: NodeJS.Timeout | null = null;
	private _store: DataStore<ScheduleServiceData>;
	private _identityService: IdentityService;

	private _remindCommand: Command;

	constructor(options: ScheduleServiceOptions) {
		super();
		const compiledOptions = shallowMerge(defaultOptions, options);

		const { interval, storage, identityService } = compiledOptions;
		this._interval = interval;
		this._identityService = identityService;

		this._store = storage.createStore<ScheduleServiceData>(
			'ScheduleService',
			false
		);

		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const service = this;

		this._remindCommand = new (class RemindCommand implements Command {
			async run(
				message: Message | null,
				name: string,
				...args: string[]
			) {
				if (message === null || !message.channel.canSend) return;

				if (args.length === 0) {
					await message.channel.sendText('No args');
					return;
				}

				let time: number | null = null;
				let reminder = '';
				const { time: t, remainingStr } = DateStringParser.tryParse(
					args.join(' ')
				);
				time = t;
				reminder = remainingStr;

				if (time === null) {
					await message.channel.sendText("Couldn't parse time");
					return;
				}

				if (reminder === '') {
					await message.channel.sendText('Missing reminder');
					return;
				}

				await message.channel.sendText(
					`"${reminder}" at ${new Date(
						time
					).toString()} (${DateStringParser.getTimeDiffString(
						time - Date.now()
					)})`
				);

				service.queueEvent(
					time,
					new Event('reminder', {
						reminder,
						serverId: message.channel.server.id,
						channelId: message.channel.id,
					})
				);
			}
		})();
	}
	register(dashBot: DashBot) {
		dashBot.registerCommand('remind', this._remindCommand);
		this.start();

		this.on('reminder', async e => {
			const { reminder, serverId, channelId } = e.data;
			const channel = await this._identityService
				.getServer(serverId)
				?.getTextChannel(channelId);
			if (channel) {
				channel.sendText(`Reminder: ${reminder}`);
			}
		});
	}

	checkForEvents() {
		const events = this._store.getData()?.events || [];

		const now = Date.now();

		while (events.length > 0 && events[0].timestamp < now) {
			const event = events.shift()!;

			this.emit(event.event);
			//TODO: try/catch log
		}
	}

	queueEvent<T>(timestamp: number, event: Event<T>) {
		const events = this._store.getData()?.events || [];

		const index = events.findIndex(e => e.timestamp > timestamp);
		if (index === -1) events.push({ timestamp, event });
		else {
			events.splice(index, 0, { timestamp, event });
		}

		this._store.setData({ events });
	}

	start() {
		if (this._intervalId !== null) return;

		this._intervalId = setInterval(
			() => this.checkForEvents(),
			this._interval
		);
	}

	stop() {
		if (this._intervalId === null) return;

		clearInterval(this._intervalId);
		this._intervalId = null;
	}
}

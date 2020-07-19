type ChangeLog = {
	[version: string]: {
		Added?: string[];
		Updated?: string[];
		Removed?: string[];
		Fixed?: string[];
	};
};

const changeLog: ChangeLog = {
	minor: {
		Added: ['Add basic mineflayer integration for minecraft bots'],
		Updated: [
			'Use singleton logger to avoid passing it in through all constructors',
		],
	},
	'0.5.0': {
		Added: [
			'The ability to load plugins dynamically from the plugins folder',
		],
		Updated: [
			'Moved a bunch of things into plugins, such as Discord and Minecraft integration',
		],
	},
	'0.4.0': {
		Updated: [
			"Replaced Date with luxon's DateTime for better timezone handling",
		],
	},
	'0.3.6': {
		Updated: [
			"!brewing command works consistently, doesn't require players to be op, and is formatted better",
		],
	},
	'0.3.5': {
		Added: ['!brewing command to show potion recipes in Minecraft'],
	},
	'0.3.4': {
		Fixed: [
			'Timezones again, temporary "fix" till we start using a proper time module',
		],
	},
	'0.3.3': {
		Fixed: ['Fix update announcer printing things twice'],
	},
	'0.3.2': {
		Updated: [
			'Update announcer should announce all new updates not just the latest one',
		],
		Fixed: [
			'Date string parser tests not considering the following day when parsing times before right now (eg. 2am probably means tomorrow since 2am today is in the past)',
			'Attempted fix at timezone problem with remineders',
		],
		Added: ['Set a limit on how many timers a person can set at once'],
	},
	'0.3.1': {
		Fixed: ['Past events not getting cleared from queue'],
	},
	'0.3.0': {
		Fixed: ['Formatting issue in the update announcer'],
		Added: [
			'Schedule Service for scheduling long term events',
			'!remind command, usage `!remind in 5 minutes its been five minutes`',
		],
	},
	'0.2.6': {
		Added: ['Quiz game (WIP) start playing with "play quiz"'],
		Updated: [
			'EventEmitter is better and covered by tests.',
			'EventEmitter now has a emitAsync function',
		],
	},
	'0.2.5': {
		Added: [
			'Murderers in MineCraft now get ahead of the competition',
			'Super basic change log',
		],
	},
};

export default changeLog;

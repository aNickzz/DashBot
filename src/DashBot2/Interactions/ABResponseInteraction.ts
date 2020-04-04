import { Tracery } from '../../tracery/Tracery';
import { DashBot2 } from '../DashBot2';
import { Event } from '../Events';
import Interaction from '../Interaction';
import Message from '../Message';

type Trigger = string | RegExp | Array<string | RegExp>;
type Response = string | string[];
/**
 * Simple a -> b lookup.
 *
 * ```
 *  new ABMessageAction(this, [
 *  	['a', 'b']
 *  ])
 * ```
 *
 * Eg. If the message is "a" it will respond with "b"
 */
export class ABResponseInteraction implements Interaction {
	constructor(protected aBResponses: [Trigger, Response][]) {}

	register(bot: DashBot2) {
		bot.on('message', this.onMessage.bind(this));
	}
	async onMessage(event: Event<Message>) {
		const message = event.data;

		const content = message.getTextContent();

		for (const response of this.aBResponses) {
			const triggers =
				response[0] instanceof Array ? response[0] : [response[0]];

			for (const trigger of triggers) {
				if (typeof trigger === 'string') {
					if (trigger === content) {
						message.getChannel().sendText(
							Tracery.generate(
								{
									origin: response[1],
									author: {
										username: message.getAuthor().getName(),
									},
								},
								'origin'
							)
						);

						event.cancel();
						return;
					}
				} else {
					const match = trigger.exec(content);

					if (match) {
						message.getChannel().sendText(
							Tracery.generate(
								{
									origin: response[1],
									target: {
										username: message.getAuthor().getName(),
									},
									match: {
										...match.groups,
									},
								},
								'origin'
							)
						);

						event.cancel();
						return;
					}
				}
			}
		}
	}
}

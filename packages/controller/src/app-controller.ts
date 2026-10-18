import type { AppStore } from "@fedex/prism-store";
import { type AppCommand, AppCommandSchema } from "./commands/commands-schema";
import type { CommandHandler } from "./handler/command-handler";
import { SetActiveAccountHandler } from "./handler/set-active-account-handler";
import { SetActiveMetricHandler } from "./handler/set-active-metric-handler";

export class AppController {
	private readonly _commandHandlers = new Map<
		AppCommand["type"],
		CommandHandler
	>();

	/**
	 * Creates an instance of AppController.
	 *
	 * @param store - The AppStore instance to be used by the controller.
	 * @param commandHandlerOverrides - Optional array of command handlers to override the default handlers.
	 */
	constructor(
		private readonly store: AppStore,
		readonly commandHandlerOverrides: CommandHandler[] = [],
	) {
		// 1. Register default command handlers
		this.defaultCommandHandlers.forEach((handler) => {
			this._commandHandlers.set(handler.type, handler);
		});

		// 2. Override default command handlers with any provided overrides
		commandHandlerOverrides.forEach((handler) => {
			this._commandHandlers.set(handler.type, handler);
		});
	}

	private get defaultCommandHandlers(): CommandHandler[] {
		return [
			new SetActiveAccountHandler(this.store),
			new SetActiveMetricHandler(this.store),
		];
	}

	/**
	 * Dispatches a command to the appropriate command handler.
	 *
	 * @param command - The command to be dispatched.
	 * @throws {Error} If no handler is found for the command type.
	 */
	async dispatch(command: AppCommand): Promise<void> {
		const parsedCommand = AppCommandSchema.parse(command);
		const handler = this._commandHandlers.get(parsedCommand.type);
		if (!handler) {
			throw new Error(
				`No handler found for command type: ${parsedCommand.type}`,
			);
		}

		await handler.handle(parsedCommand);
	}
}

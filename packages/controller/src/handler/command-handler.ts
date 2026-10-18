import type { AppCommand } from "../commands/commands-schema";

export interface CommandHandler<TCommand extends AppCommand = AppCommand> {
	readonly type: AppCommand["type"];
	handle(command: TCommand): Promise<void> | void;
}

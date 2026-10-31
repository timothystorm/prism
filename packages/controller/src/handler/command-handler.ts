import type { AppCommand } from "../commands/commands-schema";

/**
 * Implements one command discriminator for explicit registration with AppController.
 * Match `type` to the generic command shape. The controller supplies parsed input and
 * awaits returned promises; direct callers must handle envelope validation themselves.
 * A failing handler's earlier writes are not automatically rolled back.
 */
export interface CommandHandler<TCommand extends AppCommand = AppCommand> {
  readonly type: AppCommand["type"];
  handle(command: TCommand): Promise<void> | void;
}

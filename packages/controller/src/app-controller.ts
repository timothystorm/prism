import { type AppCommand, AppCommandSchema } from "./commands/commands-schema";
import type { CommandHandler } from "./handler/command-handler";

/**
 * The AppController class is responsible for managing and dispatching commands to their respective command handlers.
 */
export class AppController {
  private readonly _commandHandlers = new Map<AppCommand["type"], CommandHandler>();

  /**
   * Creates an instance of AppController.
   *
   * @param commandHandlers - Optional array of command handlers to override the default handlers.
   */
  constructor(readonly commandHandlers: CommandHandler[] = []) {
    for (const handler of commandHandlers) {
      if (this._commandHandlers.has(handler.type)) {
        throw new Error(`Duplicate handler for command type: ${handler.type}`);
      }
      this._commandHandlers.set(handler.type, handler);
    }
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
      throw new Error(`No handler found for command type: ${parsedCommand.type}`);
    }

    await handler.handle(parsedCommand);
  }
}

import { type AppCommand, AppCommandSchema } from "./commands/commands-schema";
import type { CommandHandler } from "./handler/command-handler";

/**
 * Validates command envelopes and dispatches them to explicitly registered handlers.
 * No handlers are installed automatically, and schema membership alone does not register one.
 * Handlers own policy checks and state changes; this controller does not roll back their writes.
 *
 * Dispatch calls run independently. Await each call before sending the next when command
 * order matters; there is no internal queue or batching.
 *
 * @example Register a handler and await its state update
 * import { AppController } from "@fedex/prism-controller";
 * import { AppStore } from "@fedex/prism-store";
 *
 * const store = new AppStore();
 * const controller = new AppController([
 *   {
 *     type: "METRICS:SET_ACTIVE",
 *     handle: (command) => {
 *       if (command.type === "METRICS:SET_ACTIVE") {
 *         store.metrics.setActiveMetric(command.metric);
 *       }
 *     },
 *   },
 * ]);
 * await controller.dispatch({ type: "METRICS:SET_ACTIVE", metric: "EXCEPTION" });
 */
export class AppController {
  private readonly _commandHandlers = new Map<AppCommand["type"], CommandHandler>();

  /**
   * Registers one handler per command discriminator, capturing the supplied handlers once.
   * Mutating the input array later does not update the dispatch registry.
   *
   * @param commandHandlers Handlers to install. An empty array creates a controller that cannot dispatch commands.
   * @throws Error If two handlers declare the same command type.
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
   * Parses the command before calling its handler, applying schema defaults to handler input.
   * Invalid commands never reach a handler. Completion waits for an asynchronous handler,
   * and handler failures propagate to the caller without automatic rollback.
   *
   * @param command The command envelope, not a store snapshot or partial state.
   * @throws ZodError If the envelope fails AppCommandSchema validation.
   * @throws Error If the valid command type has no registered handler.
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

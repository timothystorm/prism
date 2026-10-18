import type { AppStore } from "@fedex/prism-store";
import type { SetActiveMetricCommand } from "../commands/commands-schema";
import type { CommandHandler } from "./command-handler";

export class SetActiveMetricHandler
	implements CommandHandler<SetActiveMetricCommand>
{
	readonly type = "METRICS:SET_ACTIVE";

	constructor(private readonly store: AppStore) {}

	handle(command: SetActiveMetricCommand): Promise<void> | void {
		const activeMetric = this.store.metrics.getActiveMetric();
		if (activeMetric === command.metric) {
			return;
		}

		this.store.metrics.setActiveMetric(command.metric);
	}
}

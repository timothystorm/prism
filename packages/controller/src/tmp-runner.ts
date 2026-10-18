import { AppStore } from "@fedex/prism-store";
import { AppController } from "./app-controller";

// Create an instance of AppStore
const appStore = new AppStore();

// Subscribe to changes in active accounts
appStore.subscribe(
	(state) => state.account.activeAccounts,
	(newValue, previousValue) => {
		console.log("Active accounts changed from", previousValue, "to", newValue);
	},
);

// Create an instance of AppController with the appStore
const appController = new AppController(appStore);

// dispatch a command to set active accounts
appController.dispatch({
	type: "ACCOUNTS:SET_ACTIVE",
	accounts: ["account1", "account2"],
});

// dispatch a command to set active accounts again with the same accounts
appController.dispatch({
	type: "ACCOUNTS:SET_ACTIVE",
	accounts: ["account-A", "account-B"],
});

appStore.subscribe(
	(state) => state.account.activeAccounts,
	(newValue, previousValue) => {
		console.log(
			"I'm late --- Active accounts changed from",
			previousValue,
			"to",
			newValue,
		);
	},
);

// this should NOT trigger another subscription because the active accounts are the same as before
appController.dispatch({
	type: "METRICS:SET_ACTIVE",
	metric: "ARRIVING_EARLY",
});

console.log(appStore.getState());

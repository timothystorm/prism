import type { Account } from "../schemas/account-schema";
import type { UserService } from "./user-service";

/**
 * Placeholder UserService for local development.
 * Despite its name, this does not issue GraphQL requests or contact the mock GraphQL app.
 * Inject a real service implementation when remote account loading is needed.
 */
export class GraphqlUserService implements UserService {
  /** Returns hard-coded BASIC accounts after a simulated 400 ms delay. */
  async fetchAccounts(): Promise<Account[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          {
            id: "116557720",
            accountTier: "BASIC",
          },
          {
            id: "132640599",
            accountTier: "BASIC",
          },
          {
            id: "132690448",
            accountTier: "BASIC",
          },
        ]);
      }, 400);
    });
  }
}

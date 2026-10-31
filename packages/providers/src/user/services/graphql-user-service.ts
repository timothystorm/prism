import type { Account } from "../schemas/account-schema";
import type { UserService } from "./user-service";

export class GraphqlUserService implements UserService {
  async fetchAccounts(): Promise<Account[]> {
    //  mock data for now, will be replaced with actual GraphQL query in the future
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

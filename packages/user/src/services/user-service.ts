import type { Account } from "../schemas/account-schema";

export interface UserService {
  fetchAccounts(): Promise<Account[]>;
}

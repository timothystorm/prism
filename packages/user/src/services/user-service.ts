import type { Account } from "../schemas/user-schema";

export interface UserService {
  fetchAccounts(): Promise<Account[]>;
}

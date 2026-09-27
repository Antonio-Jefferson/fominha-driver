import { api } from "./client";
import type { DriverBalance, Withdrawal } from "../@types/driver";

export function getBalance(): Promise<DriverBalance> {
  return api.get<DriverBalance>("drivers/me/balance");
}

export function listWithdrawals(): Promise<Withdrawal[]> {
  return api.get<Withdrawal[]>("drivers/me/withdrawals");
}

export function requestWithdrawal(
  amountCents: number
): Promise<{ withdrawalId: string; status: string }> {
  return api.post("drivers/me/withdrawals", { amount_cents: amountCents });
}

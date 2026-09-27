import { api } from "./client";
import type { DriverProfile, DriverSignupInput, DriverUpdateInput } from "../@types/driver";

export function getDriverMe(): Promise<DriverProfile> {
  return api.get<DriverProfile>("drivers/me");
}

export function signupDriver(input: DriverSignupInput): Promise<DriverProfile> {
  return api.post<DriverProfile>("drivers/signup", input);
}

export function updateDriverMe(input: DriverUpdateInput): Promise<DriverProfile> {
  return api.put<DriverProfile>("drivers/me", input);
}

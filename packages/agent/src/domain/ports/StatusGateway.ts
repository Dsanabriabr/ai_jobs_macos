import type { MenuBarStatus } from "../entities/MenuBarStatus.js";

export interface StatusGateway {
  get(): MenuBarStatus;
  set(status: MenuBarStatus, errorMessage?: string | null): void;
  getErrorMessage(): string | null;
}

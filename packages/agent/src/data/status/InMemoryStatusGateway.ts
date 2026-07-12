import type { MenuBarStatus } from "../../domain/entities/MenuBarStatus.js";
import type { StatusGateway } from "../../domain/ports/StatusGateway.js";

export class InMemoryStatusGateway implements StatusGateway {
  private status: MenuBarStatus = "idle";
  private errorMessage: string | null = null;

  get(): MenuBarStatus {
    return this.status;
  }

  set(status: MenuBarStatus, errorMessage: string | null = null): void {
    this.status = status;
    this.errorMessage = status === "error" ? errorMessage : null;
  }

  getErrorMessage(): string | null {
    return this.errorMessage;
  }
}

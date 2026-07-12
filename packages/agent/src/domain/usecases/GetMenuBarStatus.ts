import type { MenuBarStatus } from "../entities/MenuBarStatus.js";
import type { StatusGateway } from "../ports/StatusGateway.js";

export interface MenuBarStatusView {
  status: MenuBarStatus;
  errorMessage: string | null;
}

export class GetMenuBarStatus {
  constructor(private readonly status: StatusGateway) {}

  execute(): MenuBarStatusView {
    return {
      status: this.status.get(),
      errorMessage: this.status.getErrorMessage(),
    };
  }
}

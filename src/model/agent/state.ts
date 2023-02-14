import IAccount from "@model/account";
import {
  InitSessionAction,
  LoginAction,
  PrepareCookieAction,
  SaveCookieAction,
} from "./actions";
import { AgentEvent, AgentState, IAgentAction } from "./agent";

export class LoginRequiredState extends AgentState {
  constructor(account: IAccount) {
    super(new Map(), [
      new InitSessionAction(account),
      new PrepareCookieAction(account),
      new LoginAction(account),
      new SaveCookieAction(account),
    ]);
  }
}

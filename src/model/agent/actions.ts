import IAccount from "@model/account";
import { AgentEvent, IAgentAction } from "./agent";

export class PrepareCookieAction implements IAgentAction {
  constructor(private account: IAccount) {}

  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, cookie } = await responder.getDefaultContext();

    if (message === "tick") {
      logger.info("Initializing Cookie");
      session.updateCookie(await cookie.getCookie(this.account));
    }
  }
}

export class LoginAction implements IAgentAction {
  constructor(private account: IAccount) {}

  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, instagram, session } = await responder.getDefaultContext();

    if (message === "tick") {
      if (session && session.isValid()) {
        logger.info("Already logged in");
        return;
      }

      logger.info("Starting login process");
      const newSession = await instagram.init(this.account);

      if (newSession && newSession.isValid()) {
        responder.setContext("session", newSession);
        logger.info("Login success");
      } else {
        logger.error("Login failed");
      }
    }
  }
}

export class SaveCookieAction implements IAgentAction {
  constructor(private account: IAccount) {}

  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, cookie } = await responder.getDefaultContext();

    if (message === "tick") {
      if (session && session.isValid()) {
        logger.info("Saving cookie");
        await cookie.setCookie(this.account, await session.getCookie());
      }
    }
  }
}

import IAccount from "@model/account";
import { AgentEvent, IAgentAction } from "./agent";

export class InitSessionAction implements IAgentAction {
  constructor(private account: IAccount) {}

  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, instagram } = await responder.getDefaultContext();

    if (message === "tick") {
      if (session) {
        logger.info("Session already initialized").catch(console.error);
        return;
      }

      logger.info("Initializing session").catch(console.error);
      const newSession = await instagram.init(this.account);
      await responder.setContext("session", newSession);
    }
  }
}

export class PrepareCookieAction implements IAgentAction {
  constructor(private account: IAccount) {}

  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, cookie } = await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      logger.info("Initializing Cookie").catch(console.error);
      await session.updateCookie(await cookie.loadCookie(this.account));
    }
  }
}

export class LoginAction implements IAgentAction {
  constructor(private account: IAccount) {}

  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, instagram, session } = await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      if (session && (await session.isValid())) {
        logger.info("Already logged in").catch(console.error);
        return;
      }

      logger.info("Starting login process").catch(console.error);
      const newSession = await instagram.init(this.account);

      if (newSession && (await newSession.isValid())) {
        await responder.setContext("session", newSession);
        logger.info("Login success").catch(console.error);
      } else {
        logger.error("Login failed").catch(console.error);
      }
    }
  }
}

export class SaveCookieAction implements IAgentAction {
  constructor(private account: IAccount) {}

  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, cookie } = await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      if (session && (await session.isValid())) {
        logger.info("Saving cookie").catch(console.error);
        await cookie.saveCookie(this.account, await session.getCookie());
      }
    }
  }
}

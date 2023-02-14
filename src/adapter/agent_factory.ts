import IAccount from "@model/account";
import Agent, { AgentState, IAgentContext } from "@model/agent/agent";
import Cookie from "@model/cookie";
import Instagram from "@model/instagram";
import Keyword from "@model/keyword";
import Logger from "@model/logger";
import ISession from "@model/session";

export default class AgentFactory {
  constructor(
    private logger: Logger,
    private instagram: Instagram,
    private keyword: Keyword,
    private cookie: Cookie
  ) {}

  async newAgent(initialState: AgentState) {
    const context: IAgentContext = {
      logger: this.logger,
      instagram: this.instagram,
      keyword: this.keyword,
      cookie: this.cookie,
    };
    return new Agent(context, initialState);
  }
}

import IAccount from "@model/account";
import Agent, { AgentState, IAgentContext } from "@model/agent/agent";
import Instagram from "@model/instagram";
import Keyword from "@model/keyword";
import Logger from "@model/logger";
import ISession from "@model/session";

export default class AgentFactory {
  constructor(
    private logger: Logger,
    private instagram: Instagram,
    private keyword: Keyword
  ) {}

  async newAgent(initialState: AgentState) {
    const context: IAgentContext = {
      logger: this.logger,
      instagram: this.instagram,
      keyword: this.keyword,
    };
    return new Agent(context, initialState);
  }
}

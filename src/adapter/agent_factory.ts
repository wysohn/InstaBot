import Agent, { AgentState, IAgentContext } from "@model/agent/agent";
import ICommenter from "@model/commenter";
import Cookie from "@model/cookie";
import Instagram from "@model/instagram";
import Keyword from "@model/keyword";
import Logger from "@model/logger";

export default class AgentFactory {
  constructor(
    private logger: Logger,
    private instagram: Instagram,
    private keyword: Keyword,
    private cookie: Cookie,
    private commenter: ICommenter
  ) {}

  async newAgent(initialState: AgentState) {
    const context: IAgentContext = {
      logger: this.logger,
      instagram: this.instagram,
      keyword: this.keyword,
      cookie: this.cookie,
      commenter: this.commenter,
    };
    return new Agent(context, initialState);
  }
}

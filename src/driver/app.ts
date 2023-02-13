import IAccount from "@model/account";
import { LoginRequiredState as LoginState } from "@model/agent/state";
import Instagram from "@model/instagram";
import Keyword from "@model/keyword";
import Logger from "@model/logger";
import AgentFactory from "adapter/agent_factory";
import InstagramAPI, { InstagramAccount } from "./api/instagram_api";
import KeywordRepository from "./repository/keyword_repository";

export default class App {
  private readonly instagram: Instagram;
  private readonly keyword: Keyword;
  private readonly agentFactory: AgentFactory;

  constructor(private readonly logger: Logger) {
    this.instagram = new Instagram(new InstagramAPI());
    this.keyword = new Keyword(new KeywordRepository());

    this.agentFactory = new AgentFactory(
      this.logger,
      this.instagram,
      this.keyword
    );
  }

  async main() {
    const account: IAccount = new InstagramAccount(
      process.env.USER_ID,
      process.env.PASSWORD
    );
    const agent = await this.agentFactory.newAgent(new LoginState(account));

    await agent.run();
  }
}

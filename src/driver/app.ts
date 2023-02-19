import IAccount from "@model/account";
import { LoginRequiredState as LoginState } from "@model/agent/state";
import ICommenter from "@model/commenter";
import Cookie from "@model/cookie";
import Instagram from "@model/instagram";
import Keyword from "@model/keyword";
import Logger from "@model/logger";
import IPost from "@model/post";
import ISession from "@model/session";
import AgentFactory from "adapter/agent_factory";
import InstagramAPI, { InstagramAccount } from "./api/instagram_api";
import CookieRepository from "./repository/cookie_repository";
import KeywordRepository from "./repository/keyword_repository";

export default class App {
  private readonly instagram: Instagram;
  private readonly keyword: Keyword;
  private readonly cookie: Cookie;
  private readonly agentFactory: AgentFactory;
  private readonly commenter: ICommenter;

  constructor(private readonly logger: Logger, debug = false) {
    this.instagram = new Instagram(
      new InstagramAPI(debug, [
        // (req) => req.resourceType() === "image",
        // (req) => req.resourceType() === "media",
      ])
    );
    this.keyword = new Keyword(new KeywordRepository());
    this.cookie = new Cookie(new CookieRepository());
    this.commenter = {
      // TODO implement actual random commenting logic
      async comment(session: ISession, post: IPost) {
        return await post.writeComment(
          session,
          "😍".repeat(Math.random() * 10 + 1)
        );
      },
    };

    this.agentFactory = new AgentFactory(
      this.logger,
      this.instagram,
      this.keyword,
      this.cookie,
      this.commenter
    );
  }

  async main() {
    await this.keyword.init();

    await this.logger.info("User ID: " + process.env.USER_ID);
    await this.logger.info("Password set: " + !!process.env.PASSWORD);

    const account: IAccount = new InstagramAccount(
      process.env.USER_ID,
      process.env.PASSWORD
    );
    const agent = await this.agentFactory.newAgent(new LoginState(account));

    await agent.run();
  }
}

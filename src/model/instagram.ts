import IAccount from "./account";
import IPost from "./post";
import Principal from "./principal";
import ISession from "./session";
import IUser, { IUserId } from "./user";

export interface IInstagramGateway {
  initSession(account: IAccount): Promise<ISession>;
  getUser(session: ISession, userId: IUserId): Promise<IUser | undefined>;
  followUser(session: ISession, userUrl: string): PromiseLike<boolean>;
  unfollowUser(session: ISession, userUrl: string): PromiseLike<boolean>;
  getPosts(session: ISession, keyword: string): Promise<IPost[]>;
  likePost(session: ISession, postUrl: string): PromiseLike<boolean>;
  unlikePost(session: ISession, postUrl: string): PromiseLike<boolean>;
  writeCommentToPost(
    session: ISession,
    postUrl: string,
    comment: string
  ): PromiseLike<void>;
}

export default class Instagram {
  constructor(private readonly gateway: IInstagramGateway) {}

  /**
   * Initialize session for the account. Notice that this does not authenticate the session.
   * You either have to call ISession#login() to authenticate the session or use the saved cookies with
   * ISession#updateCookie() to reload the previous session cookie.
   *
   * @param account Account to initialize session for
   * @returns Initialized session
   */
  async init(account: IAccount): Promise<ISession> {
    return await this.gateway.initSession(account);
  }

  async getUser(
    session: ISession,
    userId: IUserId
  ): Promise<IUser | undefined> {
    return await this.gateway.getUser(session, userId);
  }

  async followUser(session: ISession, userUrl: string): Promise<boolean> {
    return await this.gateway.followUser(session, userUrl);
  }

  async getPosts(session: ISession, keyword: string): Promise<IPost[]> {
    return await this.gateway.getPosts(session, keyword);
  }

  async likePost(session: ISession, postUrl: string): Promise<boolean> {
    return await this.gateway.likePost(session, postUrl);
  }

  async unlikePost(session: ISession, postUrl: string): Promise<boolean> {
    return await this.gateway.unlikePost(session, postUrl);
  }

  async writeCommentToPost(
    session: ISession,
    postUrl: string,
    comment: string
  ): Promise<void> {
    return await this.gateway.writeCommentToPost(session, postUrl, comment);
  }
}

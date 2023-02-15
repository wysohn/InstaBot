import IAccount from "@model/account";
import { FollowHistory, LikeHistory } from "@model/history";
import IPost from "@model/post";
import IUser from "@model/user";
import { AgentEvent, IAgentAction } from "./agent";

export class DelayAction implements IAgentAction {
  constructor(
    private readonly delay_ms: number,
    private readonly verbose: boolean = false
  ) {}

  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger } = await responder.getDefaultContext();

    if (message === "tick") {
      if (this.verbose)
        logger.info(`Delaying for ${this.delay_ms}ms`).catch(console.error);

      await new Promise((resolve) => setTimeout(resolve, this.delay_ms));
    }
  }
}

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

export const KEY_SELECTED_KEYWORD = "selectedKeyword";
export class SelectKeywordAction implements IAgentAction {
  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, keyword } = await responder.getDefaultContext();

    if (message === "tick") {
      const selected = await keyword.poll();
      if (selected) {
        await responder.setContext(KEY_SELECTED_KEYWORD, selected);
        logger.info(`Selected keyword: ${selected}`).catch(console.error);
      }
    }
  }
}

export const KEY_POSTS = "posts";
export class SearchPostsAction implements IAgentAction {
  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, instagram } = await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      const selected = await responder.getContext(KEY_SELECTED_KEYWORD);
      const posts = await instagram.getPosts(session, selected);
      await responder.setContext(KEY_POSTS, posts);
    }
  }
}

export const KEY_SELECTED_USER = "selectedUser";
export class SelectUserAction implements IAgentAction {
  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, instagram } = await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      const postsFromTag: IPost[] = await responder.getContext(KEY_POSTS);
      if (!postsFromTag || postsFromTag.length === 0) {
        logger.info("No more posts to select").catch(console.error);
        return;
      }

      const post: IPost = postsFromTag.shift();
      await responder.setContext(KEY_POSTS, postsFromTag);
      if (post) {
        await responder.setContext(
          KEY_SELECTED_USER,
          await post.getOwner(session)
        );
      } else {
        await responder.setContext(KEY_SELECTED_USER, undefined);
      }
    }
  }
}

export const KEY_FOLLOW_HISTORY = "followHistory";
export class FollowUserAction implements IAgentAction {
  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, instagram } = await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      const user: IUser = await responder.getContext(KEY_SELECTED_USER);
      if (!user) {
        logger.info("No user to follow").catch(console.error);
        return;
      }

      const followHistory: FollowHistory =
        (await responder.getContext(KEY_FOLLOW_HISTORY)) ?? new FollowHistory();
      await responder.setContext(KEY_FOLLOW_HISTORY, followHistory);

      const result = await user.follow(session);
      if (result) {
        await followHistory.add(new Date(), user.id);
      }
    }
  }
}

export const KEY_USER_POSTS = "userPosts";
export class GetUserPostsAction implements IAgentAction {
  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, instagram } = await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      const user: IUser = await responder.getContext(KEY_SELECTED_USER);
      if (!user) {
        logger.info("No user to get posts").catch(console.error);
        return;
      }

      const posts = await user.listPosts(session);
      await responder.setContext(KEY_USER_POSTS, posts);
    }
  }
}

export const KEY_SELECTED_USER_POST = "selectedUserPost";
export class SelectUserPostAction implements IAgentAction {
  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, instagram } = await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      const posts: IPost[] = await responder.getContext(KEY_USER_POSTS);
      if (!posts || posts.length === 0) {
        logger.info("No more posts to select").catch(console.error);
        return;
      }

      const post: IPost = posts.shift();
      await responder.setContext(KEY_USER_POSTS, posts);
      if (post) {
        await responder.setContext(KEY_SELECTED_USER_POST, post);
      } else {
        await responder.setContext(KEY_SELECTED_USER_POST, undefined);
      }
    }
  }
}

export const KEY_LIKE_HISTORY = "likeHistory";
export class LikeUserPostAction implements IAgentAction {
  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, instagram } = await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      const post: IPost = await responder.getContext(KEY_SELECTED_USER_POST);
      if (!post) {
        logger.info("No post to like").catch(console.error);
        return;
      }

      const likeHistory: LikeHistory =
        (await responder.getContext(KEY_LIKE_HISTORY)) ?? new LikeHistory();
      await responder.setContext(KEY_LIKE_HISTORY, likeHistory);

      const result = await post.like(session);
      if (result) {
        await likeHistory.add(new Date(), post.url);
      } else {
        logger.info(`Post already liked: ${post.url}`).catch(console.error);
        // set it to undefined so comment action will not be triggered
        await responder.setContext(KEY_SELECTED_USER_POST, undefined);
      }
    }
  }
}

export class CommentUserPostAction implements IAgentAction {
  async handler({ responder, message }: AgentEvent): Promise<void> {
    const { logger, session, instagram, commenter } =
      await responder.getDefaultContext();

    if (!session) throw new Error("Session is not initialized");

    if (message === "tick") {
      const post: IPost = await responder.getContext(KEY_SELECTED_USER_POST);
      if (!post) {
        logger.info("No post to comment").catch(console.error);
        return;
      }

      await commenter.comment(session, post);
      logger.info(`Commented on post: ${post.url}`).catch(console.error);
    }
  }
}

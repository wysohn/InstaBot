import IAccount from "@model/account";
import { FollowHistory } from "@model/history";
import IPost from "@model/post";
import ISession from "@model/session";
import IUser from "@model/user";
import {
  CommentUserPostAction,
  DelayAction,
  FilterPostsAction,
  FollowUserAction,
  GetUserPostsAction,
  InitSessionAction,
  KEY_FOLLOW_HISTORY,
  KEY_LIKE_HISTORY,
  KEY_POSTS,
  KEY_SELECTED_KEYWORD,
  KEY_SELECTED_USER,
  KEY_USER_POSTS,
  LikeUserPostAction,
  LoginAction,
  PrepareCookieAction,
  SaveCookieAction,
  SearchPostsAction as SearchFeedsAction,
  SelectKeywordAction,
  SelectUserAction,
  SelectUserPostAction,
} from "./actions";
import { AgentEvent, AgentState, IAgentAction, AgentPredicate } from "./agent";

const FOLLOW_DELAY = 6 * 60 * 60 * 1000;
const FOLLOW_THRESHOLD = 30;
const LIKE_DELAY = 6 * 60 * 60 * 1000;
const LIKE_THRESHOLD = 30;

function buildMap(tuples: [AgentPredicate, () => AgentState][]) {
  const map = new Map<AgentPredicate, () => AgentState>();
  for (const [predicate, state] of tuples) {
    map.set(predicate, state);
  }
  return map;
}

function _<T>(ctx: Record<string, any>, key: string) {
  return ctx[key] as T;
}

export class DelayState extends AgentState {
  constructor(until: Date, next: () => AgentState) {
    super(buildMap([[async () => new Date() > until, next]]), [
      new DelayAction(1000, false),
    ]);
  }
}

export class LoginRequiredState extends AgentState {
  constructor(account: IAccount) {
    super(
      buildMap([
        // check login is successful
        [async (ctx) => !!_(ctx, "session"), () => new KeywordSelectionState()],
        // otherwise, wait for 5 seconds and try again
        [
          async (ctx) => true,
          () =>
            new DelayState(
              new Date(Date.now() + 5000),
              () => new LoginRequiredState(account)
            ),
        ],
      ]),
      [
        new InitSessionAction(account),
        new PrepareCookieAction(account),
        new LoginAction(account),
        new SaveCookieAction(account),
      ]
    );
  }
}

export class KeywordSelectionState extends AgentState {
  constructor() {
    super(
      buildMap([
        // keyword selected. move to search posts state
        [
          async (ctx) => !!_(ctx, KEY_SELECTED_KEYWORD),
          () => new SearchFeedsState(),
        ],
        // no more keyword. agent terminates
        [
          async (ctx) => _(ctx, KEY_SELECTED_KEYWORD) === undefined,
          () => undefined,
        ],
      ]),
      [new SelectKeywordAction()]
    );
  }
}

export class SearchFeedsState extends AgentState {
  constructor() {
    super(
      buildMap([
        // posts populated. move to select user state
        [
          async (ctx) =>
            !!_(ctx, KEY_POSTS) && _<IPost[]>(ctx, KEY_POSTS).length > 0,
          () => new SelectUserState(),
        ],
        // no more posts. move back to keyword selection state
        [
          async (ctx) =>
            _(ctx, KEY_POSTS) === undefined ||
            _<IPost[]>(ctx, KEY_POSTS).length === 0,
          () => new KeywordSelectionState(),
        ],
      ]),
      [
        new SearchFeedsAction(),
        new FilterPostsAction({
          postsKey: KEY_POSTS,
        }),
      ]
    );
  }
}

export class SelectUserState extends AgentState {
  constructor() {
    super(
      buildMap([
        // 6 hours delay after 30 follow actions within 6 hours
        [
          async (ctx) =>
            !!_(ctx, KEY_FOLLOW_HISTORY) &&
            (await _<FollowHistory>(ctx, KEY_FOLLOW_HISTORY).count({
              from: new Date(Date.now() - FOLLOW_DELAY),
            })) > FOLLOW_THRESHOLD,
          () =>
            new DelayState(
              new Date(Date.now() + FOLLOW_DELAY),
              () => new FollowUserState()
            ),
        ],
        // TODO: prune followers
        // no more user to follow. move back to search posts state
        [
          async (ctx) => _(ctx, KEY_SELECTED_USER) === undefined,
          () => new SearchFeedsState(),
        ],
        // follow user
        [async (ctx) => true, () => new FollowUserState()],
      ]),
      [new SelectUserAction(), new DelayAction(5000)]
    );
  }
}

export class FollowUserState extends AgentState {
  constructor() {
    super(buildMap([[async (ctx) => true, () => new SearchUserPostState()]]), [
      new FollowUserAction(),
      new DelayAction(5000),
    ]);
  }
}

export class SearchUserPostState extends AgentState {
  constructor() {
    super(buildMap([[async (ctx) => true, () => new SelectUserPostState()]]), [
      new GetUserPostsAction(),
      new FilterPostsAction({
        postsKey: KEY_USER_POSTS,
        timeOrder: "desc",
        limit: 3,
      }),
    ]);
  }
}

export class SelectUserPostState extends AgentState {
  constructor() {
    super(
      buildMap([
        // no more posts. move back to select user state
        [
          async (ctx) =>
            _(ctx, KEY_USER_POSTS) === undefined ||
            _<IPost[]>(ctx, KEY_USER_POSTS).length === 0,
          () => new SelectUserState(),
        ],
        // 6 hours delay after 30 like actions within 6 hours
        [
          async (ctx) =>
            !!_(ctx, KEY_LIKE_HISTORY) &&
            (await _<FollowHistory>(ctx, KEY_LIKE_HISTORY).count({
              from: new Date(Date.now() - LIKE_DELAY),
            })) > LIKE_THRESHOLD,
          () =>
            new DelayState(
              new Date(Date.now() + LIKE_DELAY),
              () => new LikeAndCommentState()
            ),
        ],
        [async (ctx) => true, () => new LikeAndCommentState()],
      ]),
      [new SelectUserPostAction(), new DelayAction(5000)]
    );
  }
}

export class LikeAndCommentState extends AgentState {
  constructor() {
    super(buildMap([[async (ctx) => true, () => new SelectUserPostState()]]), [
      new DelayAction(Math.random() * 5000 + 1000),
      new LikeUserPostAction(),
      new CommentUserPostAction(),
    ]);
  }
}

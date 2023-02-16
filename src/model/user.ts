import IPost from "./post";
import ISession from "./session";

export interface IUserId {
  readonly id: string;
}

export default interface IUser extends IUserId {
  follow(initiator: ISession): Promise<boolean>;
  unfollow(initiator: ISession): Promise<boolean>;
  isFollowed(session: ISession): Promise<boolean>;
  listPosts(initiator: ISession): Promise<IPost[]>;
}

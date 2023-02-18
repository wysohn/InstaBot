import IPost from "@model/post";
import ISession from "@model/session";
import IUser from "@model/user";

export interface IUserGateway {
  follow(initiator: ISession, id: string): PromiseLike<boolean>;
  unfollow(initiator: ISession, id: string): PromiseLike<boolean>;
  listPosts(id: string): PromiseLike<IPost[]>;
}

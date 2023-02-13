import IPost from "@model/post";
import ISession from "@model/session";
import IUser from "@model/user";

export interface IUserGateway {
  follow(initiator: ISession, id: string): PromiseLike<boolean>;
  unfollow(initiator: ISession, id: string): PromiseLike<boolean>;
  listPosts(id: string): PromiseLike<IPost[]>;
}

export default class UserDTO implements IUser {
  constructor(private readonly gateway: IUserGateway, readonly id: string) {}

  async follow(initiator: ISession): Promise<boolean> {
    return this.gateway.follow(initiator, this.id);
  }

  async unfollow(initiator: ISession): Promise<boolean> {
    return this.gateway.unfollow(initiator, this.id);
  }

  async listPosts(): Promise<IPost[]> {
    return this.gateway.listPosts(this.id);
  }
}

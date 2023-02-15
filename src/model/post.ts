import Principal from "./principal";
import ISession from "./session";
import IUser from "./user";

export default interface IPost {
  readonly url: string;

  getPostTime(initiator: ISession): Promise<Date>;
  getOwner(initiator: ISession): Promise<IUser>;
  like(initiator: ISession): Promise<boolean>;
  unlike(initiator: ISession): Promise<boolean>;
  writeComment(initiator: ISession, comment: string): Promise<void>;
}

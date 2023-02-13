import ISession from "./session";

export default interface IPost {
  like(initiator: ISession): Promise<boolean>;
  unlike(initiator: ISession): Promise<boolean>;
  writeComment(initiator: ISession, comment: string): Promise<void>;
}

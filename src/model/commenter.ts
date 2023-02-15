import IPost from "./post";
import ISession from "./session";

export default interface ICommenter {
  comment: (session: ISession, post: IPost) => Promise<void>;
}

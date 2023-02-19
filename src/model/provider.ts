import ISession from "./session";

export interface ILoginResponse {}

export interface ILoginProvider {
  attemptLogin(session: ISession): Promise<ILoginResponse>;
}

import Principal from "./principal";
import { ICookieMemento } from "./session";

export default interface IAccount {
  readonly principal: Principal;
  readonly password: string;
  readonly cookies?: ICookieMemento;
  readonly providerType: string;
}

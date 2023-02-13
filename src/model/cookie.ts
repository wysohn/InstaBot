import IAccount from "./account";
import { ICookieMemento } from "./session";

export interface ICookieGateway {
  getCookie(account: IAccount): Promise<ICookieMemento>;
  setCookie(account: IAccount, cookie: ICookieMemento): Promise<void>;
}

export default class Cookie {
  constructor(private readonly gateway: ICookieGateway) {}

  async getCookie(account: IAccount): Promise<ICookieMemento> {
    return await this.gateway.getCookie(account);
  }

  async setCookie(account: IAccount, cookie: ICookieMemento): Promise<void> {
    return await this.gateway.setCookie(account, cookie);
  }
}

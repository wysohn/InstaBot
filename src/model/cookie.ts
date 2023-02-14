import IAccount from "./account";
import { ICookieMemento } from "./session";

export interface ICookieGateway {
  getCookie(account: IAccount): Promise<ICookieMemento | undefined>;
  setCookie(account: IAccount, cookie: ICookieMemento): Promise<void>;
}

export default class Cookie {
  constructor(private readonly gateway: ICookieGateway) {}

  async loadCookie(account: IAccount): Promise<ICookieMemento | undefined> {
    return await this.gateway.getCookie(account);
  }

  async saveCookie(account: IAccount, cookie: ICookieMemento): Promise<void> {
    return await this.gateway.setCookie(account, cookie);
  }
}

import Cookie from "./cookie";

export interface ICookieMemento {}

export default interface ISession {
  login(): Promise<void>;

  updateCookie(cookie: ICookieMemento): Promise<void>;

  getCookie(): Promise<ICookieMemento>;

  /**
   * Check if this session is still usable (headers, cookies, tokens, etc.)
   */
  isValid(): Promise<boolean>;

  close(): Promise<void>;
}

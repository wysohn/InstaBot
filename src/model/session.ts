import Cookie from "./cookie";

export interface ICookieMemento {}

export default interface ISession {
  login(): Promise<boolean>;

  /**
   * Replace the cookie of this session with the given cookie
   * @param cookie the new cookie
   */
  updateCookie(cookie: ICookieMemento | undefined): Promise<void>;

  /**
   * Get the cookie of this session. Maybe empty if the session is newly initialized.
   */
  getCookie(): Promise<ICookieMemento>;

  /**
   * Check if this session is still usable (headers, cookies, tokens, etc.)
   */
  isValid(): Promise<boolean>;

  close(): Promise<void>;
}

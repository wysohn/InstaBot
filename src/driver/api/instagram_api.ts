import IAccount from "@model/account";
import { IInstagramGateway } from "@model/instagram";
import IPost from "@model/post";
import Principal from "@model/principal";
import ISession, { ICookieMemento } from "@model/session";
import IUser, { IUserId } from "@model/user";

import {
  Browser,
  Page,
  executablePath,
  ElementHandle,
  NodeFor,
  Protocol,
} from "puppeteer";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockPlugin from "puppeteer-extra-plugin-adblocker";

const MAIN_URL = "https://www.instagram.com/";
const LOGIN_URL = "https://www.instagram.com/accounts/login/";
const EXPLORE_URL = "https://www.instagram.com/explore/tags/{}";
const USER_PROFILE_URL = "https://www.instagram.com/{}/";

async function getElementOrUndefined(
  page: Page,
  selector: string
): Promise<ElementHandle<NodeFor<string>>> {
  try {
    return await page.waitForSelector(selector, { timeout: 1000 });
  } catch (e) {
    return undefined;
  }
}

export class InstagramUser implements IUser {
  constructor(private readonly instagram: InstagramAPI, readonly id: string) {}

  async follow(initiator: ISession): Promise<boolean> {
    return await this.instagram.followUser(initiator, this.id);
  }

  async unfollow(initiator: ISession): Promise<boolean> {
    return await this.instagram.unfollowUser(initiator, this.id);
  }

  async listPosts(initiator: ISession): Promise<IPost[]> {
    return await this.instagram.getPosts(initiator, this.id);
  }
}

export class InstagramPost implements IPost {
  constructor(
    private readonly instagram: InstagramAPI,
    private readonly url: string
  ) {
    this.url = url;
  }

  async like(initiator: ISession): Promise<boolean> {
    return await this.instagram.likePost(initiator, this.url);
  }

  async unlike(initiator: ISession): Promise<boolean> {
    return await this.instagram.unlikePost(initiator, this.url);
  }

  async writeComment(initiator: ISession, comment: string): Promise<void> {
    return await this.instagram.writeCommentToPost(
      initiator,
      this.url,
      comment
    );
  }
}

export class InstagramAccount implements IAccount {
  principal: Principal;
  password: string;
  cookies: { [key: string]: string } = {};

  constructor(userId: string, password: string) {
    this.principal = { loginId: userId };
    this.password = password;
  }
}

class PuppeteerCookieMemento implements ICookieMemento {
  constructor(readonly cookies: Protocol.Network.Cookie[]) {}
}

class PuppeteerSession implements ISession {
  constructor(
    readonly account: IAccount,
    readonly browser: Browser,
    readonly page: Page
  ) {
    this.browser = browser;
    this.page = page;
  }

  async login(): Promise<void> {
    const { principal, password } = this.account;

    const delayOption = { delay: 100 };
    await this.page.goto(LOGIN_URL);

    const searchBar = await getElementOrUndefined(
      this.page,
      "input[placeholder=Search]"
    );
    if (searchBar) {
      // Already logged in
      return;
    }

    const loginWait = this.page.waitForNavigation();
    await this.page.waitForSelector("input[name=username]", { timeout: 1000 });
    await this.page.type(
      "input[name=username]",
      principal.loginId,
      delayOption
    );
    await this.page.type("input[name=password]", password, delayOption);
    await this.page.$eval("button[type=submit]", (el) =>
      el.removeAttribute("disabled")
    );
    await this.page.click("button[type=submit]", {
      ...delayOption,
      button: "left",
    });

    const loginFailed = await getElementOrUndefined(
      this.page,
      "p[id=slfErrorAlert]"
    );
    if (loginFailed) {
      throw new Error("Login failed");
    }

    await loginWait;
    await this.page.waitForSelector("main");
  }

  async updateCookie(cookie: ICookieMemento): Promise<void> {
    const cookies = (cookie as PuppeteerCookieMemento).cookies;
    await this.page.setCookie(...cookies);
  }

  async getCookie(): Promise<ICookieMemento> {
    const cookies = await this.page.cookies();
    return new PuppeteerCookieMemento(cookies);
  }

  async isValid(): Promise<boolean> {
    await this.page.goto(MAIN_URL);
    await this.page.waitForNavigation();

    const loginButton = await this.page.waitForSelector(
      "a[href='/accounts/login/']",
      { timeout: 1000 }
    );
    return loginButton === null;
  }

  close(): Promise<void> {
    return this.browser.close();
  }
}

export default class InstagramAPI implements IInstagramGateway {
  constructor(private readonly debugging: boolean = false) {}

  async login(account: IAccount): Promise<ISession> {
    const puppeteer = puppeteerExtra.use(StealthPlugin()).use(AdblockPlugin());
    const browser = await puppeteer.launch({
      headless: !this.debugging,
      executablePath: executablePath(),
    });
    const page = await browser.newPage();

    const session = new PuppeteerSession(account, browser, page);

    await session.login();
    return session;
  }

  async getUser(
    session: ISession,
    userId: IUserId
  ): Promise<IUser | undefined> {
    const { page } = session as PuppeteerSession;

    await page.goto(USER_PROFILE_URL.replace("{}", userId.id));
    await page.waitForNavigation();

    const header = await page.waitForSelector("header", { timeout: 1000 });
    const links = await header?.$$("a[href^='/']");
    const userLink = links?.[0];
    if (userLink) {
      const url = await userLink?.evaluate((node) => node.href);
      return new InstagramUser(this, url);
    } else {
      return undefined;
    }
  }

  async followUser(session: ISession, userUrl: string): Promise<boolean> {
    const { page } = session as PuppeteerSession;

    await page.goto(userUrl);
    await page.waitForNavigation();

    const header = await page.waitForSelector("header", { timeout: 1000 });
    const buttons = await header?.$$("button");
    const followButton = buttons?.[0];
    if (
      followButton &&
      (await followButton?.evaluate((node) => node.innerText)) === "Follow"
    ) {
      await followButton.click();
      return true;
    } else {
      return false;
    }
  }

  async unfollowUser(session: ISession, userUrl: string): Promise<boolean> {
    const { page } = session as PuppeteerSession;

    await page.goto(userUrl);
    await page.waitForNavigation();

    const header = await page.waitForSelector("header", { timeout: 1000 });
    const buttons = await header?.$$("button");
    const followButton = buttons?.[0];
    if (
      followButton &&
      (await followButton?.evaluate((node) => node.innerText)) === "Following"
    ) {
      await followButton.click();
      return true;
    } else {
      return false;
    }
  }

  async getPosts(session: ISession, keyword: string): Promise<IPost[]> {
    const { page } = session as PuppeteerSession;

    await page.goto(EXPLORE_URL.replace("{}", keyword));
    await page.waitForNavigation();

    const posts = await page.evaluate(() => {
      const posts = document.querySelectorAll("a[href^='/p/' role='link']");
      return Array.from(posts).map((post) => {
        const link = post.getAttribute("href");
        return {
          url: `https://www.instagram.com${link}`,
        };
      });
    });

    return posts.map((post) => new InstagramPost(this, post.url));
  }

  async likePost(session: ISession, postUrl: string): Promise<boolean> {
    const { page } = session as PuppeteerSession;

    await page.goto(postUrl);
    await page.waitForNavigation();

    const likeButtonSvg = await page.waitForSelector("svg[aria-label='Like']", {
      timeout: 3000,
    });
    if (likeButtonSvg) {
      await likeButtonSvg.click();
      return true;
    } else {
      return false;
    }
  }

  async unlikePost(session: ISession, postUrl: string): Promise<boolean> {
    const { page } = session as PuppeteerSession;

    await page.goto(postUrl);
    await page.waitForNavigation();

    const likeButtonSvg = await page.waitForSelector(
      "svg[aria-label='Unlike']",
      {
        timeout: 3000,
      }
    );
    if (likeButtonSvg) {
      await likeButtonSvg.click();
      return true;
    } else {
      return false;
    }
  }

  async writeCommentToPost(
    session: ISession,
    postUrl: string,
    comment: string
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

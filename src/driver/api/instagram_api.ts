import IAccount from "@model/account";
import { IInstagramGateway } from "@model/instagram";
import IPost from "@model/post";
import Principal from "@model/principal";
import ISession, { ICookieMemento, ScreenshotOptions } from "@model/session";
import IUser, { IUserId } from "@model/user";

import {
  Browser,
  Page,
  executablePath,
  ElementHandle,
  NodeFor,
  Protocol,
  ClickOptions,
  HTTPRequest,
} from "puppeteer";
import puppeteerExtra from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import AdblockPlugin from "puppeteer-extra-plugin-adblocker";

const MAIN_URL = "https://www.instagram.com/";
const LOGIN_URL = "https://www.instagram.com/accounts/login/";
const EXPLORE_URL = "https://www.instagram.com/explore/tags/{}";
const USER_PROFILE_URL = "https://www.instagram.com/{}/";

const delayOption = { delay: 100 };
const clickOption: ClickOptions = { button: "left" };

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

async function retry(func: () => Promise<any>, times: number) {
  for (let i = 0; i < times; i++) {
    try {
      return await func();
    } catch (e) {
      if (i == times - 1) {
        throw e;
      }

      continue;
    }
  }
}

async function waitFor(waitSecs: number = 60) {
  await new Promise((r) => setTimeout(r, waitSecs * 1000));
}

export class InstagramUser implements IUser {
  private followed?: boolean = false;

  constructor(private readonly instagram: InstagramAPI, readonly id: string) {}

  async follow(initiator: ISession): Promise<boolean> {
    if (this.followed) {
      return true;
    }

    const result = await this.instagram.followUser(
      initiator,
      USER_PROFILE_URL.replace("{}", this.id)
    );
    await waitFor();

    this.followed = true;
    return result;
  }

  async unfollow(initiator: ISession): Promise<boolean> {
    if (!this.followed) {
      return true;
    }

    const result = await this.instagram.unfollowUser(
      initiator,
      USER_PROFILE_URL.replace("{}", this.id)
    );
    await waitFor();

    this.followed = false;
    return result;
  }

  async isFollowed(session: ISession): Promise<boolean> {
    if (this.followed) {
      return true;
    }

    this.followed = await this.instagram.isFollowed(
      session,
      USER_PROFILE_URL.replace("{}", this.id)
    );
    await waitFor();

    return this.followed;
  }

  async listPosts(initiator: ISession): Promise<IPost[]> {
    const result = await this.instagram.getPostsByUser(
      initiator,
      USER_PROFILE_URL.replace("{}", this.id)
    );
    await waitFor();

    return result;
  }
}

export class InstagramPost implements IPost {
  private postTime?: Date;
  private owner?: IUser;
  private liked?: boolean;

  constructor(private readonly instagram: InstagramAPI, readonly url: string) {
    this.url = url;
  }

  async getPostTime(initiator: ISession): Promise<Date> {
    if (this.postTime) {
      return this.postTime;
    }

    this.postTime = await this.instagram.getPostTime(initiator, this.url);
    await waitFor();

    return this.postTime;
  }

  async getOwner(initiator: ISession): Promise<IUser> {
    if (this.owner) {
      return this.owner;
    }

    this.owner = await this.instagram.getPostOwner(initiator, this.url);
    await waitFor();

    return this.owner;
  }

  async like(initiator: ISession): Promise<boolean> {
    if (this.liked !== undefined && this.liked) {
      return true;
    }

    const result = await this.instagram.likePost(initiator, this.url);
    await waitFor();

    this.liked = true;

    return result;
  }

  async unlike(initiator: ISession): Promise<boolean> {
    if (this.liked !== undefined && !this.liked) {
      return true;
    }

    const result = await this.instagram.unlikePost(initiator, this.url);
    await waitFor();

    this.liked = false;

    return result;
  }

  async writeComment(initiator: ISession, comment: string): Promise<void> {
    const result = await this.instagram.writeCommentToPost(
      initiator,
      this.url,
      comment
    );
    await waitFor();

    return result;
  }

  toString(): string {
    return this.url;
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

export class PuppeteerCookieMemento implements ICookieMemento {
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

  async login(): Promise<boolean> {
    const { principal, password } = this.account;

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
      ...clickOption,
    });

    const loginFailed = await getElementOrUndefined(
      this.page,
      "p[id=slfErrorAlert]"
    );
    if (loginFailed) {
      return false;
    }

    await loginWait;
    await this.page.waitForSelector("main");
    return true;
  }

  async updateCookie(cookie?: ICookieMemento): Promise<void> {
    if (cookie) {
      const cookies = (cookie as PuppeteerCookieMemento).cookies;
      await this.page.setCookie(...cookies);
    }
  }

  async getCookie(): Promise<ICookieMemento> {
    const cookies = await this.page.cookies();
    return new PuppeteerCookieMemento(cookies);
  }

  async isValid(): Promise<boolean> {
    await this.page.goto(MAIN_URL);
    await this.page.waitForSelector("article");

    const passwordField = await getElementOrUndefined(
      this.page,
      "input[type='password']"
    );

    return passwordField === undefined;
  }

  async screenshot(options: ScreenshotOptions): Promise<void> {
    await this.page.screenshot(options);
  }

  async close(): Promise<void> {
    return await this.browser.close();
  }
}

const OWNER_NAME_REGEX = /(https:\/\/)(www\.instagram\.com\/)(.+)(\/)/;
export default class InstagramAPI implements IInstagramGateway {
  constructor(
    private readonly debugging: boolean = false,
    private readonly resourceFilters: ((req: HTTPRequest) => boolean)[] = []
  ) {}

  async initSession(account: IAccount): Promise<ISession> {
    const puppeteer = puppeteerExtra.use(StealthPlugin()).use(AdblockPlugin());
    const browser = await puppeteer.launch({
      headless: !this.debugging,
      executablePath: executablePath(),
    });
    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      for (const filter of this.resourceFilters) {
        if (filter(req)) {
          req.abort();
          return;
        }
      }

      req.continue();
    });

    const session = new PuppeteerSession(account, browser, page);

    return session;
  }

  async getUser(
    session: ISession,
    userId: IUserId
  ): Promise<IUser | undefined> {
    const { page } = session as PuppeteerSession;

    await page.goto(USER_PROFILE_URL.replace("{}", userId.id));

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

    const header = await page.waitForSelector("header");
    const buttons = await header?.$$("button");
    const followButton = buttons?.[0];
    const buttonText = await followButton?.evaluate((node) => node.innerText);

    if (buttonText !== "Follow" && buttonText !== "Following") {
      throw new Error("Invalid button text: " + buttonText);
    }

    if (followButton && buttonText === "Follow") {
      await followButton.click({ ...delayOption, ...clickOption });

      await retry(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const isDisabled = await followButton?.evaluate((node) =>
          node.classList.contains("disabled")
        );

        if (isDisabled) {
          throw new Error("Button is disabled");
        }
      }, 100);

      return true;
    } else {
      return false;
    }
  }

  async unfollowUser(session: ISession, userUrl: string): Promise<boolean> {
    const { page } = session as PuppeteerSession;

    await page.goto(userUrl);

    const header = await page.waitForSelector("header");
    const buttons = await header?.$$("button");
    const unfollowMenuButton = buttons?.[0];
    const buttonText = await unfollowMenuButton?.evaluate(
      (node) => node.innerText
    );

    if (unfollowMenuButton && buttonText === "Following") {
      await unfollowMenuButton.click({ ...delayOption, ...clickOption });
      const dialog = await page.waitForSelector("div[role='dialog']");

      await dialog.waitForSelector(
        "div[role='button'][style='cursor: pointer;']"
      );
      const menuButtons = await dialog.$$(
        "div[role='button'][style='cursor: pointer;']"
      );
      const unfollowButton = menuButtons?.[4];
      await unfollowButton?.click({ ...delayOption, ...clickOption });

      await retry(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const isDisabled = await unfollowMenuButton?.evaluate((node) =>
          node.classList.contains("disabled")
        );

        // wait for one second before retry
        if (isDisabled) {
          throw new Error("Button is disabled");
        }
      }, 100);

      return true;
    } else {
      return false;
    }
  }

  async isFollowed(session: ISession, userUrl: string): Promise<boolean> {
    const { page } = session as PuppeteerSession;

    await page.goto(userUrl);

    const header = await page.waitForSelector("header");
    const buttons = await header?.$$("button");
    const followButton = buttons?.[0];
    const buttonText = await followButton?.evaluate((node) => node.innerText);

    if (buttonText !== "Follow" && buttonText !== "Following") {
      throw new Error("Invalid button text: " + buttonText);
    }

    return buttonText === "Following";
  }

  async getPosts(session: ISession, keyword: string): Promise<IPost[]> {
    const { page } = session as PuppeteerSession;

    await page.goto(EXPLORE_URL.replace("{}", keyword));
    await page.waitForSelector("a[href^='/p/'][role='link']");

    const posts = await page.evaluate(() => {
      const posts = document.querySelectorAll("a[href^='/p/'][role='link']");
      return Array.from(posts).map((post) => {
        const link = post.getAttribute("href");
        return {
          url: `https://www.instagram.com${link}`,
        };
      });
    });

    return posts.map((post) => new InstagramPost(this, post.url));
  }

  async getPostsByUser(session: ISession, userUrl: string): Promise<IPost[]> {
    const { page } = session as PuppeteerSession;

    await page.goto(userUrl);
    await page.waitForSelector("a[href^='/p/'][role='link']");
    const posts = await page.evaluate(() => {
      const posts = document.querySelectorAll("a[href^='/p/'][role='link']");
      return Array.from(posts).map((post) => {
        const link = post.getAttribute("href");
        return {
          url: `https://www.instagram.com${link}`,
        };
      });
    });

    return posts.map((post) => new InstagramPost(this, post.url));
  }

  async getPostTime(session: ISession, postUrl: string): Promise<Date> {
    const { page } = session as PuppeteerSession;

    await page.goto(postUrl);

    const time = await page.waitForSelector("time");
    const dateTime = await time.evaluate((node) =>
      node.getAttribute("datetime")
    );

    return new Date(dateTime);
  }

  async getPostOwner(initiator: ISession, url: string): Promise<IUser> {
    const { page } = initiator as PuppeteerSession;

    await page.goto(url);

    const header = await page.waitForSelector("header");
    const links = await header?.$$("a[href^='/']");
    const userLink = links?.[0];
    if (userLink) {
      const userUrl = await userLink?.evaluate((node) => node.href);
      const matches = userUrl?.match(OWNER_NAME_REGEX);
      return new InstagramUser(this, matches?.[3]);
    } else {
      throw new Error("Cannot get post owner");
    }
  }

  async likePost(session: ISession, postUrl: string): Promise<boolean> {
    const { page } = session as PuppeteerSession;

    await page.goto(postUrl);

    const likeButtonSvg = await getElementOrUndefined(
      page,
      "svg[aria-label='Like'][width='24']"
    );
    if (likeButtonSvg) {
      const parentDiv = await likeButtonSvg.$("xpath=..");
      const likeButton = await parentDiv.$("xpath=..");

      await retry(async () => {
        await likeButton.click({ ...delayOption, ...clickOption });
        await page.waitForSelector("svg[aria-label='Unlike'][width='24']", {
          timeout: 5000,
        });
      }, 18);

      return true;
    } else {
      return false;
    }
  }

  async unlikePost(session: ISession, postUrl: string): Promise<boolean> {
    const { page } = session as PuppeteerSession;

    await page.goto(postUrl);

    const likeButtonSvg = await getElementOrUndefined(
      page,
      "svg[aria-label='Unlike'][width='24']"
    );

    if (likeButtonSvg) {
      const parentDiv = await likeButtonSvg.$("xpath=..");
      const likeButton = await parentDiv.$("xpath=..");
      await likeButton.click({ ...delayOption, ...clickOption });
      await page.waitForSelector("svg[aria-label='Like'][width='24']");
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
    const { page } = session as PuppeteerSession;

    await page.goto(postUrl);

    const form = await page.waitForSelector("form[method='POST']");

    const commentInput = await form.waitForSelector(
      "textarea[aria-label='Add a comment…']"
    );
    await commentInput?.type(comment, delayOption);

    const submitButton = await form.waitForSelector("div[role='button']");
    await submitButton?.click({ ...delayOption, ...clickOption });

    await page.waitForSelector("div[data-visualcompletion='loading-state'", {
      hidden: true,
    });
  }
}

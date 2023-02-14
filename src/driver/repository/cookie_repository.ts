import { PuppeteerCookieMemento } from "@driver/api/instagram_api";
import IAccount from "@model/account";
import { ICookieGateway } from "@model/cookie";
import { ICookieMemento } from "@model/session";
import { existsSync } from "fs";
import { mkdir, open, stat } from "fs/promises";
import { Protocol } from "puppeteer";

const ENCODING = "utf-8";

export default class CookieRepository implements ICookieGateway {
  constructor(private readonly folderPath: string = "./cookies") {}

  async getCookie(account: IAccount): Promise<ICookieMemento> {
    const fileName = `${this.folderPath}/${account.principal.loginId}.json`;

    if (
      await stat(fileName)
        .then((stat) => stat.isFile())
        .catch(() => false)
    ) {
      const handle = await open(fileName, "r");
      const cookieString = await handle.readFile(ENCODING);
      await handle.close();

      if (cookieString.length === 0) return undefined;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const cookie = JSON.parse(cookieString);
      return new PuppeteerCookieMemento(cookie as Protocol.Network.Cookie[]);
    } else {
      return undefined;
    }
  }

  async setCookie(account: IAccount, cookie: ICookieMemento): Promise<void> {
    await mkdir(this.folderPath, { recursive: true });

    const handle = await open(
      `${this.folderPath}/${account.principal.loginId}.json`,
      "w"
    );
    const puppeteerCookieMemento = cookie as PuppeteerCookieMemento;

    const cookieString = JSON.stringify(
      puppeteerCookieMemento.cookies,
      null,
      2
    );
    await handle.writeFile(cookieString, {
      encoding: ENCODING,
    });
    await handle.close();
  }
}

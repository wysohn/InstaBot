import { IKeywordGateway } from "@model/keyword";
import Logger from "@model/logger";
import { stat, open } from "fs/promises";

const ENCODING = "utf-8";

export default class KeywordRepository implements IKeywordGateway {
  constructor(private readonly logger: Logger){

  }

  async getKeywords(): Promise<string[]> {
    const fileName = `./keywords.txt`

    if (
      await stat(fileName)
        .then((stat) => stat.isFile())
        .catch(() => false)
    ) {
      const handle = await open(fileName, "r");
      const keywordsString = await handle.readFile(ENCODING);
      await handle.close();

      if (keywordsString.length === 0) return [];

      return keywordsString.split('\n');
    } else {
      const handle = await open(fileName, 'w');
      await handle.close();
      return [];
    }
  }
}

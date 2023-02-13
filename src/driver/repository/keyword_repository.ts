import { IKeywordGateway } from "@model/keyword";

export default class KeywordRepository implements IKeywordGateway {
  getKeywords(): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
}

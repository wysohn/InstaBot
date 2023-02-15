import { IKeywordGateway } from "@model/keyword";

export default class KeywordRepository implements IKeywordGateway {
  async getKeywords(): Promise<string[]> {
    // TODO load from file
    return ["championsleague"];
  }
}

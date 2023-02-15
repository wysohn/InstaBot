export interface IKeywordGateway {
  getKeywords(): Promise<string[]>;
}

export default class Keyword {
  private keywords = new Array<string>();
  private index = 0;

  constructor(private readonly gateway: IKeywordGateway) {}

  async init(): Promise<void> {
    this.keywords = (await this.gateway.getKeywords()) ?? [];
    this.index = 0;
  }

  async poll(): Promise<string | undefined> {
    if (this.index >= this.keywords.length) {
      return undefined;
    }

    return this.keywords[this.index++];
  }
}

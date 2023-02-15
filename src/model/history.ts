export interface CountOptions<V> {
  /**
   * Greater than or equal to this date
   * If not specified, count from the beginning of time
   */
  from: Date;

  /**
   * Less than or equal to this date
   * If not specified, count until the end of time
   */
  to: Date;

  /**
   * The username to count
   * If not specified, count all users
   */
  value: V;
}

export class FollowHistory {
  //TODO persist timeseries data
  constructor(private data: [Date, string][] = []) {}

  async add(date: Date, username: string): Promise<void> {
    if (!!date && !!username) {
      this.data.push([date, username]);
    } else {
      throw new Error(`Invalid date or username: ${date}, ${username}`);
    }
  }

  async count(options?: Partial<CountOptions<string>>): Promise<number> {
    const { from, to, value } = options || {};
    return this.data.filter(
      ([date, username]) =>
        (!from || date >= from) &&
        (!to || date <= to) &&
        (!value || username === value)
    ).length;
  }

  async clear(): Promise<void> {
    this.data = [];
  }
}

export class LikeHistory {
  //TODO persist timeseries data
  constructor(private data: [Date, string][] = []) {}

  async add(date: Date, postId: string): Promise<void> {
    if (!!date && !!postId) {
      this.data.push([date, postId]);
    } else {
      throw new Error(`Invalid date or postId: ${date}, ${postId}`);
    }
  }

  async count(options?: Partial<CountOptions<string>>): Promise<number> {
    const { from, to, value } = options || {};
    return this.data.filter(
      ([date, postId]) =>
        (!from || date >= from) &&
        (!to || date <= to) &&
        (!value || postId === value)
    ).length;
  }

  async clear(): Promise<void> {
    this.data = [];
  }
}

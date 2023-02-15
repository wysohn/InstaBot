import IAccount from "@model/account";
import ICommenter from "@model/commenter";
import Cookie from "@model/cookie";
import Instagram from "@model/instagram";
import Keyword from "@model/keyword";
import Logger from "@model/logger";
import ISession from "@model/session";

export interface IAgentContext {
  logger: Logger;
  instagram: Instagram;
  cookie: Cookie;
  commenter: ICommenter;
  keyword: Keyword;
  session?: ISession;
}

export type EventMessage = "tick";

export type AgentPredicate = (context: IAgentContext | any) => Promise<boolean>;

export interface IAgentAction {
  handler(event: AgentEvent): Promise<void>;
}

export class AgentEvent {
  constructor(
    readonly responder: Agent,
    readonly message: EventMessage | string
  ) {}
}

export class AgentState {
  constructor(
    readonly transitions: Map<AgentPredicate, () => AgentState>,
    readonly actions: IAgentAction[]
  ) {}

  toString(): string {
    return this.constructor.name;
  }
}

export default class Agent {
  private state: AgentState;

  constructor(
    private context: IAgentContext & { [key: string]: any },
    initialState: AgentState
  ) {
    this.state = initialState;
  }

  async getDefaultContext(): Promise<IAgentContext> {
    return {
      logger: this.context.logger,
      instagram: this.context.instagram,
      cookie: this.context.cookie,
      commenter: this.context.commenter,
      keyword: this.context.keyword,
      session: this.context.session,
    };
  }

  async getContext(key: string): Promise<any> {
    // eslint-disable-next-line
    return this.context[key];
  }

  async setContext(key: string, value: any): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.context[key] = value;
  }

  async run(): Promise<void> {
    while (this.state) {
      for (const action of this.state.actions) {
        await action.handler(new AgentEvent(this, "tick"));
      }

      for (const transition of this.state.transitions) {
        const [predicate, next] = transition;
        if (await predicate({ ...this.context })) {
          const nextState = next();
          this.context.logger.info(
            `Agent state changed: ${this.state} -> ${nextState}`
          );
          this.state = nextState;
          break;
        }
      }
    }

    await this.context.logger.info("Agent stopped");
    await this.context.session?.close();
  }
}

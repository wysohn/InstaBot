import IAccount from "@model/account";
import Cookie from "@model/cookie";
import Instagram from "@model/instagram";
import Keyword from "@model/keyword";
import Logger from "@model/logger";
import ISession from "@model/session";

export interface IAgentContext {
  logger: Logger;
  instagram: Instagram;
  keyword: Keyword;
  cookie: Cookie;
  session?: ISession;
}

export interface IAgentPredicate {
  test(context: {}): Promise<boolean>;
}

export type EventMessage = "tick";

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
    readonly transitions: Map<IAgentPredicate, AgentState>,
    readonly actions: IAgentAction[]
  ) {}
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
      keyword: this.context.keyword,
      cookie: this.context.cookie,
      session: this.context.session,
    };
  }

  async getConext(key: string): Promise<any> {
    return this.context[key];
  }

  async setContext(key: string, value: any): Promise<void> {
    this.context[key] = value;
  }

  async run(): Promise<void> {
    while (this.state) {
      for (const transition of this.state.transitions) {
        const [predicate, next] = transition;
        if (await predicate.test({ ...this.context })) {
          this.state = next;
          break;
        }
      }

      for (const action of this.state.actions) {
        await action.handler(new AgentEvent(this, "tick"));
      }
    }

    this.context.session?.close();
  }
}

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
    private readonly initialState: AgentState
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
    try {
      while (this.state) {
        for (const action of this.state.actions) {
          await action.handler(new AgentEvent(this, "tick"));

          // always way for 1 second after each action
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        for (const transition of this.state.transitions) {
          const [predicate, next] = transition;
          if (await predicate({ ...this.context })) {
            const nextState = next();
            await this.context.logger.info(
              `Agent state changed: ${this.state} -> ${nextState}`
            );
            this.state = nextState;
            break;
          }
        }
      }
    } catch (e) {
      // if something fails for some reason, take screenshot and save it with error message
      this.context.session?.screenshot({
        path: `./errors/error-${new Date().toISOString()}.png`,
      });
      await this.context.logger.error(e);
    }

    await this.context.logger.info("Agent stopped");
    await this.context.session?.close();
  }
}

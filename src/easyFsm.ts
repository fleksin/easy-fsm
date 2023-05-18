interface Transition<
  TransitionName extends nameish,
  StateName extends nameish
> {
  name: TransitionName | string;
  from: StateName | string;
  to: StateName | string;
}

// disallow number to be name, because it would be messy for debugging state/transitions
type nameish = string;

type StateActionRet<TransitionName> =
  | TransitionName
  | string
  | void
  | undefined
  | boolean;

type StateAction<TransitionName extends nameish, Ctx> = (
  ctx: Ctx
) => StateActionRet<TransitionName> | Promise<StateActionRet<TransitionName>>;

interface StateActions<T extends nameish, Ctx> {
  [stateName: string]: StateAction<T, Ctx>;
}

interface Log {
  type: "transition" | "state-action";
  name: string;
}

export class EasyFsm<
  TransitionName extends nameish,
  StateName extends nameish,
  CtxType extends Record<string, any>
> {
  state: StateName | string = "none";
  transitions = [];
  stateSet = new Set();
  transitSet: {
    [name: string]: [StateName | string, StateName | string];
  } = {};
  stateActions: StateActions<TransitionName, CtxType> = {};
  ctx = {} as CtxType;
  logs: Log[] = [];
  debugMode: boolean;
  enterStateCallbacks = {} as Record<
    StateName | string,
    (ctx: CtxType) => void
  >;
  leaveStateCallbacks = {} as Record<
    StateName | string,
    (ctx: CtxType) => void
  >;
  enterTransitCallbacks = {} as Record<
    TransitionName | string,
    (ctx: CtxType) => void
  >;
  leaveTransitCallbacks = {} as Record<
    TransitionName | string,
    (ctx: CtxType) => void
  >;
  constructor(
    {
      transitions = [],
      stateActions = {},
    }: {
      transitions?: Transition<TransitionName, StateName>[];
      stateActions?: StateActions<TransitionName, CtxType>;
    },
    debugMode: boolean = false
  ) {
    transitions.forEach(({ name, from, to }) => {
      this.stateSet.add(from);
      this.stateSet.add(to);
      this.transitSet[name] = [from, to];
    });
    this.stateActions = stateActions;
    this.debugMode = debugMode;
  }

  addLog(log: Log) {
    const { type, name } = log;
    if (this.debugMode) console.log(`[${type}] `, name);
    this.logs.push(log);
  }

  async init(state: StateName) {
    this.state = state;
    this.invokeStateAction();
  }

  async invokeStateAction() {
    this.addLog({
      type: "state-action",
      name: this.state,
    });
    const enterCb = this.enterStateCallbacks[this.state];
    enterCb?.(this.ctx);
    const stateAction = this.stateActions[this.state];
    const next = await stateAction?.(this.ctx);
    /**
     * when coming back from an async job, the state might already change,
     * if so, fsm should not transit to next
     * check if state changed by comparing stateAction.name with current state
     */
    if (stateAction && stateAction.name !== this.state) {
      return;
    }
    const leaveCb = this.leaveStateCallbacks[this.state];
    leaveCb?.(this.ctx);
    if (typeof next === "string" && stateAction.name === this.state) {
      queueMicrotask(() => {
        this.transit(next);
      });
    }
  }

  onEnterState(name: StateName, cb: (ctx: CtxType) => void) {
    this.enterStateCallbacks[name] = cb;
  }

  onLeaveState(name: StateName, cb: (ctx: CtxType) => void) {
    this.leaveStateCallbacks[name] = cb;
  }

  onEnterTransit(name: TransitionName, cb: (ctx: CtxType) => void) {
    this.enterTransitCallbacks[name] = cb;
  }

  onLeaveTransit(name: TransitionName, cb: (ctx: CtxType) => void) {
    this.leaveTransitCallbacks[name] = cb;
  }

  transit = async (transitionName: TransitionName | string) => {
    this.addLog({
      type: "transition",
      name: transitionName,
    });
    const enterCb = this.enterTransitCallbacks[transitionName];
    enterCb?.(this.ctx);
    const transition = this.transitSet[transitionName];
    if (!transition) {
      throw `transition ${transitionName} not valid !!!`;
    }
    const [from, to] = transition;
    if (from !== this.state && from !== "*") {
      throw `transition ${transitionName} cannot fire from state ${this.state}`;
    }
    this.state = to;
    const leaveCb = this.leaveStateCallbacks[transitionName];
    leaveCb?.(this.ctx);
    queueMicrotask(() => {
      this.invokeStateAction();
    });
  };
}

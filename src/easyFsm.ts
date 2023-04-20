interface Transition<TransitionName extends nameish, StateName extends nameish> {
  name: TransitionName | string;
  from: StateName | string;
  to: StateName | string;
}

// disallow number to be name, because it would be messy for debugging state/transitions
type nameish = string;

type StateActionRet<TransitionName> = TransitionName | string | void | undefined | boolean;

type StateAction<TransitionName extends nameish, Ctx> = (
  ctx: Ctx
) =>
  | StateActionRet<TransitionName>
  | Promise<StateActionRet<TransitionName>>;

interface StateActions<T extends nameish, Ctx> {
  [stateName: string]: StateAction<T, Ctx>;
}

interface Log {
  type: 'transition' | 'state-action';
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
  enterStateCallbacks = {} as Record<StateName | string, () => void>;
  leaveStateCallbacks = {} as Record<StateName | string, () => void>;
  constructor({
    transitions = [],
    stateActions = {},
  }: {
    transitions?: Transition<TransitionName, StateName>[];
    stateActions?: StateActions<TransitionName, CtxType>;
  }) {
    transitions.forEach(({ name, from, to }) => {
      this.stateSet.add(from);
      this.stateSet.add(to);
      this.transitSet[name] = [from, to];
    });
    this.stateActions = stateActions;
  }

  addLog(log: Log) {
    const { type, name } = log;
    console.log(`[${type}] `, name);
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
    enterCb?.();
    const next = await this.stateActions[this.state]?.(this.ctx);
    const leaveCb = this.leaveStateCallbacks[this.state];
    leaveCb?.();
    if (typeof next === "string") {
      this.transit(next);
    }
  }

  onEnterState(name: StateName, cb: () => void) {
    this.enterStateCallbacks[name] = cb;
  }

  onLeaveState(name: StateName, cb: () => void) {
    this.leaveStateCallbacks[name] = cb;
  }

  transit = async (transitionName: TransitionName | string) => {
    this.addLog({
      type: "transition",
      name: transitionName,
    });
    const transition = this.transitSet[transitionName];
    if (!transition) {
      throw `transition ${transitionName} not valid !!!`;
    }
    const [from, to] = transition;
    if (from !== this.state && from !== "*") {
      throw `transition ${transitionName} cannot fire from state ${this.state}`;
    }
    this.state = to;
    this.invokeStateAction();
  };
}

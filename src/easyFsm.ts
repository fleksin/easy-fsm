interface Transition<TransitionName extends nameish, StateName extends nameish> {
  name: TransitionName | string;
  from: StateName | string;
  to: StateName | string;
}

type nameish = string | number;

type StateAction<TransitionName extends nameish> = (ctx: any) => TransitionName | string | void | undefined;

interface StateActions<T extends nameish> {
  [stateName: string]: StateAction<T>;
}

export class EasyFsm<TransitionName extends nameish, StateName extends nameish> {
  state: StateName | string = "none";
  transitions = [];
  stateSet = new Set();
  transitSet: {
    [name: string]: [StateName | string, StateName | string];
  } = {};
  stateActions: StateActions<TransitionName> = {};
  ctx = {};
  constructor({
    transitions = [],
    stateActions = {},
  }: {
    transitions?: Transition<TransitionName, StateName>[];
    stateActions?: StateActions<TransitionName>;
  }) {
    transitions.forEach(({ name, from, to }) => {
      this.stateSet.add(from);
      this.stateSet.add(to);
      this.transitSet[name] = [from, to];
    });
    this.stateActions = stateActions;
  }

  async init(state: StateName) {
    this.state = state;
    this.invokeStateAction();
  }

  async invokeStateAction() {
    const next = await this.stateActions[this.state]?.(this.ctx);
    if (next) {
      this.transit(next);
    }
  }

  transit = async (transitionName: TransitionName | string) => {
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

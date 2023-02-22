interface Transition<TransitionName extends string, StateName extends string> {
  name: TransitionName | string;
  from: StateName | string;
  to: StateName | string;
}

type StateAction<TransitionName extends string> = (ctx) => TransitionName | string | void | undefined;

interface StateActions<T extends string> {
  [stateName: string]: StateAction<T>;
}

export class EasyFsm<TransitionName extends string, StateName extends string> {
  state = "none";
  transitions = [];
  stateSet = new Set();
  transitSet: {
    [name: string]: [StateName | string, StateName | string];
  } = {};
  stateActions = {};
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

  async init(state) {
    this.state = state;
    this.invokeStateAction();
  }

  async invokeStateAction() {
    const next = await this.stateActions[this.state]?.(this.ctx);
    if (next) {
      this.transit(next);
    }
  }

  transit = async (transitionName) => {
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

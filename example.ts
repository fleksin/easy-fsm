import { EasyFsm } from "./easyFsm";

enum Transits {
  transit1 = "transit1",
  transit2 = "transit2",
}

enum States {
  state1 = "state1",
  state2 = "state2",
}

const fsm = new EasyFsm<Transits, States>({
  transitions: [
    {
      name: Transits.transit1,
      from: States.state1,
      to: States.state2,
    },
  ],
  stateActions: {
    [States.state1]: function (ctx) {
      return Transits.transit1
    }
  }
});
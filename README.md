# Easy Fsm
Took a stab at fsm. An implementation for a super mini fsm (finite state machine)  
 
# Inspiration  
Inspired by [javascript-state-machine](https://github.com/jakesgordon/javascript-state-machine).  
But I want the fsm to have ability to drive itself, since [javascript-state-machine](https://github.com/jakesgordon/javascript-state-machine) doesn't allow a transition within a transition ([issue link](https://github.com/jakesgordon/javascript-state-machine/issues/108#issuecomment-307578561)).   

which means the state machine need to be "pushed" from the outside scope, which leads to a bunch of `if else`.  
And that seems to counter the idea of using a state machine -- "I don't want a bunch of if/else statement"

# Usage
TBA

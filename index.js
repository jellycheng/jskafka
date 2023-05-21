'use strict';                                                   

function Welcome() {
  return "welcome to jskafka";
}

class Counter {

  constructor() {
    this.n = 0;
  }

  nextId() {
    let ret = this.n;
    if (this.n === 0xFFFFFFFF) {
      this.n = 0;
    } else {
      ++this.n;
    }
    return ret;
  }

}

module.exports.Counter = Counter;
module.exports.Welcome = Welcome;

const EventEmitter = require('events');
const Kafka = require('node-rdkafka');
const defer = require('./defer').defer;


class Consumer extends EventEmitter {
  constructor(conf) {
    super();

    this.topic        = Array.isArray(conf.topic) ? conf.topic : [conf.topic];
    this.timeout      = conf.timeout ? conf.timeout : 50000;
    this.batchSize    = conf.batchSize || 1;

    this.consumer = new Kafka.KafkaConsumer(Object.assign({}, conf.options));
    this.consumer.on('error', err => this.emit('error', err));
    this.consumer.on('event.error', err => this.emit('error', err));
  }

  init() {
    let defered = defer();
    this.consumer.connect({
      timeout: this.timeout
    });

    this.consumer.on('ready', () => {
      this.consumer.subscribe(this.topic);
      defered.resolve();
    }); 

    this.consumer.on('disconnected', () => {
      this.emit('disconnected');
    }); 

    return defered.promise;
  }

  pop() {
    let defered = defer();
    let ret;

    this.consumer.consume(this.batchSize, (err, msg) => {
      if (err) {
        defered.reject(err);
      } else {
        if (msg.length) {
          ret = msg;
        } else {
          ret = "";
        }
        defered.resolve(ret);
      }
    });
    return defered.promise;
  }

  consume(cb) {
    this.consumer.on('data', (msg) => {
      cb(msg);
    });
    this.consumer.consume();
  }

  commit(topicPartition) {
    if (topicPartition) {
      this.consumer.commitSync(topicPartition);
    } else {
      this.consumer.commitSync();
    }
  }

  finish() {
    this.consumer.unsubscribe(this.topic);
    return this.consumer.disconnect();
  }

  assignments() {
    return this.consumer.assignments();
  }

}

module.exports = Consumer;

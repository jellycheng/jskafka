const EventEmitter = require("events");
const Kafka = require("node-rdkafka");
const defer = require('./defer').defer;
const myindex = require("./index");


class Producer extends EventEmitter {
  constructor(conf) {
    super();

    this.pendings = new Map();
    this.counter = new myindex.Counter();

    this.topic = conf.topic;
    this.drCb = conf.options.dr_cb;
    this.enable_partition = conf.enable_partition || false;

    this.producer = new Kafka.Producer(
      Object.assign({ dr_cb: true }, conf.options),
      {
        'request.required.acks': 1
      }
    );

    this.producer.on("error", err => this.emit('error', err));
    this.producer.on("event.error", err => this.emit('error', err));

    this.producer.on("delivery-report", (err, report) => {
      this.emit('delivered', report);
      let defered = this.pendings.get(report.opaque.id);

      if (defered === Object(defered) && typeof defered.then === 'function') {
        return;
      }

      this.pendings.delete(report.opaque.id);

      if (err) {
        defered.reject(err);
      } else {
        defered.resolve();
      }
    });
  }

  init() {
    let defered = defer();

    this.producer.connect({
      topic: this.topic,
      timeout: this.timeout || 5000
    }, (err) => {
      if (err) {
        defered.reject(err);
      }
    });

    this.producer.on("ready", () => {
      this.producer.setPollInterval(this.pollInterval || 500);
      defered.resolve();
    });

    return defered.promise;
  }

  push(msg, partition) {
    let defered = defer();
    let ret = defered.promise;

    try {
      let id = this.counter.nextId();

      let topic_partition = null;
      if (this.enable_partition === true) {
        topic_partition = partition || null;
      }

      this.producer.produce(this.topic, topic_partition, Buffer.from(msg), null, null, { id: id });

      if (this.drCb === true) {
        this.pendings.set(id, defered);
      } else {
        ret = Promise.resolve();
      }
    } catch (err) {
      defered.reject(err);
    }

    return ret;
  }

  finish() {
    let defered = defer();

    this.producer.flush(5000, () => {
      this.producer.disconnect((err) => {
        if (err) {
          defered.reject(err);
        } else {
          this.producer.removeAllListeners();
          defered.resolve();
        }
      });
    });

    return defered.promise;
  }
}

module.exports = Producer;

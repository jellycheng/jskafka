# jskafka
```
基于node-rdkafka封装kafka
```

## 项目引入包
```
配置package.json文件的dependencies依赖
vi package.json
{
  ...
  "dependencies": {
    ...
    "jskafka": "git+ssh://git@github.com:jellycheng/jskafka.git"
  }
  
}

```

## 生产者写法1
```
let Producer = require("./producer");
const myindex = require("./index");
let counter = new myindex.Counter();


let cfg = {
  topic: "jellytopic01",
  timeout: 50000,
  options: {
    "metadata.broker.list": "127.0.0.1:9092",
    "linger.ms": 5,
    dr_cb: false
  }
};
let producer = new Producer(cfg);

// 添加错误事件
producer.on("error", err => {
  console.log(err);
});

let ready = producer.init();
let isReady = false;
// 开始发消息
ready.then(()=>{
  isReady = true;
  console.log("开始发消息...");
  
  let msg = "消息内容 - " + counter.nextId() + " - " + Date.now();
  producer.push(msg).catch(err => {
    console.log(err);
  });


}).catch(err=> console.log(err) );


// setInterval(),setTimeout()
setInterval(function() {
    if(isReady) {
        let msg = "消息内容 - " + counter.nextId() + " - " + Date.now();
        producer.push(msg).catch(err => {
          console.log(err);
        });
    }
}, 2000);

```

## 消费者写法1
```
const Consumer = require('jskafka/Consumer');
const defer = require('jskafka/defer').defer;

let cfg = {
  topic: "jellytopic01",
  timeout: 30000,
  options: {
    "metadata.broker.list": "localhost:9092",
    "group.id": "goods_service.1",
    'enable.auto.commit': true
  },
  batchSize: 5
};

let consumer = new Consumer(cfg);

// 添加错误事件
consumer.on("error", err => console.log(err));

let ready = consumer.init();

// 开始消费
ready.then(async ()=>{
  console.log("开始消费...");
  let defered = defer();
  let runing = true;
  while (runing === true) {
    const data = await consumer.pop();
    // 打印消费内容
    console.log(data);
    const { length } = data;//数组长度
    console.log("length:", length);
    if (length === 0) {
      await defered.Delay(2000);
      continue;
    }
    // 处理数据
    data.forEach((message) => {
      tmpStr = message.value.toString();
      if(tmpStr!=""){
        const msg = JSON.parse(tmpStr);
        console.log("消息：", msg);
      } else {
        console.log("空消息：", tmpStr);
      }
      // 处理业务逻辑 todo

    });

    await defered.Delay(2000);
  }

}).catch(err=> console.log(err) );


```

## 消费者写法2
```
const Consumer = require('jskafka/Consumer');
const defer = require('jskafka/defer').defer;

let cfg = {
  topic: "jellytopic01",
  timeout: 30000,
  options: {
    "metadata.broker.list": "127.0.0.1:9092",
    "group.id": "goods_service.2",
    'enable.auto.commit': true
  },
  batchSize: 5
};

let consumer = new Consumer(cfg);

// 添加错误事件
consumer.on("error", err => console.log(err));

let ready = consumer.init();

// 开始消费
ready.then(()=>{
  console.log("开始消费...");
  consumer.consume(function(data){
    // 打印消费内容,每次消费一条
    console.log(data);
    let msg = data.value.toString();
    console.log("消费内容：",msg);
    
  });

}).catch(err=> console.log(err) );


```

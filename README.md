# co-agent
[![Build Status](https://travis-ci.org/asthesky/co-agent.svg?branch=master)](https://travis-ci.org/asthesky/co-agent)

in co warp deal with asynchronous concurrency

## Installation

```
$ npm install co-agent
```
## Usage

reference module:
```js
const CoAgent = require('co-agent');
```

parameters configure and generating instance:
```js
const coagent = new CoAgent({
    pool: 20,
    safe: true,
    timeout: 5000
});
```

use instance wrap generator function or other iterator object:
```js
// wrap can use genrator , genrator function and others can change to ierator
coagent.wrap(function* () {
    for (var i = 0; i < 100; i++) {
        // aysnc can use pormise and genrator
        yield aysnc();
    }
}).then(function(data){ 
    //data is an Array of length 100 
 });

coagent.on('resolved',function(data){
    var promise = data.promise;
     var result = data.result;
     //promise.label index
})
coagent.on('resolved',function(data){
    var promise = data.promise;
     var error = data.error;
     //promise.label index
})
```

coagent.wrap return a promise and each iterator next return is considered an item of an array;

## Options

`pool`: concurrency exec max length;

`safe`: false one async exec error return promise rejected, true just this return data is null;

`timeout`: every async exec timeout setting


## License

  MIT
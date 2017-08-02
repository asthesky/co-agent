var Inherits = require('util').inherits;
var EventEmitter = require('events').EventEmitter;

// var generatorToPromise = require('co');
// base
function CoAgent(options) {
    var self = this,
        config = self.config = {};
    // 
    config.pool = options.pool;
    config.safe = options.safe === false ? false : true;
    config.timeout = options.timeout || 5000;
    // 
    EventEmitter.call(this);
};
Inherits(CoAgent, EventEmitter);
// 
var Origin = CoAgent.prototype;
Origin.constructor = CoAgent;
// change to iterator
Origin.toIterator = function (param) {
    var type = typeof param;
    if (type === 'array') {
        return arrayToIterator(param);
    }
    if (type === 'object') {
        if (isGenerator) {
            return param;
        }
        if (isPromise) {
            return promiseToIterator(param);
        }
    }
    if (type === 'function') {
        return isGeneratorFunc(param) ? param() : functionToIterator(param);
    }
    return promiseToIterator(Promise.resolve(param));
}
// change to promise
Origin.toPromise = function (param) {
    if (isPromise(param)) {
        return param;
    }
    if (isGeneratorFunc(param)) {
        // return generatorToPromise(param);
        return console.log('please use co wrap this generator function');
    }
    if (isAsyncFunc(param)) {
        return param();
    }

    return new Promise(function (resolve, reject) {
        resolve(param);
    })
}
// execution method
Origin.wrap = function (params) {
    var self = this;

    // promise returned at last
    self._promise = {
        promise: null,
        done: null,
        resolve: null,
        reject: null
    }
    // variable of pool 
    self._poolsize = 0;
    // change params to iterator and use iterator next
    self._iterator = self.toIterator(params);
    // _iterator length as the _data index 
    self._iteratorLen = 0;
    // promise return data at last
    self._data = [];
    // 
    self._promise.promise = new Promise(function (resolve, reject) {
        self._promise.resolve = resolve;
        self._promise.reject = reject;
        // 
        self.indicator();
    });
    // pormise as final return
    return self._promise.promise;

};
// pormise pointer for contorl all process
Origin.indicator = function () {
    var self = this,
        config = self.config;
    if (!self._promise.done) {
        var nextIterator, nextPromise;
        while (self._poolsize < config.pool) {
            nextIterator = this._iterator.next();
            if (!nextIterator.done) {
                self._poolsize++;
                // 
                nextPromise = self.toPromise(nextIterator.value);
                nextPromise.label = self._iteratorLen;
                self.execPromise(nextPromise);
            } else {
                break;
            }
            self._iteratorLen++;
        }
        // iterator finished
        if (nextIterator && nextIterator.done) {
            self._promise.done = true;
        }
    } else {
        // iterator finished and promise finished
        if (self._poolsize === 0) {
            self.execSettled();
        }
    }
}
// exec settled
Origin.execSettled = function (error) {
    var self = this;
    if (error) {
        self._promise.reject(error)
    } else {
        self._promise.resolve(self._data);
    }
}
// exec promise
Origin.execPromise = function (promise) {
    var self = this;
    // 
    self.timeoutPromise(promise, self.config.timeout).then(function (result) {
        self.execResolved(promise, result);
    }, function (error) {
        self.execRejected(promise, error);
    });
};

// exec timeoutPromise
Origin.timeoutPromise = function (promise, ms) {
    var timeout = new Promise(function (resolve, reject) {
        setTimeout(function () {
           reject('promise timeout');
        }, ms);
    });
    return Promise.race([promise, timeout]);
}

// exec resolved
Origin.execResolved = function (promise, result) {
    var self = this;
    self._poolsize--;
    self.emit('resolved', {
        promise: promise,
        result: result
    });
    // 
    var label = promise.label;
    self._data[label] = result;
    // 
    self.indicator();
};
// exec rejected
Origin.execRejected = function (promise, error) {
    var self = this;
    self._poolsize--;
    self.emit('rejected', {
        promise: promise,
        error: error
    });
    if (self.config.safe) {
        var label = promise.label;
        self._data[label] = null;
        self.indicator();
    } else {
        self.execSettled(error);
    }
};

//
function isPromise(obj) {
    return 'function' == typeof obj.catch;
}

//
function isGenerator(obj) {
    return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

//
function isGeneratorFunc(obj) {
    var constructor = obj.constructor;
    if (!constructor) return false;
    if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
    return isGenerator(constructor.prototype);
}

//
function isAsyncFunc(obj) {
    var constructor = obj.constructor;
    if (!constructor) return false;
    if ('AsyncFunction' === constructor.name)
        return true;
    else
        return false;
}

//
function arrayToIterator(array) {
    var nextIndex = 0;
    return {
        next: function () {
            return nextIndex < array.length ?
                { value: array[nextIndex++] } :
                { done: true };
        }
    };
}
//
function functionToIterator(func) {
    return {
        next: function () {
            var promise = func()
            return promise ? { value: promise } : { done: true }
        }
    }
}
//
function promiseToIterator(promise) {
    var called = false
    return {
        next: function () {
            if (called) {
                return { done: true }
            }
            called = true
            return { value: promise }
        }
    }
}

module.exports = CoAgent;
var assert = require('assert');

var co = require('co');
const CoAgent = require('../index');

const coagent = new CoAgent({
    pool: 20,
    safe: true,
    timeout: 5000
});

const promiseFunc = function (data) {
    return new Promise(function (reslove) {
        setTimeout(function () {
            reslove(data)
        }, 200)
    })
}

const asyncFunc = async function(data){
    var data = await promiseFunc(data);
    return data;
}


describe('co-agent', function () {
    it('Promise return right', function () {
        // 

        // 
        return coagent.wrap(function* () {
            for (var i = 0; i < 100; i++) {
                // aysnc can use pormise and genrator
                yield promiseFunc(i);
            }
        }).then(function (data) {
            assert.equal(data.length, 100);
            console.log(data)
        });
    })

    it('aysnc return right', function () {
        // 
        return coagent.wrap(function* () {
            for (var i = 0; i < 100; i++) {
                // async can use pormise and genrator
                yield asyncFunc(i);
            }
        }).then(function (data) {
            assert.equal(data.length, 100);
            console.log(data)
        });
    })

})
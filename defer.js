
function Delay(ms){
  return new Promise(resolve=> setTimeout(resolve,ms) );
}

function defer() {
    const ret = {Delay:Delay};

    ret.promise = new Promise((resolve, reject) =>{
        ret.resolve = resolve;
        ret.reject = reject;
    });

    return ret;
}

module.exports.defer = defer;


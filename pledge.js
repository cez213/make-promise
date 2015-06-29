/*----------------------------------------------------------------
Promises Workshop: build the pledge.js deferral-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:
function $Promise(){
	this.state = 'pending';
	this.value = undefined;
	this.handlerGroups = [];
}

function Deferral(){
	this.$promise = new $Promise();
}

function defer(){
	return new Deferral();
}

Deferral.prototype.resolve = function(){
	if(this.$promise.state === 'pending'){
		this.$promise.value = arguments[0];
		this.$promise.state = 'resolved';
		this.$promise.callHandlers(this.$promise.value);
	} 
}

Deferral.prototype.reject = function(){
	if(this.$promise.state === 'pending'){
		this.$promise.value = arguments[0];
		this.$promise.state = 'rejected';
		this.$promise.callHandlers(this.$promise.value);
	}
}

$Promise.prototype.then = function(successHandler, errorHandler){
	if(typeof successHandler === 'function' || typeof errorHandler === 'function'){
		this.handlerGroups.push({'successCb': successHandler, 'errorCb': errorHandler, 'forwarder': new Deferral()});
	}else{
		this.handlerGroups.push({'successCb': undefined, 'errorCb': undefined, 'forwarder': new Deferral()});
	}
	if(this.state === 'resolved' && typeof successHandler === 'function'){
		this.handlerGroups[this.handlerGroups.length-1].successCb(this.value);
	}
	if(this.state === 'rejected' && typeof errorHandler === 'function'){
		this.handlerGroups[this.handlerGroups.length-1].errorCb(this.value);
	}
	return this.handlerGroups[0].forwarder.$promise;
}

$Promise.prototype.callHandlers = function(value){
	if(this.state === 'resolved'){
		var index = 0;
		var returnVal;
		var handlerGroup = this.handlerGroups;
		//var errorHandler = (this.state === 'resolved') ? successCb : errorCb;
		while(index < this.handlerGroups.length){
			if(handlerGroup[index].successCb !== undefined){
				try{
					returnVal = handlerGroup[index].successCb(value);

					if(returnVal instanceof $Promise){
						returnVal.then(function(val){
							handlerGroup[index].forwarder.resolve(val);
						})
					}else{
						handlerGroup[index].forwarder.resolve(returnVal);
					}

				}catch(e){
					handlerGroup[index].forwarder.reject(e);
				}
				handlerGroup.splice(index, 1);

			}else{
				handlerGroup[index].forwarder.resolve(value);
				index++;
			}
		}
	}else{
		index = 0;
		while(index < this.handlerGroups.length){
			if(this.handlerGroups[index].errorCb !== undefined){
				try {
					returnVal = this.handlerGroups[index].errorCb(value);
					this.handlerGroups[index].forwarder.resolve(returnVal);
					this.handlerGroups.splice(index, 1);
				}catch(e){
					this.handlerGroups[index].forwarder.reject(e);
					this.handlerGroups.splice(index, 1);
				}
			}else{
				this.handlerGroups[index].forwarder.reject(value);
				index++;
			}
		}

	}
}

$Promise.prototype.catch = function(errorCb){
	return this.then(null, errorCb);
}





/*-------------------------------------------------------
The spec was designed to work with Test'Em, so we don't
actually use module.exports. But here it is for reference:

module.exports = {
  defer: defer,
};

So in a Node-based project we could write things like this:

var pledge = require('pledge');
…
var myDeferral = pledge.defer();
var myPromise1 = myDeferral.$promise;
--------------------------------------------------------*/

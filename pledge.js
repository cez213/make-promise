/*----------------------------------------------------------------
Promises Workshop: build the pledge.js deferral-style promise library
----------------------------------------------------------------*/
// YOUR CODE HERE:

function isFn(maybeFunc){return typeof maybeFunc === 'function';}

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

Deferral.prototype.settle = function(state, value) {
	if(this.$promise.state === 'pending'){
		this.$promise.state = state;
		this.$promise.value = value;
		this.$promise.callHandlers();
	}
};

Deferral.prototype.resolve = function(data){
	this.settle('resolved', data);
/*	if(this.$promise.state === 'pending'){
		this.$promise.state = 'resolved';
		this.$promise.value = data;
		this.$promise.callHandlers(this.$promise.value);
	} */
}

Deferral.prototype.reject = function(reason){
	this.settle('rejected', reason);
/*	if(this.$promise.state === 'pending'){
		this.$promise.state = 'rejected';
		this.$promise.value = reason;
		this.$promise.callHandlers(this.$promise.value);
	}*/
}

//REVIEW
$Promise.prototype.then = function(successCb, errorCb){
	var handlerGroup = {
		successCb: isFn(successCb) ? successCb : null, 
		errorCb: isFn(errorCb) ? errorCb : null,
		forwarder: new Deferral()
	};
	this.handlerGroups.push(handlerGroup);
	this.callHandlers();
	return handlerGroup.forwarder.$promise;
}

//REVIEW
$Promise.prototype.callHandlers = function() {
	if(this.state === 'pending') return;
	var group, handler;
	while(this.handlerGroups.length){
		group = this.handlerGroups.shift();
		handler = (this.state === 'resolved') ? group.successCb : group.errorCb;
		if(!handler){ //if I don't have the right function, bubble to pB
			var method = (this.state === 'resolved') ? 'resolve' : 'reject';
			group.forwarder[method](this.value);
			/*if(this.state === 'resolved') group.forwarder.resolve(this.value);
			else group.forwarder.reject(this.value);*/
		}else{
			try{
				var output = handler(this.value);
				if(output instanceof $Promise){
					// output is a promise (promiseZ)
					// this is a promise (promiseA)
					// group.forwarder.$promise (promiseB)
					// we know promiseB has resolved when it runs with a success function
/*					output.then(function(val){
						group.forwarder.resolve(val);
					}, function(err){
						group.forwarder.reject(err);
					})*/
					group.forwarder.assimilate(output)

				}else group.forwarder.resolve(output);	
			}catch(err){
				group.forwarder.reject(err);
			}
		} 
	}
};

$Promise.prototype.catch = function(errorCb){
	return this.then(null, errorCb);
}

//REVIEW
Deferral.prototype.assimilate = function(returnedPromise) {
	var forwarder = this;
	// make the output promise (controlled by forwarder) mimic the return promise
	returnedPromise.then(
		// function(val) {forwarder.resolve(val)}, //works the same as the bind method
		forwarder.resolve.bind(forwarder),
		forwarder.reject.bind(forwarder)
		);
};


//REVIEW - callHandlers func
	//var self = this; //only need this if you don't use bind
	// note: forEach changes 'this' to the window
/*	this.handlerGroups.forEach(function(handlerGroup){
		handlerGroup.successCb(this.value);
	}.bind(this));*/

//BEFORE REVIEW
/*$Promise.prototype.then = function(successHandler, errorHandler){
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
}*/

/*$Promise.prototype.callHandlers = function(value){
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
}*/





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

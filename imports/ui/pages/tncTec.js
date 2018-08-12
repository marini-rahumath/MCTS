import './tncTec.html';

import { Template } from 'meteor/templating';

Template.tncTec.onCreated(function () {
	this.state = new ReactiveDict();
	Meteor.subscribe('tnclog');
});

Template.tncTec.onRendered(function () {
	$('.tooltip-demo').tooltip({
        selector: "[data-toggle=tooltip]"
    })
});

Template.tncTec.events({
	'click .turnOnTec'(event, instance){
		const commandToSend = 'obc test tec_on';
		console.log('turnOnTec')
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .turnOffTec'(event, instance){
		const commandToSend = 'obc test tec_off';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .turnOnTecDuration'(event, instance){
		const commandToSend = 'obc test tec_on_for';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .startCSP'(event, instance){
		Meteor.call('startCSP', function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .sendCommand'(event, instance){
        const commandToSend = instance.find('.commandText').value;
        if(commandToSend.trim() == 'clear'){
        	Meteor.call('removeAllTnc', commandToSend, function (err, response) {
	        	if(err){
	        		console.log("err is "+err)
	        	}
	        	console.log(response);
	        });
        }else if(commandToSend.trim() == 'start'){
        	Meteor.call('startCSP', commandToSend, function (err, response) {
	        	if(err){
	        		console.log("err is "+err)
	        	}
	        	console.log(response);
	        });
        }else if(commandToSend.trim() == 'stop'){
        	Meteor.call('killCSP', commandToSend, function (err, response) {
	        	if(err){
	        		console.log("err is "+err)
	        	}
	        	console.log(response);
	        });
        }else{

	        Meteor.call('sendCommand', commandToSend, function (err, response) {
	        	if(err){
	        		console.log("err is "+err)
	        	}
	        	console.log(response);
	        });	
      	}
	},
	'click .killCSP'(event, instance){
		console.log('kill')
		Meteor.call('killCSP', function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},					
	'keypress .commandGo': function (evt, template){

        // console.log(evt);
        if(evt.which === 13){
	        const commandToSend = evt.currentTarget.value;
	        if(commandToSend.trim() == 'clear'){
	        	Meteor.call('removeAllTnc', commandToSend, function (err, response) {
		        	if(err){
		        		console.log("err is "+err)
		        	}
		        	console.log(response);
		        });
	        }else if(commandToSend.trim() == 'start'){
	        	Meteor.call('startCSP', commandToSend, function (err, response) {
		        	if(err){
		        		console.log("err is "+err)
		        	}
		        	console.log(response);
		        });
	        }else if(commandToSend.trim() == 'stop'){
	        	Meteor.call('killCSP', commandToSend, function (err, response) {
		        	if(err){
		        		console.log("err is "+err)
		        	}
		        	console.log(response);
		        });
	        }else{

		        Meteor.call('sendCommand', commandToSend, function (err, response) {
		        	if(err){
		        		console.log("err is "+err)
		        	}
		        	console.log(response);
		        });	
		    }
        // alert("Enter!");
      	}
    }
});

Template.tncTec.helpers({
	tncData(){
		var data = TncLog.find({}).fetch();
		
		console.log(data);
		if(data.length==0){
			return null;
		}
		return data[0].log;
	}
});

Template.tncTec.onDestroyed(function () {

});
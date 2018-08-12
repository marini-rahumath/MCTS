import './tncSpeqs.html';

import { Template } from 'meteor/templating';

Template.tncSpeqs.onCreated(function () {
	this.state = new ReactiveDict();
	Meteor.subscribe('tnclog');
});

Template.tncSpeqs.onRendered(function () {
	$('.tooltip-demo').tooltip({
        selector: "[data-toggle=tooltip]"
    })
});

Template.tncSpeqs.events({
	'click .turnOnSPEQS'(event, instance){
		const commandToSend = 'obc test speqs_on';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .turnOffSPEQS'(event, instance){
		const commandToSend = 'obc test speqs_off';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .initSPEQS'(event, instance){
		const commandToSend = 'obc test speqs_comm_init';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .downloadSPEQSExp'(event, instance){
		const commandToSend = 'obc test speqs_download_exp';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .setSPEQSProf'(event, instance){
		const commandToSend = 'obc test speqs_set_profile';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .saveSPEQSExp'(event, instance){
		const commandToSend = 'obc test speqs_save_data';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .enManualCtrSPEQSExp'(event, instance){
		const commandToSend = 'obc test speqs_manual_ctr '+ instance.find('.enableText').value;;
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

Template.tncSpeqs.helpers({
	tncData(){
		var data = TncLog.find({}).fetch();
		
		console.log(data);
		if(data.length==0){
			return null;
		}
		return data[0].log;
	}
});

Template.tncSpeqs.onDestroyed(function () {

});

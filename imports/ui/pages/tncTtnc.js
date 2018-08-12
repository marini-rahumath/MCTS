import './tncTtnc.html';

import { Template } from 'meteor/templating';

Template.tncTtnc.onCreated(function () {
	this.state = new ReactiveDict();
	Meteor.subscribe('tnclog');
});

Template.tncTtnc.onRendered(function () {
	$('.tooltip-demo').tooltip({
        selector: "[data-toggle=tooltip]"
    })
});

Template.tncTtnc.events({
	'click .deployGsAnt'(event, instance){
		const commandToSend = 'obc test gs_ant_deploy'+ instance.find('.burnTime').value;;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .saveGsAnt'(event, instance){
		const commandToSend = 'obc test gs_ant_save';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .deployIsisAnt'(event, instance){
		const commandToSend = 'obc test isis_ant_deploy'+ instance.find('.processorAddrText').value+ instance.find('.antNoText').value+ instance.find('.depBurnTimeText').value+ instance.find('.overrideText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .getIsisAntStat'(event, instance){
		const commandToSend = 'obc test isis_ant_status';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .dlAntStatFile'(event, instance){
		const commandToSend = 'obc test ant_stat_download';
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

Template.tncTtnc.helpers({
	tncData(){
		var data = TncLog.find({}).fetch();
		
		console.log(data);
		if(data.length==0){
			return null;
		}
		return data[0].log;
	}
});

Template.tncTtnc.onDestroyed(function () {

});
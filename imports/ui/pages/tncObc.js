import './tncObc.html';

import { Template } from 'meteor/templating';

Template.tncObc.onCreated(function () {
	this.state = new ReactiveDict();
	Meteor.subscribe('tnclog');
});

Template.tncObc.onRendered(function () {
	$('.tooltip-demo').tooltip({
        selector: "[data-toggle=tooltip]"
    })
});

Template.tncObc.events({
	'click .getGlobalVar'(event, instance){
		const commandToSend = 'obc test get_var '+ instance.find('.getGlobalVarnameText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .getAllGlobalVar'(event, instance){
		const commandToSend = 'obc test get_var_all '+ instance.find('.getAllGlobalVarnameText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .setGlobalVar'(event, instance){
		const commandToSend = 'obc test set_var '+ instance.find('.setGlobalVarnameText').value+ instance.find('.setGlobalValText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .getFlashVar'(event, instance){
		const commandToSend = 'obc test get_flash_var '+ instance.find('.getFlashVarnameText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .getAllFlashVar'(event, instance){
		const commandToSend = 'obc test get_flash_var_all';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .setFlashVar'(event, instance){
		const commandToSend = 'obc test set_flash_var '+ instance.find('.setFlashVarnameText').value+ instance.find('.setFlashVarValueText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .suspendTask'(event, instance){
		const commandToSend = 'obc test suspend_task '+ instance.find('.suspendTasknameText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .resumeTask'(event, instance){
		const commandToSend = 'obc test resume_task '+ instance.find('.resumeTasknameText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .getEventGrpFlg'(event, instance){
		const commandToSend = 'obc test get_event_grouup';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .setEventBits'(event, instance){
		const commandToSend = 'obc test set_event '+ instance.find('.setEventBitsText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .clrEventBits'(event, instance){
		const commandToSend = 'obc test set_event '+ instance.find('.clrEventBitsText').value;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .changeMode'(event, instance){
		const commandToSend = 'obc test mode_change '+ instance.find('.changeModeText').value;;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .liveHseKeeping'(event, instance){
		const commandToSend = 'obc test get_hk_live';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .performBeacon'(event, instance){
		const commandToSend = 'obc test beacon';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .endContact'(event, instance){
		const commandToSend = 'obc test end_contact';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .dlErrorLog'(event, instance){
		const commandToSend = 'obc test error_log_download';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .chngTimeoutNpwr'(event, instance){
		const commandToSend = 'obc test timeout_set_eps '+ instance.find('.chngTimeoutNpwrText').value;;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	//TODO: TimeSync is not a button
	'click .timeSync'(event, instance){
		const commandToSend = 'obc test speqs_manual_ctr ';
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .delHsekeepingFiles'(event, instance){
		const commandToSend = 'obc test delete_hk '+ instance.find('.delHsekeepingFilesStText').value+ instance.find('.delHsekeepingFilesEndText').value;;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .dlHsekeepingFiles'(event, instance){
		const commandToSend = 'obc test download_hk '+ instance.find('.dlHsekeepingFilesStText').value+ instance.find('.dlHsekeepingFilesEndText').value;;
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .disableNanohHub'(event, instance){
		const commandToSend = 'obc test disable_hub_wdt ';
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

Template.tncObc.helpers({
	tncData(){
		var data = TncLog.find({}).fetch();
		
		console.log(data);
		if(data.length==0){
			return null;
		}
		return data[0].log;
	}
});

Template.tncObc.onDestroyed(function () {

});
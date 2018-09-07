//TNC Main

import './tncTest2.html';

import { Template } from 'meteor/templating';

// CSP & Rotor
var toggleCSP = false;
var toggleRotor = false;

var tncLogLen = 0;

// Chat box
var scrollMethodInterval;
var prevcurrscrollposition = 0;
var prevtotaldivheight = 600;
var toScroll = false;
var taskingInfo = [];

Template.tncTest2.onCreated(function () {
	this.state = new ReactiveDict();
	Meteor.subscribe('tnclog');
	Meteor.subscribe('currenttaskinformation')
});

Template.tncTest2.onRendered(function () {
	$('[data-toggle="tooltip"]').on('click', function () {
	    $(this).tooltip('hide')
	})
	$('.tooltip-demo').tooltip({
		selector: "[data-toggle=tooltip]"
	});	
	$(document).ready(function() {
		$('#sub').on('show.bs.collapse', function() {
			$('#sub .collapse').collapse('hide')
		})
	});
	$( "button#StartRotorButton" ).click(function() {
		$(this).toggleClass( "toggleRotorButtonColour" );
		if(toggleRotor){
			$(this).text("Engage Rotor");
		}else{
			$(this).text("Disengage Rotor");
		}
		toggleRotor=!toggleRotor;
	});
	$( "button#StartCSPButton" ).click(function() {
		$(this).toggleClass( "toggleStartButtonColour" );
		if(toggleCSP){
			$(this).text("Start-CSP");
		}else{
			$(this).text("Stop-CSP");
		}
		toggleCSP=!toggleCSP;
	});
	$(document).ready(function() {
		Meteor.setTimeout(function(){
			$('#terminallog').animate({ scrollTop: $('#terminallog').prop('scrollHeight')}, 0);	
		}, 800);
		Meteor.setTimeout(function(){
			prevtotaldivheight = document.getElementById("terminallog").scrollHeight;
			prevcurrscrollposition = document.getElementById("terminallog").scrollTop;
		}, 1000);
	});
	$(document).ready(()=>{
		var textField = document.getElementById('terminalTextField');
		textField.focus();
	})
});

Template.tncTest2.events({
	// Start CSP-term Button
	'click .switchCSP'(event, instance){
		if(toggleCSP){
			console.log("Starting CSP-term");
			Meteor.call('startCSP', function (err, response) {
				if(err){
					console.log("err is "+err)
				}
				else {
                    console.log(response);
                   if (response = "undefined"){
                       toggleCSP=!toggleCSP;
                       Meteor.call('killCSP', function (err, response){
                           alert("Error with connection");
                       });
                   }

                }
			});
		}else{
			console.log('Stopping CSP-term');
			Meteor.call('killCSP', function (err, response) {
				if(err){
					console.log("err is "+err)
				}
				console.log(response);
			});
		}
	},

	// Engage Rotor Button
	'click .switchRotor'(event, instance){
		if(toggleRotor){
			console.log("Starting Rotor");
			// TODO: Add functionality
		}else{
			console.log('Stopping Rotor');
			// TODO: Add functionality
		}
	},

	// Chat Box
	'click .tolatestmsg'(event, instance){
		$('#terminallog').animate({ scrollTop: $('#terminallog').prop('scrollHeight')}, 1000);
		Meteor.setTimeout(function(){
			prevtotaldivheight = document.getElementById("terminallog").scrollHeight;
			prevcurrscrollposition = document.getElementById("terminallog").scrollTop;
		}, 1100);		
	},
	'click .sendCommand'(event, instance){
        const commandToSend = instance.find('.commandText').value;
        sendTimeout = 1000;
        sendStartTime = new Date();
        tncLogLen =  TncLog.find({}).fetch().length;
        if(commandToSend.trim() == 'clear'){
        	Meteor.call('removeAllTnc', commandToSend, function (err, response) {
	        	if(err){
	        		console.log("err is "+err)
	        	}
	        	console.log(response);
	        	// reset chat scroll params
	        	Meteor.setTimeout(function(){
	        		prevcurrscrollposition = 0;
	        		prevtotaldivheight = 600;	
	        	},50);
	        });
        }else if(commandToSend.trim() == 'start'){
        	Meteor.call('startCSP', commandToSend, function (err, response) {
	        	if(err){
	        		console.log("err is "+err)
	        	}
	        	console.log(response);
	        });
        }else if(commandToSend.trim() == 'exit'){
        	Meteor.call('killCSP', commandToSend, function (err, response) {
	        	if(err){
	        		console.log("err is "+err)
	        	}
	        	console.log(response);
	        });
        }else if(commandToSend.trim() != ""){
	        sendCommand(commandToSend);
      	}	

		chatscroll();      	
      	instance.find('.commandText').value = "";
	},
	'keypress .commandGo': function (evt, template){
		//User pressing "Enter"
        if(evt.which === 13){
	        const commandToSend = evt.currentTarget.value;
	        if(commandToSend.trim() == 'clear'){
	        	Meteor.call('removeAllTnc', commandToSend, function (err, response) {
		        	if(err){
		        		console.log("err is "+err)
		        	}
		        	console.log(response);
		        	// reset chat scroll params
		        	Meteor.setTimeout(function(){
		        		prevcurrscrollposition = 0;
		        		prevtotaldivheight = 600;	
		        	},50);
		        });
	        }else if(commandToSend.trim() == 'start'){
	        	Meteor.call('startCSP', commandToSend, function (err, response) {
		        	if(err){
		        		console.log("err is "+err);
		        	}
		        	console.log(response);
		        });
	        }else if(commandToSend.trim() == 'exit'){
	        	Meteor.call('killCSP', commandToSend, function (err, response) {
		        	if(err){
		        		console.log("err is "+err);
		        	}
		        	console.log(response);
		        });
	        }else if(commandToSend.trim() != ""){
    	    	sendCommand(commandToSend);
          	}
        	chatscroll();
        	evt.currentTarget.value = "";
      	}
    },

	// TEC Commands
	'click .turnOnTec'(event, instance){
		const commandToSend = 'obc test tec_on';
		console.log('turnOnTec');
		sendCommand(commandToSend);
	},
	'click .turnOffTec'(event, instance){
		const commandToSend = 'obc test tec_off';
		sendCommand(commandToSend);
	},
	'click .turnOnTecDuration'(event, instance){
		const commandToSend = 'obc test tec_on_for';
		sendCommand(commandToSend);
	},

	// SPEQS Commands
	'click .turnOnSPEQS'(event, instance){
		const commandToSend = 'obc test speqs_on';
		sendCommand(commandToSend);
	},
	'click .turnOffSPEQS'(event, instance){
		const commandToSend = 'obc test speqs_off';
		sendCommand(commandToSend);
	},
	'click .initSPEQS'(event, instance){
		const commandToSend = 'obc test speqs_comm_init';
		sendCommand(commandToSend);
	},
	'click .downloadSPEQSExp'(event, instance){
		const commandToSend = 'obc test speqs_download_exp';
		sendCommand(commandToSend);
	},
	'click .setSPEQSProf'(event, instance){
		const commandToSend = 'obc test speqs_set_profile';
		sendCommand(commandToSend);
	},
	'click .saveSPEQSExp'(event, instance){
		const commandToSend = 'obc test speqs_save_data';
		sendCommand(commandToSend);
	},
	'click .enManualCtrSPEQSExp'(event, instance){
		const commandToSend = 'obc test speqs_manual_ctr '+ instance.find('.enableText').value;;
		sendCommand(commandToSend);
	},

	// TT&C Commands
	'click .deployGsAnt'(event, instance){
		const commandToSend = 'obc test gs_ant_deploy'+ instance.find('.burnTime').value;;
		sendCommand(commandToSend);
	},
	'click .saveGsAnt'(event, instance){
		const commandToSend = 'obc test gs_ant_save';
		sendCommand(commandToSend);
	},
	'click .deployIsisAnt'(event, instance){
		const commandToSend = 'obc test isis_ant_deploy'+ instance.find('.processorAddrText').value+ instance.find('.antNoText').value+ instance.find('.depBurnTimeText').value+ instance.find('.overrideText').value;
		sendCommand(commandToSend);
	},
	'click .getIsisAntStat'(event, instance){
		const commandToSend = 'obc test isis_ant_status';
		sendCommand(commandToSend);
	},
	'click .dlAntStatFile'(event, instance){
		const commandToSend = 'obc test ant_stat_download';
		sendCommand(commandToSend);
	},

	// ADCS Commands
	'click .turnOnADCS'(event, instance){
		const commandToSend = 'obc test adcs_on';
		sendCommand(commandToSend);
	},
	'click .turnOffADCS'(event, instance){
		const commandToSend = 'obc test adcs_off';
		sendCommand(commandToSend);
	},

	// OBC Commands
	'click .getGlobalVar'(event, instance){
		const commandToSend = 'obc test get_var '+ instance.find('.getGlobalVarnameText').value;
		sendCommand(commandToSend);
	},
	'click .getAllGlobalVar'(event, instance){
		const commandToSend = 'obc test get_var_all ';
		sendCommand(commandToSend);
	},
	'click .setGlobalVar'(event, instance){
		const commandToSend = 'obc test set_var '+ instance.find('.setGlobalVarnameText').value+ instance.find('.setGlobalValText').value;
		sendCommand(commandToSend);
	},
	'click .getFlashVar'(event, instance){
		const commandToSend = 'obc test get_flash_var '+ instance.find('.getFlashVarnameText').value;
		sendCommand(commandToSend);
	},
	'click .getAllFlashVar'(event, instance){
		const commandToSend = 'obc test get_flash_var_all';
		sendCommand(commandToSend);
	},
	'click .setFlashVar'(event, instance){
		const commandToSend = 'obc test set_flash_var '+ instance.find('.setFlashVarnameText').value+ instance.find('.setFlashVarValueText').value;
		sendCommand(commandToSend);
	},
	'click .suspendTask'(event, instance){
		const commandToSend = 'obc test suspend_task '+ instance.find('.suspendTasknameText').value;
		sendCommand(commandToSend);
	},
	'click .resumeTask'(event, instance){
		const commandToSend = 'obc test resume_task '+ instance.find('.resumeTasknameText').value;
		sendCommand(commandToSend);
	},
	'click .getEventGrpFlg'(event, instance){
		const commandToSend = 'obc test get_event_grouup';
		sendCommand(commandToSend);
	},
	'click .setEventBits'(event, instance){
		const commandToSend = 'obc test set_event '+ instance.find('.setEventBitsText').value;
		sendCommand(commandToSend);
	},
	'click .clrEventBits'(event, instance){
		const commandToSend = 'obc test set_event '+ instance.find('.clrEventBitsText').value;
		sendCommand(commandToSend);
	},
	'click .changeMode'(event, instance){
		const commandToSend = 'obc test mode_change '+ instance.find('.changeModeText').value;;
		sendCommand(commandToSend);
	},
	'click .liveHseKeeping'(event, instance){
		const commandToSend = 'obc test get_hk_live';
		sendCommand(commandToSend);
	},
	'click .performBeacon'(event, instance){
		const commandToSend = 'obc test beacon';
		sendCommand(commandToSend);
	},
	'click .endContact'(event, instance){
		const commandToSend = 'obc test end_contact';
		sendCommand(commandToSend);
	},
	'click .dlErrorLog'(event, instance){
		const commandToSend = 'obc test error_log_download';
		sendCommand(commandToSend);
	},
	'click .chngTimeoutNpwr'(event, instance){
		const commandToSend = 'obc test timeout_set_eps '+ instance.find('.chngTimeoutNpwrText').value;;
		sendCommand(commandToSend);
	},
	'click .timeSync'(event, instance){
		//TODO: TimeSync command is UNKNOWN
		const commandToSend = ' ';
		sendCommand(commandToSend);
	},
	'click .delHsekeepingFiles'(event, instance){
		const commandToSend = 'obc test delete_hk '+ instance.find('.delHsekeepingFilesStText').value+ instance.find('.delHsekeepingFilesEndText').value;;
		sendCommand(commandToSend);
	},
	'click .dlHsekeepingFiles'(event, instance){
		const commandToSend = 'obc test download_hk '+ instance.find('.dlHsekeepingFilesStText').value+ instance.find('.dlHsekeepingFilesEndText').value;;
		sendCommand(commandToSend);
	},
	'click .disableNanohHub'(event, instance){
		const commandToSend = 'obc test disable_hub_wdt ';
		sendCommand(commandToSend);
	},

    // ZX Commands
    'click .getPing'(event, instance){
        const commandToSend = 'ping '+ instance.find('.getPingValue').value;
        sendCommand(commandToSend);
    },
    'click .getRemotePs'(event, instance){
        const commandToSend = 'rps '+ instance.find('.getRemotePsValue').value;
        sendCommand(commandToSend);
    },
    'click .setMemFree'(event, instance){
        const commandToSend = 'memfree '+ instance.find('.setMemFreeValue').value;
        sendCommand(commandToSend);
    },
    'click .setBuffFree'(event, instance){
        const commandToSend = 'buffree '+ instance.find('.setBuffFreeValue').value;
        sendCommand(commandToSend);
    },
	'click .setReboot'(event, instance){
        const commandToSend = 'reboot '+ instance.find('.setRebootValue').value;
        sendCommand(commandToSend);
    },
	'click .setShutdown'(event, instance){
        const commandToSend = 'reboot '+ instance.find('.setShutdownValue').value;
        sendCommand(commandToSend);
    },
    'click .getUptime'(event, instance){
        const commandToSend = 'uptime';
        sendCommand(commandToSend);
    },
	'click .cmpNodeId'(event, instance){
        const commandToSend = 'cmp ident';
        sendCommand(commandToSend);
    },
    'click .cmpUpdateTbl'(event, instance){
        const commandToSend = 'cmp route_set '+ instance.find('.getUpdateTblNode').value + ' ' + instance.find('.getUpdateTblAddress').value;
        sendCommand(commandToSend);
    },
	'click .cmpRemoteIfc'(event, instance){
        const commandToSend = 'cmp ifc '+ instance.find('.getRemoteIfcNode').value + ' ' + instance.find('.getRemoteIfcInterface').value;
        sendCommand(commandToSend);
    },
	'click .cmpRemoteMem'(event, instance){
        const commandToSend = 'cmp peek '+ instance.find('.getRemoteMemNode').value + ' ' + instance.find('.getRemoteMemAddress').value + ' ' + instance.find('.getRemoteMemLen').value;
        sendCommand(commandToSend);
    },
	'click .cmpModRemoteMem'(event, instance){
        const commandToSend = 'cmp peek '+ instance.find('.getModRemoteMemNode').value + ' ' + instance.find('.getModRemoteMemAddress').value + ' ' + instance.find('.getModRemoteMemLen').value;
        sendCommand(commandToSend);
    },
    'click .cmpClock'(event, instance){
        const commandToSend = 'cmp clock '+ instance.find('.getClockNode').value + ' ' + instance.find('.getClockTime').value;
        sendCommand(commandToSend);
    },
    'click .showRoute'(event, instance){
        const commandToSend = 'route';
        sendCommand(commandToSend);
    },
    'click .showIfc'(event, instance){
        const commandToSend = 'ifc';
        sendCommand(commandToSend);
    },
    'click .showConn'(event, instance){
        const commandToSend = 'conn';
        sendCommand(commandToSend);
    },
    'click .showHelp'(event, instance){
        const commandToSend = 'help';
        sendCommand(commandToSend);
    },
    'click .setSleep'(event, instance){
	const commandToSend = 'sleep '+ instance.find('.setSleepValue').value;
	sendCommand(commandToSend);
	},
    'click .cmdIntervals'(event, instance){
        const commandToSend = 'watch '+ instance.find('.getDelay').value + ' ' + instance.find('.getCommand').value;
        sendCommand(commandToSend);
    },
    'click .pklParam'(event, instance){
        const commandToSend = 'a3200 sendPKLparam';
        sendCommand(commandToSend);
    },
    'click .debug'(event, instance){
        const commandToSend = 'debug '+ instance.find('.getGroup').value + ' ' + instance.find('.getError').value;
        sendCommand(commandToSend);
    },

	// REBECCA TEST
	'click .imgTask'(event, instance){
        console.log(JSON.stringify(taskingInfo));
    	var commandToSend = '';
    	commandToSend += 'a3200 setPKLimaging ';
        console.log(taskingInfo[0].passInformation.imageTime);
    	commandToSend += taskingInfo[0].passInformation.imageTime + ' ';

        commandToSend += taskingInfo[0].passInformation.timeInterval + ' ';
        commandToSend += taskingInfo[0].passInformation.numPhotos + ' ';
        commandToSend += taskingInfo[0].exposureTime + ' ';
        commandToSend += taskingInfo[0].imageGain + ' ';
        commandToSend += taskingInfo[0].pixelFormat;

        // commandToSend += 'Capture Time: ' + taskingInfo[0].imageTime + '\n';
        // commandToSend += 'Interval: ' + taskingInfo[0].timeInterval + '\n';
        // commandToSend += 'Number of pictures: ' + taskingInfo[0].numPhotos + '\n';
        // commandToSend += 'Exposure Time: ' + taskingInfo[0].exposureTime + '\n';
        // commandToSend += 'Image Gain: ' + taskingInfo[0].imageGain + '\n';
        // commandToSend += 'Pixel Format: ' + taskingInfo[0].pixelGain + '\n';
        sendCommand(commandToSend);
	},

    'click .downlinkTask'(event, instance){
        console.log(JSON.stringify(taskingInfo));
        var commandToSend = '';
        commandToSend += 'a3200 setPKLdownlink ';
        commandToSend += taskingInfo[0].downlinkTime + ' ';
        commandToSend += taskingInfo[0].preambleAmount + ' ';
        commandToSend += taskingInfo[0].postambleAmount + ' ';
        commandToSend += taskingInfo[0].frequency + ' ';
        commandToSend += taskingInfo[0].sps + ' ';
        commandToSend += taskingInfo[0].modulation + ' ';
        commandToSend += taskingInfo[0].txGain + ' ';
        commandToSend += taskingInfo[0].arbdl;

        sendCommand(commandToSend);
    }

});

Template.tncTest2.helpers({
	tncData(){
		var data = TncLog.find({}).fetch();
		var dataLog = []
		// console.log(data);
		if(data.length==0){
			return null;
		}else{
			for(i=0;i<data[0].log.length;i++){
				dataLog.push({content:decodeURIComponent(data[0].log[i].content),time:new Date(data[0].log[i].time),isUser:data[0].log[i].isUser})
			}
		}
		// Quick fix to adapt to response by CSP-term
		Meteor.setTimeout(function(){
			chatscroll()
		}, 50);
		enableSendCSP(data);
		return dataLog;
	},

	// REBECCA TEST
	getTaskInformation(){
        var uid = Meteor.userId();
        var data = CurrentTaskInformation.find({idUser: uid}).fetch();
        taskingInfo = data;
        console.log("helper " + data);
        return taskingInfo;
	},


	
});
//Send command to csp-term
function sendCommand(commandToSend){
	console.log('disable')

	var tempTncLog =  TncLog.find({}).fetch();
    console.log("temptncLog: "+tempTncLog)

    //check if tncLog has any logs
    if(tempTncLog.length>0 &&tempTncLog[0].log != null &&tempTncLog[0].log.length>0){
        tncLogLen = tempTncLog[0].log.length+2; //one log for user and one from csp
       	console.log('update tncLogLen: '+tncLogLen);
       	console.log('tnclog update called')
        Meteor.call('updateTnc', commandToSend, true, function (err, response) {
            if(err){
                console.log("err is "+err)
            }
            console.log(response);
        });
    }else{
        tncLogLen = 2
        console.log('insert tncLogLen: '+tncLogLen);
        console.log('tnclog insert called')
        Meteor.call('insertTnc', commandToSend, true, function (err, response) {
            if(err){
                console.log("err is "+err)
            }
            console.log(response);
        });
    }   
    console.log('disable terminalTextField')
    document.getElementById('terminalTextField').disabled = true;
    $(".cspBtn").prop("disabled", true);
    $("#terminalTextField").attr('placeholder','Waiting for response')
    Meteor.setTimeout(function(){
        var terminalField = document.getElementById('terminalTextField');
        terminalField.disabled = false;
        terminalField.focus();
        $("#terminalTextField").attr('placeholder','Type your command here...')
        $(".cspBtn").prop("disabled", false);
    }, 5000);
    
    Meteor.call('sendCommandToCSP', commandToSend, function (err, response) {
    	if(err){
    		console.log("err is "+err)
    	}
    	console.log(response);
    });	
}

Template.tncTest.onDestroyed(function () {
	// TODO: Include Destruction of Rotor Interval

});
//Enable the UI elements to allow user to send commands to csp
function enableSendCSP(data){
	console.log('tncLogLen: '+tncLogLen)
	console.log('data[0].length: '+data[0].log.length);
	if(tncLogLen>data[0].log.length+2){
		 var terminalField = document.getElementById('terminalTextField');
        terminalField.disabled = false;
        terminalField.focus();
        $("#terminalTextField").attr('placeholder','Type your command here...')
		 $(".cspBtn").prop("disabled", false);
		console.log('enable send csp')
	}
	
}

function chatscroll(){
	var totaldivheight = document.getElementById("terminallog").scrollHeight;
	var currscrollposition = document.getElementById("terminallog").scrollTop;
	var newmessageheight;
	if(currscrollposition < prevcurrscrollposition){
		toScroll = false;
	}else{
		newmessageheight = totaldivheight - prevtotaldivheight;
		if(currscrollposition - prevcurrscrollposition <= newmessageheight){
			toScroll = true;
		}
		prevcurrscrollposition = currscrollposition;
		prevtotaldivheight = totaldivheight;
	}
	if(toScroll){
		$('#terminallog').animate({ scrollTop: $('#terminallog').prop('scrollHeight')}, 1000);
	}
}
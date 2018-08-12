import './tncTest.html';

import { Template } from 'meteor/templating';
import PLib from '../../api/prediction/predictlib.js';

var toggleEngage = false;
var rotorCtrlInterval;

var scrollMethodInterval;
var prevcurrscrollposition = 0;
var prevtotaldivheight = 600;
var toScroll = false;

Template.tncTest.onCreated(function () {
	this.state = new ReactiveDict();
	Session.set('tle_loaded',false);
	Session.set('activesetting_loaded',false);
	Meteor.subscribe('tnclog');
	Meteor.subscribe('activesetting',function(){
		Session.set('activesetting_loaded',true);
	});
	Meteor.subscribe('location');
	Meteor.subscribe('satgroup');
	Meteor.subscribe('tle', function(){
        Session.set('tle_loaded',true);
    })

	Meteor.subscribe('rotorSetting');
});

Template.tncTest.onRendered(function () {
	$(document).ready(function() {
		Meteor.setTimeout(function(){
			$('#selfchatlog').animate({ scrollTop: $('#selfchatlog').prop('scrollHeight')}, 0);	
		}, 800);
		Meteor.setTimeout(function(){
			prevtotaldivheight = document.getElementById("selfchatlog").scrollHeight;
			prevcurrscrollposition = document.getElementById("selfchatlog").scrollTop;
		}, 1000);
		
		// var scrollMethod = function(){
		// 	var totaldivheight = document.getElementById("selfchatlog").scrollHeight;
		// 	var currscrollposition = document.getElementById("selfchatlog").scrollTop;
		// 	// console.log("TDH:"+totaldivheight);
		// 	// console.log("CSP:"+currscrollposition);
		// 	if(prevtotaldivheight - prevcurrscrollposition >= 0){
		// 		$('#selfchatlog').animate({ scrollTop: $('#selfchatlog').prop('scrollHeight')}, 1000);
		// 	}
		// 	prevcurrscrollposition = currscrollposition;
		// 	prevtotaldivheight = totaldivheight;
		// }
		// scrollMethodInterval = Meteor.setInterval(scrollMethod, 1000);
	});
});

Template.tncTest.events({
	'click .rotorControl'(event, instance){
		if(!toggleEngage){
			var rotorCtrl = function(){
				// console.log('interval');
				console.log('every 5 sec plstle');
				getTLEData();
				// console.log(PLib.tleData);
				// for testing (to delete)
				// Meteor.call('rotorCtrl',PLib.tleData, function (err, response) {
				// engageRotor (opens socket if not open)
				console.log('every 5 sec pls1');
				Meteor.call('engageRotor',PLib.tleData, function (err, response) {
					if(err){
						console.log("err is "+err)
					}
					console.log(response);
				});
				console.log('every 5 sec pls2');
			}
			// rotorCtrl();
			rotorCtrlInterval = Meteor.setInterval(rotorCtrl, 5000);
		}else{
			// console.log('close');
			Meteor.clearInterval(rotorCtrlInterval);
			Meteor.call('disengageRotor',PLib.tleData, function (err, response) {
				if(err){
					console.log("err is "+err)
				}
				console.log(response);
			});
		}
		toggleEngage = !toggleEngage;
	},
	'click .simulatePass'(event, instance){
		getTLEData();
		Meteor.call('simulatePass', PLib.tleData, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .getRotorPos'(event, instance){
		Meteor.call('getRotorPos', function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .closeSocket '(event, instance){
		Meteor.call('disengageRotor', function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
		Meteor.clearInterval(rotorCtrlInterval);
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
		Meteor.call('sendCommand', commandToSend, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .killCSP'(event, instance){
		Meteor.call('killCSP', function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .tolatestmsg'(event, instance){
		$('#selfchatlog').animate({ scrollTop: $('#selfchatlog').prop('scrollHeight')}, 1000);
		Meteor.setTimeout(function(){
			prevtotaldivheight = document.getElementById("selfchatlog").scrollHeight;
			prevcurrscrollposition = document.getElementById("selfchatlog").scrollTop;
		}, 1100);
		
	},
	'keypress .commandGo': function (evt, template){

        // console.log(evt);
        if(evt.which === 13){
	        const commandToSend = evt.currentTarget.value;
	        Meteor.call('sendCommand', commandToSend, function (err, response) {
	        	if(err){
	        		console.log("err is "+err)
	        	}
	        	console.log(response);
	        });
        // alert("Enter!");
      	}
    },
    'click .clearalltext'(event, instance){
    	const commandToSend = "clear";
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
    },
	'keypress .commandGo2': function (evt, template){
		// console.log(evt);
        if(evt.which === 13 && evt.currentTarget.value != ""){
        	var data = TncLog.find({}).fetch();
	        const commandToSend = evt.currentTarget.value;
	        if(data.length != 0){
	        	Meteor.call('updateTnc', commandToSend, function (err, response) {
		        	if(err){
		        		console.log("err is "+err)
		        	}
		        	// console.log(response);
		        });
	        }else{
	        	Meteor.call('insertTnc', commandToSend, function (err, response) {
		        	if(err){
		        		console.log("err is "+err)
		        	}
		        	// console.log(response);
		        });
	        }	        
        	// alert("Enter!");
        	chatscroll();
        	evt.currentTarget.value = "";
      	}
    },

});

Template.tncTest.helpers({
	tncData(){
		var data = TncLog.find({}).fetch();

		// console.log(data);
		if(data.length==0){
			return null;
		}
		return data[0].log;
	},
	tncData2(){
		var data = TncLog.find({}).fetch();

		// console.log(data);
		if(data.length==0){
			return null;
		}
		// Quick fix to adapt to response by CSP-term
		Meteor.setTimeout(function(){
			chatscroll()
		}, 50);
		return data[0].log;
	},
	// rotorSettingData(){
	// 	var data = RotorSetting.find({}).fetch();
	// 	if(data.length != 0){
	// 		console.log('aztype: '+data[0].azType)
	// 		// console.log(data[0]);
	// 		var is180;
	// 		var is360;
	// 		//is ROT_AZ_TYPE_360
	// 		if(data[0].azType == 0){
	// 			console.log('is360')
	// 			is360 = 'selected';
	// 			is180 = null;
	// 		//is ROT_AZ_TYPE_180
	// 		}else{
	// 			is360 = null;
	// 			is180 = 'selected';
	// 		}
	// 		data[0].is180 = is180;
	// 		data[0].is360 = is360;
	// 		return data[0];	
	// 	}
	// 	else{
	// 		console.log('default')
	// 		return {
	// 					host:'hostname',
	// 					port:'4533',
	// 					minAz: '0',
	// 					maxAz: '360',
	// 					minEl: '0',
	// 					maxEl: '90',
	// 					is180: null,
	// 					is360: 'selected',
	// 				};
	// 	}
	// },
});

Template.tncTest.onDestroyed(function () {

});

Template.registerHelper('breaklines', function(text) {
  // text = s.escapeHTML(text);
    // console.log("before "+text);

	// text = text.replace(/(\r\n|\n|\r)/gm, '<br/>');
	text = decodeURIComponent(encodeURIComponent(text).replace(/%(?:1B)/g,''));
	// text = text.replace(new RegExp('\\[0m|\\[1\;32m|\\[1\;30m \# |\\[1\;32mtnc|\\[1\;','g'), '');
	text = text.replace(new RegExp('\\[0m|\\[1\;32m|\\[1\;30m \# |\\[1\;32mtnc|\\[1\;|30m \# |32m|30m','g'), '');
	text = text.replace(new RegExp('\r\n|\n|\r','g'), '<br/>');
  // console.log("after "+text);
  return new Spacebars.SafeString(text);
});

function getTLEData(){
	var storage = [];
    var uid = Meteor.userId();
	if(uid && Session.get('activesetting_loaded') && Session.get('tle_loaded')){
        var settings = ActiveSetting.find({idUser: uid}).fetch();
        var grpname = SatGroup.find({_id: settings[0].idSatGrp}).fetch();
        var satId = grpname[0].satid;
        for(var i=0;i<satId.length;i++){
        	var satData = TLE.find({_id:satId[i]}).fetch()[0];
        	var sattle = [];
        	sattle.push(satData.name);
        	sattle.push(satData.line1);
        	sattle.push(satData.line2);
        	storage.push(sattle);
        }
	}
	PLib.tleData = storage;
}

function chatscroll(){
	var totaldivheight = document.getElementById("selfchatlog").scrollHeight;
	var currscrollposition = document.getElementById("selfchatlog").scrollTop;
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
		$('#selfchatlog').animate({ scrollTop: $('#selfchatlog').prop('scrollHeight')}, 1000);
	}
}
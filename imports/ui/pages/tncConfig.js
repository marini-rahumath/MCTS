import './tncConfig.html';

import { Template } from 'meteor/templating';
// insertRotorSetting
Template.tncConfig.onCreated(function () {
	Meteor.subscribe('rotorSetting');
});

Template.tncConfig.onRendered(function () {

});

Template.tncConfig.events({
	'click .saveRotorSetting'(event, instance){
		console.log('saved')
		var azType;
		$('#aztype option:selected').each(function() {
			azType = $(this)[0].value;
		});
			console.log('aztype save: '+aztype)
		var data = {
				name:instance.find('.nameVal').value,
				host:instance.find('.hostVal').value,
				port:instance.find('.portVal').value,
				azType:azType,
				minAz:instance.find('.minAzVal').value,
				maxAz:instance.find('.maxAzVal').value,
				minEl:instance.find('.minElVal').value,
				maxEl:instance.find('.maxElVal').value,
				// delay:instance.find('.nameVal').value,
				// tolerance:instance.find('.nameVal').value,
			}
			console.log(data)

		Meteor.call('insertRotorSetting',data, function (err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
});

Template.tncConfig.helpers({
	rotorSettingData(){
		var data = RotorSetting.find({}).fetch();
		if(data.length != 0){
			console.log('aztype: '+data[0].azType)
			// console.log(data[0]);
			var is180;
			var is360;
			//is ROT_AZ_TYPE_360
			if(data[0].azType == 0){
				console.log('is360')
				is360 = 'selected';
				is180 = null;
			//is ROT_AZ_TYPE_180
			}else{
				is360 = null;
				is180 = 'selected';
			}
			data[0].is180 = is180;
			data[0].is360 = is360;
			return data[0];	
		}
		else{
			console.log('default')
			return {
						host:'hostname',
						port:'4533',
						minAz: '0',
						maxAz: '360',
						minEl: '0',
						maxEl: '90',
						is180: null,
						is360: 'selected',
					};
		}
	},
});

Template.tncConfig.onDestroyed(function () {

});
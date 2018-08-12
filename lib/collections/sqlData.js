import fs from 'fs';
EPSHK = new Mongo.Collection('epshk');
GLOBALVAR = new Mongo.Collection('globalVar');
NANOCOMHK = new Mongo.Collection('nanocomhk');
ERRORLOG = new Mongo.Collection('errorlog');
FLASHVAR = new Mongo.Collection('flashvar');
HKDATA = new Mongo.Collection('hkdata');
NANOCOMDATA = new Mongo.Collection('nanocomdata');
NANOCOMRSSI = new Mongo.Collection('nanocomrssi');
NANOHUBHK = new Mongo.Collection('nanohubhk');


if(Meteor.isServer){
	Meteor.publish('epshk',function(){
		return EPSHK.find();
	});
	Meteor.publish('globalVar',function(){
		return GLOBALVAR.find();
	});
	Meteor.publish('nanocomhk',function(){
		return NANOCOMHK.find();
	});
	Meteor.publish('errorlog',function(){
		return ERRORLOG.find();
	});
	Meteor.publish('flashvar',function(){
		return FLASHVAR.find();
	});
	Meteor.publish('hkdata',function(){
		return HKDATA.find();
	});
	Meteor.publish('nanocomdata',function(){
		return NANOCOMDATA.find();
	});
	Meteor.publish('nanocomrssi',function(){
		return NANOCOMRSSI.find();
	});
	Meteor.publish('nanohubhk',function(){
		return NANOHUBHK.find();
	});
}

Meteor.methods({
	getSqlData: function(){
		if(Meteor.isServer){
			this.unblock();
			var Fiber = Npm.require('fibers')
			var fs = require('fs');
			var dirname = '../../../../../server/satelliteSQLData/';
			fs.readdir(dirname, function(err, filenames) {
				if (err) {
					console.log(err);
					return;
				}
				console.log("fileNames are "+ filenames);

				filenames.forEach(function(filename) {
					fs.readFile(dirname + filename, 'utf-8', function(err, content) {
						if (err) {
							console.log(err);
							return;
						}
						
						var lines = content.split('\n')
						var parameterList = lines[0].split('\"\,\"');
						parameterList[0] = parameterList[0].replace('\"','');
						parameterList[parameterList.length-1] = parameterList[parameterList.length-1].replace('\"','');
						var finalResult = [];
						for(i = 1; i<lines.length-1;i++){
							var list1 = {};
							for(j = 0; j<parameterList.length; j++){
								var actualParams = lines[i].split('\"\,\"');;
								actualParams[0] = actualParams[0].replace('\"','');
								actualParams[actualParams.length-1] = actualParams[actualParams.length-1].replace('\"','');
								if(actualParams[j] != null){
									list1[parameterList[j]] = actualParams[j].split('\,');
								}
							}
							finalResult.push(list1);
						}
						finalResult.sort(function(a, b) {
							a = a.time;
							b = b.time;
							return a>b ? -1 : a<b ? 1 : 0;
						});  
						Fiber(function(){
							if(filename == 'eps_hk'){
								EPSHK.insert({
									name: filename,
									content: finalResult
								}); 
							}
							else if(filename == 'error_log'){
								ERRORLOG.insert({
									name: filename,
									content: finalResult
								}); 

							}
							else if(filename == 'flash_var'){
								FLASHVAR.insert({
									name: filename,
									content: finalResult
								}); 

							}
							else if(filename == 'global_var'){
								GLOBALVAR.insert({
									name: filename,
									content: finalResult
								}); 

							}
							else if(filename == 'hk_data'){
								HKDATA.insert({
									name: filename,
									content: finalResult
								}); 

							}
							else if(filename == 'nanocom_data'){
								NANOCOMDATA.insert({
									name: filename,
									content: finalResult
								}); 

							}
							else if(filename == 'nanocom_hk'){
								NANOHUBHK.insert({
									name: filename,
									content: finalResult
								}); 

							}
							else if(filename == 'nanocom_rssi'){
								NANOCOMRSSI.insert({
									name: filename,
									content: finalResult
								}); 

							}
							else if(filename == 'nanohub_hk'){
								NANOHUBHK.insert({
									name: filename,
									content: finalResult
								}); 
							}
						}).run();
					});
				});
			});
		}
	},
	removeSQLCollections:function(){
		console.log('dropped')
		EPSHK.remove({});
		GLOBALVAR.remove({});
		NANOCOMHK.remove({});
		ERRORLOG.remove({});
		FLASHVAR.remove({});
		HKDATA.remove({});
		NANOCOMDATA.remove({});
		NANOCOMRSSI.remove({});
		NANOHUBHK.remove({});
	},
})


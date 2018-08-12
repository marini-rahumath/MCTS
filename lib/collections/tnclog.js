TncLog = new Mongo.Collection('tnclog');

if(Meteor.isServer){
	Meteor.publish('tnclog',function(){
		return TncLog.find();
	});
}

Meteor.methods({
	'insertTnc'(logData, isUser = false){
		if(Meteor.isServer){
			this.unblock();
			if(TncLog.find({}).count()==0){
				TncLog.insert({
					log: [{
						content: logData,
						time: new Date(),
						isUser: isUser,
						}]
				});
			}
		}
	},
	'updateTnc'(logData, isUser = false){
		if(Meteor.isServer){
			console.log('logData is '+logData)
			this.unblock();
			var fs = require('fs');
			if(!isUser){
				fs.readFile('/home/jade/Desktop/FYP/rawTncLog.txt', 'utf8', function (err,data) {
					var Fiber = Npm.require('fibers')
					if (err) {
						return console.log(err);
					}
					console.log(data);
					Fiber(function(){
						var tempData = data.split('SpaceCentre');
						console.log('da length: '+tempData.length);
						var dataToSave = []
						var arr = TncLog.find({}).fetch();
						for(i =0;i<tempData.length;i++){
							console.log('da '+tempData[i]);
							if(tempData[i]!=''&&tempData[i]!=null){
								arr[0].log.push(JSON.parse(tempData[i]));
							}
						}
						
						//Sort according to time
						arr[0].log.sort(function(a,b){
							return new Date(a.time).getTime() - new Date(b.time).getTime();
						})

						//Remove all duplicates(if any)
						arr[0].log = _.uniq(arr[0].log,function(x){
							return (x.content + x.time+'');
						});
						//Combining strings together if csp-term had sent separately
						var count = 0;
						while(count<arr[0].log.length){
							//check if it contains only half of the beacon
							if(arr[0].log[count].content.includes('GALASSIA')
								&&!arr[0].log[count].content.includes('Bits')){
								if(count+1<arr[0].log.length){
									//next item should not be a full beacon
									//but should contain the other half
									if(!arr[0].log[count+1].content.includes('GALASSIA')
										&&arr[0].log[count+1].content.includes('Bits')){
										arr[0].log[count].content = arr[0].log[count].content+arr[0].log[count+1].content;
										arr[0].log.splice(count+1,1);
									}
								}
							}
							if(count+1<arr[0].log.length){
								if((arr[0].log[count].content.trim() + arr[0].log[count+1].content.trim()) ==('%3Cbr%2F%3E%3Cbr%2F%3Ecsp-term')){
									arr[0].log[count].content = arr[0].log[count].content+arr[0].log[count+1].content;
									arr[0].log.splice(count+1,1);
								//Combine messages that are supposed to be together
								}else if(Math.floor((new Date(arr[0].log[count].time)).getTime()/1000) == Math.floor((new Date(arr[0].log[count+1].time)).getTime()/1000)
								    && arr[0].log[count].isUser == arr[0].log[count+1].isUser){
									arr[0].log[count].content = arr[0].log[count].content+arr[0].log[count+1].content;
									arr[0].log.splice(count+1,1);
									//check after combining
									if(arr[0].log[count].content == 'Timeout%3Cbr%2F%3Ecsp-term30m%20%23%20#'){
										arr[0].log[count].content = 'Timeout%3Cbr%2F%3Ecsp-term'
									}
								}else{
									count++;
								}
							}else{
								count++;
							}
							
						}

						TncLog.update({ _id: arr[0]._id}, { $set: {log:arr[0].log}},function(error){
							if(error){
								console.log('updateTnc error '+error)
							}else{
								console.log('no error in updateTnc ')
							}
						});
			        	Meteor.call('clearTextFile', function (err, response) {
				        	if(err){
				        		console.log("err is "+err)
				        	}
				        	console.log(response);
				        });
					}).run();
				
				});
				
			}else{
				var arr = TncLog.find({}).fetch();
				arr[0].log.push({content:encodeURIComponent(logData),time:new Date(),isUser:isUser})
				console.log('b4 update')
				TncLog.update({ _id: arr[0]._id}, { $set: {log:arr[0].log}},function(error){
					if(error){
						console.log('updateTnc error '+error)
					}else{
						console.log('no error in updateTnc ')
					}
				});
				console.log('after update')
				return true;
			}
		}
	},
	'removeAllTnc'(){
		if(Meteor.isServer){
			this.unblock();
			var arr = TncLog.find({}).fetch();
			var temp =  "cleared"
			TncLog.update(
				{ _id: arr[0]._id},
				{ $set: {log:[{
						content: temp,
						time: new Date()
						}]}}
			,function(error){
				if(error){
					console.log('error in claer '+error)
				}else{
					console.log('cleared db')
				}

			});
        	Meteor.call('clearTextFile', function (err, response) {
	        	if(err){
	        		console.log("err is "+err)
	        	}
	        	console.log(response);
	        });
			return true;
		}
	}
})

RotorSetting = new Mongo.Collection('rotorSetting');

if(Meteor.isServer){
	Meteor.publish('rotorSetting',function(){
		return RotorSetting.find();
	});
}

Meteor.methods({
	'insertRotorSetting'(data){
		if(Meteor.isServer){
			this.unblock();
			if(RotorSetting.find({}).count()==0){
				RotorSetting.insert(data)
			}else{
				var rs = RotorSetting.find({}).fetch();
				RotorSetting.update(
					{_id:rs[0]._id},
					{ $set: data}
				)
			}
		}
	},
})
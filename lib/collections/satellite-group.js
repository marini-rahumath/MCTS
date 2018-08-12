SatGroup = new Mongo.Collection('satgroup');

if(Meteor.isServer){
	Meteor.publish('satgroup',function(){
		return SatGroup.find();
	});
}

Meteor.methods({
	'insert-newgroup'(uid, name, satid){
		SatGroup.insert({
			idUser: uid,
			name: name,
			satid: satid
		})
	},
	'update-onegroup'(id, name, satid){
		SatGroup.update(
			{ _id:id},
			{ $set: {name:name, satid, satid} }
		)
	},
	'remove-onegroup'(id){
		SatGroup.remove(id);
	},
	'getSatForEmail'(id){
		if (Meteor.isServer){
            var allSatForEmail = SatGroup.findOne({_id:id});
            return allSatForEmail;
		}

	}
})
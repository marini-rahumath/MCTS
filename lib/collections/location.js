Location = new Mongo.Collection('location');

if(Meteor.isServer){
	Meteor.publish('location',function(){
		return Location.find();
	});
}

Meteor.methods({
	'insert-location'(uid, name, desc, location, lat, lon){
		var display = "";
		display += "(" + lat;
		display += "," + lon;
		display += ") " + name;
		display += " | " + location;
		display += " | \'" + desc+"\'";
		Location.insert({
			idUser: uid,
			name: name,
			desc: desc,
			location: location,
			lat: lat,
			lon: lon,
			display: display
		});
	},
	'remove-location'(id){
		Location.remove(id);
	},
	'update-location'(id, name, desc, location, lat, lon){
		var display = "";
		display += "(" + lat;
		display += "," + lon;
		display += ") " + name;
		display += " | " + location;
		display += " | \'" + desc+"\'";
		Location.update(
			{ _id: id},
			{ $set: { name:name, desc:desc,location:location, lat:lat, lon:lon, display } }
		);
	},

});
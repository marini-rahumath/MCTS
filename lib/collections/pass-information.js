PassInformation = new Mongo.Collection('passinformation');

if(Meteor.isServer){
    Meteor.publish('passinformation',function(){
        return PassInformation.find();
    });

}

Meteor.methods({
    'insert-new-pass-info'(uid){
        PassInformation.insert({
            idUser: uid,
            imageTime:"",
            numPhotos: "",
            timeInterval: "",
            taskId: "",
            count: ""
        })
    },
    'update-new-pass-info'(uid, imageTime, numPhotos, timeInterval, taskId){
        var exist = PassInformation.find({taskId: taskId }).count();
        console.log(exist);
        PassInformation.insert(
            { idUser:uid,
                imageTime: imageTime,  numPhotos: numPhotos,
                timeInterval: timeInterval, taskId: taskId, count:exist}
        )
    },

});
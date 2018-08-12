CurrentTaskInformation = new Mongo.Collection('currenttaskinformation');

if(Meteor.isServer){
    Meteor.publish('currenttaskinformation',function(){
        return CurrentTaskInformation.find();
    });

}

Meteor.methods({
    'insert-new-task-info'(uid){
        CurrentTaskInformation.insert({
            idUser: uid,
            passInformation: "",
            //imageTime: "",
            //numPhotos: "",
            //timeInterval: "",
            exposureTime: "",
            imageGain: "",
            pixelFormat: "",
            downlinkTime: "",
            preambleAmount: "",
            postambleAmount: "",
            frequency: "",
            sps: "",
            modulation:"",
            txGain: "",
            arbdl: "",
            numPass: 0
        })
    },
    // addition of FIRST PASS in the system (current task info stores all of the first pass information)
    'update-new-task-info-image'(uid, imageTime, numPhotos, timeInterval, exposureTime, imageGain,
                           pixelFormat, downlinkTime, preambleAmount, postambleAmount, frequency, sps,
                           modulation, txGain, arbdl){
        var exist = CurrentTaskInformation.find({idUser: uid }).count();




        if (exist != 0){
            CurrentTaskInformation.remove({idUser:uid});

        }

        CurrentTaskInformation.insert(
            { idUser:uid,
             exposureTime:exposureTime,
                imageGain: imageGain, pixelFormat: pixelFormat, downlinkTime: downlinkTime,
                preambleAmount: preambleAmount, postambleAmount: postambleAmount,
                frequency: frequency, sps: sps, modulation: modulation,
                txGain: txGain, arbdl: arbdl, numPass: 0}
        );

        var taskId = CurrentTaskInformation.find({idUser: uid }).fetch()[0]._id;

        var pass = {
            uid: uid,
            imageTime: imageTime,
            numPhotos: numPhotos,
            timeInterval: timeInterval,
            taskId: taskId
        };
        Meteor.call('update-new-pass-info', uid,imageTime,numPhotos,timeInterval, taskId);

        CurrentTaskInformation.update(
            {idUser: uid},
            {$set: {
                passInformation: pass
            }}
        )

    },
    'update-new-task-pass-info' (uid, imageTime, numPhotos, timeInterval){
        var pass = {
            uid: uid,
            imageTime: imageTime,
            numPhotos: numPhotos,
            timeInterval: timeInterval
        };
        var taskId = CurrentTaskInformation.find({idUser: uid }).fetch()[0]._id;

        Meteor.call('update-new-pass-info', uid,imageTime,numPhotos,timeInterval, taskId);

    },

});
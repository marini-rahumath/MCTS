ActiveSetting = new Mongo.Collection('activesetting');
//import PLib2 from '../../imports/api/prediction/predictlib.js';

if(Meteor.isServer){
    Meteor.publish('activesetting',function(){
        return ActiveSetting.find();
    });
}

Meteor.methods({
    'insert-new-setting'(uid){
        ActiveSetting.insert({
            idUser: uid,
            idLoc: "",
            idSatGrp: "",
            idEmailGrp: ""
        })
    },
    'update-new-settings'(uid, idLoc, idSatGrp, idEmailGrp){
        ActiveSetting.update(
            { idUser:uid},
            { $set: {idLoc: idLoc, idSatGrp: idSatGrp, idEmailGrp: idEmailGrp} }
        )
    },
    'sendEmail' () {
        console.log("in send email");
        if (Meteor.isServer){
            this.unblock();

            var toEmail = ActiveSetting.find().fetch();
            console.log(toEmail);
            var user, currSat, emailText;

            for (var i=0; i<toEmail.length; i++){
                if (toEmail[i].idEmailGrp != ""){
                    console.log('users are ' + toEmail[i].idUser);
                    user = Meteor.users.findOne(toEmail[i].idUser);
                    // the code after meteor call will run first, even when meteor call is not done... why?
                    const allSat = Meteor.call('getSatForEmail', toEmail[i].idEmailGrp);
                    // each user should only have 1 sat group for email
                    console.log('sat id length is ' + allSat.satid.length);
                    for (var j=0; j<allSat.satid.length; j++){
                        currSat = allSat.satid[j];
                        console.log(currSat);
                        //get prediction here
                    }




                    // Email.send({
                    //     to: user.emails[0].address,
                    //     from: "rebgsat@gmail.com",
                    //     subject: "Reminder: Your satellite passes today",
                    //     //TODO
                    //     text: "hehe",
                    // });
                }
            };
            // if (idEmailGrp != ""{
            //     var emailAdd = Meteor.users.findOne({_id: idUser});
            //     Email.send({
            //         to: uid.emails[0].address,
            //         from: "rebgsat@gmail.com",
            //         subject: "Reminder: Your satellite passes today",
            //         //TODO
            //         text: results,
            //     });
            // });


        }
    },

});
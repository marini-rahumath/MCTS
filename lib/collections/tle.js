TLE = new Mongo.Collection('tle');


const server = 'http://www.celestrak.com/NORAD/elements/';
const default_files = 'amateur.txt;cubesat.txt;dmc.txt;education.txt;engineering.txt;galileo.txt;geo.txt;geodetic.txt;' +
    'globalstar.txt;glo-ops.txt;goes.txt;gorizont.txt;gps-ops.txt;intelsat.txt;iridium.txt;military.txt;molniya.txt;' +
    'musson.txt;nnss.txt;noaa.txt;orbcomm.txt;other.txt;other-comm.txt;radar.txt;raduga.txt;' +
    'resource.txt;sarsat.txt;sbas.txt;science.txt;tdrss.txt;tle-new.txt;visual.txt;weather.txt;x-comm.txt';

if(Meteor.isServer){
    Meteor.publish('tle',function(){
        return TLE.find();
    });
}

Meteor.methods({
    'updateTLE'(){
        if(Meteor.isServer){
            this.unblock();
            var textfiles = default_files.split(";");
            var data;
            var temp;

            for(var i=0;i<textfiles.length;i++){
                try {
                    console.log(textfiles[i]);
                    data = HTTP.call('GET', server + textfiles[i]);
                } catch (e) {
                    return false;
                }
                temp = data.content.split("\r\n");
                for(var j=0;j<temp.length-1;j=j+3){

                    // check if existing database has trailing whitespace bug
                    var existWhiteSpace = TLE.find({name: temp[j]}).count();

                    if (existWhiteSpace != 0) {
                        TLE.update(
                            { name: temp[j] },
                            { $set: {name: temp[j].trim(), line1 : temp[j+1], line2 : temp[j+2], time: new Date() } }
                        );
                    }

                    var exist = TLE.find({name: temp[j].trim()}).count();
                    if(exist != 0){
                        TLE.update(
                            { name: temp[j].trim() },
                            { $set: {line1 : temp[j+1], line2 : temp[j+2], time: new Date() } }
                        );
                    }else{
                        TLE.insert({
                            name: temp[j].trim(),
                            line1 : temp[j+1],
                            line2 : temp[j+2],
                            time: new Date()
                        });
                    }
                }
            }

            console.log(true);
            return true;
        }
    },

    'manualUpdateTLE'(satnamem, tleline1m, tleline2m) {
        if(Meteor.isServer){
            this.unblock();

            var exist = TLE.find({name: satnamem }).count();

             if(exist != 0){
                 TLE.update(
                     { name: satnamem },
                     { $set: {line1 : tleline1m, line2 : tleline1m, time: new Date() } }
                 );
             }else{
                TLE.insert({
                    name: satnamem,
                    line1 : tleline1m,
                    line2 : tleline2m,
                    time: new Date()
                });
            }

            console.log(true);
            return true;
        }
    },
});








import { Meteor } from 'meteor/meteor';
import PLib from '../imports/api/prediction/predictlib.js';
import { SyncedCron } from 'meteor/percolate:synced-cron';

Meteor.startup(() => {
    // code to run on server at startup
    process.env.MAIL_URL = "smtps://postmaster@sandboxe978bc0e1c984a3a805bf067f41b4f44.mailgun.org:galassia123@smtp.mailgun.org:465/";
    var data;

    // Load future from fibers
    var Future = Npm.require("fibers/future");
    // Load exec
    var exec = Npm.require("child_process").exec;
    //Child Process
    var childP;

    var rotorClient;
    // Meteor.subscribe('tnclog');
    var blocker = false;
    // Server methods
    var canSend = true;
    //flag to allow code to process data from rotor
    var canReceiveRotor = false;
    //flag to enable computation of Azimuth and Elevation
    var canRunAzElComputation = false;

    var canSendDot = true;
    var counterOn = 0;




    Meteor.methods({
        getUsers:function(){
            var users = Meteor.users.find({}, { fields: {"emails": true} }).fetch();
            console.log(users);
        },

        //Open connection to Hamlib
        //Send and receive data from Hamlib

        engageRotor:function(tle){

            //Create rotorClient and initialise socket
            if(rotorClient == null){

                /* ------- Get Configuration from DatabaseSettings ----------- */
                //TODO: Assign RotorSettings variables with values
                var rotorSetting = RotorSetting.find({}).fetch();
                console.log('rotorSetting is ')
                console.log(rotorSetting);



                console.log('engageRotor')
                // https://gist.github.com/tedmiston/5935757
                var net = require('net');
                rotorClient = new net.Socket();
                rotorClient.connect(4533, 'localhost', function() {
                    console.log('Connected');
                });

                rotorClient.read(function(data){
                    console.log('read response is '+data);

                });

                rotorClient.on('data',function(data){
                    if(canReceiveRotor){
                        console.log('receiving rotor feedback aft set pos '+data)
                        canReceiveRotor = false
                    }

                    //Azimuth & Elevation Computation
                    //if blocker is true, it will not run rotorCalculations
                    if(!blocker && canRunAzElComputation){
                        canRunAzElComputation = false;
                        blocker = true;
                        // Pre-conditions:
                        // initialize groundstation
                        // delay = 5000
                        // tolerance = 1.0
                        // aos azimuth & elevation
                        // los azimuth & elevation
                        // ----- Configuration ------
                        // rotator type (Azimuth type)
                        // Min Az, Max Az, Min El, Max El
                        // --------------------------
                        // is_flipped_pass function

                        /* ------- Parameters Settings ----------- */
                        var minAz = 0;
                        var maxAz = 450;
                        var minEl = 0;
                        var maxEl = 180; // **Check if this is the correct value**
                        var AziTypeEnum = {
                            ROT_AZ_TYPE_360 : 0,        /*!< Azimuth in range 0..360 */
                            ROT_AZ_TYPE_180 : 1,        /*!< Azimuth in range -180..+180 */
                        } ;
                        var AziType = AziTypeEnum.ROT_AZ_TYPE_360;
                        var tolerance = 1.00; /* degrees */
                        var delay = 5000 /* msec */

                        /* --------- Parameters Local ------------- */
                        var rotAz = 0.0;
                        var rotEl = 0.0;
                        var setAz = 0.0;
                        var setEl = 45.0;
                        var time_delta;
                        var step_size;

                        /*------From hamlib (get rotor position)-----*/
                        var rotAzEl = ((data.toString()).split('\n'));
                        rotAz = rotAzEl[0];
                        rotEl = rotAzEl[1];
                        console.log('rotAz '+rotAz);
                        console.log('rotEl '+rotEl);
                        /* ------------ Initialise Data ----------- */
                        PLib.tleData = tle;
                        PLib.InitializeData();
                        PLib.configureGroundStation(1.2966,103.7764);//latitude, longtitude);
                        var liveData = PLib.liveTrack();
                        var currTime = PLib.CurrentDaynum();
                        var passData = PLib.getNextPass();
                        var flipped = is_flipped_pass(AziType, passData.cazi);
                        // Convert to number format for more accuracy
                        passData.aos = PLib.Date2DayNum(passData.aos);
                        passData.los = PLib.Date2DayNum(passData.los);
                        /* ------------- Line 865 ----------------- */
                        if(liveData.ele < 0.0){
                            if(passData.aos <= currTime && passData.los >= currTime){
                                if(passData.aos <= currTime){
                                    setAz = passData.cazi[0];
                                    setEl = 0.0;
                                    // console.log(setAz);
                                }
                                else if(passData.los >= currTime){
                                    setAz = passData.cazi[passData.cazi.length-1];
                                    setEl = 0.0;
                                    // console.log(setAz);
                                }
                            }
                        }else{
                            setAz = liveData.azi;
                            setEl = liveData.ele;
                        }

                        /* ------------- Line 907 ----------------- */
                        /* if this is a flipped pass and the rotor supports it*/
                        if(flipped && maxEl >= 180.0){
                            setEl = 180.0 - setEl;
                            if(setAz > 180.0){
                                setAz-=180.0;
                            }else{
                                setAz+=180.0;
                            }
                        }
                        if((AziType == AziTypeEnum.ROT_AZ_TYPE_180) && (setAz > 180.0)){
                            setAz = setAz - 360.0;
                        }

                        /* ------------- Line 951 ----------------- */
                        /* SET rotAz & rotEl with Rotor Device current Azimuth & Elevation */
                        // rotAz = device Azimuth
                        // rotEl = device Elevation
                        /* if tolerance exceeded */
                        if(Math.abs(setAz-rotAz) > tolerance || Math.abs(setEl-rotEl) > tolerance){
                            if(liveData.ele > 0.0){
                                /* compute az/el in the future that is past end of pass or exceeds tolerance */
                                if(liveData){
                                    /* the next point is before the end of the pass if there is one.*/
                                    time_delta = passData.los - currTime;
                                }else{
                                    /* otherwise look 20 minutes into the future*/
                                    time_delta = 1.0/72.0;
                                }
                                /* have a minimum time delta*/
                                if(time_delta < (delay/1000.0/8.6400E4)){
                                    time_delta = delay/1000.0/8.6400E4;
                                }

                                step_size = time_delta / 2.0;

                                /*
                                find a time when satellite is above horizon and at the
                                edge of tolerance. the final step size needs to be smaller
                                than delay. otherwise the az/el could be further away than
                                tolerance the next time we enter the loop and we end up
                                pushing ourselves away from the satellite.
                                */
                                var tempazi;
                                var tempele;
                                while(step_size > (delay/1000.0/4.0/8.6400E4)){
                                    PLib.daynum = currTime + time_delta;
                                    PLib.Calc();
                                    tempazi = PLib.sat_azi;
                                    tempele = PLib.sat_ele;
                                    /*update sat->az and sat->el to account for flips and az range*/
                                    if(flipped && maxEl >= 180.0){
                                        tempele = 180.0 - tempele;
                                        if(tempazi > 180.0){
                                            tempazi-=180.0;
                                        }else{
                                            tempazi+-180.0;
                                        }
                                    }
                                    if((AziType == AziTypeEnum.ROT_AZ_TYPE_180) && (tempazi > 180.0)){
                                        tempazi = tempazi - 360.0;
                                    }
                                    if((tempele < 0.0) || (tempele > 180.0) || (Math.abs(setAz-tempazi)>tolerance) || (Math.abs(setEl-tempele)>tolerance)){
                                        time_delta-=step_size;
                                    }else{
                                        time_delta+=step_size;
                                    }
                                    step_size/=2.0;
                                }
                                setEl = tempele;
                                if(setEl < 0.0){
                                    setEl = 0.0;
                                }
                                if(setEl > 180.0){
                                    setEl = 180.0;
                                }
                                setAz = tempazi;
                            }
                            console.log('adj azi: '+setAz);
                            console.log('adj ele: '+setEl);

                            // Send this data to Rotor Device
                            var az84;
                            az84=84+setAz;
                            if (az84 > 450){
                                az84-=360;
                            }
                            var az = az84;
                            var el = setEl;
                            rotorClient.write("P "+az.toFixed(2)+ " " +el.toFixed(2)+"\x0a")
                            canReceiveRotor = true;

                        }
                        blocker = false;
                    }
                })
            }
            //Get position of rotor
            console.log('requesting for rotor position')
            if(rotorClient!=null){
                rotorClient.write("p\x0a")
            }else{
                console.log('Cannot request for rotor pos because rotorClient is null')
            }
            canRunAzElComputation = true;
        },


        //Get current antennae position
        getRotorPos:function(){
            if(rotorClient!=null){
                rotorClient.write("p\x0a")
            }else{
                console.log('Cannot request for rotor pos because rotorClient is null')
            }
        },
        //Close connection to Hamlib
        disengageRotor: function(){
            console.log('disengageRotor')
            if(rotorClient != null){
                rotorClient.destroy();
                rotorClient = null;
                console.log('rotorClient is destroyed')
            }else{
                console.log('Cannot destroy because rotorClient is null')
            }
        },
        /*
        Mock satellite pass test
        To determine the accuracy of the converted C to JS code
        Needs Refinement and Comparison to the Output from GPredict
        */
        simulatePass: function(tle){
            /* ------- Parameters Settings ----------- */
            var minAz = 0;
            var maxAz = 450;
            var minEl = 0;
            var maxEl = 180; // **Check if this is the correct value**
            var AziTypeEnum = {
                ROT_AZ_TYPE_360 : 0,        /*!< Azimuth in range 0..360 */
                ROT_AZ_TYPE_180 : 1,        /*!< Azimuth in range -180..+180 */
            } ;
            var AziType = AziTypeEnum.ROT_AZ_TYPE_360;
            var tolerance = 1.00; /* degrees */
            var delay = 5000 /* msec */

            /* --------- Parameters Local ------------- */
            var rotAz = 0.0;
            var rotEl = 0.0;
            var setAz = 0.0;
            var setEl = 45.0;
            var time_delta;
            var step_size;

            /* ------------ Initialise Data ----------- */
            PLib.tleData = tle;
            PLib.InitializeData();
            PLib.configureGroundStation(1.2966,103.7764);//latitude, longtitude);
            PLib.daynum = PLib.Date2DayNum(new Date("March 30, 2017 14:07:00")); // Simulated time altered according to CurrentDaynum function in PredictLib
            console.log(PLib.daynum);
            var simData = PLib.simulateTrack();
            var passData = PLib.getSimNextPass(PLib.daynum);
            var flipped = is_flipped_pass(AziType, passData.cazi);

            // Convert to number format for more accuracy
            passData.aos = PLib.Date2DayNum(passData.aos);
            passData.los = PLib.Date2DayNum(passData.los);
            currTime = passData.aos;

            /*Testing*/
            // console.log("ELE: " + passData.cele);
            // console.log("AZI: " + passData.cazi);
            // console.log("AOS: " + passData.aos);
            // console.log("LOS: " + passData.los);
            var fs = require('fs');
            for(var k = 0; k < passData.cazi.length; k++){
                simData.ele = passData.cele[k];
                simData.azi = passData.cazi[k];
                if(k!=0){
                    currTime = currTime + (Math.cos((PLib.sat_ele - 1.0) * PLib.deg2rad) * Math.sqrt(PLib.sat_alt) / 502500.0);
                    flipped = is_flipped_pass(AziType, simData.azi);
                }
                // console.log("k = " + k);
                /*Testing*/

                /* ----------- Calculations --------------- */
                /* ------------- Line 865 ----------------- */
                if(simData.ele < 0.0){
                    if(passData.aos <= currTime && passData.los >= currTime){
                        if(passData.aos <= currTime){
                            setAz = passData.cazi[0];
                            setEl = 0.0;
                            // console.log(setAz);
                        }
                        else if(passData.los >= currTime){
                            setAz = passData.cazi[passData.cazi.length-1];
                            setEl = 0.0;
                            // console.log(setAz);
                        }
                    }
                }else{
                    setAz = simData.azi;
                    setEl = simData.ele;
                }

                /* ------------- Line 907 ----------------- */
                /* if this is a flipped pass and the rotor supports it*/
                if(flipped && maxEl >= 180.0){
                    setEl = 180.0 - setEl;
                    if(setAz > 180.0){
                        setAz-=180.0;
                    }else{
                        setAz+=180.0;
                    }
                }
                if((AziType == AziTypeEnum.ROT_AZ_TYPE_180) && (setAz > 180.0)){
                    setAz = setAz - 360.0;
                }

                /* ------------- Line 951 ----------------- */
                /* SET rotAz & rotEl with Rotor Device current Azimuth & Elevation */
                // rotAz = device Azimuth
                // rotEl = device Elevation
                /* if tolerance exceeded */
                if(Math.abs(setAz-rotAz) > tolerance || Math.abs(setEl-rotEl) > tolerance){
                    if(simData.ele > 0.0){
                        /* compute az/el in the future that is past end of pass or exceeds tolerance */
                        if(simData){
                            /* the next point is before the end of the pass if there is one.*/
                            time_delta = passData.los - currTime;
                        }else{
                            /* otherwise look 20 minutes into the future*/
                            time_delta = 1.0/72.0;
                        }
                        /* have a minimum time delta*/
                        if(time_delta < (delay/1000.0/8.6400E4)){
                            time_delta = delay/1000.0/8.6400E4;
                        }

                        step_size = time_delta / 2.0;

                        /*
                        find a time when satellite is above horizon and at the
                        edge of tolerance. the final step size needs to be smaller
                        than delay. otherwise the az/el could be further away than
                        tolerance the next time we enter the loop and we end up
                        pushing ourselves away from the satellite.
                        */
                        var tempazi;
                        var tempele;
                        while(step_size > (delay/1000.0/4.0/8.6400E4)){
                            PLib.daynum = currTime + time_delta;
                            PLib.Calc();
                            tempazi = PLib.sat_azi;
                            tempele = PLib.sat_ele;
                            /*update sat->az and sat->el to account for flips and az range*/
                            // flipped=false;
                            if(flipped && maxEl >= 180.0){
                                tempele = 180.0 - tempele;
                                if(tempazi > 180.0){
                                    tempazi-=180.0;
                                }else{
                                    tempazi+-180.0;
                                }
                            }
                            if((AziType == AziTypeEnum.ROT_AZ_TYPE_180) && (tempazi > 180.0)){
                                tempazi = tempazi - 360.0;
                            }
                            if((tempele < 0.0) || (tempele > 180.0) || (Math.abs(setAz-tempazi)>tolerance) || (Math.abs(setEl-tempele)>tolerance)){
                                time_delta-=step_size;
                            }else{
                                time_delta+=step_size;
                            }
                            step_size/=2.0;
                        }
                        setEl = tempele;
                        if(setEl < 0.0){
                            setEl = 0.0;
                        }
                        if(setEl > 180.0){
                            setEl = 180.0;
                        }
                        setAz = tempazi;
                    }
                    // console.log('adj azi: '+setAz);
                    var az84;
                    az84=84+setAz;
                    if (az84 > 450){
                        az84-=360;
                    }
                    // console.log('a84 azi: '+az84);
                    // console.log('org azi: '+passData.cazi[k]);
                    // console.log('adj ele: '+setEl);

                    /*Testing*/
                    var logstring = "TIME: " + PLib.Daynum2Date(currTime) + ", AZ: " + az84 + ", EL: " + setEl + ", is_flipped_pass: " + flipped + "\n";
                    console.log(logstring);
                    // NOTE: Change Storage location of log file
                    fs.appendFile("C:/Users/Ben/Desktop/RotorTestLog.txt", logstring, function(err){
                        // console.log(err);
                    })
                    /*Testing*/

                    // console.log('org ele: '+passData.cele[k]);
                    // console.log('');
                    // Send this data to Rotor Device

                }
                /*Testing*/
            }
            console.log("END OF FUNCTION");
            /*Testing*/

        },
        clearTextFile: function(){
            var fs = require('fs');
            fs.writeFile("/home/jade/Desktop/FYP/rawTncLog.txt", '', function(err) {
                console.log('clear rawTncLog');
                if(err) {
                    return console.log(err);
                }

                console.log("");
            });
        },
        //Start CSP process
        startCSP: function(){
            var c = 0;
            var spawn = require('child_process').spawn;
            function shspawn(command) {return spawn('sh', ['-c', command]);}
            // const child = shspawn('/home/nusfypsc/Desktop/node-command_line_gs/build/csp-term -a11');
            const child = shspawn('sudo ~/Desktop/mcts-cspterm/build/csp-term -a11 -d /dev/ttyUSB0');
            Meteor.call('insertTnc',"Welcome", function (err, response) {
                if(err){
                    console.log("err is "+err)
                }
                // console.log(response);
            })
            childP = child;
            var calldb = Meteor.bindEnvironment(function(data){
                Meteor.call('updateTnc',data.toString(), function (err, response) {
                    if(err){
                        console.log("err is "+err)
                    }
                })
            });
            child.stdout.on ('data', function (data)  {
                var text = data.toString();


                console.log('data is '+text)
                console.log('data len is: '+text.length)

                text = decodeURIComponent(encodeURIComponent(text).replace(/%(?:1B)/g,''));
                text = text.replace(new RegExp('\\[0m|\\[1\;32m|\\[1\;30m \# |\\[1\;32mtnc|\\[1\;','g'), '');
                if(text!='\n'){
                    text = text.replace(new RegExp('\r\n|\n|\r','g'), '<br/>');
                    console.log(encodeURIComponent(data.toString()));
                    console.log('text after conversion is '+text);
                    if(text.length >0){
                        var fs = require('fs');
                        var tempJson = {content:encodeURIComponent(text),time:new Date(),isUser:false};
                        var saveText = JSON.stringify(tempJson);
                        var preamble = 'SpaceCentre'
                        fs.appendFile("/home/jade/Desktop/FYP/rawTncLog.txt", saveText+preamble, function(err) {
                            console.log('saving to log '+saveText+preamble)
                            if(err) {
                                return console.log(err);
                            }else{
                                calldb(data.toString());
                            }

                            console.log("");
                        });
                    }
                }


            });
            child.stderr.on ('data', (data) => {
                console.log ("error is "+data.toString ());
            });
        },
        //Send command to csp-term process
        sendCommandToCSP(commandToSend){
            if(childP != null){
                // console.log('child feedback pid'+ childP.pid);
                childP.stdin.setEncoding('utf-8');
                childP.stdin.write(commandToSend+'\n')
                // child.stdin.end(); // kills process
            }
        },
        //Kill csp-term process
        killCSP(){
            //TODO: show exit code of child process
            if(childP == null ){
                console.log('childP is null')
            }
            if(childP!=null){
                childP.stdout.destroy();
                childP.stdin.end();
                childP.kill();
                console.log('after killing childP\n\n')
                childP = null;
            }
        },

        //remove syncedcron job
        updateJob(ratelength){
            SyncedCron.remove('Update TLE');
            SyncedCron.add({
                name: 'Update TLE',
                schedule: function(parser) {
                    // the problem with this parser is that it always starts from the first min/hour/day etc. not from now.
                    if (ratelength == 'hour')
                        return parser.recur().on(1).minute();
                    else
                    if (ratelength == 'day')
                        return parser.recur().on('00:00').time();
                    else
                    if (ratelength == 'week')
                        return parser.recur().on(1).dayOfWeek();
                    else
                    if (ratelength == 'month')
                        return parser.recur().on(1).dayOfMonth();
                    else
                        return parser.recur().on('00:00').time();

                },
                job: function() {
                    Meteor.call('updateTLE', function(error,result){});
                }
            });

            return true;
     }
    });
});


//Http call to weather data
if (Meteor.isServer) {

    Meteor.methods({
        'getWeather': function (latitude,longitude) {
            this.unblock();
            // console.log(latitude+" "+longitude)
            const url = "https://api.darksky.net/forecast/5751c659722c64ca8ea7112509b89f5a/"+latitude+","+longitude;
            return Meteor.http.call("GET", url);
        },
        'getGeomagneticAndSolarInfo':function(){
            this.unblock();
            const url = 'http://services.swpc.noaa.gov/text/3-day-forecast.txt';
            return Meteor.http.call("GET",url);
        }
    });
}

// Line 1448
function is_flipped_pass(rotor_az_type, az){
    var min_az;
    var max_az;
    var caz;
    var last_az = az[0];
    var retval = false;

    /* ROT_AZ_TYPE_360 */
    if(rotor_az_type == 0) {
        min_az = 0;
        max_az = 360;
    }
    /* ROT_AZ_TYPE_180 */
    else if (rotor_az_type == 1) {
        min_az = -180;
        max_az = 180;
    }

    /* Assume that min_az and max_az are atleat 360 degrees apart*/
    /*get the azimuth that is in a settable range*/
    while(last_az > max_az){
        last_az-=360;
    }
    while(last_az < min_az){
        last_az+=360;
    }


    for(var i=1;i<az.length;i++){
        // TODO
        caz = az[i];
        while(caz > max_az){
            caz-=360;
        }
        while(caz < min_az){
            caz+=360;
        }
        if(Math.abs(caz-last_az) > 180){
            retval = true;
            break;
        }
    }

    return retval;
}

SyncedCron.add({
    name: 'Send Email',
    schedule: function(parser) {

        // Send an email every midnight
        return parser.recur().on('13:38:00').time().onWeekday();

    },
    job: function() {
        Meteor.call('sendEmail', function (err, response){});
        //Meteor.call('getUserEmail', function (err, response){});

    }
});

SyncedCron.add({
    name: 'Update TLE',
    schedule: function(parser) {

        // Send an email every midnight
        return parser.recur().on('00:00').time().onWeekday();

    },
    job: function() {

        Meteor.call('updateTLE', function(error,result){});
    }
});


SyncedCron.start();
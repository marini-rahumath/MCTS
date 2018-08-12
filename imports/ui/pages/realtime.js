import './realtime.html';
import '../../api/prediction/maplabel.js';
import PLib from '../../api/prediction/predictlib.js';
import mapui from '../../api/prediction/mapui.js';
import { Template } from 'meteor/templating';

import SGP4 from '../../api/prediction/sgp4.js';

var satTrackDep = new Deps.Dependency();
var satInterval;
var info;

var satPassDep = new Deps.Dependency();
var nextPass;
var nextPassCazi;
var nextPassCele;

var predictionMode = false;

var weatherData;

var timeToNextPass = "";
var TimeInUTC_Global = "NA";

/*
Gets the Parameters of the selected Satellite
*/
function satTrack() {

    var trackdata = PLib.liveTrack();
    //console.log(trackdata);

    info = {

        name: trackdata.name,
        azimuth: trackdata.azi.toFixed(2),
        elevation: trackdata.ele.toFixed(2),
        slant_range: trackdata.range.toFixed(0),
        range_rate: trackdata.rrate.toFixed(3),
        ssp: trackdata.ssp,
        latitude: trackdata.lat.toFixed(3),
        longtitude: trackdata.long.toFixed(3),
        footprint: trackdata.fpkm.toFixed(0),
        altitude: trackdata.alt.toFixed(0),
        velocity: trackdata.vel.toFixed(3),
        dop_factor: trackdata.dfactor.toFixed(10),
        dop_shift_100m: trackdata.dshift.toFixed(0),
        signal_loss: trackdata.signl.toFixed(2),
        signal_delay: trackdata.signd.toFixed(2),
        mean_anomaly: trackdata.ma256.toFixed(2),
        orbit_phase: trackdata.orbphase.toFixed(2),
        orbit_num: trackdata.orbnum.toFixed(0),
        orbit_period: trackdata.orbperiod.toFixed(2),
        visibility: trackdata.visible
    };
    //console.log(info);
    satTrackDep.changed();
}

/*
Gets the parameters of the Next Pass for the polar chart : AOS, LOS, azimuth, elevation
*/
function satNextPass() {
    nextPass = PLib.getNextPass();
    nextPassCazi = nextPass.cazi;
    nextPassCele = nextPass.cele;
    satPassDep.changed();
    return nextPass;
}



Template.Real_Time.helpers({
    /*
Dependency
Updates the polar chart values
*/
    liveInfo(){
        satTrackDep.depend();
        if(document.getElementById('azimuth-polarchart') != null){
            var coord_r = [0,0,0,0];
            var coord_t = [0,0,0,0];
            if(parseInt(info.elevation) >= 0){
                // Draw a + sign
                var adjusted_ele = parseInt(info.elevation);
                var adjusted_azi = parseInt(info.azimuth);
                coord_r = [adjusted_ele-5,adjusted_ele,adjusted_ele+5,adjusted_ele,
                    adjusted_ele,adjusted_ele,adjusted_ele,adjusted_ele];
                coord_t = [adjusted_azi,adjusted_azi,adjusted_azi,adjusted_azi,
                    adjusted_azi-5,adjusted_azi,adjusted_azi+5,adjusted_azi];
            }
            const data = [
                { r: coord_r, t: coord_t, type: "scatter", mode: "lines", marker:{ line:{ color: ["blue"], width: 10 } } },
                { r: nextPassCele, t: nextPassCazi, type: "scatter", mode: "lines", marker:{ line:{ color: ["red"], width: 3 } } }
            ];

            const settings = {
                height: 400, width: 400,
                margin: { l: 20, r: 20, b: 20, t: 20, pad: 0 },
                orientation: -90, showLegend: false,
                radialaxis: { range: [90, 0] }
            };

            Plotly.plot($('#azimuth-polarchart')[0], data, settings);
        }
        return info;
    },
    /*
    Dependency
    Updates the satellite's parameters
    */
    livePassInUTC(){
        satPassDep.depend();
        var TimeInUTC;

        if(PLib.tleData.length != 0){

            // TimeInUTC format: YYYY/M/D HH:mm:ss
            TimeInUTC = nextPass.aos.getUTCFullYear()+"/"+(nextPass.aos.getUTCMonth()+1)+"/"+nextPass.aos.getUTCDate()
                +" "+nextPass.aos.getUTCHours()+":"+nextPass.aos.getUTCMinutes()+":"+nextPass.aos.getUTCSeconds().toPrecision(2);

            // Update time for next pass globally
            TimeInUTC_Global = TimeInUTC;

        } else {
            TimeInUTC = "NA";
            TimeInUTC_Global = "NA";
        }

        return TimeInUTC;
    },

    livePassInGMT(){
        satPassDep.depend();
        if(PLib.tleData.length != 0){

            // Get UTC Time in Epoch
            var TimeInEpoch = Date.parse(TimeInUTC_Global);

            // Get GMT+8 Time in Epoch
            // Convert to date with format: YYYY/M/D HH:mm:ss
            // Ref to http://momentjs.com/docs/#/displaying/format/
            var TimeInGMT = moment(new Date(TimeInEpoch + 28800*1000)).format("YYYY/M/D HH:mm:ss");

        }else{
            TimeInGMT = "NA";
        }
        return TimeInGMT;
    },

    countdownToNextPass: function () {

        satPassDep.depend();

        require('jquery-countdown');

        var TimeInEpoch = Date.parse(TimeInUTC_Global);
        timeToNextPass = moment(new Date(TimeInEpoch)).from(TimeSync.serverTime());

        // Convert from UTC to GMT by adding 28800s = 28800*1000ms
        var TimeInEpochGMT = TimeInEpoch + 28800*1000;

        $('#clock').countdown(TimeInEpochGMT, {elapse: true})
            .on('update.countdown', function(event) {
                var $this = $(this);
                if (event.elapsed) {
                    $this.html(event.strftime('Time since last pass: <span>%H hours %M min %S sec</span>'));
                } else {
                    $this.html(event.strftime('Time to next pass: <span>%H hours %M min %S sec</span>'));
                }
            });

        // $('[data-countdown]').each(function() {
        //     var $this = $(this), finalDate = $(this).data('countdown');
        //     $this.countdown(finalDate, function(event) {
        //         $this.html(event.strftime('%D days %H:%M:%S'));
        //     });
        // });

        return "";
    },

    gMapOptions: function() {
        // Make sure the maps API has loaded
        if (GoogleMaps.loaded()) {
            // Map initialization options
            return {
                mapTypeId: 'satellite',
                center: new google.maps.LatLng(30, 40),
                zoom: 2,
                minZoom: 2
            };
        }
    },
    isBeginChecked() {
        return Session.get('satOnTrackState') == 0?'checked':false;
    },
    isMiddleChecked(){
        return Session.get('satOnTrackState')==1?'checked':false;
    },
    isEndChecked(){
        return Session.get('satOnTrackState')==2?'checked':false;
    },
    satelliteList: function(){
        var uid = Meteor.userId();
        var resultArr = [];
        if(uid && Session.get('tle_loaded') && Session.get('activesetting_loaded')){
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if(settings.length != 0){
                var grpname = SatGroup.find({_id:settings[0].idSatGrp}).fetch();
                if(grpname.length == 0){
                    return []
                }
                var satIdList = grpname[0].satid;
                var data = TLE.find({},{}).fetch();
                console.log('tle length is        : '+data.length)
                for(i=0;i<satIdList.length;i++){
                    resultArr.push(TLE.find({_id:satIdList[i]}).fetch()[0]);
                }

            }
        }
        return resultArr;
    }
});

function callWeatherApi(){
    var uid = Meteor.userId();
    if(uid){
        var settings = ActiveSetting.find({idUser: uid}).fetch();
        if(settings.length != 0){
            var locname = Location.find({_id: settings[0].idLoc}).fetch();
            if(locname.length != 0){

                Meteor.call("getWeather",locname[0].lat,locname[0].lon, function(error, results) {
                    if(error){
                        console.log("Weather error is "+error)
                    }else{
                        weatherData = JSON.parse(results.content)
                    }
                });
            }

        }
    }
}

function getClosestCloudCover(){
    var dateToFollow = new Date();
    var hours = Math.round(Math.abs(dateToFollow - new Date()) / (60*60*1000));//36e5;
    if(hours<1){
        return weatherData.currently.cloudCover;
    }else if(hours<49){
        return weatherData.hourly.data[hours].cloudCover;
    }else{
        callWeatherApi()
        return null;
    }
}

Template.Real_Time.onRendered(function () {
    /*
    Initialize polar chart
    */
    var coord_r = [0,0,0,0];
    var coord_t = [0,0,0,0];
    const data = [{
        r: coord_r, t: coord_t,
        type: "scatter", mode: "lines",
        marker:{ line:{ color: ["green"], width: 3 } }
    }];
    const settings = {
        height: 400, width: 400,
        margin: { l: 20, r: 20, b: 20, t: 20, pad: 0 },
        orientation: -90, showLegend: false,
        radialaxis: { range: [90, 0] }
    };

    Plotly.plot($('#azimuth-polarchart')[0], data, settings);
});

Template.Real_Time.events({
    
    'click .toggle-sunMarker'(event, instance){
        if(event.target.checked){
            mapui.sunMarker.setVisible(true)
        }else{
            mapui.sunMarker.setVisible(false);
        }
    },
    'change #selectSatGrp'(event, instance){
        var activeSelected;
        $('#selectSatGrp option:selected').each(function(){
            activeSelected = $(this)[0].value;
        });
        console.log('act '+activeSelected);
        const isSucc = mapui.satelliteMarkers.changeActiveMarker(activeSelected,PLib)

    },
    'click .show-futurePasses'(event, instance){
        mapui.flightPathView.setNumOfPasses(instance.find('.num-of-passes').value);

        //Meteor.call('sendEmail', "Galassia-2", "Text of email", function (err, response){});

    },
    'click .toggle-flightPath'(event, instance){
        if(event.target.checked){
            mapui.flightPathView.show();
        }else{
            mapui.flightPathView.hide();
        }
    },
    'click .toggle-terminator'(event, instance){
        if(event.target.checked){
            mapui.nite.showTerminator();
        }else{
            mapui.nite.hideTerminator();
        }
    }
    ,'click .toggle-nightShadow'(event, instance){
        if(event.target.checked){
            mapui.nite.show();
        }else{
            mapui.nite.hide();
        }
    },
    'click .toggle-footPrint'(event, instance){
        if(event.target.checked){
            mapui.coverageCircle.setVisible(true);
        }else{
            mapui.coverageCircle.setVisible(false);
        }
    },
    'click .toggle-beginSatOnTrack'(event, instance){
        if(event.target.checked){
            Session.set('satOnTrackState',0);
            mapui.flightPathView.setState(0)
        }
    },
    'click .toggle-middleSatOnTrack'(event, instance){

        if(event.target.checked){
            Session.set('satOnTrackState',1);
            mapui.flightPathView.setState(1);
        }
    },
    'click .toggle-endSatOnTrack'(event, instance){
        if(event.target.checked){
            Session.set('satOnTrackState',2);
            mapui.flightPathView.setState(2);

        }
    }

})

Template.Real_Time.onCreated(function bodyOnCreated() {

    Session.set('tle_loaded',false);
    Session.set('activesetting_loaded',false);
    Meteor.subscribe('activesetting',function(){
        Session.set('activesetting_loaded',true);
    });
    Meteor.subscribe('location');
    Meteor.subscribe('satgroup');
    Meteor.subscribe('tle',function(){
        Session.set('tle_loaded',true);
    });

    Meteor.setTimeout(SetTLEData,1800);
    Meteor.setTimeout(SetChartAndParams,1900);

    Session.setDefault('satOnTrackState',0);
    GoogleMaps.ready('gMapView', function(map) {

        mapui.init(map,PLib);
        updateMapInterval = Meteor.setInterval(UpdateMap,100);
        updateMapIntervalLonger = Meteor.setInterval(UpdateMapLongerInterval,10000)
        UpdateMap();
        UpdateMapLongerInterval();
        SetChartAndParams();
    });
    function UpdateMap(){
        if(!predictionMode){
            mapui.UpdateMap(PLib);
        }
    }
    function UpdateMapLongerInterval(){
        if(!predictionMode){
            mapui.UpdateMapLongerInterval();
        }
    }

    /*
    Initialization of interval
    Updates polar chart after a pass
    */
    function SetChartAndParams(){
        satTrack();
        satNextPass();
        satTrackInterval = Meteor.setInterval(satTrack, 1000);
        var snpinterval = function(){
            clearInterval(satNextPassInterval);
            var timer = satNextPass().los-(new Date());
            satNextPassInterval = Meteor.setInterval(snpinterval, timer);

        }
        satNextPassInterval = Meteor.setInterval(snpinterval, satNextPass().los-(new Date()));
    }


    /*
    Retrieve profile data
    */
    function SetTLEData(){
        var storage = [];
        var uid = Meteor.userId();
        if(uid){
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if(settings.length != 0){
                var grpname = SatGroup.find({_id: settings[0].idSatGrp}).fetch();
                var satId = grpname[0].satid;
                for(var i=0;i<satId.length;i++){
                    var satData = TLE.find({_id:satId[i]}).fetch()[0];
                    var sattle = [];
                    sattle.push(satData.name);
                    sattle.push(satData.line1);
                    sattle.push(satData.line2);
                    storage.push(sattle);
                }
            }
        }
        PLib.tleData = storage;
        PLib.InitializeData();
    }
});

Template.Real_Time.onDestroyed(function() {
    clearInterval(satTrackInterval);
    clearInterval(satNextPassInterval);
    clearInterval(updateMapInterval);
    clearInterval(updateMapIntervalLonger);
});









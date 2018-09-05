import './tasking.html';

import {Template} from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import SGP4 from '../../api/prediction/sgp4.js';
import PLib from '../../api/prediction/predictlib.js';
import nite from '../../api/prediction/nite-overlay.js';
import PLib3 from '../../api/prediction/predictlib.js';
import mapui from '../../api/prediction/mapui.js';
import '../../api/prediction/maplabel.js';
var popupS = require('popups');
var satTrackDep = new Deps.Dependency();
var satInterval;
var info;

var infoWindow;
var taskMap;
var taskBox;
var gsBox;
var gsCircle;
var testCircle;
var marker;

var satPassDep = new Deps.Dependency();
var getTaskingCoordsDep = new Deps.Dependency();
var getGSPassesDep = new Deps.Dependency();
var coordsPhotos = []; //coordsPhotos contains the coordinates for imaging
var coordsDraw = []; //coords to draw the rects
var coordsPrint = [];
var timingGS = [];
var inTaskBox;
var inGSCircle;
var nextPass;
var nextPassCazi;
var nextPassCele;

var predictionMode = false;

var weatherData;

var timeToNextPass = "";
var timeToNextPass2 = "";
var timeToNextPass3 = "";
var TimeInUTC_Global = "NA";
var distanceThreshold = 0;
var gsRadius = 0;
var gsLat = 0;
var gsLon = 0;

var distanceOf2PointsDep = new Deps.Dependency();
var distanceOf2Points = "-";
var issLine1 = null;
var issLine2 = null;
var activeSatName = null;
var activeGSName = null;
var flightPathView;

var indexOfBeginningCoord = -1;
var indexOfEndingCoord = -1;
var listOfIndexes = [];
var listOfIndexes_GS = [];
var allCoords = [];



/*
Gets the Parameters of the selected Satellite
*/
function satTrack() {

    var trackdata = PLib.liveTrack();

    info = {
        tle: JSON.stringify(trackdata.tle),
        tlel1: JSON.stringify(trackdata.tlel1),
        tlel2: JSON.stringify(trackdata.tlel2),
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


Template.Tasking.helpers({
    /*
Dependency
Updates the polar chart values
*/
    getLatLong() {
        //satTrackDep.depend();
        satTrack();
        var hehe = parseInt(info.latitude);
        var haha = parseInt(info.longtitude);
        return "Lat: " + hehe + " Long: " + haha;
    },

    liveInfo() {
        satTrackDep.depend();
        if (document.getElementById('azimuth-polarchart') != null) {
            var coord_r = [0, 0, 0, 0];
            var coord_t = [0, 0, 0, 0];
            if (parseInt(info.elevation) >= 0) {
                // Draw a + sign
                var adjusted_ele = parseInt(info.elevation);
                var adjusted_azi = parseInt(info.azimuth);
                coord_r = [adjusted_ele - 5, adjusted_ele, adjusted_ele + 5, adjusted_ele,
                    adjusted_ele, adjusted_ele, adjusted_ele, adjusted_ele];
                coord_t = [adjusted_azi, adjusted_azi, adjusted_azi, adjusted_azi,
                    adjusted_azi - 5, adjusted_azi, adjusted_azi + 5, adjusted_azi];
            }
            const data = [
                {r: coord_r, t: coord_t, type: "scatter", mode: "lines", marker: {line: {color: ["blue"], width: 10}}},
                {
                    r: nextPassCele,
                    t: nextPassCazi,
                    type: "scatter",
                    mode: "lines",
                    marker: {line: {color: ["red"], width: 3}}
                }
            ];

            const settings = {
                height: 400, width: 400,
                margin: {l: 20, r: 20, b: 20, t: 20, pad: 0},
                orientation: -90, showLegend: false,
                radialaxis: {range: [90, 0]}
            };

            Plotly.plot($('#azimuth-polarchart')[0], data, settings);
        }
        return info;
    },
    /*
    Dependency
    Updates the satellite's parameters
    */

    countdownToNextPass: function () {

        satPassDep.depend();

        require('jquery-countdown');

        var TimeInEpoch = Date.parse(TimeInUTC_Global);
        timeToNextPass = moment(new Date(TimeInEpoch)).from(TimeSync.serverTime());

        // Convert from UTC to GMT by adding 28800s = 28800*1000ms
        var TimeInEpochGMT = TimeInEpoch + 28800 * 1000;

        $('#clock').countdown(TimeInEpochGMT, {elapse: true})
            .on('update.countdown', function (event) {
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

    gMapOptions: function () {
        // Make sure the maps API has loaded
        if (GoogleMaps.loaded()) {
            // Map initialization options
            return {
                mapTypeId: 'satellite',
                center: new google.maps.LatLng(30, 40),
                zoom: 2,
                minZoom: 2,
            };
        }
    },
    satelliteList: function () {
        var uid = Meteor.userId();
        var resultArr = [];
        if (uid && Session.get('tle_loaded') && Session.get('activesetting_loaded')) {
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if (settings.length != 0) {
                var grpname = SatGroup.find({_id: settings[0].idSatGrp}).fetch();
                if (grpname.length == 0) {
                    return []
                }
                var satIdList = grpname[0].satid;
                var data = TLE.find({}, {}).fetch();
                console.log('satellite list tle length is        : ' + data.length)
                for (i = 0; i < satIdList.length; i++) {
                    resultArr.push(TLE.find({_id: satIdList[i]}).fetch()[0]);
                }

            }
        }
        return resultArr;
    },

    viewTasking: function () {
        getTaskingCoordsDep.depend();
        return {show: inTaskBox, name: activeSatName, data: coordsPrint};
    },

    viewGSPasses: function () {
        getGSPassesDep.depend();
        return {show: inTaskBox, check: inGSCircle, notcheck: !inGSCircle, name: activeGSName, data: timingGS};
    },

});

//returns an array of indexes that refer to the unfiltered coords[] (all coords in the duration of the mission)

function getListOfIndexes(coords, photosPerPass, cameraSize, overlapPercentage) { //needed to draw the appropriate flight paths that lie within zone
    var currentCoord;   //base coordinate we are checking against
    var nextCoord;      //coordinate used for comparison
    var indexes = [];   //array of beginning and end indexes to be returned at the end
    var beginning = -1; //variable1 of the indexes array
    var end = -1;       //variable2 of the indexes array
    var lastAdded = -1; //prevents double addition by always checking which coord was last added
    var beginningFound = false; //flag to prevent everything from becoming a beginning
    var currNumPhotos;
    distanceThreshold = cameraSize * (1-((overlapPercentage)/100)); //When 2 LatLngs are these far apart, they will be taken as the next imaging coordinate

    console.log("getListOfIndexes cameraSize = " + cameraSize);
    console.log("getListOfIndexes distanceThreshold = " + distanceThreshold);

    // UNLIMITED
    if (photosPerPass == "show all"){
        photosPerPass = 10000000000000;
    }

    for (var i = 0; i < coords.length; i++) {

        //make sure we only check the points after intersection
        if (i > end) {
            currentCoord = coords[i];
            //console.log(i);

            //this checkIfInGSCircle searches for the beginning coordinate. once the first point is found, calculations start here
            if (checkIfInTaskBox(coords[i])) {

                if (beginningFound == false) {
                    beginningFound = true;
                    currNumPhotos = 1;
                    beginning = i;

                    coordsPhotos.push({
                        lat: currentCoord.latitude2,
                        lon: currentCoord.longitude2,
                        rot: currentCoord.rot2,
                        date: convertEpochTime(currentCoord.date)
                    });

                    coordsDraw.push({
                        lat: currentCoord.latitude2,
                        lon: currentCoord.longitude2,
                        rot: currentCoord.rot2,
                        date: convertEpochTime(currentCoord.date)
                    });

                    lastAdded = beginning;
                }
                //alert(coords.length + " and " + beginning);

                //this for loop will find the end coord and also all the coordinates for imaging and push them to coordsPhoto
                for (var j = beginning + 1; j < (coords.length); j++) {

                    //this checkIfInTaskBox searches for the ending coordinate
                    if (checkIfInTaskBox(coords[j])) {
                        nextCoord = coords[j];
                        var dist = CalcDistanceBetween(currentCoord.latitude2, currentCoord.longitude2, nextCoord.latitude2, nextCoord.longitude2);

                        //TODO: update 60 to be a calculated value -> need to create a function
                        //if an appropriate distance away, add to coordsPhoto
                        if (dist > distanceThreshold) {
                            coords[j].distance = dist;
                            coordsPhotos.push({
                                lat: nextCoord.latitude2,
                                lon: nextCoord.longitude2,
                                rot: nextCoord.rot2,
                                date: convertEpochTime(nextCoord.date)
                            });

                            if (currNumPhotos<photosPerPass){
                                coordsDraw.push({
                                    lat: nextCoord.latitude2,
                                    lon: nextCoord.longitude2,
                                    rot: nextCoord.rot2,
                                    date: convertEpochTime(nextCoord.date)
                                });
                            }

                            currentCoord = nextCoord;
                            lastAdded = j;
                            currNumPhotos++;
                        }
                    }

                    //have the coordinate before the coordinate that lies outside the Task Box be the last imaging coordinate
                    else {

                        end = j - 1;

                        indexes.push({
                            beginning: beginning,
                            end: end
                        });

                        //alert(JSON.stringify(indexes));

                        //if the end coordinate is not already in coordsPhoto, add it in
                        if (lastAdded != end) {
                            coordsPhotos.push({
                                lat: coords[end].latitude2,
                                lon: coords[end].longitude2,
                                rot: coords[end].rot2,
                                date: convertEpochTime(coords[end].date)
                            });
                            lastAdded = end;
                            if (currNumPhotos<photosPerPass){
                                coordsDraw.push({
                                    lat: coords[end].latitude2,
                                    lon: coords[end].longitude2,
                                    rot: coords[end].rot2,
                                    date: convertEpochTime(coords[end].date)
                                })
                            }
                        }

                        beginningFound = false;
                        break;
                    }
                }
            }
        }
    }


    console.log(indexes);
    console.log(coordsPhotos);
    console.log(coords);
    return indexes;
}

function getListOfIndexes_GS(coords) { //needed to draw the appropriate flight paths that lie within zone
    var indexes = [];   //array of beginning and end indexes to be returned at the end
    var beginning = -1; //variable1 of the indexes array
    var end = -1;       //variable2 of the indexes array
    var lastAddedBeginning = -1; //prevents double addition by always checking which coord was last added
    var lastAddedEnd = -1; //prevents double addition by always checking which coord was last added
    var beginningFound = false; //flag to prevent everything from becoming a beginning

    for (var i = 0; i < coords.length; i++) {

        //make sure we only check the points after intersection
        if (i > end) {

            //this checkIf searches for the beginning coordinate. once the first point is found, calculations start here
            if (checkIfInTestCircle(coords[i])) { //use box to check for optimisation
                if (beginningFound == false) {
                    beginningFound = true;
                    beginning = i;
                    inGSCircle = true;
                }

                //this for loop will find the end coord and also all the coordinates that lay within the circle
                for (var j = beginning + 1; j < (coords.length); j++) {

                    //this checkIfInTaskBox searches for the ending coordinate
                    if (checkIfInTestCircle(coords[j])) {

                    }

                    //have the coordinate before the coordinate that lies outside the Task Box be the last imaging coordinate
                    else {

                        end = j - 1;
                        if ((beginning != lastAddedBeginning) && (end != lastAddedEnd)) {
                            //console.log(coords[beginning].date.toLocaleDateString());
                            //purely for indexes
                            indexes.push({
                                beginning: beginning,
                                end: end,
                            });

                            //for display purposes
                            timingGS.push({
                                start: convertEpochTime(coords[beginning].date),
                                end: convertEpochTime(coords[end].date),
                                duration: (coords[end].date - coords[beginning].date) / 1000,
                            });

                            lastAddedBeginning = beginning;
                            lastAddedEnd = end;
                        }
                        //alert(JSON.stringify(indexes));

                        beginningFound = false;
                        break;
                    }
                }
            }
        }
    }


    console.log(indexes);
    console.log(timingGS);

    return indexes;
}

function getTaskCoords(photosPerPass, numDays, cameraSize, overlapPercentage) {
    console.log("getTaskCoords cameraSize = " + cameraSize);
    console.log("getTaskCoords overlapPercentage = " + overlapPercentage);

    var tempDate = new Date();

    var tleLine1 = issLine1;
    var tleLine2 = issLine2;

    // coords of specified # of future path points (86400*numdays points numDays days, each 1 second apart) (86400s in a day)
    var coords = getFlightPathPoints(numDays * 86400, tempDate, tleLine1, tleLine2);
    allCoords = coords;

    inTaskBox = false;
    inGSCircle = false;
    indexOfBeginningCoord = -1;

    for (var i = 0; i < coords.length; i++) {
        if (checkIfInTaskBox(coords[i])) {
            inTaskBox = true;
            break;
        }
    }

    if (!inTaskBox) {

    }

    else {
        listOfIndexes = getListOfIndexes(coords, photosPerPass, cameraSize, overlapPercentage);
        listOfIndexes_GS = getListOfIndexes_GS(coords);
        console.log(listOfIndexes_GS);
    }

    // Draw rectangles for each imaging coordinate
    var overlap = false;

    // Draw rectangles for each imaging coordinate
    for (var i = 0; i < coordsDraw.length; i++) {
        //    alert(coordsPhotos[i].lat);
        // also need to create a function to make this 80000 value a calculated value
        // if (i < coordsDraw.length - 2) {
        //     currLatLong = new google.maps.LatLng(coordsDraw[i].lat, coordsDraw[i].lon);
        //     nextLatLong = new google.maps.LatLng(coordsDraw[i + 1].lat, coordsDraw[i + 1].lon);
        //     headingBetweenPoints = google.maps.geometry.spherical.computeHeading(currLatLong, nextLatLong);
        //     if (i == 0) {
        //         prevHeading = headingBetweenPoints;
        //     }
        //     console.log('heading between ' + headingBetweenPoints);
        //     console.log('prev ' + prevHeading);
        // }
        // diffHeading = Math.abs(headingBetweenPoints) - Math.abs(prevHeading);
        // console.log('diff heading ' + Math.abs(diffHeading));
        // if (Math.abs(diffHeading) < 2) {
        //     if (nextPass == true) {
        //         console.log('in true');
        //         this.flightPathView = flightPathView.drawRect(coordsDraw[i - 1].lat, coordsDraw[i - 1].lon, headingBetweenPoints, 80000, 80000);
        //         nextPass = false;
        //         console.log('drew one');
        //     }
        //     this.flightPathView = flightPathView.drawRect(coordsDraw[i].lat, coordsDraw[i].lon, headingBetweenPoints, 80000, 80000);
        //     console.log('drew another');
        //     lastCoordOfPass = true;
        // } else {
        //     if (lastCoordOfPass == true) {
        //         this.flightPathView = flightPathView.drawRect(coordsDraw[i].lat, coordsDraw[i].lon, prevHeading, 80000, 80000);
        //         lastCoordOfPass = false;
        //     }
        //     nextPass = true;
        //     console.log('OH NO ITS THE NEXT PASSSSSSSSSS');
        // }
        // prevHeading = headingBetweenPoints;


        var shadowPos = nite.getShadowPositionAtParticularDate(coordsDraw[i].date);
        //console.log("coordsDraw date: " + coordsDraw[i].date);
        //var shadowRadiusLarge = nite.getShadowRadiusFromAngle(12);
        var shadowRadiusSmall = nite.getShadowRadiusFromAngle(12);

        if (flightPathView.getDistanceBetween(new google.maps.LatLng(coordsDraw[i].lat, coordsDraw[i].lon),shadowPos) > shadowRadiusSmall) {

            var distBetweenCenter = 0;
            //console.log("this coord in the light");
            if (i != 0) {
                for (var j = 0; j < coordsPrint.length; j++) {
                    distBetweenCenter = CalcDistanceBetween(coordsDraw[i].lat, coordsDraw[i].lon, coordsPrint[j].lat, coordsPrint[j].lon);
                    //console.log(distBetweenCenter);

                    //console.log(distBetweenCenter + " is dist between centre");
                    if (distBetweenCenter < distanceThreshold) {
                        overlap = true;
                        //console.log('its true');
                    }
                }
            }

            if (overlap == false) {
                coordsPrint.push(coordsDraw[i]); //cameraSize in metres
                //console.log("this coord does not overlap");
            }
            overlap = false;
        } else {
            //console.log("this coord is NOT in coordsprint");
        }

    }
    if (coordsPrint.length == 0){

        alert("Not possible within number of specified days");

    } else {
        for (var i =0; i<coordsPrint.length; i++){
            this.flightPathView = flightPathView.drawRect(coordsPrint[i].lat, coordsPrint[i].lon, coordsPrint[i].rot, cameraSize*1000, cameraSize*1000);

        }
        for (var i = 0; i < listOfIndexes.length; i++) {
            this.flightPathView = flightPathView.drawPaths(listOfIndexes[i].beginning, listOfIndexes[i].end);
        }
    }




    coordsPhotos_string = JSON.stringify(coordsPhotos);
    // alert(coordsPhotos_string);
    // alert("index of beginning coord = " + indexOfBeginningCoord);
    // alert("index of ending coord = " + indexOfEndingCoord);
    getTaskingCoordsDep.changed();
    getGSPassesDep.changed();
    return "Number of positions: " + coords.length + " \nFinal set of coordinates: " + coordsPhotos_string;
}

function rotatePoint(point, origin, angle) {
    var angleRad = angle * Math.PI / 180.0;

    var newx = Math.cos(angleRad) * (point.lat() - origin.lat()) - Math.sin(angleRad) * (point.lng() - origin.lng()) + origin.lat();
    var newy = Math.sin(angleRad) * (point.lat() - origin.lat()) + Math.cos(angleRad) * (point.lng() - origin.lng()) + origin.lng();
    var newPoint = new google.maps.LatLng(newx, newy);

    return newPoint;
}

function convertEpochTime(epochTime) {
    return new Date(epochTime);
}

function getFlightPathPoints(numOfPoints = 1,inputDate, tleInput1,tleInput2){
    var tleLine1;
    var tleLine2;

    //alert("tle input " + tleInput1);

    if(tleInput1 == null&&tleInput2 ==null){
        tleLine1 = issLine1
        tleLine2 = issLine2
    }else{
        tleLine1 = tleInput1
        tleLine2 = tleInput2
    }

    //alert("tle line1 " + tleLine1);

    //alert(tleLine1 + tleLine2);

    var issSatRec = SGP4.twoline2rv(tleLine1,tleLine2, SGP4.wgs84());

    //alert(JSON.stringify(issSatRec));

    PLib3.tleData[['default',tleLine1,tleLine2]]
    PLib3.InitializeData();
    var firstOfYear = (typeof inputDate!== 'undefined')? new Date(inputDate.getTime()): new Date();

    //alert(firstOfYear);

    var arr = [];

    //alert(arr);

    for(i=0;i<numOfPoints;i++){
        var positionAndVelocity = SGP4.propogate(issSatRec, firstOfYear.getUTCFullYear(), firstOfYear.getUTCMonth() + 1, firstOfYear.getUTCDate(), firstOfYear.getUTCHours(), firstOfYear.getUTCMinutes(), firstOfYear.getUTCSeconds());
        var gmst = SGP4.gstimeFromDate(firstOfYear.getUTCFullYear(), firstOfYear.getUTCMonth() + 1, firstOfYear.getUTCDate(), firstOfYear.getUTCHours(), firstOfYear.getUTCMinutes(), firstOfYear.getUTCSeconds());
        var geodeticCoordinates = SGP4.eciToGeodetic(positionAndVelocity.position, gmst);

        //alert(JSON.stringify(geodeticCoordinates)); //returns {"longitude:" xxx, "latitude":xxx, "height":xxx, "velocity":xxx}

        var longitude2 = SGP4.degreesLong(geodeticCoordinates.longitude);
        var latitude2 = SGP4.degreesLat(geodeticCoordinates.latitude);

        var date = firstOfYear.getTime();
        var distance = 0;
        arr.push({latitude2, longitude2, date, distance});
        firstOfYear.setSeconds(firstOfYear.getSeconds()+1);

        if (i != 0){
            currLatLong = new google.maps.LatLng(arr[i - 1].latitude2, arr[i - 1].longitude2);
            nextLatLong = new google.maps.LatLng(arr[i].latitude2, arr[i].longitude2);
            headingBetweenPoints = google.maps.geometry.spherical.computeHeading(currLatLong, nextLatLong);
            arr[i-1].rot2 = headingBetweenPoints;
        }
    }

    //alert(arr);
    // alert("finish getflightpathpoints");
    return arr;
}

function CalcDistanceBetween(lat1, lon1, lat2, lon2) {
    //Radius of the earth in:  1.609344 miles,  6371 km  | var R = (6371 / 1.609344);
    var R = 3958.7558657440545; // Radius of earth in Miles

    var dLat = toRad(lat2-lat1);
    var dLon = toRad(lon2-lon1);

    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c; // distance in miles
    var d_km = d * 1.609344; // distance in km

    return d_km;
}


function toRad(Value) {
    /** Converts numeric degrees to radians */
    return Value * Math.PI / 180;
}

function checkIfInTaskBox(currentCoord) {
    var myPosition = new google.maps.LatLng(currentCoord.latitude2, currentCoord.longitude2);

    if (google.maps.geometry.poly.containsLocation(myPosition, taskBox)) {
        return true;
    }
    return false;
}

function checkIfInTestCircle(currentCoord) {
    var myPosition = new google.maps.LatLng(currentCoord.latitude2, currentCoord.longitude2);

    if (google.maps.geometry.poly.containsLocation(myPosition, testCircle)) {
        return true;
    }
    return false;
}

function checkIfInGSCircle(currentCoord) {
    var myPosition = new google.maps.LatLng(currentCoord.latitude2, currentCoord.longitude2);

    var circlePosition = new google.maps.LatLng(gsLat, gsLon);

    if (google.maps.geometry.spherical.computeDistanceBetween(myPosition, circlePosition) <= gsRadius) {
        //console.log("IN GS CIRCLE");
        return true;
    }
    //console.log("NOT IN GS CIRCLE");
    return false;
}

function showArrays(event) {
    // Since this polygon has only one path, we can call getPath() to return the
    // MVCArray of LatLngs.
    var vertices = this.getPath();

    var contentString = '<b>Task Box Coordinates</b><br>' +
        'Clicked location: <br>' + event.latLng.lat() + ',' + event.latLng.lng() +
        '<br>';

    // Iterate over the vertices.
    for (var i = 0; i < vertices.getLength(); i++) {
        var xy = vertices.getAt(i);
        contentString += '<br>' + 'Coordinate ' + i + ':<br>' + xy.lat() + ',' +
            xy.lng();
    }

    // Replace the info window's content and position.
    infoWindow.setContent(contentString);
    infoWindow.setPosition(event.latLng);

    infoWindow.open(taskMap);
}


function getPrediction(){
    console.log("before passes");
    const passes = PLib.getTodaysPasses(1);
    console.log(passes);
    const results = [];

    if(passes.length == 0){
        return false;
    }else {
        for (var i = 0; i < passes.length; i++) {

            passes[i]["LocalDateOfPass"] = PLib.formatDateOnly(passes[i]["dateTimeStart"]);
            passes[i]["LocalTimeOfPassStart"] = PLib.format24HOnly(passes[i]["dateTimeStart"]);
            results.push(passes[i]);

        }
    }

    if(results.length ==0){
        return [];
    }
    const results2 = [];
    let tempArr = [];
    tempArr.push(results[0]);
    for(i=1;i<results.length;i++){
        if(results[i]["name"] == results[i-1]["name"]){
            tempArr.push(results[i]);
        }else{
            // console.log("break");
            results2.push(tempArr);
            tempArr = [];
            tempArr.push(results[i]);
        }
    }
    results2.push(tempArr);

    // console.log(results2);

    const getPredResults = [];
    for(i=0;i<results2.length;i++){
        getPredResults.push({
            data:{
                name: results2[i][0]["name"],
                array: results2[i]
            }
        });
    }

    console.log(getPredResults);
    return simplifyResults(getPredResults)

}

function simplifyResults(results){
    var resultString = "";

    for (var i=0; i<results.length; i++){
        console.log(results[i].data.name);
        resultString += results[i].data.name;
        resultString += ": \n";
        for (var j=0; j< results[i].data.array.length; j++){
            console.log(results[i].data.array[j].dateTimeStart);
            resultString += (results[i].data.array[j].dateTimeStart);
            resultString += "\n";
        }
        resultString += "\n\n";
    }
    console.log(resultString);
    return resultString;

}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function drawCircle(point, radius, dir) {
    var d2r = Math.PI / 180;   // degrees to radians
    var r2d = 180 / Math.PI;   // radians to degrees
    var earthsradius = 3963*1609.34; // 3963 is the radius of the earth in miles, Multiply by 1609.34 to get radius in metres

    var points = 32;

    // find the raidus in lat/lon
    var rlat = (radius / earthsradius) * r2d;
    var rlng = rlat / Math.cos(point.lat() * d2r);

    var extp = new Array();
    if (dir==1) {
        var start=0;
        var end=points+1; // one extra here makes sure we connect the path
    } else {
        var start=points+1;
        var end=0;
    }
    for (var i=start; (dir==1 ? i < end : i > end); i=i+dir)
    {
        var theta = Math.PI * (i / (points/2));
        ey = point.lng() + (rlng * Math.cos(theta)); // center a + radius x * cos(theta)
        ex = point.lat() + (rlat * Math.sin(theta)); // center b + radius y * sin(theta)
        extp.push(new google.maps.LatLng(ex, ey));
    }
    return extp;
}

Template.Tasking.onRendered(function () {

});

// Default setting for plan task
var photosPerPass = 5;
var numDays = 7;
var cameraSize = 80; // in km
var overlapPercentage = 30;
var degGS = 15; // in deg
var degGSTR = 15; // in deg
var degGSTL = 15; // in deg
var degGSBL = 15; // in deg
var degGSBR = 15; // in deg

// Default setting for download task
var exposureTime = 150000;
var imageGain = 1;
var pixelFormat = 0;
var preambleAmount = 3;
var postambleAmount = 2;
var frequency = 2290;
var sps = 2;
var modulation = 0;
var txGain = 89.8;
var arbdl = 0;

Template.Tasking.events({
    'click .calculate-distance'(event, instance) {
        var p1lat = document.getElementById('p1lat').value;
        var p1lng = document.getElementById('p1lng').value;
        var p2lat = document.getElementById('p2lat').value;
        var p2lng = document.getElementById('p2lng').value;

        distanceOf2Points = CalcDistanceBetween(p1lat, p1lng, p2lat, p2lng);
        distanceOf2PointsDep.changed();
    },
    'change #selectSatGrpTask'(event, instance) {
        var activeSelected;
        // alert('change selectsatgrptask');
        $('#selectSatGrpTask option:selected').each(function(){
            activeSelected = $(this)[0].value;
            // alert('activeselected is ' + activeSelected);
            activeSatName = activeSelected;
        });
        // alert('before issline1 ' + issLine1);
        //need to update plib.tledata
        const isSucc = satellitesMap.changeActiveSat(activeSelected,PLib);
        // if(isSucc){
        //     satTrack();
        //     satNextPass();
        //     var snpinterval = function(){
        //         clearInterval(satNextPassInterval);
        //         var timer = satNextPass().los-(new Date());
        //         satNextPassInterval = Meteor.setInterval(snpinterval, timer);
        //     }
        //     satNextPassInterval = Meteor.setInterval(snpinterval, satNextPass().los-(new Date()));
        // }

        satTrack();
        //satNextPass();
    },

    'click .infoPasses' (event, instance){
        if (coordsPrint.length == 0) {
            alert("Please plan a task first!");
        }
        var elmnt = document.getElementById("ground_station_passes");
        elmnt.scrollIntoView();
    },

    'click .editPlanTaskDetails'(event, instance){

        popupS.confirm({
            content:                       '<div class="row">\n' +
                                            '<div class="form-group col-lg-4">\n' +
                '                                <h5>Number of days for mission</h5>\n' +
                '                                <select class="form-control" id="numDays">\n' +
                '                                    <option value="1">1</option>\n' +
                '                                    <option value="2">2</option>\n' +
                '                                    <option value="3">3</option>\n' +
                '                                    <option value="4">4</option>\n' +
                '                                    <option value="5">5</option>\n' +
                '                                    <option value="6">6</option>\n' +
                '                                    <option value="7">7</option>\n' +
                '                                    <option value="8">8</option>\n' +
                '                                </select>\n' +
                '                           </div>' +
                '                           <div class="form-group col-lg-4">\n' +
                '                                <h5>Number of photos per pass</h5>\n' +
                '                                <select class="form-control" id="numPhotos">\n' +
                '                                    <option value="1">1</option>\n' +
                '                                    <option value="2">2</option>\n' +
                '                                    <option value="3">3</option>\n' +
                '                                    <option value="4">4</option>\n' +
                '                                    <option value="5">5</option>\n' +
                '                                    <option value="6">6</option>\n' +
                '                                    <option value="7">7</option>\n' +
                '                                    <option value="8">8</option>\n' +
                '                                    <option>show all</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-4">\n' +
                '                                <h5>Camera size (in km)</h5>\n' +
                '                                <select class="form-control" id="cameraSize">\n' +
                '                                    <option value="60">60</option>\n' +
                '                                    <option value="70">70</option>\n' +
                '                                    <option value="80">80</option>\n' +
                '                                    <option value="90">90</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                                           '</div>\n' +
                '<div class="row">\n' +
                '                            <div class="form-group col-lg-4">\n' +
                '                                <h5>Overlap (in %)</h5>\n' +
                '                                <select class="form-control" id="overlapPercentage">\n' +
                '                                    <option value="20">20</option>\n' +
                '                                    <option value="30">30</option>\n' +
                '                                    <option value="40">40</option>\n' +
                '                                    <option value="50">50</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-4">\n' +
                '                                <!--degree of slant to form radius-->\n' +
                '                                <h5>Degree from GS (in deg)</h5>\n' +
                '                                <select class="form-control" id="degGS">\n' +
                '                                    <option value="10">10</option>\n' +
                '                                    <option value="15">15</option>\n' +
                '                                    <option value="20">20</option>\n' +
                '                                    <option value="25">25</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-4">\n' +
                '                                <!--degree of slant to form radius-->\n' +
                '                                <h5>Top Right Quadrant Degree from GS (in deg)</h5>\n' +
                '                                <select class="form-control" id="degGS1">\n' +
                '                                    <option value="10">10</option>\n' +
                '                                    <option value="15">15</option>\n' +
                '                                    <option value="20">20</option>\n' +
                '                                    <option value="25">25</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            </div>\n' +
                '<div class="row">\n' +
                '                            <div class="form-group col-lg-4">\n' +
                '                                <!--degree of slant to form radius-->\n' +
                '                                <h5>Top Left Quadrant Degree from GS (in deg)</h5>\n' +
                '                                <select class="form-control" id="degGS2">\n' +
                '                                    <option value="10">10</option>\n' +
                '                                    <option value="15">15</option>\n' +
                '                                    <option value="20">20</option>\n' +
                '                                    <option value="25">25</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-4">\n' +
                '                                <!--degree of slant to form radius-->\n' +
                '                                <h5>Bottom Left Quadrant Degree from GS (in deg)</h5>\n' +
                '                                <select class="form-control" id="degGS3">\n' +
                '                                    <option value="10">10</option>\n' +
                '                                    <option value="15">15</option>\n' +
                '                                    <option value="20">20</option>\n' +
                '                                    <option value="25">25</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-4">\n' +
                '                                <!--degree of slant to form radius-->\n' +
                '                                <h5>Bottom Right Quadrant Degree from GS (in deg)</h5>\n' +
                '                                <select class="form-control" id="degGS4">\n' +
                '                                    <option value="10">10</option>\n' +
                '                                    <option value="15">15</option>\n' +
                '                                    <option value="20">20</option>\n' +
                '                                    <option value="25">25</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            </div>\n' +
                '                        </div>',

            labelOk:     'Save',
            labelCancel: 'Cancel',
            onOpen: function(){
                document.getElementById('numPhotos').value = photosPerPass;
                document.getElementById('numDays').value = numDays;
                document.getElementById('cameraSize').value = cameraSize; // in km
                document.getElementById('overlapPercentage').value = overlapPercentage;
                document.getElementById('degGS').value = degGS; // in deg
                document.getElementById('degGS1').value = degGSTR; // in deg
                document.getElementById('degGS2').value = degGSTL; // in deg
                document.getElementById('degGS3').value = degGSBL; // in deg
                document.getElementById('degGS4').value = degGSBR; // in deg
            },
            onSubmit: function() {
                photosPerPass = document.getElementById('numPhotos').value;
                numDays = document.getElementById('numDays').value;
                cameraSize = document.getElementById('cameraSize').value; // in km
                overlapPercentage = document.getElementById('overlapPercentage').value;
                degGS = document.getElementById('degGS').value; // in deg
                degGSTR = document.getElementById('degGS1').value; // in deg
                degGSTL = document.getElementById('degGS2').value; // in deg
                degGSBL = document.getElementById('degGS3').value; // in deg
                degGSBR = document.getElementById('degGS4').value; // in deg
                console.log("user saved inputs: " + photosPerPass, numDays, cameraSize, overlapPercentage);
            },
            onClose: function() {
                console.log("user cancel inputs: " + photosPerPass, numDays, cameraSize, overlapPercentage);
            }
        });
    },

    'click .showTaskCoords'(event, instance){
        this.flightPathView = flightPathView.clearMap();
        satellitesMap.addGroundStationBoundary(degGS, degGSTR, degGSTL, degGSBL, degGSBR);
        console.log("user inputs: " + photosPerPass, numDays, cameraSize, overlapPercentage);
        getTaskCoords(photosPerPass, numDays, cameraSize, overlapPercentage);
        this.flightPathView = flightPathView.plotFlightPath(taskMap);
        if (coordsPrint.length != 0){
            alert("Finished Tasking!");
        }
    },
    'click .editDownloadTask'(event, instance){
        popupS.confirm({
            content:     '                <div class="col-lg-12 border-bottom m-b-sm">\n' +
                '                        <h4>Download Task</h4>\n' +
                '                         </div>\n' +
                '                        <div class="row">\n' +
                '                        <div class="form-group col-lg-3">\n' +
                '                            <h5>Exposure Time (microseconds):</h5>\n' +
                '                            <input class="form-control" type="number" id="exposureTime" min="0" max="500000" value="150000">\n' +
                '                        </div>\n' +
                '                        <div class="form-group col-lg-3">\n' +
                '                            <h5>Image Gain:</h5>\n' +
                '                            <select class="form-control" id="imageGain">\n' +
                '                                <option value="1">1</option>\n' +
                '                                <option value="2">2</option>\n' +
                '                                <option value="3">3</option>\n' +
                '                                <option value="4">4</option>\n' +
                '                                <option value="5">5</option>\n' +
                '                                <option value="6">6</option>\n' +
                '                                <option value="7">7</option>\n' +
                '                                <option value="8">8</option>\n' +
                '                                <option value="9">9</option>\n' +
                '                                <option value="10">10</option>\n' +
                '                            </select>\n' +
                '                        </div>\n' +
                '                        <div class="form-group col-lg-3">\n' +
                '                            <h5>Pixel Format:</h5>\n' +
                '                            <select class="form-control" id="pixelFormat">\n' +
                '                                <option value="0">mono12p</option>\n' +
                '                                <option value="1">mono10p</option>\n' +
                '                                <option value="2">mono8p</option>\n' +
                '                            </select>\n' +
                '                        </div>\n' +
                '                    </div>\n' +
                '                    <div class="col-lg-12 border-bottom m-b-sm">\n' +
                '                        <h4>Download Downlink Task</h4>\n' +
                '                    </div>\n' +
                '                    <div class="row">\n' +
                '                        <div class="row padding">\n' +
                '                            <div class="form-group col-lg-3">\n' +
                '                                <h5>Preamble Amount:</h5>\n' +
                '                                <select class="form-control" id="preambleAmount">\n' +
                '                                    <option value="1">1</option>\n' +
                '                                    <option value="2">2</option>\n' +
                '                                    <option value="3">3</option>\n' +
                '                                    <option value="4">4</option>\n' +
                '                                    <option value="5">5</option>\n' +
                '                                    <option value="6">6</option>\n' +
                '                                    <option value="7">7</option>\n' +
                '                                    <option value="8">8</option>\n' +
                '                                    <option value="9">9</option>\n' +
                '                                    <option value="10">10</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-3">\n' +
                '                                <h5>Postamble Amount:</h5>\n' +
                '                                <select class="form-control" id="postambleAmount">\n' +
                '                                    <option value="2">2</option>\n' +
                '                                    <option value="3">3</option>\n' +
                '                                    <option value="4">4</option>\n' +
                '                                    <option value="5">5</option>\n' +
                '                                    <option value="6">6</option>\n' +
                '                                    <option value="7">7</option>\n' +
                '                                    <option value="8">8</option>\n' +
                '                                    <option value="9">9</option>\n' +
                '                                    <option value="10">10</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-3">\n' +
                '                                <h5>Frequency (MHz): </h5>\n' +
                '                                <input class="form-control" type="number" id="frequency" min="2200" max="2290" value="2290">\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-3">\n' +
                '                                <h5>SPS:</h5>\n' +
                '                                <select class="form-control" id="sps">\n' +
                '                                    <option value="2">2</option>\n' +
                '                                    <option value="4">4</option>\n' +
                '                                    <option value="5">5</option>\n' +
                '                                    <option value="8">8</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                        </div>\n' +
                '                        <div class="row padding">\n' +
                '                            <div class="form-group col-lg-3">\n' +
                '                                <h5>Modulation:</h5>\n' +
                '                                <select class="form-control" id="modulation">\n' +
                '                                    <option value ="0">bpsk</option>\n' +
                '                                    <option value="1">qpsk</option>\n' +
                '                                </select>\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-3">\n' +
                '                                <h5>txGain(dB): </h5>\n' +
                '                                <input class="form-control" type="number" id="txGain" min="2200" max="50" value="89.8">\n' +
                '                            </div>\n' +
                '                            <div class="form-group col-lg-3">\n' +
                '                                <h5>arbDL:</h5>\n' +
                '                                <select class="form-control" id="arbdl">\n' +
                '                                    <option value="0">Non-arbitrary</option>\n' +
                '                                    <option value="1">Arbitrary</option>\n' +
                '                                    <option value="2">Multiple</option>\n' +
                '                                </select>\n' +
                '                            </div>',
            labelOk:     'Save',
            labelCancel: 'Cancel',
            onOpen: function(){
                document.getElementById('exposureTime').value = exposureTime;
                document.getElementById('imageGain').value = imageGain;
                document.getElementById('pixelFormat').value = pixelFormat;
                document.getElementById('preambleAmount').value = preambleAmount;
                document.getElementById('postambleAmount').value = postambleAmount;
                document.getElementById('frequency').value = frequency;
                document.getElementById('sps').value = sps;
                document.getElementById('modulation').value = modulation;
                document.getElementById('txGain').value = txGain;
                document.getElementById('arbdl').value = arbdl;
            },
            onSubmit: function() {
                exposureTime = document.getElementById('exposureTime').value;
                imageGain = document.getElementById('imageGain').value;
                pixelFormat = document.getElementById('pixelFormat').value;
                preambleAmount = document.getElementById('preambleAmount').value;
                postambleAmount = document.getElementById('postambleAmount').value;
                frequency = document.getElementById('frequency').value;
                sps = document.getElementById('sps').value;
                modulation = document.getElementById('modulation').value;
                txGain = document.getElementById('txGain').value;
                arbdl = document.getElementById('arbdl').value;
                console.log("user saved inputs: " + exposureTime, imageGain, pixelFormat, preambleAmount);
            },
            onClose: function() {
                console.log("user cancel inputs: " + exposureTime, imageGain, pixelFormat, preambleAmount);
            }
        });
    },
    'click .downloadTask'(event, instance){
        if (coordsPrint.length == 0){
            alert("Please plan a task first!");
        }
        var date = Math.round((new Date()).getTime() / 1000);
        var downlinkTime = timingGS[0].start.getTime() / 1000;


        // Error Prevention

        if (exposureTime <0 || exposureTime > 500000){
            alert("Exposure time must be between 0 - 500000 microseconds!");
        }
        else if (frequency <2200 || frequency > 2290){
            alert("Frequency must be between 2200 - 2290 MHz!");
        }
        else if (txGain<50 || txGain > 89.8){
            alert("txGain must be between 50 - 89.8 dB!");
        }
        else {
            // IMAGING
            frequency *= 1000000;
            var uid = Meteor.userId();

            var text = "";
            var beginningDate;
            var indexOfBeginningDate;
            var timeInterval = 0;
            var numPhotos = 0;
            var firstPhoto = true;
            var tempTime = 0;
            var firstPass = true;

            // we are comparing the list of indexes (beginning and end) with the coordsPrint array, if it matches,
            // put it in the text file
            console.log(listOfIndexes);

            //only want the first one for now
            beginningDate = allCoords[listOfIndexes[0].beginning].date / 1000;
            numPhotos = document.getElementById('numPhotos').value;
            console.log("BEGIN DATE!!! " + beginningDate);

            for (var i=0; i<listOfIndexes.length; i++){
                //becca's original code [just fbi]
                tempTime = allCoords[listOfIndexes[i].beginning].date;


                for (var j=0; j < coordsPrint.length-1; j++){
                    //console.log("coodprint date is " + (coordsPrint[j].date).getTime());

                    // is the tempTime from allCoords == coordsPrint?
                    if (tempTime == (coordsPrint[j].date).getTime()) {
                        console.log("temptime: " + tempTime);
                        // check for second photo in pass. if it is, print number of photos and timeinterval
                        // if (firstPhoto == false && j!=0){
                        //     console.log("Here " + (coordsPrint[j-1].date).getTime());
                        //     numPhotos = j - indexOfBeginningDate; THIS IS FOR GETTING ALL PHOTOS
                        //     text += "hello";
                        //     text += numPhotos;
                        //     text += " ";
                        //     text += timeInterval;
                        //     text += "\n";
                        //     //firstPhoto = true;
                        //     Meteor.call('update-new-pass-info', uid, numPhotos, timeInterval, (coordsPrint[j-1].date).getTime()/1000);
                        //     break;
                        // }

                        console.log(tempTime/1000);
                        // from here onwards: first photo of pass
                        text += tempTime;
                        text += " ";
                        indexOfBeginningDate = j;

                        //console.log((coordsPrint[j+1].date).getTime() + ",  " + beginningDate + ",  " + (coordsPrint[j+1].date - beginningDate));
                        // if time between pictures is more that 30s (30000ms), new task
                        if ((coordsPrint[j+1].date).getTime() - tempTime < 30000){
                            timeInterval = (coordsPrint[j+1].date).getTime() - tempTime;
                            console.log("time interval: " + timeInterval);
                        }

                        if (firstPass == true){
                            /// TEST DATABASE HERE
                            Meteor.call('update-new-task-info-image',uid, tempTime/1000, numPhotos, timeInterval, exposureTime, imageGain,
                                pixelFormat, downlinkTime, preambleAmount, postambleAmount, frequency, sps,
                                modulation, txGain, arbdl);
                            firstPass = false;
                        } else {
                            Meteor.call('update-new-task-pass-info',uid, tempTime/1000, numPhotos, timeInterval);
                        }


                        //Meteor.call('update-new-pass-info', uid,tempTime,numPhotos,timeInterval, );
                        firstPhoto = false;
                    }

                }
                firstPhoto = true;

                // if it is the first photo, break out of checking loop
                // if (firstPhoto == true){
                //     break;
                // }



            }

            // other user defined parameters
            text += "Exposure Time: " + exposureTime + "\n";
            text += "Image Gain: " + imageGain + "\n";
            text += "Pixel Format: " + pixelFormat + "\n";
            download(date + '_Imaging.txt', text);





            ///// DOWNLINK
            // this is all the start times in 1 file
            var text = "";

            // other user defined parameters
            text += "downlinkTime: " + downlinkTime + "\n";
            text += "preambleAmount: " + preambleAmount + "\n";
            text += "postambleAmount: " + postambleAmount + "\n";
            text += "frequency: " + frequency + "\n";
            text += "sps: " + sps + "\n";
            text += "modulation: " + modulation + "\n";
            text += "txGain: " + txGain + "\n";
            text += "arbdl: " + arbdl + "\n";
            download(date + '_Downlink.txt', text);






        }

    },






    /*
    'click .downloadImagingTask'(event, instance){
        var date = Math.round((new Date()).getTime() / 1000);

        ///// this is all the human  made constraints
        //
        // var photosPerPass = document.getElementById('numPhotos').value;
        // var numDays = document.getElementById('numDays').value;
        // var cameraSize = document.getElementById('cameraSize').value; // in km
        // var overlapPercentage = document.getElementById('overlapPercentage').value;
        // var space = " ";
        // var text =  photosPerPass.concat(space, numDays, space, cameraSize, space, overlapPercentage);
        // download(date + '.txt', text);

        var exposureTime = document.getElementById('exposureTime').value;
        var imageGain = document.getElementById('imageGain').value;
        var pixelGain = document.getElementById('pixelGain').value;

        if (exposureTime <0 || exposureTime > 500000){
            alert("Exposure time must be between 0 - 500000 microseconds!");
        }
        else if (coordsPrint.length == 0){
            alert("Please plan a task first!");
        }
        else {
            ///// this is all the start times in 1 file
            var text = "";
            var beginningDate;
            var indexOfBeginningDate;
            var timeInterval = 0;
            var numPhotos = 0;
            // we are comparing the list of indexes (beginning and end) with the coordsPrint array, if it matches,
            // put it in the text file
            console.log(listOfIndexes);
            for (var i=0; i<listOfIndexes.length; i++){
                beginningDate = allCoords[listOfIndexes[i].beginning].date;

                for (var j=0; j < coordsPrint.length; j++){
                    //console.log("coodprint date is " + (coordsPrint[j].date).getTime());

                    if (beginningDate == (coordsPrint[j].date).getTime()) {
                        if (text != ""){
                            numPhotos = j - indexOfBeginningDate;

                            text += numPhotos;
                            text += " ";
                            text += timeInterval;
                            text += "\n";
                        }
                        text += beginningDate;
                        text += " ";
                        indexOfBeginningDate = j;

                        //console.log((coordsPrint[j+1].date).getTime() + ",  " + beginningDate + ",  " + (coordsPrint[j+1].date - beginningDate));
                        // if time between pictures is more that 30s (30000ms), new task
                        if ((coordsPrint[j+1].date).getTime() - beginningDate < 30000){
                            timeInterval = (coordsPrint[j+1].date).getTime() - beginningDate;
                        }
                    }

                }

            }
            text += coordsPrint.length - indexOfBeginningDate;
            text += " ";
            text += timeInterval;
            text += "\n";

            // other user defined parameters
            text += "Exposure Time: " + exposureTime + "\n";
            text += "Image Gain: " + imageGain + "\n";
            text += "Pixel Gain: " + pixelGain + "\n";
            download(date + '_Imaging.txt', text);
        }

    },
    'click .downloadDownlinkTask'(event, instance){
        var date = Math.round((new Date()).getTime() / 1000);

        var preambleAmount = document.getElementById('preambleAmount').value;
        var postambleAmount = document.getElementById('postambleAmount').value;
        var frequency = document.getElementById('frequency').value;
        var sps = document.getElementById('sps').value;
        var modulation = document.getElementById('modulation').value;
        var txGain = document.getElementById('txGain').value;
        var arbdl = document.getElementById('arbdl').value;

        // Error Prevention
        if (frequency <2200 || frequency > 2290){
            alert("Frequency must be between 2200 - 2290 MHz!");
        }
        else if (txGain<50 || txGain > 89.8){
            alert("txGain must be between 50 - 89.8 dB!");
        }
        else {
            ///// this is all the start times in 1 file
            var text = "";

            // other user defined parameters
            text += "preambleAmount: " + preambleAmount + "\n";
            text += "postambleAmount: " + postambleAmount + "\n";
            text += "frequency: " + frequency + "\n";
            text += "sps: " + sps + "\n";
            text += "modulation: " + modulation + "\n";
            text += "txGain: " + txGain + "\n";
            text += "arbdl: " + arbdl + "\n";
            download(date + '_Downlink.txt', text);
        }

    },
    */




    'click .sendEmail'(event, instance){
        var uid = Meteor.user();
        console.log(uid);
        //var results = getPrediction();
        Meteor.call('sendEmail', function (err, response){});
    },



});



Template.Tasking.onCreated(function bodyOnCreated() {
    Session.set('tle_loaded', false);
    Session.set('activesetting_loaded', false);
    Meteor.subscribe('activesetting', function () {
        Session.set('activesetting_loaded', true);
    });
    Meteor.subscribe('location');
    Meteor.subscribe('satgroup');
    Meteor.subscribe('tle', function () {
        Session.set('tle_loaded', true);
    });
    Meteor.subscribe('currenttaskinformation');
    Meteor.subscribe('passinformation');

    Meteor.setTimeout(SetTLEData, 1800);
    var finishFlightPathInit = false;
    // Meteor.setTimeout(SetChartAndParams,1900);

    Session.setDefault('satOnTrackState', 0);
    GoogleMaps.ready('gMapViewTask', function (map) {
        taskMap = map.instance;
        satellitesMap.init();
        satellitesMap.addTaskBox();

        updateMapInterval = Meteor.setInterval(UpdateMap,100);

    });

    function UpdateMap() {
        //alert("here in update map! :-)");
        if(satellitesMap.isDataReady()){
            //this else is for updating location of current selected sat
            //alert("mapui update map if sat marker data ready if isotherinit");
            //this.activeSat.marker.setPosition(position);
            if (!finishFlightPathInit) {
                flightPathView = flightPathView.init(taskMap);
                finishFlightPathInit = true;
            } else {

            }
            // this else is for when satellite data is not ready yet
        }else{
            satellitesMap.init();

        }
    }

    // /*
    // Initialization of interval
    // Updates polar chart after a pass
    // */
    // function SetChartAndParams(){
    //     satTrack();
    //     satNextPass();
    //     satTrackInterval = Meteor.setInterval(satTrack, 1000);
    //     var snpinterval = function(){
    //         clearInterval(satNextPassInterval);
    //         var timer = satNextPass().los-(new Date());
    //         satNextPassInterval = Meteor.setInterval(snpinterval, timer);
    //
    //     }
    //     satNextPassInterval = Meteor.setInterval(snpinterval, satNextPass().los-(new Date()));
    // }

    /*
    Retrieve profile data
    */
    function SetTLEData() {
        var storage = [];
        var uid = Meteor.userId();
        if (uid) {
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if (settings.length != 0) {
                var grpname = SatGroup.find({_id: settings[0].idSatGrp}).fetch();
                var satId = grpname[0].satid;
                for (var i = 0; i < satId.length; i++) {
                    var satData = TLE.find({_id: satId[i]}).fetch()[0];
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

Template.Tasking.onDestroyed(function () {
    //clearInterval(satTrackInterval);
    //clearInterval(satNextPassInterval); //Commented these out as they cause an exception error because apparently it destroys something
    clearInterval(updateMapInterval);
    //clearInterval(updateMapIntervalLonger);
});

//googleMap name="gMapViewTask"
var flightPathView = {
    date:null,
    flightPath:[], //current flight path
    numOfPasses:null, //number of future passes
    nite: null,
    flightPathRect:[],
    flightPathSnippets:[], //flight path for each intersecting path
    flightPathSnippets_Day:[],
    flightPathSnippets_Night:[],
    init:function(map,date){

        //alert("in flightpathview init")

        this.nite = nite.init(taskMap);
        this.nite.initTerminator(taskMap);
        //alert("finish initterminator");
        this.coverageCircle = new google.maps.Circle({
            strokeColor: '#F5FFFA',
            strokeWeight: 2,
            fillOpacity: 0,
            map: taskMap,
            //center: currentLocData[0],
            radius: 2700000
        });
        var sunPos = nite.calculatePositionOfSun();
        //alert("calc sunpos finish");
        var markerImage = new google.maps.MarkerImage('sunny-icon.png',//'/sun.bmp',
            new google.maps.Size(30, 30),
            new google.maps.Point(0, 0),
            new google.maps.Point(15, 15));
        this.sunMarker = new google.maps.Marker({
            position: sunPos,
            icon: markerImage,
            map: taskMap
        });
        this.setDate(date);
        //alert("finish flightpathview init");
        return this;
    },
    plotFlightPath: function() {
        //alert("in plot flight path");
        this.setDate(this.date);
        // for (var i = 0; i < listOfIndexes.length; i++) {
        //     console.log("line " + i);
        //     this.generateFlightPath(i);
        // }
        this.generateFlightPath(0);
        //this.generateFutureFlightPath();
    },
    getDate: function(){
        var tempDate = new Date(this.date.getTime());
        return tempDate;
    },
    //Setting date will automatically update to the new points
    setDate: function(date){
        //alert("in set date")
        this.date = (typeof date !== 'undefined')?new Date(date.getTime()):new Date();

    },
    //call this function for live update
    liveUpdate: function(){
        this.setDate(new Date());
    },
    generateFlightPath: function(pathNum){
        // // alert("in generate flight path")
        // var requiredDate = this.getDate();
        // console.log(requiredDate);
        // //var testDate = allCoords[listOfIndexes[pathNum].beginning].date;
        // //var testToDate = new Date(testDate);
        // //console.log(testToDate);
        // //end - start + 50, requireddate will become a few coords before start date
        // //var flightPathPoints = getFlightPathPoints(indexOfEndingCoord + 100,requiredDate, issLine1, issLine2);
        // //var flightPathPoints = getFlightPathPoints(listOfIndexes[pathNum].end + 100, allCoords[listOfIndexes[pathNum].beginning].date, issLine1, issLine2);
        //
        // console.log(listOfIndexes[pathNum].end);
        // var flightPathPoints = getFlightPathPoints(listOfIndexes[pathNum].end + 100, requiredDate, issLine1, issLine2);
        // //alert(JSON.stringify(flightPathPoints));
        // var shadowPos = nite.getShadowPositionAtParticularDate(requiredDate);
        // var shadowRadiusLarge = nite.getShadowRadiusFromAngle(12);
        // var shadowRadiusSmall = nite.getShadowRadiusFromAngle(18);
        //
        // var numPath = 0;
        //
        // console.log(listOfIndexes[pathNum].beginning);
        // // for(var i=indexOfBeginningCoord - 100;i<flightPathPoints.length;i++){
        // for(var i=listOfIndexes[pathNum].beginning - 100;i<flightPathPoints.length;i++){
        //
        //     if(this.getDistanceBetween(new google.maps.LatLng(flightPathPoints[i].latitude2, flightPathPoints[i].longitude2),shadowPos)<shadowRadiusLarge){
        //         var redLine = [];
        //         //alert("A");
        //         while(flightPathPoints.length>i&&this.getDistanceBetween(new google.maps.LatLng(flightPathPoints[i].latitude2, flightPathPoints[i].longitude2),shadowPos)<shadowRadiusLarge){
        //             redLine.push(new google.maps.LatLng(flightPathPoints[i].latitude2, flightPathPoints[i].longitude2));
        //             i++;
        //         }
        //         // if(numPath < this.flightPath.length){
        //         //     this.flightPath[numPath].setPath(redLine);
        //         //     this.flightPath[numPath].setOptions({strokeColor: '#FF0000'});
        //         //     this.flightPath[numPath].setMap(taskMap);
        //         // }else{
        //         this.flightPath.push( new google.maps.Polyline({
        //                 path: redLine,
        //                 geodesic: true,
        //                 strokeColor: '#FF0000',
        //                 strokeOpacity: 1.0,
        //                 strokeWeight: 2,
        //                 map:taskMap
        //             })
        //         )
        //
        //         numPath++;
        //         redLine = [];
        //     }
        //
        // }
        //
        // console.log(listOfIndexes[pathNum].beginning);
        // // for(var i=indexOfBeginningCoord - 100;i<flightPathPoints.length;i++){
        // for(var i=listOfIndexes[pathNum].beginning - 100;i<flightPathPoints.length;i++){
        //     if(flightPathPoints.length>i&&this.getDistanceBetween(new google.maps.LatLng(flightPathPoints[i].latitude2, flightPathPoints[i].longitude2),shadowPos)>shadowRadiusSmall){
        //         var yellowLine = [];
        //         while(flightPathPoints.length>i&&this.getDistanceBetween(new google.maps.LatLng(flightPathPoints[i].latitude2, flightPathPoints[i].longitude2),shadowPos)>shadowRadiusSmall){
        //             yellowLine.push(new google.maps.LatLng(flightPathPoints[i].latitude2, flightPathPoints[i].longitude2));
        //             i++;
        //         }
        //         // if(numPath<this.flightPath.length){
        //         //     this.flightPath[numPath].setPath(yellowLine);
        //         //     this.flightPath[numPath].setOptions({strokeColor: '#FFD700'});
        //         //     this.flightPath[numPath].setMap(taskMap)
        //         // }else{
        //
        //         this.flightPath.push( new google.maps.Polyline({
        //                 path: yellowLine,
        //                 geodesic: true,
        //                 strokeColor: '#FFD700',
        //                 strokeOpacity: 1.0,
        //                 strokeWeight: 2,
        //                 map: taskMap
        //             })
        //         )
        //
        //         numPath++;
        //     }
        // }
        // var len = this.flightPath.length;
        // //alert("len is " + len);
        // for(var i=numPath;i<len;i++){
        //     this.flightPath[numPath].setMap(null);
        //     this.flightPath.splice(numPath,1);
        // }
        // // alert("fin gen flight path");
    },

    clearMap: function(){
        for(var i=0;i<this.flightPath.length;i++){
            this.flightPath[i].setMap(null);
        }

        for(var i=0;i<flightPathView.flightPathRect.length;i++){
            this.flightPathRect[i].setMap(null);
        }

        // for(var i=0;i<flightPathView.flightPathSnippets.length;i++){
        //     this.flightPathSnippets[i].setMap(null);
        // }

        for(var i=0;i<flightPathView.flightPathSnippets_Day.length;i++){
            this.flightPathSnippets_Day[i].setMap(null);
        }

        for(var i=0;i<flightPathView.flightPathSnippets_Night.length;i++){
            this.flightPathSnippets_Night[i].setMap(null);
        }

        this.flightPath = [];
        this.flightPathRect = [];
        this.flightPathSnippets = [];
        this.flightPathSnippets_Day = [];
        this.flightPathSnippets_Night = [];

        coordsPhotos = [];
        coordsDraw = [];
        coordsPrint = [];
        allCoords = [];
        timingGS = [];

        if (testCircle) {
            testCircle.setMap(null);
        }

        if (gsCircle) {
            gsCircle.setMap(null);
        }

        // alert("cleared!");
    },

    // todo: THE NAMES ARE WRONG!!!! EDIT AFTER PRESENTATION
    drawRect(lat, lng, heading, width, height) {
        var degreeNorth = 0;
        var degreeSouth  = -90;
        var degreeWest = 180;
        var degreeEast  = 90;


        var center = new google.maps.LatLng(lat, lng);

        var north = google.maps.geometry.spherical.computeOffset(center, height / 2, degreeNorth);
        var south = google.maps.geometry.spherical.computeOffset(center, height / 2, degreeWest);

        var northEast = google.maps.geometry.spherical.computeOffset(north, width / 2, degreeEast);
        var northWest = google.maps.geometry.spherical.computeOffset(north, width / 2, degreeSouth);

        var southEast = google.maps.geometry.spherical.computeOffset(south, width / 2, degreeEast);
        var southWest = google.maps.geometry.spherical.computeOffset(south, width / 2, degreeSouth);

        var corners = [northEast, northWest, southWest, southEast];

        var newcorners = [ rotatePoint(northEast, center, heading), rotatePoint(northWest, center, heading), rotatePoint(southWest, center, heading), rotatePoint(southEast, center, heading) ];



        this.flightPathRect.push(new google.maps.Polygon({
                paths: newcorners,
                strokeColor: '#4BFF00',
                strokeOpacity: 0.9,
                strokeWeight: 2,
                fillOpacity: 0.1,
                map: taskMap,
                geodesic: true
            })
        )


    },

    drawPaths(startIndex, endIndex) {
        //console.log("drawing path for index: " + startIndex + ", " + endIndex);

        var passPath = [];
        var dayPath = [];
        var nightPath = [];

        for (var i=startIndex; i<=endIndex; i++) {

            // passPath.push({
            //     lat: allCoords[i].latitude2,
            //     lng: allCoords[i].longitude2,
            // });

            //get position of shadow at the instance (date) of the coordinate
            var shadowPos = nite.getShadowPositionAtParticularDate(convertEpochTime(allCoords[i].date));
            //console.log("allCoords date: " + allCoords[i].date);
            var shadowRadiusLarge = nite.getShadowRadiusFromAngle(12);
            var shadowRadiusSmall = nite.getShadowRadiusFromAngle(18);

            //check if the coordinate is not in daylight
            //TODO: should we use small or large here?
            if (flightPathView.getDistanceBetween(new google.maps.LatLng(allCoords[i].latitude2, allCoords[i].longitude2),shadowPos) > shadowRadiusSmall) {
                dayPath.push({
                    lat: allCoords[i].latitude2,
                    lng: allCoords[i].longitude2,
                });
            }

            else { //if (flightPathView.getDistanceBetween(new google.maps.LatLng(allCoords[i].latitude2, allCoords[i].longitude2),shadowPos) < shadowRadiusSmall){
                nightPath.push({
                    lat: allCoords[i].latitude2,
                    lng: allCoords[i].longitude2,
                });
            }
        }

        // this.flightPathSnippets.push(new google.maps.Polyline({
        //         path: passPath,
        //         strokeColor: '#FFD700',
        //         strokeOpacity: 1.0,
        //         strokeWeight: 2,
        //         map: taskMap,
        //         geodesic: true
        //     })
        // )

        this.flightPathSnippets_Day.push(new google.maps.Polyline({
                path: dayPath,
                strokeColor: '#FFD700',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: taskMap,
                geodesic: true
            })
        )

        this.flightPathSnippets_Night.push(new google.maps.Polyline({
                path: nightPath,
                strokeColor: '#FF0000',
                strokeOpacity: 1.0,
                strokeWeight: 2,
                map: taskMap,
                geodesic: true
            })
        )
    },

    rad:function(x) {
        return x * Math.PI / 180;
    },
    //Computes distance between two points
    getDistanceBetween:function(p1, p2) {
        var R = 6371008; //Earth's mean radius in meters
        var dLat = this.rad(p2.lat() - p1.lat());
        var dLong = this.rad(p2.lng() - p1.lng());
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.rad(p1.lat())) * Math.cos(this.rad(p2.lat())) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meters
    },
    setMap: function(map){
        for(i=0;i<this.flightPath.length;i++){
            this.flightPath[i].setMap(map);
        }
    },
    show: function(){
        for(i=0;i<this.flightPath.length;i++){
            this.flightPath[i].setVisible(true);
        }
    },
    refreshMapView: function (dateTimeStart){
        var locationData = getFlightPathPoints(1,dateTimeStart);
        this.nite.setDate(dateTimeStart);
        this.sunMarker.setPosition(nite.calculatePositionOfSun(dateTimeStart));
        this.coverageCircle.setCenter(locationData[0]);
        this.satelliteMarkers.updateAccordingToDate(dateTimeStart);
        //marker.setPosition(locationData[0]);
        this.flightPathView.setDate(dateTimeStart);

    },
    //set number of future flight passes
    setNumOfPasses(num){
        this.numOfPasses = num;
        this.setDate(this.date);
    },
}


var satellitesMap = {
    otherSat:[], //Other satellites in the satellite group but not selected
    activeSat: null, //Selected satellite in the satellite group
    satDate:null,
    init: function(){
        // alert('inside init');

        this.otherSat = [];
        this.activeMarker = null;
        //Find user's satellite settings data
        var uid = Meteor.userId();
        //Check if it is a valid user
        if(uid){
            //Check if necessary data is available before creating marker
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if(settings.length != 0){
                var activeData;
                var otherData = [];
                //Match IDs of Satellite Group in SatGroup (_id) and ActiveSetting (idSatGroup) Collections
                //settings[0] is used because a user should only have 1 set of corresponding ActiveSettings
                var grpname = SatGroup.find({_id: settings[0].idSatGrp}).fetch();
                //Get list of Satellites in Satellite Group
                //grpname[0] is used as there is only 1 Satellite Group for the particular Sat Group ID
                var satIdList = grpname[0].satid;
                var data = TLE.find({}).fetch();

                for(var i=0; i < data.length; i++) {
                    data[i].display = true;
                    //If CelesTrak database sat ID matches selected sat ID
                    if(data[i]._id == satIdList[0]){
                        //activeData represents current satellite's data from CelesTrak TLE database
                        activeData = {name:data[i].name,line1:data[i].line1,line2:data[i].line2};
                        //Pass name, TLEs into PLib to predict satellite movement/position
                        PLib.tleData = [[data[i].name,data[i].line1,data[i].line2]]
                    }
                    for(j = 1;j<satIdList.length;j++){

                        data[i].display = true;
                        if(data[i]._id == satIdList[j]){


                            otherData.push({name:data[i].name,line1:data[i].line1,line2:data[i].line2})
                        }
                    }
                }

                if(activeData!=null&&otherData.length == satIdList.length-1){
                    issLine1 = activeData.line1;
                    issLine2 = activeData.line2;
                    //alert("sat map init issline1 " + issLine1);
                    //alert("sat map init issline2 " + issLine2);
                    activeSatName = activeData.name;
                    this.createActiveSat(activeData.name);

                    for(i=0;i<otherData.length;i++){
                        this.createOtherSat(otherData[i].name,otherData[i].line1,otherData[i].line2);
                    }

                }
                var locname = Location.find({_id: settings[0].idLoc}).fetch();

                activeGSName = locname[0].name;

                //mapui has the defaultlocation = null
                if(locname.length != 0){
                    //return locname[0].display;
                    var markerImage = new google.maps.MarkerImage('/grdStation.png',
                        new google.maps.Size(22, 22),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(11, 11));

                    // Marker represents groundstation
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(locname[0].lat,locname[0].lon),
                        icon: markerImage,
                        map: taskMap,
                        label: activeGSName,
                        // label:'active'
                    });





                    PLib.configureGroundStation(locname[0].lat, locname[0].lon);
                }


            }
        }

        // alert('done init satellitesmap');
    },

    addGroundStationBoundary: function (degGS, degGSTR, degGSTL, degGSBL, degGSBR){
        //Find user's satellite settings data
        var uid = Meteor.userId();
        var settings = ActiveSetting.find({idUser: uid}).fetch();
        var locname = Location.find({_id: settings[0].idLoc}).fetch();

        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(locname[0].lat,locname[0].lon),
            map: taskMap,
            label: "Active GS",
            visible: false,
            // label:'active'
        });

        // Find altitude of satellite
        var track = PLib.liveTrack();
        var altitude = track.alt.toFixed(0);
        //alert("ALTITUDE " + altitude);

        // Add a radius to the groundstation which defines the area that is allows tx/rx to occur
        // Radius in m found using sine rule, after calculating altitude of groundstation TODO: (Is this constant though?)
        // http://www.bbc.co.uk/schools/gcsebitesize/maths/geometry/furthertrigonometryhirev1.shtml
        // Math.sin input is in radians
        // degGS is the angle from ground to clear line of sight of groundstation
        var groundstationRadius = (Math.sin((90-degGS)*0.01745329252) / Math.sin(degGS*0.01745329252)) * altitude * 1000; //TODO: change '60' to use defined input
        gsRadius = groundstationRadius;

        // T = Top, B = Bottom, R = Right, L = Left
        var groundstationTRRadius = (Math.sin((90-degGSTR)*0.01745329252) / Math.sin(degGSTR*0.01745329252)) * altitude * 1000;
        var groundstationTLRadius = (Math.sin((90-degGSTL)*0.01745329252) / Math.sin(degGSTL*0.01745329252)) * altitude * 1000;
        var groundstationBLRadius = (Math.sin((90-degGSBL)*0.01745329252) / Math.sin(degGSBL*0.01745329252)) * altitude * 1000;
        var groundstationBRRadius = (Math.sin((90-degGSBR)*0.01745329252) / Math.sin(degGSBR*0.01745329252)) * altitude * 1000;





        gsLat = locname[0].lat;
        gsLon = locname[0].lon;

        //alert("degGS = " + degGS);
        //alert("Radius (m) = " + groundstationRadius);

        gsCircle = new google.maps.Circle({
            map: taskMap,
            //center: new google.maps.LatLng(locname[0].lat,locname[0].lon),
            //center: {lat: locname[0].lat, lng: locname[0].lon},
            radius: groundstationRadius,    // 10 miles in metres
            fillColor: '#FF0000'
        });
        gsCircle.bindTo('center', marker, 'position');

        var circleArray = drawCircle(new google.maps.LatLng(gsLat, gsLon), groundstationTRRadius, 1);
        var quarterLength = Math.ceil(circleArray.length/4);
        var topRightQuadrant = circleArray.slice(0,quarterLength);

        circleArray = drawCircle(new google.maps.LatLng(gsLat, gsLon), groundstationTLRadius, 1);
        quarterLength = Math.ceil(circleArray.length/4);
        var topLeftQuadrant = circleArray.slice(quarterLength-1,(quarterLength*2)-1);

        circleArray = drawCircle(new google.maps.LatLng(gsLat, gsLon), groundstationBLRadius, 1);
        quarterLength = Math.ceil(circleArray.length/4);
        var botLeftQuadrant = circleArray.slice((quarterLength*2)-2,(quarterLength*3)-2);

        circleArray = drawCircle(new google.maps.LatLng(gsLat, gsLon), groundstationBRRadius, 1);
        quarterLength = Math.ceil(circleArray.length/4);
        var botRightQuadrant = circleArray.slice((quarterLength*3)-3,(quarterLength*4));

        circleArray = topRightQuadrant.concat(topLeftQuadrant);
        circleArray = circleArray.concat(botLeftQuadrant);
        circleArray = circleArray.concat(botRightQuadrant);

        testCircle = new google.maps.Polygon({
            map: taskMap,
            paths: [circleArray],
            strokeColor: "#0000FF",
            strokeOpacity: 0.8,
            strokeWeight: 2,
            fillColor: "#FF0000",
            fillOpacity: 0.35
        });

        var degreeNorth = 0;
        var degreeSouth  = -90;
        var degreeWest = 180;
        var degreeEast  = 90;

        var center = new google.maps.LatLng(gsLat, gsLon);

        var north = google.maps.geometry.spherical.computeOffset(center, gsRadius, degreeNorth);
        var south = google.maps.geometry.spherical.computeOffset(center, gsRadius, degreeWest);

        var northEast = google.maps.geometry.spherical.computeOffset(north, gsRadius, degreeEast);
        var northWest = google.maps.geometry.spherical.computeOffset(north, gsRadius, degreeSouth);

        var southEast = google.maps.geometry.spherical.computeOffset(south, gsRadius, degreeEast);
        var southWest = google.maps.geometry.spherical.computeOffset(south, gsRadius, degreeSouth);

        var gsCorners = [northEast, northWest, southWest, southEast];

        // Define the rectangle and set its editable property to true.
        gsBox = new google.maps.Polygon({
            paths: gsCorners,
            editable: false,
            draggable: false,
            fillOpacity: 0
        });

        gsBox.setMap(taskMap);

    },

    addTaskBox: function (){

        var triangleCoords = [
            {lat: 25.663, lng: 39.067},
            {lat: 22.061, lng: 39.067},
            {lat: 22.061, lng: 45.445},
            {lat: 25.663, lng: 45.445},
            {lat: 25.663, lng: 39.067}
        ];

        // Define the rectangle and set its editable property to true.
        taskBox = new google.maps.Polygon({
            paths: triangleCoords,
            editable: true,
            draggable: true,
            fillOpacity: 0
        });

        taskBox.setMap(taskMap);
        taskBox.addListener('rightclick', showArrays);
        infoWindow = new google.maps.InfoWindow();


    },
    isDataReady:function (){
        //Active marker is created when the tle data is ready
        //so it is used as a indicator
        if(this.activeSat == null){
            // alert('isdataready false');
            return false;
        }
        return true;
    },

    createActiveSat: function(name){
        var currentLocData = getFlightPathPoints(1);

        // var markerImage = new google.maps.MarkerImage('/satellite-icon.png',
        //     new google.maps.Size(40, 40),
        //     new google.maps.Point(0, 0),
        //     new google.maps.Point(28, 32));
        // // Add a marker to the map once it's ready
        // var marker = new google.maps.Marker({
        //     position: new google.maps.LatLng(currentLocData[0].latitude2, currentLocData[0].longitude2),
        //     icon: markerImage,
        //     label: activeSatName    ,
        //     map: taskMap,
        //
        // });
        this.activeSat = {name:name.trim(), marker:marker};
        satTrack();
    },

    // Satellites in the same satellite group, but not selected
    createOtherSat: function(name,line1,line2){
        var currentLocData = getFlightPathPoints(1,undefined,line1,line2);
        var myLatLng = {lat: currentLocData[0].latitude2, lng: currentLocData[0].longitude2};

        var marker = new google.maps.Marker({
            position: myLatLng,
            //icon:this.getMarkerImage(),
            //label: "Not Active",
            label: name,
            map: taskMap,
            // label:'active'
        });
        this.otherSat.push({name:name.trim(),marker:marker,tleLine1:line1,tleLine2:line2})
        // console.log('otherPos '+currentLocData[0])
    },
    getMarkerImage(){
        var markerImage = new google.maps.MarkerImage('/satellite-icon.png',
            new google.maps.Size(70, 70),
            new google.maps.Point(0, 0),
            new google.maps.Point(28, 32));
        return markerImage;
    },

    changeActiveSat(nameOfNewActive, PLib){
        nameOfNewActive = nameOfNewActive.trim();
        var isFound = false;
        for(i=0;i<this.otherSat.length;i++){
            if(this.otherSat[i].name === nameOfNewActive){
                //save activeMarker data
                var tempName = this.activeSat.name;
                // alert(tempName);
                var tempLine1 = issLine1;
                var tempLine2 = issLine2;
                //update activeMarker data with new activeMarker
                this.activeSat.name = this.otherSat[i].name;
                issLine1 = this.otherSat[i].tleLine1;
                issLine2 = this.otherSat[i].tleLine2;

                PLib.tleData = [[this.activeSat.name,issLine1,issLine2]];

                //this.activeSat.markerText.setValues({text:this.otherSats[i].name})
                //update otherMarker
                this.otherSat[i].name = tempName;

                this.otherSat[i].tleLine1 = tempLine1;

                this.otherSat[i].tleLine2 = tempLine2;

                //this.otherSat[i].markerText.setValues({text:tempName})
                isFound = true;
            }
        }
        if(isFound){
            if(this.satDate!=null){
                this.updateAccordingToDate(this.satDate);
                this.refreshMapView(this.satDate);
            }else{
                this.updateLive();
            }
        }
        return isFound;
    },
    //Updates the Map UI for a specific date
    updateAccordingToDate(dateInput){
        // alert('in updateaccordingtodate');
        this.satDate = dateInput;
        this.updateActiveSat(getFlightPathPoints(1,dateInput)[0])
        //this.updateOtherMarkerAccordingToDate(dateInput)
    },
    refreshMapView: function (dateTimeStart){
        // alert('refreshmapview');
        this.updateAccordingToDate(dateTimeStart);

    },
    updateLive: function(){
        // alert('updatelive');
        var currentLocData = getFlightPathPoints(1);
        this.updateActiveSat(currentLocData[0]);
        //this.updateLiveOtherMarkers()
    },
    updateActiveSat: function(position){
        // alert('updateactivesat');
        //this.activeSat.marker.setPosition(position);
        //this.activeMarker.markerText.setValues({position:this.offsetPos(position)})
    },


}


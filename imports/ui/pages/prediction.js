import './prediction.html';
import PLib from '../../api/prediction/predictlib.js';
import mapuiPredict from '../../api/prediction/mapui.js';
import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';

import SGP4 from '../../api/prediction/sgp4.js';
import orbtrak from '../../api/prediction/orbtrak.js';

var predictionMode = false;

var dlat;
var dlon;
var timeOfSelectedPassDep = new Deps.Dependency();
var timeOfSelectedPass = "NA";
var selected = 0;

var moment = require('moment');
require('moment-precise-range-plugin');

Template.Prediction.onCreated(function bodyOnCreated() {
  	this.state = new ReactiveDict();
     Session.set('tle_loaded',false)
  	Meteor.subscribe('activesetting');
	Meteor.subscribe('location');
	Meteor.subscribe('satgroup');
	Meteor.subscribe('tle', function(){
        Session.set('tle_loaded',true);
    })
  Session.setDefault('satOnTrackState',0);
  GoogleMaps.ready('gMapView', function(map) {
	 mapuiPredict.init(map,PLib,true)
    });
});

Template.Prediction.onRendered(function () {
	/*
	Initialize polar chart
	*/
	const data = [{
      r: [0,0,0,0],
      t: [0,0,0,0],
      type: "scatter",
      mode: "lines",
      marker:{
      	line:{
      		width: 1
      	}
      }
    }];

	const settings = {
      height: 400, width: 400,
      margin: { l: 20, r: 20, b: 20, t: 20, pad: 0 },
      orientation: -90, showLegend: false,
      radialaxis: { range: [90, 0] }
    };
    
    Plotly.plot($('#azimuth-polarchart')[0], data, settings);
    
});

Template.Prediction.helpers({
	/*
	Calculates the future passes based on inputs
	*/
	calculate(){
        timeOfSelectedPassDep.changed();
		const instance = Template.instance();
		const eventData = instance.state.get('calculate');
        const weatherData = instance.state.get('weatherRawData')

		if(eventData == null){//|| weatherData == null){
			return [];
		}else{
			const searchPeriod = eventData.searchPeriod;
			const minElevation = eventData.minElevation;
			const latitude = eventData.latitude;
			const longtitude = eventData.longtitude;
			const minCloudCover = eventData.minCloudCover
            const allowedVisibility = eventData.visibility

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
			PLib.configureGroundStation(latitude, longtitude);
            const passes = PLib.getTodaysPasses(searchPeriod);
            const results = [];
 
			if(passes.length == 0){
				return {show: false, data: results};
			}else{
				for(i=0;i<passes.length;i++){
                    var visibility = PLib.formatVisibility(passes[i]["visibility"]);
                    var cloudCover = getCloudCover(passes[i],weatherData);
                    var isValid = checkWeatherValidity(visibility,allowedVisibility,minCloudCover,cloudCover)
					if(passes[i]["peakElevation"] > minElevation && isValid){
						passes[i]["LocalDateOfPass"] = PLib.formatDateOnly(passes[i]["dateTimeStart"]);
						passes[i]["LocalTimeOfPassStart"] = PLib.format24HOnly(passes[i]["dateTimeStart"]);
						passes[i]["LocalTimeOfPassEnd"] = PLib.format24HOnly(passes[i]["dateTimeEnd"]);
						passes[i]["UTCDateOfPass"] = PLib.formatUTCDateOnly(passes[i]["dateTimeStart"]);
						passes[i]["UTCTimeOfPassStart"] = PLib.formatUTC24HOnly(passes[i]["dateTimeStart"]);
						passes[i]["UTCTimeOfPassEnd"] = PLib.formatUTC24HOnly(passes[i]["dateTimeEnd"]);
						passes[i]["visibility"] = visibility;
						passes[i]["cloudCover"] = cloudCover;
                        passes[i]["startEpochTime"]= Math.round(( (new Date(passes[i]["dateTimeStart"])).getTime()/1000));
                        passes[i]["endEpochTime"]= Math.round(( (new Date(passes[i]["dateTimeEnd"])).getTime()/1000));
                        //TEST//
						passes[i]["countdownToPass"] = moment(new Date(Math.round(( (new Date(passes[i]["dateTimeStart"])).getTime())))).from(TimeSync.serverTime(), "mm");

						//var m1 = moment(new Date(Math.round(( (new Date(passes[i]["dateTimeStart"])).getTime()))));
						//var m2 = moment(new Date(TimeSync.serverTime()));
                        //passes[i]["countdownToPass"] = moment.preciseDiff(m1, m2);
						//passes[i]["countdownToPass"] = moment.preciseDiff("2014-01-01 12:00:00", "2014-04-20 12:00:00");
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

				const results3 = [];
				for(i=0;i<results2.length;i++){
					results3.push({
						data:{
							name: results2[i][0]["name"],
							array: results2[i]
						}
					});
				}

				// console.log(results3);

				return {show: true, data: results3};
			}
		}
		
	},
	timezone(){
		const instance = Template.instance();
		if(instance.state.get('timezone')){
			return true;
		}
		return false;
	},
	highlightRow(){
		const instance = Template.instance();
		if(instance.state.get('highlightRow')){
            timeOfSelectedPassDep.changed();
			return true;
		}
		return false;
	},

	gMapOptions: function() {
        timeOfSelectedPassDep.changed();
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
        timeOfSelectedPassDep.changed();
		return Session.get('satOnTrackState') == 0?'checked':false;
	},
	isMiddleChecked(){
        timeOfSelectedPassDep.changed();
		return Session.get('satOnTrackState')==1?'checked':false;
	},
	isEndChecked(){
        timeOfSelectedPassDep.changed();
		return Session.get('satOnTrackState')==2?'checked':false;
	},
	isLocation(){
		const instance = Template.instance();
		if(instance.state.get('locationstring')){
			return true;
		}
		return false;
	},
	defaultLocation(){
		var uid = Meteor.userId();
		var latitude;
		var longtitude;
		var location;
        if(uid){
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if(settings.length != 0){
                var loc = Location.find({_id: settings[0].idLoc}).fetch();
                if(loc.length != 0){
	                latitude = loc[0].lat;
	                longtitude = loc[0].lon;
	                location = loc[0].location;
	                dlat = latitude;
	                dlon = longtitude;
	            }
            }
        }
		return {lat:latitude,lon:longtitude,loc:location};
	},
    satelliteList: function(){
        timeOfSelectedPassDep.changed();
        var uid = Meteor.userId();
        var resultArr = [];
        if(uid && Session.get('tle_loaded')){
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if(settings.length != 0){
                var grpname = SatGroup.find({_id:settings[0].idSatGrp}).fetch();
               if(grpname.length == 0){
                   return []
               }
                var satIdList = grpname[0].satid;
                var data = TLE.find({},{}).fetch();
                for(i=0;i<satIdList.length;i++){
                    resultArr.push(TLE.find({_id:satIdList[i]}).fetch()[0]);
                }
               
            }
        }
        return resultArr;
    },
	statusOfSelection() {
        timeOfSelectedPassDep.depend();

        if (/^\d+$/.test(timeOfSelectedPass)) {
            return "Time to Selected Pass: ";
        }

        else if (timeOfSelectedPass.indexOf("NA") >= 0) {
        	return "Select your parameters and click on 'Predict'";
        }

        else if (timeOfSelectedPass.indexOf("Updating") >= 0) {
            return timeOfSelectedPass;
        }

        else if  (timeOfSelectedPass.indexOf("Select") >= 0) {
            return timeOfSelectedPass;
        }


	},

    selectedPass(){

        timeOfSelectedPassDep.depend();

        var m1 = moment(new Date(timeOfSelectedPass*1000));
        var m2 = moment(new Date(TimeSync.serverTime()));
        var ans = moment.preciseDiff(m1, m2);

		return ans;
    }

})
//Get cloud cover by calling the respective API
function getCloudCover(pass,weatherData){
    var dateToFollow = pass["dateTimeStart"]
    if(weatherData == null){
        return 'N.A';
    }
    var hours = Math.round(Math.abs(dateToFollow - new Date()) / (60*60*1000));//36e5; 
    if(hours<1){
        return weatherData.currently.cloudCover;
    }else if(hours<49){
        return weatherData.hourly.data[hours].cloudCover;
    }else{
        var days = Math.round(hours/24);
        if(days<8){
            return weatherData.daily.data[days].cloudCover;
        }else{
            return 'N.A';
        }
    }
}
//Used to filter (based on prediction options) suitable passes
function checkWeatherValidity(visibility,allowedVisibility,minCloudCover,cloudCover){
    if(allowedVisibility != 'All'&&visibility!= allowedVisibility){
        return false
    }
    if(cloudCover<minCloudCover){
        return false;
    }
    return true;
}

Template.Prediction.events({
	'click .toggle-timezone'(event, instance){
		instance.state.set('timezone', event.target.checked);
	},
    'change #selectSatGrp'(event, instance){
        var activeSelected;
        $('#selectSatGrp option:selected').each(function(){
            activeSelected = $(this)[0].value;
            timeOfSelectedPassDep.changed();
        });
        console.log('act '+activeSelected);
        mapuiPredict.satelliteMarkers.changeActiveMarker(activeSelected,PLib)
       
    },
	'change #selectLocation'(event, instance){
		var setting;
		var toggle;
		var latitude = "";
		var longtitude = "";
		var location = "";
		$('#selectLocation option:selected').each(function(){ 
           setting = $(this)[0].value;
        });
        if(setting == "default"){
        	toggle = false;
        }else{
        	toggle = true;
        }
        instance.state.set('locationstring', toggle);
	},
	'click .run-prediction'(event, instance){
		const searchPeriod = instance.find('.search-period').value;
		const minElevation = instance.find('.min-elevation').value;
        const minCloudCover = instance.find('.min-cloudCover').value;
       	var visibility;

        timeOfSelectedPassDep.changed();
        timeOfSelectedPass = "Updating...";

        $('#selectVisibility option:selected').each(function(){ 
           visibility = $(this)[0].value;
        });
        var setting;
        var latitude;
        var longtitude;
        $('#selectLocation option:selected').each(function(){ 
           setting = $(this)[0].value;
        });
        if(setting == "default"){
        	latitude = dlat;
			longtitude = dlon;
             if (mapuiPredict.satelliteMarkers!= null){
                 mapuiPredict.satelliteMarkers.setMissionMarkerVisibility(false)
             }
        }else{
        	latitude = instance.find('.latitude').value;
			longtitude = instance.find('.longtitude').value;
            if (mapuiPredict.satelliteMarkers!= null){
                mapuiPredict.satelliteMarkers.setMissionMarker(latitude,longtitude);
            }
        }
		instance.state.set('calculate', {searchPeriod: searchPeriod, minElevation: minElevation, latitude: latitude, longtitude: longtitude,minCloudCover:minCloudCover,visibility:visibility});
        Meteor.call("getWeather",latitude,longtitude, function(error, results) {
			if(error){
				console.log("Weather error is "+error)
                timeOfSelectedPassDep.changed();
			}else{
                timeOfSelectedPassDep.changed();
                timeOfSelectedPass = "Select a prediction to view more";
                instance.state.set('weatherRawData',JSON.parse(results.content));
			}
        });
    },
	'click .predict-row'(event,instance){
		const data = [{
	      r: this.coordinatesEle,
	      t: this.coordinatesAzi,
	      type: "scatter",
	      mode: "lines",
	      marker:{
	      	line:{
	      		color: ["red"],
	      		width: 3
	      	}
	      }
	    }];

		const settings = {
	      height: 400, width: 400,
	      margin: { l: 20, r: 20, b: 20, t: 20, pad: 0 },
	      orientation: -90, showLegend: false,
	      radialaxis: { range: [90, 0] }
	    };
		if(PLib.tleData[0][0] == this.name){
			issLine1 = PLib.tleData[0][1];
			issLine2 = PLib.tleData[0][2];
            timeOfSelectedPassDep.changed();
		}else{
			issLine1 = PLib.tleData[1][1];
			issLine2 = PLib.tleData[1][2];
            timeOfSelectedPassDep.changed();
		}
		predictionMode = true;
	    mapuiPredict.displayUI(this.dateTimeStart,PLib);

	    selected = '1';
	    timeOfSelectedPass= this.startEpochTime;

		Plotly.plot($('#azimuth-polarchart')[0], data, settings);

	    $('.highlight-row').removeClass('predict_highlight_row');
	    $(event.currentTarget).removeClass('predict_highlight_row2');
	    $(event.currentTarget).addClass('predict_highlight_row');
	},
	'mouseenter .predict-row'(event,instance){
		if(event.currentTarget.classList.contains("predict_highlight_row")){
		}else{
			$(event.currentTarget).addClass('predict_highlight_row2');		
		}
	},
	'mouseleave .predict-row'(event,instance){
		$(event.currentTarget).removeClass('predict_highlight_row2');		
	},
	'click .toggle-sunMarker'(event, instance){
		if(event.target.checked){
			mapuiPredict.sunMarker.setVisible(true)
		}else{
			mapuiPredict.sunMarker.setVisible(false);
		}
	},
	'click .show-futurePasses'(event, instance){
		mapuiPredict.flightPathView.setNumOfPasses(instance.find('.num-of-passes').value);
	},
	'click .toggle-flightPath'(event, instance){
		if(event.target.checked){
			mapuiPredict.flightPathView.show();
		}else{
			mapuiPredict.flightPathView.hide();
		}
	},
	'click .toggle-terminator'(event, instance){
		if(event.target.checked){
			mapuiPredict.nite.showTerminator();
		}else{
			mapuiPredict.nite.hideTerminator();
		}		
	},
	'click .toggle-nightShadow'(event, instance){
		if(event.target.checked){
			mapuiPredict.nite.show();
		}else{
			mapuiPredict.nite.hide();
		}
	},
	'click .toggle-footPrint'(event, instance){
		if(event.target.checked){
			mapuiPredict.coverageCircle.setVisible(true);
		}else{
			mapuiPredict.coverageCircle.setVisible(false);
		}
	},
	'click .toggle-beginSatOnTrack'(event, instance){
		if(event.target.checked){
			Session.set('satOnTrackState',0);
			mapuiPredict.flightPathView.setState(0)
		}
	},
	'click .toggle-middleSatOnTrack'(event, instance){
		if(event.target.checked){
			Session.set('satOnTrackState',1);	
			mapuiPredict.flightPathView.setState(1);
		}
	},
	'click .toggle-endSatOnTrack'(event, instance){
		if(event.target.checked){
			Session.set('satOnTrackState',2);
			mapuiPredict.flightPathView.setState(2);
			
		}
	}
});



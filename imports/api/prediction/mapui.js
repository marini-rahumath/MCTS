import PLib2 from '../../api/prediction/predictlib.js';
import SGP4 from '../../api/prediction/sgp4.js';
import nite from '../../api/prediction/nite-overlay.js';
import '../../api/prediction/maplabel.js';

import PLib from '../../api/prediction/predictlib.js';

var issLine1 = null;
var issLine2 = null;
var infoWindow;

var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var labelIndex = 0;

var mapui = {
    googleMap: null,
    sunMarker:null,
    coverageCircle: null,
    isOtherInit: false,
    flightPathView:null,
    nite:null,
    satelliteMarkers:null,
    testMarker:null,

    init: function(map,PLib,isPredictMode){

        this.isOtherInit = false;
        this.googleMap = map.instance;
        //Flag to check if user is in prediction page
        if(!isPredictMode){
            this.satelliteMarkers =  satelliteMarkers.init(this.googleMap,PLib)
        }

        flightCoords = "LOOOOOL";

    },
    //Initialises all other UI elements excluding satellite markers
    initOtherUI: function(){

        var currentLocData = getFlightPathPoints(1);
        this.nite = nite.init(this.googleMap);
        this.nite.initTerminator(this.googleMap);
        this.coverageCircle = new google.maps.Circle({
            strokeColor: '#F5FFFA',
            strokeWeight: 2,
            fillOpacity: 0,
            map: this.googleMap,
            center: currentLocData[0],
            radius: 2700000
        });
        var sunPos = nite.calculatePositionOfSun();
        var markerImage = new google.maps.MarkerImage('sunny-icon.png',//'/sun.bmp',
            new google.maps.Size(30, 30),
            new google.maps.Point(0, 0),
            new google.maps.Point(15, 15));
        this.sunMarker = new google.maps.Marker({
            position: sunPos,
            icon: markerImage,
            map: this.googleMap
        });
        var uluru = {lat: -25.363, lng: 131.044};
        this.addMarker(uluru);


        infoWindow = new google.maps.InfoWindow();

        //rectangle.addListener('bounds_changed', showNewRect);
        this.flightPathView = flightPathView.init(this.googleMap);

    },
    showNewRect: function(event){

            var ne = rectangle.getBounds().getNorthEast();
            var sw = rectangle.getBounds().getSouthWest();

            var contentString = '<b>Rectangle moved.</b><br>' +
                'New north-east corner: ' + ne.lat() + ', ' + ne.lng() + '<br>' +
                'New south-west corner: ' + sw.lat() + ', ' + sw.lng();

            // Set the info window's content and position.
            infoWindow.setContent(contentString);
            infoWindow.setPosition(ne);

            infoWindow.open(this.googleMap);

    },
    UpdateMap: function(PLib){
        if(this.satelliteMarkers.isDataReady()){
            // this is for initialising markers
            if(!this.isOtherInit){
                this.initOtherUI();
                this.isOtherInit = true;

            }else{
                //this else is for updating location of current selected sat
                this.satelliteMarkers.updateLive();
                var currentLocData = getFlightPathPoints(1);
                this.coverageCircle.setCenter(currentLocData[0]);
                this.flightPathView.liveUpdate();
            }
        // this else is for when satellite data is not ready yet
        }else{
            this.satelliteMarkers = satelliteMarkers.init(this.googleMap,PLib);
        }
    },
    UpdateMapLongerInterval(){

        //setDate will refresh both terminator and the nite overlays
        if(this.satelliteMarkers.isDataReady()){

            if(!this.isOtherInit){
                this.initOtherUI();
                this.isOtherInit = true;

            }else{
                this.nite.setDate(new Date());
                this.sunMarker.setPosition(nite.calculatePositionOfSun());
            }
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
    displayUI: function(dateTimeStart,PLib){
        if(!this.isOtherInit){
            this.satelliteMarkers =  satelliteMarkers.init(this.googleMap,PLib)
            if(this.satelliteMarkers.isDataReady()){
                this.initOtherUI();
                this.isOtherInit = true;
            }
        }
        this.refreshMapView(dateTimeStart);
    },
    addMarker: function(location){
        // var marker = new google.maps.Marker({
        //     position: location,
        //     // label: labels[labelIndex++ % labels.length],
        //     label: "J",
        //     map: this.googleMap,
        //     draggable:true,
        // });
        //
        // var marker = new google.maps.Marker({
        //     position: location,
        //     label: "R",
        //     //label: labels[labelIndex++ % labels.length],
        //     map: this.googleMap,
        //     draggable:true,
        // });
    }
}



var flightPathView = {
    map:null,
    date:null,
    flightPath:[], //current flight path
    futureFlightPath:[], // next flight paths of satellite
    numOfPasses:null, //number of future passes
    state:0, //state refers to sat on track where 0,1,2 refer to begin,mid,end
    init:function(map,date){
        this.map = map;
        this.setDate(date);
        return this;
    },
    getDate: function(){
        var tempDate = new Date(this.date.getTime());
        //Middle sat on track state
        if(this.state == 1){
            tempDate.setMinutes(tempDate.getMinutes()-50);
            //End sat on track state
        }else if(this.state == 2){
            tempDate.setMinutes(tempDate.getMinutes()-99);
        }
        return tempDate;
    },
    //Setting date will automatically update to the new points
    setDate: function(date){
        this.date = (typeof date !== 'undefined')?new Date(date.getTime()):new Date();
        this.generateFlightPath();
        this.generateFutureFlightPath();
    },
    setState(state){
        this.state = state;
        this.setDate(this.date);
    },
    //call this function for live update
    liveUpdate: function(){
        this.setDate(new Date());
    },
    generateFlightPath: function(){
        var requiredDate = this.getDate();
        var flightPathPoints = getFlightPathPoints(100,requiredDate);
        var shadowPos = nite.getShadowPositionAtParticularDate(requiredDate);
        var shadowRadiusLarge = nite.getShadowRadiusFromAngle(12);
        var shadowRadiusSmall = nite.getShadowRadiusFromAngle(18);

        var numPath = 0;

        for(i=0;i<flightPathPoints.length;i++){
            if(this.getDistanceBetween(flightPathPoints[i],shadowPos) < shadowRadiusLarge){
                var redLine = [];
                while(flightPathPoints.length>i && this.getDistanceBetween(flightPathPoints[i],shadowPos) < shadowRadiusLarge){
                    redLine.push(flightPathPoints[i]);
                    i++;
                }
                if(numPath < this.flightPath.length){
                    this.flightPath[numPath].setPath(redLine);
                    this.flightPath[numPath].setOptions({strokeColor: '#FF0000'});
                    this.flightPath[numPath].setMap(this.map);
                }else{
                    this.flightPath.push( new google.maps.Polyline({
                            path: redLine,
                            geodesic: true,
                            strokeColor: '#FF0000',
                            strokeOpacity: 1.0,
                            strokeWeight: 2,
                            map:this.map
                        })
                    )
                }
                numPath++;
                redLine = [];
            }

        }
        for(i=0;i<flightPathPoints.length;i++){
            if(flightPathPoints.length>i&&this.getDistanceBetween(flightPathPoints[i],shadowPos)>shadowRadiusSmall){
                var yellowLine = [];
                while(flightPathPoints.length>i&&this.getDistanceBetween(flightPathPoints[i],shadowPos)>shadowRadiusSmall){
                    yellowLine.push(flightPathPoints[i]);
                    i++;
                }
                if(numPath<this.flightPath.length){
                    this.flightPath[numPath].setPath(yellowLine);
                    this.flightPath[numPath].setOptions({strokeColor: '#FFD700'});
                    this.flightPath[numPath].setMap(this.map)
                }else{
                    this.flightPath.push( new google.maps.Polyline({
                            path: yellowLine,
                            geodesic: true,
                            strokeColor: '#FFD700',
                            strokeOpacity: 1.0,
                            strokeWeight: 2,
                            map:this.map
                        })
                    )
                }
                numPath++;
            }
        }
        var len = this.flightPath.length;
        for(i=numPath;i<len;i++){
            this.flightPath[numPath].setMap(null);
            this.flightPath.splice(numPath,1);
        }
    },
    clearFlightPath: function(){
        for(i=0;i<this.flightPath.length;i++){
            this.flightPath[i].setMap(null);
        }
        this.flightPath = [];
    },
    rad:function(x) {
        return x * Math.PI / 180;
    },
    //Computes distance between two points
    getDistanceBetween:function(p1, p2) {
        var R = 6371008; //Earth's mean radius in meter
        var dLat = this.rad(p2.lat() - p1.lat());
        var dLong = this.rad(p2.lng() - p1.lng());
        var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.rad(p1.lat())) * Math.cos(this.rad(p2.lat())) *
            Math.sin(dLong / 2) * Math.sin(dLong / 2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c;
        return d; // returns the distance in meter
    },
    setMap: function(map){
        for(i=0;i<this.flightPath.length;i++){
            this.flightPath[i].setMap(map);
        }
    },
    hide: function(){
        for(i=0;i<this.flightPath.length;i++){
            this.flightPath[i].setVisible(false);
        }
    },
    show: function(){
        for(i=0;i<this.flightPath.length;i++){
            this.flightPath[i].setVisible(true);
        }
    },
    setFutureFlightPathMap:function(map){
        for(i=0;i<this.futureFlightPath.length;i++){
            this.futureFlightPath[i].setMap(map);
        }
    },
    hideFutureFlightPath: function(){
        for(i=0;i<this.futureFlightPath.length;i++){
            this.futureFlightPath[i].setVisible(false);
        }
    },
    showFutureFlightPath: function(){
        for(i=0;i<futureFlightPath.length;i++){
            futureFlightPath[i].setVisible(true);
        }
    },
    generateFutureFlightPath: function(){
        // Define a symbol using SVG path notation, with an opacity of 1.
        var redLineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 2,
            strokeColor: '#FF0000'
        };
        var yellowLineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: 1,
            scale: 2,
            strokeColor: '#FFD700'
        };


        var requiredDate = new Date(this.getDate().getTime());
        requiredDate.setMinutes(requiredDate.getMinutes()+100);
        var flightPathPoints = this.numOfPasses == 0? []: getFlightPathPoints(100*this.numOfPasses,requiredDate);
        //TODO: Does this mean 1 pass is 100 points?

        var shadowPos = nite.getShadowPositionAtParticularDate(requiredDate);
        var shadowRadiusLarge = nite.getShadowRadiusFromAngle(12);
        var shadowRadiusSmall = nite.getShadowRadiusFromAngle(18);
        var numPath = 0;
        for(i=0;i<flightPathPoints.length;i++){
            if(this.getDistanceBetween(flightPathPoints[i],shadowPos)<shadowRadiusLarge){
                var redLine = [];
                while(flightPathPoints.length>i&&this.getDistanceBetween(flightPathPoints[i],shadowPos)<shadowRadiusLarge){
                    redLine.push(flightPathPoints[i]);
                    i++;
                }
                if(numPath < this.futureFlightPath.length){
                    this.futureFlightPath[numPath].setPath(redLine);
                    this.futureFlightPath[numPath].setOptions({icons: [{
                        icon: redLineSymbol,
                        offset: '0',
                        repeat: '10px'
                    }]});
                    this.futureFlightPath[numPath].setMap(this.map);
                }else{
                    this.futureFlightPath.push( new google.maps.Polyline({
                            path: redLine,
                            geodesic: true,
                            strokeOpacity: 0,
                            icons: [{
                                icon: redLineSymbol,
                                offset: '0',
                                repeat: '10px'
                            }],
                            map:this.map
                        })
                    )
                }
                numPath++;
                redLine = [];
            }

        }
        for(i=0;i<flightPathPoints.length;i++){
            if(flightPathPoints.length>i&&this.getDistanceBetween(flightPathPoints[i],shadowPos)>shadowRadiusSmall){
                var yellowLine = [];
                while(flightPathPoints.length>i&&this.getDistanceBetween(flightPathPoints[i],shadowPos)>shadowRadiusSmall){
                    yellowLine.push(flightPathPoints[i]);
                    i++;
                }
                if(numPath<this.futureFlightPath.length){
                    this.futureFlightPath[numPath].setPath(yellowLine);
                    this.futureFlightPath[numPath].setOptions({icons: [{
                        icon: yellowLineSymbol,
                        offset: '0',
                        repeat: '10px'
                    }]});
                    this.futureFlightPath[numPath].setMap(this.map);
                }else{
                    this.futureFlightPath.push( new google.maps.Polyline({
                            path: yellowLine,
                            geodesic: true,
                            strokeOpacity: 0,
                            icons: [{
                                icon: yellowLineSymbol,
                                offset: '0',
                                repeat: '10px'
                            }],
                            map:this.map
                        })
                    )
                }
                numPath++;
            }
        }
        var len = this.futureFlightPath.length;
        for(i=numPath;i<len;i++){
            this.futureFlightPath[numPath].setMap(null);
            this.futureFlightPath.splice(numPath,1);
        }
    },
    //set number of future flight passes
    setNumOfPasses(num){
        this.numOfPasses = num;
        this.setDate(this.date);
    },

    getFuturePathCoords: function(){

        return 20;
    },
}


//Two sets of marker - active (main marker) and other markers
//Active marker's tle is stored outside as issLine1 and issLine2
//Active marker is the one that will be used for prediction
var satelliteMarkers = {

    isReady:false,
    activeMarker:null,
    otherMarkers:[],
    map:null,
    satDate:null,
    defaultLocationMarker:null,
    missionMarker:null,
    mapUIFacade:null,
    init: function(mapInput, PLib,mapui){
        this.mapUIFacade = mapui;
        this.map = mapInput;
        this.otherMarkers = [];
        this.activeMarker = null;
        this.defaultLocationMarker = null;
        //find satellite setting data
        var uid = Meteor.userId();
        //Check if it is a valid user
        if(uid){
            //Check if necessary data is available before creating marker
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if(settings.length != 0){
                var activeData;
                var otherData = [];
                var grpname = SatGroup.find({_id: settings[0].idSatGrp}).fetch();
                var satIdList = grpname[0].satid;
                var data = TLE.find({}).fetch();

                for(var i=0; i < data.length; i++) {
                    data[i].display = true;
                    if(data[i]._id == satIdList[0]){

                        console.log('activeMarker1 '+satIdList[0])
                        console.log('activeMarker2 '+satIdList[1])
                        activeData = {name:data[i].name,line1:data[i].line1,line2:data[i].line2};

                        PLib.tleData = [[data[i].name,data[i].line1,data[i].line2]]
                    }
                    for(j = 1;j<satIdList.length;j++){
                        data[i].display = true;
                        if(data[i]._id == satIdList[j]){

                            console.log('createOtherMarker')
                            otherData.push({name:data[i].name,line1:data[i].line1,line2:data[i].line2})
                        }
                    }


                }
                if(activeData!=null&&otherData.length == satIdList.length-1){
                    issLine1 = activeData.line1;
                    issLine2 = activeData.line2;
                    this.createActiveMarker(activeData.name)

                    for(i=0;i<otherData.length;i++){
                        this.createOtherMarker(otherData[i].name,otherData[i].line1,otherData[i].line2);
                    }

                }
                var locname = Location.find({_id: settings[0].idLoc}).fetch();
                if(locname.length != 0 && this.defaultLocationMarker ==null){
                    //return locname[0].display;
                    var markerImage = new google.maps.MarkerImage('/grdStation.png',
                        new google.maps.Size(22, 22),
                        new google.maps.Point(0, 0),
                        new google.maps.Point(11, 11));
                    var marker = new google.maps.Marker({
                        position: new google.maps.LatLng(locname[0].lat,locname[0].lon),
                        icon:markerImage,
                        map: this.map,
                        // label:'active'
                    });
                    var markerText = this.createMarkerText(locname[0].name.trim(),new google.maps.LatLng(locname[0].lat,locname[0].lon))
                    this.defaultLocationMarker = {name:locname[0].name,marker:marker,markerText:markerText}
                    PLib.configureGroundStation(locname[0].lat, locname[0].lon);
                }
            }
        }
        return this
    },

    //Used for creating the target mission marker
    setMissionMarker(latitude,longtitude){
        if(this.missionMarker == null){
            var markerImage = new google.maps.MarkerImage('/missionMarker.png',
                new google.maps.Size(22, 22),
                new google.maps.Point(0, 0),
                new google.maps.Point(11, 11));
            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(latitude,longtitude),
                icon:markerImage,
                map: this.map,
                // label:'active'
            });
            this.missionMarker = {marker:marker}
        }else{
            this.missionMarker.marker.setPosition(new google.maps.LatLng(latitude,longtitude));
            this.missionMarker.marker.setVisible(true);
        }
    },
    setMissionMarkerVisibility(isVisible){
        if(this.missionMarker != null){
            this.missionMarker.marker.setVisible(isVisible);
        }
    },

    createOtherMarker: function(name,line1,line2){
        var currentLocData = getFlightPathPoints(1,undefined,line1,line2);
        var marker = new google.maps.Marker({
            position: currentLocData[0],
            icon:this.getMarkerImage(),
            map: this.map,
            // label:'active'
        });
        var markerText = this.createMarkerText(name,currentLocData[0])
        this.otherMarkers.push({name:name.trim(),marker:marker,markerText:markerText,tleLine1:line1,tleLine2:line2})
        // console.log('otherPos '+currentLocData[0])
    },

    isDataReady:function (){
        //Active marker is created when the tle data is ready
        //so it is used as a indicator
        if(this.activeMarker == null){
            return false;
        }
        return true;
    },

    //Tle (issLine1 and issLine2) is to be set before calling this function
    //should not be called outside
    createActiveMarker: function(name){
        var currentLocData = getFlightPathPoints(1);
        // Add a marker to the map once it's ready
        var marker = new google.maps.Marker({
            position: currentLocData[0],
            icon:this.getMarkerImage(),
            map: this.map,
            // label:'active'
        });
        var markerText = this.createMarkerText(name,currentLocData[0])
        this.activeMarker = {name:name.trim(), marker:marker, markerText: markerText}
    },
    createMarkerText: function(name,markerPosition){
        var markerTextPos = this.offsetPos(markerPosition)
        var markerText =   new MapLabel({
            position: markerTextPos,
            text: name,
            map: this.map,
            align: 'center',
            fontColor: 'white',
            fontFamily: 'Times New Roman',
            fontSize: 15,
            strokeWeight: 1,
            strokeColor: 'black',
        });
        return markerText;
    },
    //Updates the Map UI for realtime
    updateLive: function(){
        var currentLocData = getFlightPathPoints(1);
        this.updateActiveMarker(currentLocData[0]);
        this.updateLiveOtherMarkers()
    },
    updateActiveMarker: function(position){
        this.activeMarker.marker.setPosition(position);
        this.activeMarker.markerText.setValues({position:this.offsetPos(position)})
    },
    //Updates the Map UI for a specific date
    updateAccordingToDate(dateInput){
        this.satDate = dateInput;
        this.updateActiveMarker(getFlightPathPoints(1,dateInput)[0])
        this.updateOtherMarkerAccordingToDate(dateInput)
    },
    updateLiveOtherMarkers(){
        for(var i=0;i<this.otherMarkers.length;i++){
            var currentLocData = getFlightPathPoints(1,undefined,this.otherMarkers[i].tleLine1,
                this.otherMarkers[i].tleLine2)
            this.otherMarkers[i].marker.setPosition(currentLocData[0])
            this.otherMarkers[i].markerText.setValues({position:this.offsetPos(currentLocData[0])})
        }
    },
    updateOtherMarkerAccordingToDate(dateInput){
        for(var i=0;i<this.otherMarkers.length;i++){
            var currentLocData = getFlightPathPoints(1,dateInput,this.otherMarkers[i].tleLine1,
                this.otherMarkers[i].tleLine2)
            this.otherMarkers[i].marker.setPosition(currentLocData[0])
            this.otherMarkers[i].markerText.setValues({position:this.offsetPos(currentLocData[0])})
        }
    },
    getMarkerImage(){
        var markerImage = new google.maps.MarkerImage('/satellite-icon.png',
            new google.maps.Size(70, 70),
            new google.maps.Point(0, 0),
            new google.maps.Point(28, 32));
        return markerImage;
    },
    //For markerText
    offsetPos(position){
        return new google.maps.LatLng(position.lat()+15,position.lng()+10)
    },
    changeActiveMarker(nameOfNewActive, PLib){
        console.log('activated')
        nameOfNewActive = nameOfNewActive.trim();
        var isFound = false;
        for(i=0;i<this.otherMarkers.length;i++){
            if(this.otherMarkers[i].name === nameOfNewActive){
                //save activeMarker data
                var tempName = this.activeMarker.name;
                var tempLine1 = issLine1;
                var tempLine2 = issLine2;
                //update activeMarker data with new activeMarker
                this.activeMarker.name = this.otherMarkers[i].name;
                issLine1 = this.otherMarkers[i].tleLine1
                issLine2 = this.otherMarkers[i].tleLine2

                PLib.tleData = [[this.activeMarker.name,issLine1,issLine2]];

                this.activeMarker.markerText.setValues({text:this.otherMarkers[i].name})
                //update otherMarker
                this.otherMarkers[i].name = tempName;
                this.otherMarkers[i].tleLine1 = tempLine1;
                this.otherMarkers[i].tleLine2 = tempLine2;
                this.otherMarkers[i].markerText.setValues({text:tempName})
                isFound = true;

            }
        }
        if(isFound){
            if(this.satDate!=null){
                this.updateAccordingToDate(this.satDate);
                this.mapUIFacade.refreshMapView(this.satDate);
            }else{
                this.updateLive();
            }
        }
        return isFound;
    }

}

//This method generates flight path points based on TLE for next numOfPoints 
function getFlightPathPoints(numOfPoints = 1,inputDate, tleInput1,tleInput2){
    var tleLine1;
    var tleLine2;
    if(tleInput1 == null&&tleInput2 ==null){
        tleLine1 = issLine1
        tleLine2 = issLine2
    }else{
        tleLine1 = tleInput1
        tleLine2 = tleInput2
    }

    var issSatRec = SGP4.twoline2rv(tleLine1,tleLine2, SGP4.wgs84());
    PLib2.tleData[['default',tleLine1,tleLine2]]
    PLib2.InitializeData()
    var firstOfYear = (typeof inputDate!== 'undefined')? new Date(inputDate.getTime()): new Date();
    var arr = [];
    for(i=0;i<numOfPoints;i++){
        var positionAndVelocity = SGP4.propogate(issSatRec, firstOfYear.getUTCFullYear(), firstOfYear.getUTCMonth() + 1, firstOfYear.getUTCDate(), firstOfYear.getUTCHours(), firstOfYear.getUTCMinutes(), firstOfYear.getUTCSeconds());
        var gmst = SGP4.gstimeFromDate(firstOfYear.getUTCFullYear(), firstOfYear.getUTCMonth() + 1, firstOfYear.getUTCDate(), firstOfYear.getUTCHours(), firstOfYear.getUTCMinutes(), firstOfYear.getUTCSeconds());
        var geodeticCoordinates = SGP4.eciToGeodetic(positionAndVelocity.position, gmst);
        var longitude2 = SGP4.degreesLong(geodeticCoordinates.longitude);
        var latitude2 = SGP4.degreesLat(geodeticCoordinates.latitude);
        // console.log('sgp4 lat: '+latitude2+' long: '+ longitude2)
        //console.log('Plib lat: '+PLib2.CalcPos(firstOfYear).lat+' long: '+PLib2.CalcPos(firstOfYear).lng)
        arr.push(new google.maps.LatLng(latitude2,longitude2));
        firstOfYear.setMinutes(firstOfYear.getMinutes()+1);
    }
    return arr;
}

module.exports = mapui;

// module.exports = {
//     mapui,
//     globalVariablexxx,
//     hehehe,
//     lotsOfVar,
//     flightPathView,
//     flightCoords
// }
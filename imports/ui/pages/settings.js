import './settings.html';

import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Meteor } from 'meteor/meteor';

var usersettingsid;
var updateresponse = "";
var updateresponsedep = new Deps.Dependency();
var tlerateresponse = "";
var tlerateresponsedep = new Deps.Dependency();
var items;
var set1dep = new Deps.Dependency();
var set2dep = new Deps.Dependency();
var set1count = 0;
var set2count = 0;
var items2;
var set3dep = new Deps.Dependency();
var set4dep = new Deps.Dependency();
var set3count = 0;
var set4count = 0;



Template.Settings.onCreated(function () {
    this.state = new ReactiveDict();
    Meteor.subscribe('activesetting');
    Meteor.subscribe('location');
    Meteor.subscribe('satgroup');
    Meteor.subscribe('tle');

});



Template.Settings.onRendered(function () {
});

Template.Settings.helpers({
    updateresponse(){
        updateresponsedep.depend();
        var data = TLE.find({},{limit:1}).fetch()[0];
        if(data != null){

            updateresponse = "Updated at " + getTime(data.time) + "  GMT+8, "
                + getDate(data.time);
        }else{
            updateresponse = "Please update TLE";
        }
        return updateresponse;
    },
    displayLocation(){
        var uid = Meteor.userId();
        console.log(uid);
        if(uid){
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if(settings.length != 0){
                var locname = Location.find({_id: settings[0].idLoc}).fetch();
                if(locname.length != 0){
                    return locname[0].display;
                }else{
                    return "NIL";
                }
            }
        }
    },
    displaySatGrp(){
        var uid = Meteor.userId();
        if(uid){
            var settings = ActiveSetting.find({idUser: uid}).fetch();
            if(settings.length != 0){
                var grpname = SatGroup.find({_id: settings[0].idSatGrp}).fetch();
                if(grpname.length !=0){
                    return grpname[0].name;
                }else{
                    return "NIL";
                }
            }
        }
    },
    listLocations(){
        var uid = Meteor.userId();
        var data = Location.find({idUser: uid}).fetch();
        return data;
    },
    listSatGroups(){
        var uid = Meteor.userId();
        var data = SatGroup.find({idUser: uid}).fetch();
        return data;
    },
    listEmailOptions(){
        var uid = Meteor.userId();
        var data = SatGroup.find({idUser: uid}).fetch();
        data.unshift({
            idUser: "",
            name: "Don't want email notifications",
            satid: ""
        });
        data.unshift({
            idUser: "",
            name: "Default (Follow Selected Satellite Group)",
            satid: ""
        });
        return data;
    },
    listSatellites(){
        var data = TLE.find({},{sort: {name: 1}}).fetch();
        for(var i=0; i < data.length; i++) {
            data[i].display = true;
        }
        items = data;
        set1count = items.length;
        set1dep.changed();
        return items;
    },
    countset1(){
        set1dep.depend();
        return set1count;
    },
    countset2(){
        set2dep.depend();
        return set2count;
    },
    listSatellites2(){
        var data = TLE.find({},{sort: {name: 1}}).fetch();
        for(var i=0; i < data.length; i++) {
            data[i].display = true;
        }
        items2 = data;
        set3count = items2.length;
        set3dep.changed();
        return items2;
    },
    countset3(){
        set3dep.depend();
        return set3count;
    },
    countset4(){
        set4dep.depend();
        return set4count;
    },
    printText(){
        var textToPrint = "";
        document.getElementById("openFile").addEventListener('change', function() {
            var fr = new FileReader();
            fr.onload = function() {
                document.getElementById("fileContents").textContent = this.results;
            }
            textToPrint = fr.readAsText(this.files[0]);
        })
        return textToPrint;
    },
});

Template.Settings.events({
    /*
    Updates the TLE from Celestrack
    Note: Add loading animation and a notification to show success/fail update
    */
    'click .update-tle-network'(event, instance){
        var data;
        Meteor.call('updateTLE',function(error,result){
            data = result;
            console.log(data);
            if(data == true){
                alert("Updated!");
            }else{
                alert("Failed to update. Please try again!");
            }
            updateresponsedep.changed();
        });
    },
    /*
        Configure rate of auto-updating TLE
        */
    'click .tle-rate'(event, instance){
        var ratelength = instance.find('#TLEratelength').value;
        var data;
        Meteor.call('updateJob', ratelength, function(error, result){
            data = result;
            console.log(data);
            if(data == true){
                alert("TLE will be updated automatically every " + ratelength);
            }else{
                alert("Failed to configure rate for auto updating TLE. Please try again!");
            }
        });
    },

    /*
        Manually add TLE
        */
    'click .update-tle-network-manual'(event, instance){
        var satnamem = instance.find('#satnamem').value;
        var tleline1m = instance.find('#tleline1m').value;
        var tleline2m = instance.find('#tleline2m').value;
        Meteor.call('manualUpdateTLE', satnamem, tleline1m, tleline2m, function(error,result) {
            updateresponsedep.changed();
        });
    },


    /*
    Set chosen location and satellite group
    */
    'click .set-info'(event,instance){
        var idLoc;
        $('#selectLoc option:selected').each(function() {
            idLoc = $(this)[0].value;
        });
        var idSatGrp;
        $('#selectSatGrp option:selected').each(function() {
            idSatGrp = $(this)[0].value;
        });
        var idEmailGrp;
        $('#selectEmailGrp option:selected').each(function() {
            idEmailGrp = $(this)[0].value;
            if (idEmailGrp.indexOf("Default") >= 0) {
                idEmailGrp = idSatGrp;
            }
            else if (idEmailGrp.indexOf("Don't") >= 0) {
                idEmailGrp = "";
            }
            alert(idEmailGrp);
        });
        var idUser = Meteor.userId();
        Meteor.call('update-new-settings', idUser, idLoc , idSatGrp, idEmailGrp)
    },
    /*
    Events for Add Satellite Group
    */
    'click .add-options'(event, instance){
        $("#set1 option:selected").each(function () {
            var optionVal = $(this).val();

            for (var i = 0; i < items.length; i++) {
                if (items[i]._id == optionVal) {
                    items[i].display = false;
                }
            }
        });
        PopulateSet1();
        PopulateSet2();
    },
    'click .remove-options'(event, instance){
        $("#set2 option:selected").each(function () {
            var optionVal = $(this).val();

            for (var i = 0; i < items.length; i++) {
                if (items[i]._id == optionVal) {
                    items[i].display = true;
                }
            }
        });
        PopulateSet1();
        PopulateSet2();
    },
    'click .reset-options'(event, instance){
        for (var i = 0; i < items.length; i++) {
            items[i].display = true;
        };
        PopulateSet1();
        PopulateSet2();
    },
    'click .add-group'(event, instance){
        var name = instance.find('#satgroupname').value;
        var satid = []
        $('#set2 option').each(function () {
            satid.push($(this).val());
        });
        var uid = Meteor.userId();
        Meteor.call('insert-newgroup',uid , name, satid);

    },
    /*
    Events for Update Satellite Group
    */
    'click .add-options2'(event, instance){
        $("#set3 option:selected").each(function () {
            var optionVal = $(this).val();

            for (var i = 0; i < items.length; i++) {
                if (items2[i]._id == optionVal) {
                    items2[i].display = false;
                }
            }
        });
        PopulateSet3();
        PopulateSet4();
    },
    'click .remove-options2'(event, instance){
        $("#set4 option:selected").each(function () {
            var optionVal = $(this).val();

            for (var i = 0; i < items.length; i++) {
                if (items2[i]._id == optionVal) {
                    items2[i].display = true;
                }
            }
        });
        PopulateSet3();
        PopulateSet4();
    },
    'click .reset-options2'(event, instance){
        for (var i = 0; i < items2.length; i++) {
            items2[i].display = true;
        };
        PopulateSet3();
        PopulateSet4();
    },
    'click .update-satgroup-before'(event, instance){
        var id;
        $('#satgroup option:selected').each(function() {
            id = $(this)[0].value;
        });
        if(id == null){
            // Todo: disable update, although it wouldnt update cause no id
        }else{
            var group = SatGroup.find({_id:id}).fetch()[0];
            instance.find('#satgroupname2').value = group.name;
            for(var i=0;i<group.satid.length;i++){
                for (var j = 0; j < items2.length; j++) {
                    if (items2[j]._id == group.satid[i]) {
                        items2[j].display = false;
                    }
                }
            }
            PopulateSet3();
            PopulateSet4();
        }
    },
    'click .update-satgroup-after'(event, instance){
        var id;
        $('#satgroup option:selected').each(function() {
            id = $(this)[0].value;
        });
        var name = instance.find('#satgroupname2').value;
        var satid = []
        $('#set4 option').each(function () {
            satid.push($(this).val());
        });
        Meteor.call('update-onegroup', id, name, satid);

    },
    'click .remove-group'(event, instance){
        $("#satgroup option:selected").each(function() {
            var id = $(this)[0].value;
            Meteor.call('remove-onegroup', id);
        });
    },
    /*
    Events for Location settings
    */
    'click .add-location'(event, instance){
        var name = instance.find('#locname').value;
        var desc = instance.find('#locdesc').value;
        var lat = instance.find('#latitude').value;
        var lon = instance.find('#longtitude').value;
        var loc = instance.find('#findlocation1').value;
        var uid = Meteor.userId();
        Meteor.call('insert-location',uid , name, desc, loc, lat, lon);
    },
    'click .update-location-before'(event, instance){
        var id;
        $("#location option:selected").each(function() {
            id = $(this)[0].value;
        });
        if(id == null){
            // Todo: disable update, although it wouldnt update cause no id
        }else{
            var location = Location.find({_id:id}).fetch()[0];
            instance.find('#locname2').value = location.name;
            instance.find('#locdesc2').value = location.desc;
            instance.find('#latitude2').value = location.lat;
            instance.find('#longtitude2').value = location.lon;
            instance.find('#findlocation2').value = location.location;
        }
    },
    'click .update-location-after'(event, instance){
        var id;
        $("#location option:selected").each(function() {
            id = $(this)[0].value;
        });
        var name = instance.find('#locname2').value;
        var desc = instance.find('#locdesc2').value;
        var lat = instance.find('#latitude2').value;
        var lon = instance.find('#longtitude2').value;
        var loc = instance.find('#findlocation2').value;
        Meteor.call('update-location', id, name, desc, loc, lat, lon);
    },
    'click .remove-location'(event, instance){
        $("#location option:selected").each(function() {
            var id = $(this)[0].value;
            Meteor.call('remove-location', id);
        });
    },
    'click .get-location1'(event,instance){
        var lat = instance.find('#latitude').value;
        var lon = instance.find('#longtitude').value;
        var geocoder = new google.maps.Geocoder;
        var latlng = {lat: parseFloat(lat), lng: parseFloat(lon)};
        geocoder.geocode({'location': latlng}, function(results, status) {
            if (status === 'OK') {
                if (results[1]) {
                    var location = results[1].formatted_address;
                    instance.find('#findlocation1').value = location;
                } else {
                    window.alert('Invalid Coordinates');
                }
            } else {
                window.alert('Geocoder failed due to: ' + status);
            }
        });
    },
    'click .get-location2'(event,instance){
        var lat = instance.find('#latitude2').value;
        var lon = instance.find('#longtitude2').value;
        var geocoder = new google.maps.Geocoder;
        var latlng = {lat: parseFloat(lat), lng: parseFloat(lon)};
        geocoder.geocode({'location': latlng}, function(results, status) {
            if (status === 'OK') {
                if (results[1]) {
                    var location = results[1].formatted_address;
                    instance.find('#findlocation2').value = location;
                } else {
                    window.alert('Invalid Coordinates');
                }
            } else {
                window.alert('Geocoder failed due to: ' + status);
            }
        });
    },
});

Template.Settings.onDestroyed(function () {

});

function PopulateSet1() {
    var innHTML = "";
    var count = 0;
    for (var i = 0; i < items.length; i++) {
        if(items[i].display == true){
            innHTML += '<option ' + 'value=' + items[i]._id + '>' + items[i].name + '</option>';
            count++;
        }
    }
    set1count = count;
    set1dep.changed();
    $('#set1').empty().append(innHTML);
};

function PopulateSet2() {
    var innHTML = "";
    var count = 0;
    for (var i = 0; i < items.length; i++) {
        if(items[i].display == false){
            innHTML += '<option ' + 'value=' + items[i]._id + '>' + items[i].name + '</option>';
            count++;
        }
    }
    set2count = count;
    set2dep.changed();
    $('#set2').empty().append(innHTML);
};

function PopulateSet3() {
    var innHTML = "";
    var count = 0;
    for (var i = 0; i < items2.length; i++) {
        if(items2[i].display == true){
            innHTML += '<option ' + 'value=' + items2[i]._id + '>' + items2[i].name + '</option>';
            count++;
        }
    }
    set3count = count;
    set3dep.changed();
    $('#set3').empty().append(innHTML);
};

function PopulateSet4() {
    var innHTML = "";
    var count = 0;
    for (var i = 0; i < items2.length; i++) {
        if(items2[i].display == false){
            innHTML += '<option ' + 'value=' + items2[i]._id + '>' + items2[i].name + '</option>';
            count++;
        }
    }
    set4count = count;
    set4dep.changed();
    $('#set4').empty().append(innHTML);
};

function getTime(date) {
    var h = date.getHours();
    var m = date.getMinutes();
    var s = date.getSeconds();
    h = h < 10 ? "0" + h : h;
    m = m < 10 ? "0" + m : m;
    s = s < 10 ? "0" + s : s;
    return h+":"+m+":"+s;

};

function getDate(date) {
    var dd = date.getDate();
    var mm = (date.getMonth()+1);
    var yy = date.getFullYear();
    dd = dd < 10 ? "0" + dd : dd;
    mm = mm < 10 ? "0" + mm : mm;
    return dd+"/"+mm+"/"+yy;
}
import './header.html';

import { Template } from 'meteor/templating';

var workingclock_ = "";
var timestamp_header = "";

Template.header.helpers({
    getTimeAndDateHeader(){
        return new Date(TimeSync.serverTime());
    }
});

Template.header.helpers({
    getTimeHeader(){
        timestamp_header = moment(new Date(TimeSync.serverTime())).fromNow();
        return timestamp_header;
    }
});

Template.header.events({

    'click .hide-menu': function (event) {

        event.preventDefault();

        if ($(window).width() < 769) {
            $("body").toggleClass("show-sidebar");
        } else {
            $("body").toggleClass("hide-sidebar");
        }
    },

    'click .right-sidebar-toggle': function (event) {
        event.preventDefault();
        $('#right-sidebar').toggleClass('sidebar-open');
    }


});
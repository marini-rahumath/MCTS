import './navigation.html';

import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { AccountsTemplates } from 'meteor/useraccounts:core';

Template.navigation.onRendered(function() {

    // Initialize metsiMenu plugin to sidebar menu
    $('#side-menu').metisMenu();

    // Sparkline bar chart data and options used under Profile image on navigation
    // $("#sparkline1").sparkline([5, 6, 7, 2, 0, 4, 2, 4, 5, 7, 2, 4, 12, 11, 4], {
    //     type: 'bar',
    //     barWidth: 7,
    //     height: '30px',
    //     barColor: '#62cb31',
    //     negBarColor: '#53ac2a'
    // });

});

Template.navigation.events({

    // Colapse menu in mobile mode after click on element
    'click #side-menu a:not([href$="\\#"])': function(){
        if ($(window).width() < 769) {
            $("body").toggleClass("show-sidebar");
        }
    },
    'click .account-logout'(event){
        event.preventDefault();
        AccountsTemplates.logout();
    }

});
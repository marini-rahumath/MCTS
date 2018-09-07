import './app-body.html';

import { Template } from 'meteor/templating';

Template.App_body.onRendered(function(){

    // Add special class to minimalize page elements when screen is less than 768px
    setBodySmall();
    // Wait until metisMenu, collapse effect finish and set wrapper height
    setTimeout(function () {
        fixWrapperHeight();
    }, 300);

    $(window).bind("resize click", function () {

        // Add special class to minimalize page elements when screen is less than 768px
        setBodySmall();

        // Wait until metisMenu, collapse effect finish and set wrapper height
        setTimeout(function () {
            fixWrapperHeight();
        }, 300);
    });

    // FIXED SIDEBAR
    // $('body').addClass('fixed-sidebar');

    // FIXED NAVBAR
    // $('body').addClass('fixed-navbar');

    // FIXED FOOTER
    // $('body').addClass('fixed-footer');

    // FIXED SMALL HEADER
    // $('body').addClass('fixed-small-header');

    GoogleMaps.load({key:'AIzaSyBELhkwld5NXivqK2OqUHTkdsExLc0CBmk', libraries: 'geometry' });
});

function fixWrapperHeight() {

    // Get and set current height
    var headerH = 62;
    var navigationH = $("#navigation").height();
    var contentH = $(".content").height();

    // Set new height when content height is less then navigation
    if (contentH < navigationH) {
        $("#wrapper").css("min-height", navigationH + 'px');
    }

    // Set new height when content height is less then navigation and navigation is less then window
    if (contentH < navigationH && navigationH < $(window).height()) {
        $("#wrapper").css("min-height", $(window).height() - headerH  + 'px');
    }

    // Set new height when content is higher then navigation but less then window
    if (contentH > navigationH && contentH < $(window).height()) {
        $("#wrapper").css("min-height", $(window).height() - headerH + 'px');
    }
}


function setBodySmall() {
    if ($(window).width() < 769) {
        $('body').addClass('page-small');
    } else {
        $('body').removeClass('page-small');
        $('body').removeClass('show-sidebar');
    }
}


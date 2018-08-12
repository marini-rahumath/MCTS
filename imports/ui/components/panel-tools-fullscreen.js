import './panel-tools-fullscreen.html';

import { Template } from 'meteor/templating';

Template.panelToolsFullscreen.events({

    'click .showhide': function(event){
        event.preventDefault();
        var hpanel = $(event.target).closest('div.hpanel');
        var icon = $(event.target).closest('i');
        var body = hpanel.find('div.panel-body');
        var footer = hpanel.find('div.panel-footer');
        body.slideToggle(300);
        footer.slideToggle(200);

        // Toggle icon from up to down
        icon.toggleClass('fa-chevron-up').toggleClass('fa-chevron-down');
        hpanel.toggleClass('').toggleClass('panel-collapse');
        setTimeout(function () {
            hpanel.resize();
            hpanel.find('[id^=map-]').resize();
        }, 50);
    },

    'click .closebox': function(event){
        event.preventDefault();
        var hpanel = $(event.target).closest('div.hpanel');
        hpanel.remove();
        if($('body').hasClass('fullscreen-panel-mode')) { $('body').removeClass('fullscreen-panel-mode');}
    },

    'click .fullscreen': function(event){
        event.preventDefault();
        var hpanel = $(event.target).closest('div.hpanel');
        var icon = $(event.target).closest('i');
        $('body').toggleClass('fullscreen-panel-mode');
        icon.toggleClass('fa-expand').toggleClass('fa-compress');
        hpanel.toggleClass('fullscreen');
        setTimeout(function() {
            $(window).trigger('resize');
        }, 100);
    }

});
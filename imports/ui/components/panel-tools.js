import './panel-tools.html';

import { Template } from 'meteor/templating';

Template.panelTools.events({

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
    }

});
import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

//Note import ALL TEMPLATES cause some are a subset of other templates

//import a layout
import '../../ui/layouts/app-body.js';
//import templates
// import '../../ui/components/splash.js';
import '../../ui/components/header.js';
import '../../ui/components/navigation.js';
import '../../ui/components/footer.js';
import '../../ui/components/panel.js';
import '../../ui/components/panel-tools.js';
import '../../ui/components/panel-tools-fullscreen.js';
import '../../ui/pages/prediction.js';
import '../../ui/pages/realtime.js';
import '../../ui/pages/settings.js';
import '../../ui/pages/weather.js';
import '../../ui/pages/tasking.js';
import '../../ui/pages/tncTest.js';
import '../../ui/pages/tncConfig.js';
import '../../ui/pages/tncObc.js';
import '../../ui/pages/tncSpeqs.js';
import '../../ui/pages/tncAdcs.js';
import '../../ui/pages/tncTtnc.js';
import '../../ui/pages/tncTec.js';
import '../../ui/pages/tncmock.js';
import '../../ui/pages/statistics.js';
import '../../ui/pages/tncTest2.js';

// import accounts template
import '../../ui/accounts/accounts.js';

// Flowrouter.route('url route', {
// 	name: 'define route name',
// 	action() {
// 		BlazeLayout.render('main layout template name', {arbitrary name of section to place template : 'other template name'});
// 	}
// })

FlowRouter.route('/', {
	name: 'Default',
	triggersEnter: [ function(context,redirect) {
		redirect('RealTime');
	}]
});

FlowRouter.route('/real-time', { 
	name: 'RealTime',
	action() {
		BlazeLayout.render('App_body', {main: 'Real_Time'});
	}
});

FlowRouter.route('/prediction', {
	name: 'Prediction',
	action() {
		BlazeLayout.render('App_body', {main: 'Prediction'});
	}
});

FlowRouter.route('/settings', {
	name: 'Settings',
	action() {
		BlazeLayout.render('App_body', {main: 'Settings'});
	}
});

FlowRouter.route('/weather', {
	name: 'Weather',
	action() {
		BlazeLayout.render('App_body', {main: 'Weather'});
	}
});

FlowRouter.route('/tncConfig', {
	name: 'tncConfig',
	action() {
		BlazeLayout.render('App_body', {main: 'tncConfig'});
	}
});


FlowRouter.route('/tncTec', {
	name: 'tncTec',
	action() {
		BlazeLayout.render('App_body', {main: 'tncTec'});
	}
});

FlowRouter.route('/tncSpeqs', {
	name: 'tncSpeqs',
	action() {
		BlazeLayout.render('App_body', {main: 'tncSpeqs'});
	}
});

FlowRouter.route('/tncAdcs', {
	name: 'tncAdcs',
	action() {
		BlazeLayout.render('App_body', {main: 'tncAdcs'});
	}
});

FlowRouter.route('/tncTtnc', {
	name: 'tncTtnc',
	action() {
		BlazeLayout.render('App_body', {main: 'tncTtnc'});
	}
});

FlowRouter.route('/tncObc', {
	name: 'tncObc',
	action() {
		BlazeLayout.render('App_body', {main: 'tncObc'});
	}
});


FlowRouter.route('/tncTest', {
	name: 'tncTest',
	action() {
		BlazeLayout.render('App_body', {main: 'tncTest'});
	}
});

FlowRouter.route('/statistics', { 
	name: 'statistics',
	action() {
		BlazeLayout.render('App_body', {main: 'statistics'});
	}
});

FlowRouter.route('/tncTest2', {
	name: 'tncTest2',
	action() {
		BlazeLayout.render('App_body', {main: 'tncTest2'});
	}
});

FlowRouter.route('/tasking', {
    name: 'Tasking',
    action() {
        BlazeLayout.render('App_body', {main: 'Tasking'});
    }
});
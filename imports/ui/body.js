// import { Template } from 'meteor/templating';
 
import './body.html';
import PLib from '../api/prediction/predictlib.js';
import orbtrak from '../api/prediction/orbtrak.js';
// import SGP4 from '../api/prediction/sgp4.js';
import { ReactiveDict } from 'meteor/reactive-dict';


Template.body.onCreated(function bodyOnCreated() {
  this.state = new ReactiveDict();
});

Template.body.helpers({
	calculate(){
		// const value = SGP4.degreesLat(1.3);
		PLib.InitializeData();
		PLib.configureGroundStation(1.3667, 103.9832);
		const passes = PLib.getTodaysPasses();
		console.log(passes);
		for(i=0;i<passes.length;i++){
			passes[i]["LocalDateOfPass"] = PLib.formatDateOnly(passes[i]["dateTimeStart"]);
			passes[i]["LocalTimeOfPass"] = PLib.formatTimeOnly(passes[i]["dateTimeStart"]) + " - " + PLib.formatTimeOnly(passes[i]["dateTimeEnd"]);
			passes[i]["UTCDateOfPass"] = PLib.formatUTCDateOnly(passes[i]["dateTimeStart"]);
			passes[i]["UTCTimeOfPass"] = PLib.formatUTCTimeOnly(passes[i]["dateTimeStart"]) + " - " + PLib.formatUTCTimeOnly(passes[i]["dateTimeEnd"]);
		}
		
		return passes;
	},
	timezone(){
		const instance = Template.instance();
		if(instance.state.get('timezone')){
			return true;
		}
		return false;
	},
})

Template.body.events({
	'click .toggle-timezone input'(event, instance){
		instance.state.set('timezone', event.target.checked);
	},
})
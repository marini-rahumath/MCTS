import './statistics.html';

import { Template } from 'meteor/templating';

var dataSetName = "";
var coord_x = [];
var coord_y = [];
var storage = [];
var parameters = [];
var paramChange = new Deps.Dependency();

Template.statistics.onCreated(function bodyOnCreated() {
	Meteor.subscribe('epshk');
	Meteor.subscribe('globalVar');
	Meteor.subscribe('nanocomhk');
	Meteor.subscribe('errorlog');
	Meteor.subscribe('flashvar');
	Meteor.subscribe('hkdata');
	Meteor.subscribe('nanocomdata');
	Meteor.subscribe('nanocomrssi');
	Meteor.subscribe('nanohubhk');
});

Template.statistics.onRendered(function () {
	
});

Template.statistics.helpers({
	listParameters(){
		paramChange.depend();
		return parameters;
	},
});

Template.statistics.events({
	'click .getdata'(event, instance){
		Meteor.call('getSqlData', function(err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .dropdata'(event, instance){
		Meteor.call('removeSQLCollections', function(err, response) {
			if(err){
				console.log("err is "+err)
			}
			console.log(response);
		});
	},
	'click .showdata'(event, instance){

		// Need to get the string for the set of data to show
		// Also need to get the string of the parameter of the data to show
		parameters = [];
		const data = [];
		coord_x = [];
		
		$('#selectDataSet option:selected').each(function() {
			dataSetName = $(this)[0].value;
		});

		var dataSet = retrieveData(dataSetName);

		for (key in dataSet[0]){
			// Set parameter list
			if(key != "time" && key != "id"){
				parameters.push(key);
			}
		}

	    // Sort Data
	    for (key in dataSet){
			// Divide the storage into its respective number of parameters
			for (key2 in dataSet[key]){
				if(storage[key2] == null){
					storage[key2] = [];
				}
				for(i=0;i<dataSet[key][key2].length;i++){
					if(storage[key2][i] == null){
						storage[key2][i] = [];
					}
					storage[key2][i].push(dataSet[key][key2][i]);
				}
			}
		}

		paramChange.changed();

		// Initialise the parameters in the x-axis
		for (i in storage["time"]){
			for (j in storage["time"][i]){
				// Pushes one value of time into an array coord_x
				coord_x.push(storage["time"][i][j]);	
			}			
		}

		// Initialise the parameters in the y-axis
		for (i in storage[parameters[0]]){
			coord_y.push(storage[parameters[0]][i]);
		}

		// Plot graph
		for (i in coord_y){
			data.push({
				x: coord_x, y: coord_y[i],
				type: "scatter", mode: "lines",
				marker:{ line:{ width: 3 } },
				name: parameters[0] + " " + i,
			});		
		}	

		const settings = {
			title: dataSetName + " (" + parameters[0] + ")",
			font: {
				size: 12
			},
			showlegend: true,
		};

		var d3 = Plotly.d3;

		var WIDTH_IN_PERCENT_OF_PARENT = 100,
		HEIGHT_IN_PERCENT_OF_PARENT = 80;

		var gd3 = d3.select('#scatterchart')
		.style({
				width: WIDTH_IN_PERCENT_OF_PARENT + '%',
		        height: HEIGHT_IN_PERCENT_OF_PARENT + 'vh',
		    });

		var gd = gd3.node();

		Plotly.newPlot(gd, data, settings);

		window.onresize = function() {
			Plotly.Plots.resize(gd);
		};
	},
	'change .showparam'(event, instance){
		var parameter;
		const data = [];
		coord_y = [];

		$('#selectParameter option:selected').each(function() {
			parameter = $(this)[0].value;
		});

		// Initialise the parameters in the y-axis
		for (i in storage[parameter]){
			coord_y.push(storage[parameter][i]);
		}

		// Plot graph
		for (i in coord_y){
			data.push({
				x: coord_x, y: coord_y[i],
				type: "scatter", mode: "lines",
				marker:{ line:{ width: 3 } },
				name: parameter + " " + i,
			});		
		}	

		const settings = {
			title: dataSetName + " (" + parameter + ")",
			font: {
				size: 12
			},
			showlegend: true,
		};

		var d3 = Plotly.d3;

		var WIDTH_IN_PERCENT_OF_PARENT = 100,
		HEIGHT_IN_PERCENT_OF_PARENT = 80;

		var gd3 = d3.select('#scatterchart')
		.style({
				width: WIDTH_IN_PERCENT_OF_PARENT + '%',
		        height: HEIGHT_IN_PERCENT_OF_PARENT + 'vh',
		    });

		var gd = gd3.node();

		Plotly.newPlot(gd, data, settings);

		window.onresize = function() {
			Plotly.Plots.resize(gd);
		};

	},

});

Template.statistics.onDestroyed(function() {

});

function retrieveData(string){
	var dataSet = [];
	var temp;
	if(string == 'epshk'){
		temp = EPSHK.find().fetch();
		dataSet = temp[temp.length-1].content;
	};
	if(string == 'globalVar'){
		temp = GLOBALVAR.find().fetch();
		dataSet = temp[temp.length-1].content;
	};
	if(string == 'nanocomhk'){
		temp = NANOCOMHK.find().fetch();
		dataSet = temp[temp.length-1].content;
	};
	if(string == 'errorlog'){
		temp = ERRORLOG.find().fetch();
		dataSet = temp[temp.length-1].content;
	};
	if(string == 'flashvar'){
		temp = FLASHVAR.find().fetch();
		dataSet = temp[temp.length-1].content;
	};
	if(string == 'hkdata'){
		temp = HKDATA.find().fetch();
		dataSet = temp[temp.length-1].content;
	};
	if(string == 'nanocomdata'){
		temp =  NANOCOMDATA.find().fetch();
		dataSet = temp[temp.length-1].content;
	};
	if(string == 'nanocomrssi'){
		temp = NANOCOMRSSI.find().fetch();
		dataSet = temp[temp.length-1].content;
	};
	if(string == 'nanohubhk'){
		temp = NANOHUBHK.find().fetch();
		dataSet = temp[temp.length-1].content;
	};
	return dataSet;
}
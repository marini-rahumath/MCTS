import './weather.html';

import { Template } from 'meteor/templating';
import { ReactiveDict } from 'meteor/reactive-dict';
import { Meteor } from 'meteor/meteor';
import PLib from '../../api/prediction/predictlib.js';


Template.Weather.onCreated(function () {
    this.state = new ReactiveDict();
	
});
Template.Weather.helpers({
    //Data from SWPC comes in the format of string, we parse the data and format
    //into our tables
    solarAndGeomagneticInfo(){
            Meteor.call('getGeomagneticAndSolarInfo',function(error,results){
            if(error){
                console.log('Geomagnetic and solar http call error '+error)
            }else{
               Session.set("solarAndGeomagneticdata", results.content);
            }
                return 'Solar and Geomagnetic data not found'
        })
        const arr = [];
        const data = Session.get("solarAndGeomagneticdata")
        if(data == null){
            return null;
        }
        const lines = data.split('\n')
        console.log(lines);
        var lineNum = 0;
        var issueString;
        var authorOfDataString;
        
        
        
        
      lineNum =  findFirstInstanceOfString(lines,lineNum,':Issued')
        if(lines[lineNum].indexOf(':Issued')>-1){
            issueString = lines[lineNum].replace(':Issued:','');
            console.log('issueString is '+issueString)
            lineNum++
        }
        if(lines[lineNum].indexOf('# Prepared'>-1)){
            authorOfDataString = lines[lineNum].replace('#','');
            console.log('authors is '+authorOfDataString)
            lineNum++
        }
        lineNum = findFirstInstanceOfString(lines,lineNum,'A.');
         var category1 = generateCategoryObject(lines,lineNum,false)
        lineNum = findFirstInstanceOfString(lines,lineNum,'B.')
        var category2 = generateCategoryObject(lines,lineNum,true)
        lineNum = findFirstInstanceOfString(lines,lineNum,'C.')
        var category3 = generateCategoryObject(lines,lineNum,false)
    
         var resultArr = [];
        resultArr.push(category1)
        resultArr.push(category2)
        resultArr.push(category3)
        
         return {authorOfDataString:authorOfDataString,issueString:issueString,resultArr: resultArr};//{category1:category1,category2:category2:category3:category3}
        
    },
    forecast(){
        const instance = Template.instance();
        const eventData = instance.state.get('weatherRawData');
        if(eventData == null){
            console.log('null')
            return [];
        }else{
            const forecastResults= []; //each data has a type and a array
            forecastResults.push(createForecastData('current',eventData.currently))
            forecastResults.push(createForecastData('daily',eventData.daily.data))
            forecastResults.push(createForecastData('hourly',eventData.hourly.data))
            return {show:true, data: forecastResults}
        }

    },
	timezone(){
		const instance = Template.instance();
		if(instance.state.get('timezone')){
			return true;
		}
		return false;
	}
})
function createForecastData(forecastType,forecastData){
    var isRemoveTime = false;
    var type;
    if(forecastType=='daily'){
        isRemoveTime = true;
        type = 'AVERAGE CLOUD COVER FOR THE DAY'
    }else{
        type = forecastType.toUpperCase();
    }
        const arr = [];
     if(forecastType=='current'){
          const tempDate = new Date(forecastData.time*1000)
            arr.push({cloudCover:forecastData.cloudCover,
                      timeOfForecast:formatNormalDate(tempDate),
                      UTCTimeOfForecast:formatUtcDate(tempDate)
                    });
    }else{
         for(i=0; i <forecastData.length;i++){
            const tempDate = new Date(forecastData[i].time*1000)
            arr.push({cloudCover:forecastData[i].cloudCover,
                      timeOfForecast:formatNormalDate(tempDate,isRemoveTime),
                      UTCTimeOfForecast: formatUtcDate(tempDate,isRemoveTime)
                     });
        
                     } 
     }
    if(forecastType == 'daily'){
      arr.splice(0,1)  
    }
    
   
    return {type:type,array:arr}
}
function formatNormalDate(dateInput,isRemoveTime){
    if(isRemoveTime){
        return PLib.formatDateOnly(dateInput)
    }
    return PLib.formatDateOnly(dateInput)+'    '+PLib.format24HOnly(dateInput);
}
function formatUtcDate(dateInput,isRemoveTime){
    if(isRemoveTime){
         return PLib.formatUTCDateOnly(dateInput)
    }
    return PLib.formatUTCDateOnly(dateInput)+'   '+PLib.formatUTC24HOnly(dateInput);
}

function findFirstInstanceOfString(lines,lineNum,str){
      while(lines[lineNum].indexOf(str)!=0){
            lineNum++;
        }
        return lineNum
}
function generateCategoryObject(lines,lineNum,singleLineSpaceForColHeaders){
        var mainTableHeader;// = new mainTableHeader();
        var tableInfo;
        var tableRationale;
        var tableHeader;
        var tableColHeaders = []; // will store the 3 header data
        var tableRow = []; //contains the row header as first and rest as the data (2d array)
        var temp
        mainTableHeader = lines[lineNum].substring(3,lines[lineNum].length);
        lineNum+=2;
        temp = generateLongString(lines,lineNum)
        tableInfo = temp.tempString;
        lineNum = temp.lineNum;
        lineNum++
        
        temp = generateLongString(lines,lineNum);
        tableHeader = temp.tempString
        lineNum = temp.lineNum
        lineNum++
    
        if(singleLineSpaceForColHeaders){
            tableColHeaders = processSingleSpacedColHeaders(lines[lineNum])
            
        }else{
            tableColHeaders = processTabbedString(lines[lineNum])
        }
       
        
        
        lineNum++
        
        var preTableRow = []
        while(lines[lineNum] !==''){
            tableRow.push(processTabbedString(lines[lineNum]))
            lineNum++
        }
        tableRow = processTableRow(tableRow);   
    
        lineNum++
        
        temp = generateLongString(lines,lineNum)
        tableRationale = temp.tempString
        lineNum = temp.lineNum;
        
    
        return {mainTableHeader:mainTableHeader,tableInfo:tableInfo,tableRationale:tableRationale,tableHeader:tableHeader,tableRow:tableRow,tableColHeaders:tableColHeaders}
}
function processTableRow(tableRow){
    var j =0;
 for(i=0;i<tableRow.length;i++){
        while(j<tableRow[i].length){
          if(tableRow[i][j]===''){
               tableRow[i].splice(j,1);
                j--;
              console.log('found empty')
            }
            j++;  
        }
            
    }
 return tableRow;
}

function processPreTableRow(preTableRow){
    //converting rows to column for easier formating later
    var col0 = [];
    var col1 = [];
    var col2 = [];
    var col3 = [];
    var colTableArr =[];
    for(i=0;i<preTableRow.length;i++){
        col0.push(preTableRow[i][0])
         col1.push(preTableRow[i][1])
          col2.push(preTableRow[i][2])
           col3.push(preTableRow[i][3])
        
    }
    colTableArr.push(col0);
    colTableArr.push(col1);
    colTableArr.push(col2);
    colTableArr.push(col3);
    return colTableArr;
    
}

function processSingleSpacedColHeaders(str){
    var splitString = str.split(' ')
    var tempArr = []
    var tempArrPos = 0;
    var mergeCount = 0;
    for(i = 0;i<splitString.length;i++){
        if(splitString[i]!==''){
            if(mergeCount == 1){
                tempArr[tempArrPos-1] += ' '+splitString[i]
                mergeCount=0;
            }else{
                tempArr.push(splitString[i])
                mergeCount++;
                tempArrPos++;
            }
        } 
    }
    return tempArr
}
function processTabbedString(str){
     var splitString = str.split('   ')
            var tempArr = []
            for(i = 0;i<splitString.length;i++){
                if(splitString[i]!==''){
                    tempArr.push(splitString[i].trim())
                }
            }
    return tempArr;
}
function printArr(arr){
    for(i=0;i<arr.length;i++){
        console.log(arr[i])
    }
}
function generateLongString(lines,lineNum){
       var tempString = ''    
    while(lines[lineNum] !== ''){
            tempString += lines[lineNum];
            
            lineNum++
        }
    return {tempString:tempString, lineNum:lineNum};
}
Template.Weather.events({
    'click .toggle-timezone'(event, instance){
		instance.state.set('timezone', event.target.checked);
	},
	'click .run-weatherForecast'(event, instance){
		const latitude = instance.find('.latitude').value;
		const longtitude = instance.find('.longtitude').value;
        Meteor.call("getWeather",latitude,longtitude, function(error, results) {
			if(error){
				console.log("Weather error is "+error)
			}else{
                instance.state.set('weatherRawData',JSON.parse(results.content))   
			}
        });
    }
});
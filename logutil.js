 /*****************************************
 * logutil.js                             *
 * Contains functions for logging,        *
 * including formatting and time.         *
 *****************************************/

//require the colors library, to make colored text in the console
var colors = require('colors');

//variable to hold the last time a message was sent.
//used to determine whether the full date should be sent - if only the time is different and not the day then we won't waste space
var lastTime = new Date(0);

//make all the stuff inside this public, so we can access it from the main program file
module.exports = {
	//object holding some preset logging levels and their formatted prefixes
	levels: {
		info: "INFO".bold.green,
		warn: "WARN".bold.yellow,
		err: "ERROR".bold.red
	},
	//function to output log messages to the console
	log: function(msg, level){
		//if no level is provided
		if((level == null) || (level === undefined) || (level.trim() == "")){
			//level is automatically INFO
			level = module.exports.levels.info;
		}
		//variable to hold the current time
		var currentTime = time();
		//output the message, formatting the time string based on last time and current time
		console.log("["+timefmt(currentTime,lastTime)+"]["+level+"] "+msg);
		//assign the current time to the last time; it will be compared the next time a log message is sent
		lastTime = currentTime;
	},
	//function to exit and display a log message based on the status code
	exit: function(code){
		//variable to hold the log level
		var level = "";
		//if the exit status code is greater than zero (error occurred)
		if(code>0){
			//set the log level to "ERROR"
			level = module.exports.levels.err;
		}
		//otherwise
		else{
			//set the log level to "INFO"
			level = module.exports.levels.info;
		}
		//output the log message, including the status code
		module.exports.log("Exiting... (Code: "+code+")",level);
		//actually exit the program, returning the status code
		process.exit(code);
	}	
}

//gets the current time as a Date object.
function time(){
	return new Date();
}

//checks whether the date portions of two Date objects are different or not.
function checkDateDiff(time1, time2){
	return (
		//check year
		(time1.getFullYear() != time2.getFullYear()) ||
		//check month
        (time1.getMonth() != time2.getMonth()) ||
        //check day
        (time1.getDate() != time2.getDate())
		);
}

//returns a formatted time string. Decides whether to include the date based on whether the dates of "now" and "last" are different.
function timefmt(now, last){
	//variable to hold the current time, formatted as YYYY-MM-DDTHH:MM:SS.mmmZ
	var nowstr = now.toJSON();
	//variable to hold the output string, now empty
	var outstr = "";
	//variable to hold the current date as a string. uses regular expression to match everything before the "T"
	var datestr = nowstr.match(/([0-9,-]+)T/)[1].cyan;
	//variable to hold the current time as a string. uses regular expression to match everything between the "T" and the "Z"
	var timestr = nowstr.match(/T([0-9,\:,\.]+)Z/)[1].bold.blue;
	//checks if the dates are different
	if (last && checkDateDiff(last, now)){
		//assign the date string and a space to the output
		outstr = datestr + " ";
	}
	//append the time string to the output
	outstr = outstr + timestr;
	//return the output
	return outstr;
}
var readline = require('readline')
var util = require('util');

var firstTime = true;

module.exports.setupInterface = function (readlineInstance)
{
	var rl;
	if(readlineInstance)
	{
		rl = readlineInstance;
	}
	else
	{
		rl = readline.createInterface({
    		input: process.stdin,
    		output: process.stdout
		});
	}
    rl.setPrompt("> ", 2);
    rl.on('close', function() {
        return process.exit(1);
    });
    rl.on("SIGINT", function() {
        rl.clearLine();
        rl.question("Confirm exit : ", function(answer) {
            return (answer.match(/^o(ui)?$/i) || answer.match(/^y(es)?$/i)) ? process.exit(1) : rl.output.write("> ");
        });
    });
    rl.prompt();

    var fu = function(type, args) {
        var t = Math.ceil((rl.line.length + 3) / process.stdout.columns);
        var text = util.format.apply(console, args);
        rl.output.write("\n\x1B[" + t + "A\x1B[0J");
        rl.output.write(text + "\n");
        rl.output.write(Array(t).join("\n\x1B[E"));
        rl._refreshLine();
    };
    rl.on('line',function(line){
    	rl.prompt();
    });

    console.log = function() {
        fu("log", arguments);
    };
    console.warn = function() {
        fu("warn", arguments);
    };
    console.info = function() {
        fu("info", arguments);
    };
    console.error = function() {
        fu("error", arguments);
    };

    return rl;
}

module.exports.setupCommandListener = function(rl, listener, deleteOld)
{
	if(firstTime)
	{
		firstTime = false;
		deleteOld = true;
	}
	if(deleteOld)
	{
		rl.removeAllListeners('line');
	}
	if(typeof listener === 'function')
	{
		rl.on("line", function(line) {
    		listener(line);
    		rl.prompt();
		});
	}
}

//returns a formatted string for user information.
//the returned string will be in the format "Full Name (@username) [ID: XXXXXXXXX]"
module.exports.getUserFormat = function(user){
  return module.exports.getFormattedName(user).bold.green+" (".yellow+module.exports.getUsername(user)+")".yellow+" [ID: ".bold.cyan+user.id.toString().inverse+"]".bold.cyan;
}

//returns the formatted full name of a user.
//if the user has no last name set, then "Firstname" will be returned,
//but if the user does have a last name set, then "Firstname Lastname" will be returned.
module.exports.getFormattedName = function(user){
  return user.first_name+(user.last_name?" "+user.last_name:"");
}

//returns the formatted username of a user.
//if the user has a username, then "@username" will be returned, but if
//the user does not have a username, then "No username" will be returned.
module.exports.getUsername = function(user){
  return (user.username?"@"+user.username.bold.magenta:"No username".italic.magenta);
}
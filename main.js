var botBase = require('./bot-base.js');

var logutil = require('./logutil.js');
var levels = logutil.levels;
var log = logutil.log;
var exit = logutil.exit;

var TelegramBot = require('node-telegram-bot-api');

var rl;
var bot;

checkArguments();
var token = process.argv[2];

rl = botBase.setupInterface();
log("Interface successfully started!");

log("Initializing Telegram bot...");
initTelegram(token);




var usage = "node main.js <Telegram Bot API token>"
function checkArguments(){
  var args = process.argv
  if(args.length < 3)
  {
    log("Missing arguments!",levels.err);
    log("Usage: "+usage,levels.err);
    exit(1)
  }
  return true;
}
function initTelegram(token){
  bot = new TelegramBot(token,{polling:true});
  log("Fetching bot information...",levels.info);
  me = bot.getMe().then((me) => {
    log("Bot information fetched!",levels.info);
    log("Bot ID: "+me.id+"; Name: "+me.first_name+(me.last_name?" "+me.last_name:"")+"; Username: @"+me.username);
    startTelegramPolling(bot);
  }).catch((e) => {
    log("An error was encountered while fetching bot information!",levels.err);
    //check if the token was incorrect (API server will return HTTP 401 UNAUTHORIZED error)
    if(e.response && e.response.body && JSON.parse(e.response.body).error_code==401){
      log("Your token is incorrect! (API returned 401 UNAUTHORIZED)",levels.err);
    }
    log(e.stack.bold.red,levels.err);
    exit(2);
  });
  //
}

function startTelegramPolling(bot){
    //set up event listeners
    bot.on('text',onMessage);
    bot.on('inline_query',onInlineQuery);
    bot.on('callback_query',onCallbackQuery);
    log("Telegram Bot successfully started!",levels.info);
    botBase.setupCommandListener(rl, handleConsoleCommand);
    log("-= READY =-".bold.green);
  }

  function onMessage(msg)
  {
    log("Message from "+botBase.getUserFormat(msg.from)+": '"+msg.text+"'");
    bot.sendMessage(msg.from.id,"Message received!");
  }

  function onInlineQuery(query)
  {
    log("Inline query from "+botBase.getUserFormat(query.from)+"; Query ID: "+query.id+"; Text: '"+query.query+"'");
  }

function onCallbackQuery(query)
{
  log("Callback query from "+botBase.getUserFormat(query.from)+"; Query ID: "+query.id+"; Data: '"+query.data+"'");
}

 function handleConsoleCommand(command)
 {
  var args = command.trim().split(" ");
  if(!(args.length == 1 && args[0] == ""))
  {
    if(args[0] == "send")
    {
      if(args.length < 3)
      {
        log("Usage: send <ID> <message>",levels.err);
      }
      else
      {
        id = args[1];
        message = "";
        for(var i =2;i<args.length;i++)
        {
          message += args[i];
          message += " ";
        }
        bot.sendMessage(id,message);
      }
    }
  }
}


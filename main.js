var botBase = require('./bot-base.js');

var logutil = require('./logutil.js');
var levels = logutil.levels;
var log = logutil.log;
var exit = logutil.exit;

var TelegramBot = require('node-telegram-bot-api');

var uuid = require('uuid');

var rl;
var bot;

var diceSizes = [4,6,8,10,12,20];

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
    var diceMsg = createDiceMessage(20);
    bot.sendMessage(msg.from.id,diceMsg.text, {reply_markup:diceMsg.reply_markup});
  }

  function onInlineQuery(query)
  {
    log("Inline query from "+botBase.getUserFormat(query.from)+"; Query ID: "+query.id+"; Text: '"+query.query+"'");
    var results = [];
    for(var i in diceSizes)
    {
      var current = diceSizes[i];
      var diceMsg = createDiceMessage(current);
      results.push(createInlineQueryResult(uuid.v4(),'D'+current,current+'-sided die', diceMsg.text, diceMsg.reply_markup));
    }
    bot.answerInlineQuery(query.id, results);
  }

  function onCallbackQuery(query)
  {
    log("Callback query from "+botBase.getUserFormat(query.from)+"; Query ID: "+query.id+"; Data: '"+query.data+"'");
    var msgID;
    var chatID;
    var data = JSON.parse(query.data);
    if(data.reroll)
    {
      var rerollCount = data.rerollCount;
      if(!rerollCount){rerollCount = 0};
      rerollCount++;
      var sides = parseInt(data.reroll);
      if(sides)
      {
        var newMsg = createDiceMessage(sides,rerollCount);
        if(query.inline_message_id)
        {
          msgID = query.inline_message_id;
          bot.editMessageText(newMsg.text, {inline_message_id:msgID,reply_markup:newMsg.reply_markup});
        }
        else
        {
          msgID = query.message.message_id;
          chatID = query.message.chat.id;
          bot.editMessageText(newMsg.text, {message_id:msgID,chat_id:chatID,reply_markup:newMsg.reply_markup});
        }
      }
    }
    bot.answerCallbackQuery(query.id,"",false,{});
  }

function createDiceMessage(sides,rerollCount)
{
  if(!rerollCount){rerollCount=0};
  var msgText = "";
  msgText += (sides+'-sided die (D'+sides+') roll:'+'\n');
  msgText += roll(sides)+'\n';
  //decided to put the reroll count on the button in favor of visibility.
  /*if(rerollCount > 0)
  {
    msgText += "(Re-rolled "+rerollCount+" times)\n";
  }*/

  var buttons = [];
  var firstRow = [];
  var buttonText = (rerollCount > 0 ? "Roll Again ("+rerollCount+")" : "Roll Again");
  firstRow.push(createInlineKeyboardButton(buttonText,'{"reroll":'+sides+',"rerollCount":'+rerollCount+'}'));
  buttons.push(firstRow);

  var replyMarkup = createInlineKeyboardMarkup(buttons);
  return {text:msgText,reply_markup:replyMarkup};
}

function roll(sides)
{
  return Math.floor(Math.random()*sides)+1;
}


//requires a two-dimensional array of inline keyboard button objects and wraps them in the syntax that telegram requires.
//see createInlineKeyboardButton for a function that generates them.
function createInlineKeyboardMarkup(buttons){
  return {inline_keyboard:buttons};
}

function createInlineKeyboardButton(text, callbackData){
  return {text:text,callback_data:callbackData};
}

//abstraction
//returns an inline query result object given the id and some information.
function createInlineQueryResult(resultId, title, description, content, replyMarkup){
  return {type:"article",id:resultId,title:title,description:description,input_message_content:{message_text:content}, reply_markup:replyMarkup};
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
    if(args[0] == "roll")
    {
      if(args.length < 2)
      {
        log("Usage: roll <sides>",levels.err);
      }
      else
      {
        var sides = parseInt(args[1]);
        if(sides)
        {
          var result = roll(sides);
          log(sides+"-sided die roll: "+result);
        }
        else
        {
          log("Sides must be a valid number",levels.err);
        }
      }
    }
  }
}


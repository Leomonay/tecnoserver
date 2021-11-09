require("dotenv").config();
const telegramBot = require('node-telegram-bot-api');
const {BOT_TOKEN,BOT_URL,BOT_PARSE_MODE} = process.env; 

const bot = new telegramBot(BOT_TOKEN, {polling: true});

bot.onText(/^\/start/, function(msg){
    console.log(msg);
    var chatId = msg.chat.id;
    var userName = msg.from.username;
    bot .sendMessage(chatId,"Hola, "+userName+". soy el bot de Tecnoclima, minombre es TecnoBot");
});

bot.on('message', function(msg){
    console.log(msg);
    var chatId = msg.chat.id;
    var text = msg.text;
    if(text.includes("hola")){
        bot.sendMessage(chatId, 'hola de nuevo, '+msg.from.username+'!');
    }else{
    bot.sendMessage(chatId, 'Procesando tu mensaje');
    }
});

// bot.on('rrss',(ctx)=>{
//     var botones = {
//         reply_markup:{
//             inline_keyboard:[
//             [{text: "Web", url:"https://forocoches.com"},
//             {text: "Twitter", url:"https://twitter.com"},
//             {text: "Instagram", url:"https:/www.instagram.com"},
//             {text: "Facebook", url:"https://www.facebook.com"},
//             {text: "YouTube", url:"https://www.youtube.com"},
//             {text: "Twitch", url:"https://www.twitch.tv"},
//         ]
//         ]},
//         parse_mode:"HTML",
//     };
//         bot.sendMessage(ctx.chat.id, "<b><i>Estas son las redes sociales:</i></b>",botones);
// });

module.exports = {
    bot
};

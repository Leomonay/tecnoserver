require('dotenv').config();

// set online telegram bot
    // const bot = require('./src/telegramBot');
    
// load config
const {appConfig, dbUrl} = require ('./config');

const server = require('./src/server');
//import database connection:
const connectDb = require('./src/db/mongodb');

async function initApp(appConfig, dbUrl){
  try{
    await connectDb(dbUrl);
    server.listen(appConfig.port, ()=> {
      (`Servidor web escuchando en el puerto ${appConfig.port}`);
    });  
  }catch(e){
    console.error(e);
    process.exit(0);
  }
}
initApp(appConfig,dbUrl);
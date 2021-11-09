const mongoose = require('mongoose');

mongoose.connection.on('open',()=>console.log('db connected'))

async function connectDb (url){
    // const uri = `mongodb://${host}:${port}/${dbName}`;
    // const uri = `mongodb+srv://tecnoadmin:admin@cluster0.vwxyc.mongodb.net/tecnobase`;
    console.log(url);
    await mongoose.connect(url, {useNewUrlParser: true});
}

module.exports=connectDb;
const mongoose = require('mongoose');

mongoose.connection.on('open',()=>console.log('db connected'))

async function connectDb (url){
    console.log(url);
    await mongoose.connect(url, {useNewUrlParser: true});
}

module.exports=connectDb;
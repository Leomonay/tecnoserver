const config = {
    appConfig:{
        host: process.env.HOST,
        port: process.env.PORT || 5000
    },
    dbUrl:process.env.DB_URL,
}
module.exports=config
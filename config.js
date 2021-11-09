const config = {
    appConfig:{
        host: process.env.APP_HOST,
        port: process.env.APP_PORT || 8000
    },
    dbUrl:process.env.DB_URL,
}
module.exports=config
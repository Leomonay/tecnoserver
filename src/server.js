const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require ('morgan');
const routes = require('./routes/index.js');
//const productRoutes = require('./routes/products');

const server = express();

const {CLIENT_URL} = process.env; 

server.use(express.json());
server.name='TecnoApp';

server.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
server.use(bodyParser.json({ limit: '50mb' }));

server.use('/public',express.static(`${__dirname}/storage/imgs`))

server.use(cookieParser('secret'));
server.use(morgan('dev'));
server.use((req,res, next)=>{
    res.header('Access-Control-Allow-Origin', CLIENT_URL);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    next();
});

server.get('/',(req,res)=>res.send("Tecnoclima Server"));
server.use('/v1',routes);

server.use((err, req, res, next) => {
    // eslint-disable-line no-unused-vars
    const status = err.status || 500;
    const message = err.message || err;
    console.error(err);
    res.status(status).send(message);  
  });

module.exports = server;
/*
    Import Modules
 */
const express = require("express");
const path = require("path");
const http = require("http");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const socketIo = require('socket.io');

const csv      = require('csv-express');

const CONFIG = require("./config");


//Initialise Server
const app = express();
const Server = http.Server(app);
const io = socketIo(Server);

//Handle form-data (JSON & UrlEncoded)
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use('/',express.static(path.join(__dirname,"./public_html")));
app.use("/",require("./routes/user"));


app.use(function (req, res) {
    res.send('404');
});

let unameSocketMap={};
io.on('connection',(socket)=>{
    // console.log(socket.id);
    socket.on('uname',(data)=>{
        unameSocketMap[data]=socket.id;
    });
    socket.on('monitor',(data)=>{
        if(unameSocketMap[data])
            socket.to(unameSocketMap[data]).emit('click');
        else
            socket.emit('fail');
    });
    socket.on('stopMonitor',(data)=>{
        if(unameSocketMap[data])
            socket.to(unameSocketMap[data]).emit('stopClick');
        else
            socket.emit('fail');
    })


});
//Listen on port
Server.listen(CONFIG.SERVER.PORT, function () {
    console.log(`Server running @ http://${CONFIG.SERVER.HOST}:${CONFIG.SERVER.PORT}`);
});

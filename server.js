/*
    Import Modules
 */
const express = require("express");
const path = require("path");
const http = require("http");
const mongoose = require("mongoose");
const socketIo = require('socket.io');

const csv      = require('csv-express');

const CONFIG = require("./config");


//Initialise Server
const app = express();
const Server = http.Server(app);
const io = socketIo(Server);

//Handle form-data (JSON & UrlEncoded)
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

app.use('/',express.static(path.join(__dirname,"./public_html")));
app.use("/",require("./routes/user"));


app.use(function (req, res) {
    res.send('404');
});
let unameSocketMap={};
io.on('connection',(socket)=>{
    // console.log(socket.id);
    socket.on('uname',(data)=>{
        console.log(data);
        unameSocketMap[data]=socket.id;
    });
    socket.on('monitor',(data)=>{
        console.log(data);
    });
    socket.on('stopMonitor',(data)=>{
        console.log(data);
    })


});
//Listen on port
Server.listen(CONFIG.SERVER.PORT, function () {
    console.log(`Server running @ http://${CONFIG.SERVER.HOST}:${CONFIG.SERVER.PORT}`);
});

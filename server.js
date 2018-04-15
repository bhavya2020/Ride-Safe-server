/*
    Import Modules
 */
const express = require("express");
const path = require("path");
const http = require("http");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const socketIo = require('socket.io');
const fs=require('fs');
const csv      = require('csv-express');

const CONFIG = require("./config");
let imgName={};
let oldImgName={};

//Initialise Server
const app = express();
const Server = http.Server(app);
const io = socketIo(Server);

//Handle form-data (JSON & UrlEncoded)
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

app.use('/',express.static(path.join(__dirname,"./public_html")));
app.use('/',require("./routes/user"));


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
    socket.on('disconnect',(data)=>{
       unameSocketMap[data]=undefined;
    });
    socket.on('stopMonitor',(data)=>{

        oldImgName[data]=imgName[data];

        if(unameSocketMap[data])
            socket.to(unameSocketMap[data]).emit('stopClick');
        else
            socket.emit('fail');
    })
});
app.post("/click/:email",(req,res)=>{

    // console.log(req.params.email);
    let dir = __dirname+'/public_html/images/'+req.params.email;
    // console.log(dir);
    if (!fs.existsSync(dir)){
        console.log("dir does not exists");
        imgName[req.params.email]=1;
        oldImgName[req.params.email]=1;
        fs.mkdirSync(dir);
    }
    let bitmap = new Buffer(req.body.img, 'base64');
    fs.writeFileSync(__dirname+"/public_html/images/"+req.params.email+"/"+imgName[req.params.email]+".jpg", bitmap);
    imgName[req.params.email]++;
    res.send("got");
});
app.use(function (req, res) {
    res.send('404');
});

//Listen on port
Server.listen(CONFIG.SERVER.PORT, function () {
    console.log(`Server running @ http://${CONFIG.SERVER.HOST}:${CONFIG.SERVER.PORT}`);
});

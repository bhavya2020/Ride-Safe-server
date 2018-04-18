/*
    Import Modules
 */
const express = require("express");
const parse=require('csv-parse');
const path = require("path");
const http = require("http");
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const models=require('./models/mongodb/mongo');
const socketIo = require('socket.io');
const fs=require('fs');
const csv      = require('csv-express');
const PythonShell=require('python-shell');
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


async  function processImages(uname,start,end) {

    let driver=await function (uname) {
        return new Promise((resolve)=>{
            models.distractionResult.findOne({
                driver:uname
            }).then((driver)=>{
                resolve(driver);
            }).catch((Err)=>{
                console.log(Err);
            })
        })
    }(uname);
        if(!driver) return;
    for(let i=start;i<end;i++) {
        await function getDistractionPrediction(i) {
            let imgPath=__dirname+"/public_html/images/"+uname+"/"+i+".jpg";
            let options = {
                mode: 'text',
                pythonPath: '/usr/bin/python3.5',
                pythonOptions: ['-u'],
                scriptPath: path.join(__dirname),
                args: [imgPath, path.join(__dirname, "./", "driverDistractionResult/", uname + ".csv"), "driver_distraction_model.h5"]
            };
            PythonShell.run('predicton.py', options, function (err, results) {
                if (err) console.log(err);
                // results is an array consisting of messages collected during execution
                console.log('results: %j', results);
                let csvPath = path.join(__dirname, "./", "driverDistractionResult/", uname+ ".csv");
                if (fs.existsSync(csvPath)) {
                    let csvData = [];
                    fs.createReadStream(csvPath)
                        .pipe(parse({delimiter: ':'}))
                        .on('data', function (csvrow) {
                            //do something with csvrow
                            csvData.push(csvrow);
                        })
                        .on('end', function () {
                            imgPath="/images/"+uname+"/"+i+".jpg";
                            //do something with csvData
                            console.log(csvData[1][0]);
                            switch (csvData[1][0]){
                                case '0': driver.c0.push(imgPath);break;
                                case '1': driver.c1.push(imgPath);break;
                                case '2': driver.c2.push(imgPath);break;
                                case '3': driver.c3.push(imgPath);break;
                                case '4': driver.c4.push(imgPath);break;
                                case '5': driver.c5.push(imgPath);break;
                                case '6': driver.c6.push(imgPath);break;
                                case '7': driver.c7.push(imgPath);break;
                                default : console.log("default");
                            }
                            driver.save();
                        });
                }else{
                    console.log("result does not exist");
                }

            });
        }(i);
    }



}
let unameSocketMap={};
io.on('connection',(socket)=>{
    console.log(socket.id);
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

        processImages(data,oldImgName[data],imgName[data])
            .then((data)=>{
            // console.log(data);
            }).catch((err)=>{
            console.log(err);
        });
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
        models.distractionResult.create({
            driver:req.params.email
        }).then(()=>{}).catch((err)=>{
            console.log(err);
        });
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

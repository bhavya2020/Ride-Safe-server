const route = require("express").Router();
const CONFIG = require("../config");
const fs = require('fs');
const path = require('path');
const models=require('../models/mongodb/mongo');
const PythonShell=require('python-shell');

route.post('/signUp',(req,res)=>{
    models.user.findOne({
        email:req.body.email
    }).then((user)=>{
        if(!user)
        { let options = {
            mode: 'text',
            pythonPath: '/usr/bin/python3.5',
            pythonOptions: ['-u'],
            scriptPath: path.join(__dirname,"../"),
            args: [req.body.profilePic,path.join(__dirname, "../", "under18result/",req.body.email+".csv" ),"17-2-18_Test-1.h5","2"]
        };
        console.log(req.body.profilePic);
            PythonShell.run('predicton.py', options, function (err, results) {
                if (err) console.log(err);
                // results is an array consisting of messages collected during execution
                console.log('results: %j', results);
            });
            models.user.create({
                email:req.body.email
            }).then(()=>{
                res.send("done")
            }).catch((err)=>{
                res.send("notDone")
            });

        }
        else{
            res.send("done")
        }
    }).catch((err)=> {
        res.send("notDone")
    })
});
route.get('/isUnder18/:email',(req,res)=>{

        let csvPath = path.join(__dirname, "../", "under18result/", req.params.email + ".csv");
        if (fs.existsSync(csvPath)) {
            let csvData = [];
            fs.createReadStream(csvPath)
                .pipe(parse({delimiter: ':'}))
                .on('data', function (csvrow) {
                    //do something with csvrow
                    csvData.push(csvrow);
                })
                .on('end', function () {
                    //do something wiht csvData
                    console.log(csvData[1][0]);
                    res.send(csvData[1][0]);
                });
        } else {
            res.send("1");
        }
});
route.get('/profile/:email',(req,res)=>{
    models.user.findOne({
        email:req.params.email
    }).then((user)=> {
        if(user)
            res.send(user);
        else{
            res.send("notDone");
        }
    }).catch((err)=>{
        res.send(err);
    })
});

route.post('/update',(req,res)=>{
    models.user.findOne({
        email:req.body.email
    }).then((user)=>{
        if(user)
        {
            try {
                user.DLno = req.body.DLno;
                user.licencePlateNo = req.body.licencePlateNo;
                user.gender = req.body.gender;
                user.phoneNo = req.body.phoneNo;
                user.age = req.body.age;
            }catch (err){
                console.log(err);
            }
            user.save().then()
                .catch((err)=>{
                console.log(err);
                });
            res.send("done");
        }
        else{
            console.log("no");
            res.send("notDone")
        }
    }).catch((err)=> {
        res.send("notDone")
    })
});

route.post('/accelerometer',(req,res)=>{
    models.sensor.create({
        email:req.body.email,
        x:req.body.x,
        y:req.body.y,
        z:req.body.z,
        sensorType:"accelerometer",
        time:req.body.time
    }).then(()=>{
        res.send("done")
    }).catch((err)=>{
        res.send(err);
    })
});

route.post('/linearAcceleration',(req,res)=>{
    models.sensor.create({
        email:req.body.email,
        x:req.body.x,
        y:req.body.y,
        z:req.body.z,
        sensorType:"linearAcceleration",
        time:req.body.time
    }).then(()=>{
        res.send("done")
    }).catch((err)=>{
        res.send(err);
    })
});

route.post('/magnetometer',(req,res)=>{
    models.sensor.create({
        email:req.body.email,
        x:req.body.x,
        y:req.body.y,
        z:req.body.z,
        sensorType:"magnetometer",
        time:req.body.time
    }).then(()=>{
        res.send("done")
    }).catch((err)=>{
        res.send(err);
    })
});

route.post('/gyroscope',(req,res)=>{
    models.sensor.create({
        email:req.body.email,
        x:req.body.x,
        y:req.body.y,
        z:req.body.z,
        sensorType:"gyroscope",
        time:req.body.time
    }).then(()=>{
        res.send("done")
    }).catch((err)=>{
        res.send(err);
    })
});
route.get('/report/:email',(req,res)=>{
   models.user.findOne({
       email: req.params.email
   }).then((user)=>{
      return models.culprits.find({
           plateNo:user.licencePlateNo
       })
   }) .then((reports)=>{
       res.send({
           reports:reports
       })
   }).catch((err)=>{
       res.send({
           reports:["err"]
       });
   })
});
route.post('/report',(req,res)=>{
    models.culprits.create({
        reporterID:req.body.reporterID,
        plateNo:req.body.plateNo,
    }).then((culprit)=>{
        culprit.categories.push(req.body.category0);
        culprit.categories.push(req.body.category1);
        culprit.categories.push(req.body.category2);
        culprit.categories.push(req.body.category3);
        culprit.categories.push(req.body.category4);
        culprit.categories.push(req.body.category5);
        culprit.save();
        res.send("done");
    }).catch((err)=>{
        res.send("notDone");
    })
});
module.exports = route;
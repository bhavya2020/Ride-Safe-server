const route = require("express").Router();
const CONFIG = require("../config");
const fs = require('fs');
const mongoose=require('mongoose');
const path = require('path');
const models = require('../models/mongodb/mongo');
const PythonShell = require('python-shell');
const Json2csvTransform = require('json2csv').Transform;

function makePrediction(uname) {

    models.sensor.find({
        email: uname
    }).lean().exec()
        .then((sensorData) => {
            const json2csv = require('json2csv').parse;
            const fields = ['sensorType', 'x', 'y', 'z', 'time'];
            const opts = {fields};
            const csv = json2csv(sensorData, opts);
            fs.createWriteStream(path.join(__dirname, "../", "monitorResult/" + uname + ".csv"), {encoding: 'utf-8'});
            fs.createWriteStream(path.join(__dirname, "../", "monitorPrediction/" + uname + ".csv"), {encoding: 'utf-8'});
            console.log("built");
            fs.appendFile(path.join(__dirname, "../", "monitorResult/" + uname + ".csv"), csv, () => {
                console.log("appended");
                let options = {
                    mode: 'text',
                    pythonPath: '/usr/bin/python3.5',
                    pythonOptions: ['-u'],
                    scriptPath: path.join(__dirname, "../"),
                    args: [path.join(__dirname, "../", "sensors_model.h5"), path.join(__dirname, "../", "monitorResult/" + uname + ".csv"), path.join(__dirname, "../", "monitorPrediction/" + uname + ".csv")]
                };
                PythonShell.run('sensors_prediction.py', options, function (err, results) {
                    if (err) console.log(err);
                    // results is an array consisting of messages collected during execution
                    console.log('results: %j', results);
                });
            });
        });

}
async function sendDriverNames(map,res) {
    let driverNames=[];
    for(let driver of map.drivers)
    {
      await   models.user.find({
            _id:mongoose.Types.ObjectId(driver)
        }).then((user)=>{
            let email=user[0].email;
            driverNames.push(email);
        }).catch((err)=>{
            console.log(err);
        })
    }
    res.send({drivers: driverNames});
}

route.post('/signUp', (req, res) => {
    models.user.findOne({
        email: req.body.email
    }).then((user) => {
        if (!user) {
            let options = {
                mode: 'text',
                pythonPath: '/usr/bin/python3.5',
                pythonOptions: ['-u'],
                scriptPath: path.join(__dirname, "../"),
                args: [req.body.profilePic, path.join(__dirname, "../", "under18result/", req.body.email + ".csv"), "17-2-18_Test-1.h5", "2"]
            };
            PythonShell.run('predicton.py', options, function (err, results) {
                if (err) console.log(err);
                // results is an array consisting of messages collected during execution
                console.log('results: %j', results);
            });
            models.user.create({
                email: req.body.email
            }).then(() => {
                res.send("done")
            }).catch((err) => {
                res.send("notDone")
            });

        }
        else {
            res.send("done")
        }
    }).catch((err) => {
        res.send("notDone")
    })
});
route.get('/isUnder18/:email', (req, res) => {

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
                //do something with csvData
                console.log(csvData[1][0]);
                res.send(csvData[1][0]);
            });
    } else {
        res.send("1");
    }
});
route.get('/profile/:email', (req, res) => {
    models.user.findOne({
        email: req.params.email
    }).then((user) => {
        if (user)
            res.send(user);
        else {
            res.send("notDone");
        }
    }).catch((err) => {
        res.send(err);
    })
});

route.post('/update', (req, res) => {
    models.user.findOne({
        email: req.body.email
    }).then((user) => {
        if (user) {
            try {
                user.DLno = req.body.DLno;
                user.licencePlateNo = req.body.licencePlateNo;
                user.gender = req.body.gender;
                user.phoneNo = req.body.phoneNo;
                user.age = req.body.age;
            } catch (err) {
                console.log(err);
            }
            user.save().then()
                .catch((err) => {
                    console.log(err);
                });
            res.send("done");
        }
        else {
            console.log("no");
            res.send("notDone")
        }
    }).catch((err) => {
        res.send("notDone")
    })
});

route.post('/accelerometer', (req, res) => {
    models.sensor.create({
        email: req.body.email,
        x: req.body.x,
        y: req.body.y,
        z: req.body.z,
        sensorType: "accelerometer",
        time: req.body.time
    }).then(() => {
        res.send("done")
    }).catch((err) => {
        res.send(err);
    })
});

route.post('/linearAcceleration', (req, res) => {
    models.sensor.create({
        email: req.body.email,
        x: req.body.x,
        y: req.body.y,
        z: req.body.z,
        sensorType: "linearAcceleration",
        time: req.body.time
    }).then(() => {
        res.send("done")
    }).catch((err) => {
        res.send(err);
    })
});
route.post('/magnetometer', (req, res) => {
    models.sensor.create({
        email: req.body.email,
        x: req.body.x,
        y: req.body.y,
        z: req.body.z,
        sensorType: "magnetometer",
        time: req.body.time
    }).then(() => {
        res.send("done");
    }).catch((err) => {
        res.send(err);
    })
});
route.get('/prediction/:uname', (req, res) => {
    //prediction
    makePrediction(req.params.uname);
    res.send("done");
});
route.post('/gyroscope', (req, res) => {
    models.sensor.create({
        email: req.body.email,
        x: req.body.x,
        y: req.body.y,
        z: req.body.z,
        sensorType: "gyroscope",
        time: req.body.time
    }).then(() => {
        res.send("done")
    }).catch((err) => {
        res.send(err);
    })
});
route.get('/report/:email', (req, res) => {
    models.user.findOne({
        email: req.params.email
    }).then((user) => {
        return models.culprits.find({
            plateNo: user.licencePlateNo
        })
    }).then((reports) => {
        res.send({
            reports: reports
        })
    }).catch((err) => {
        res.send({
            reports: ["err"]
        });
    })
});
route.post('/report', (req, res) => {
    models.culprits.create({
        reporterID: req.body.reporterID,
        plateNo: req.body.plateNo,
    }).then((culprit) => {
        culprit.categories.push(req.body.category0);
        culprit.categories.push(req.body.category1);
        culprit.categories.push(req.body.category2);
        culprit.categories.push(req.body.category3);
        culprit.categories.push(req.body.category4);
        culprit.categories.push(req.body.category5);
        culprit.save();
        res.send("done");
    }).catch((err) => {
        res.send("notDone");
    })
});
route.get('/temp/:category', (req, res) => {
    models.temp.create({
        category: req.params.category
    }).then(() => {
        res.redirect('/');
    }).catch(() => {
        res.send("notDone");
    })
});
route.get('/key/:email', (req, res) => {
    models.user.findOne({
        email: req.params.email
    }).then((user) => {
        res.send(user._id);
    }).catch(() => {
        res.send("not available");
    })
});
// route.get('/csv', (req, res) => {
//
//     makePrediction("serena");
//     // let filename = "classes.csv";
//
//
//     // models.temp.find().lean().exec({}, function (err, data) {
//     //
//     //     if (err) res.send(err);
//     //
//     //     res.statusCode = 200;
//     //
//     //     res.setHeader('Content-Type', 'text/csv');
//     //
//     //     res.setHeader("Content-Disposition", 'attachment; filename=' + filename);
//     //
//     //     res.csv(data, true);
//
//     // });
//
// });
route.get('/drivers/:email', (req, res) => {
    models.managerDriversMap.findOne({
        ownerID: req.params.email
    }).then((map) => {
       return sendDriverNames(map,res);
    }).catch(() => {
        res.send(["notDone"]);
    })
});
route.post('/addDriver', (req, res) => {

    if(req.body.driverKey.length !==24)
        res.send('notDone');
    else {
        models.user.find({
            _id: mongoose.Types.ObjectId(req.body.driverKey)
        }).then((user) => {
            if (user[0]) {
                return models.managerDriversMap.findOne({
                    ownerID: req.body.manager
                }).then((map) => {
                    if (!map) {
                        return models.managerDriversMap.create({
                            ownerID: req.body.manager
                        })
                    } else return map;
                }).then((map) => {
                    if (map.drivers.indexOf(req.body.driverKey) === -1)
                        map.drivers.push(req.body.driverKey);
                    return map.save()
                }).then(() => {
                    res.send("done");
                }).catch((err) => {
                    console.log(err);
                    res.send("notDone");
                })
            } else res.send("notDone");
        })
            .catch((err) => {
                console.log(err);
                res.send("notDone");
            })
    }
});
module.exports = route;
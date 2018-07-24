const route = require("express").Router();
const CONFIG = require("../config");
const fs = require('fs');
const mongoose = require('mongoose');
const parse = require('csv-parse');
const path = require('path');
const models = require('../models/mongodb/mongo');
const PythonShell = require('python-shell');
const Json2csvTransform = require('json2csv').Transform;

function getDistance(trip1, trip2) {
    return (parseInt((trip2.longitude - trip1.longitude) * (trip2.longitude - trip1.longitude)) + parseInt((trip2.latitude - trip1.latitude) * (trip2.latitude - trip1.latitude)));
}

// models.sensorTripResult.find().then((results)=>{
//
//     for(let result of results) {
//         result.credits=0;
//         for (let i = 0; i < result.trip.length - 1; i++) {
//             if(result.trip[i+1].class===4){
//                 result.credits+=getDistance(result.trip[i],result.trip[i+1])/10;
//             }
//         }
//         result.save();
//     }
//
// }).catch((Err)=>{
//     console.log(Err);
// });
async function makeMongoDbFromCsv(uname) {

    let csvPath = path.join(__dirname, "../", "monitorPrediction/" + uname + ".csv");
    if (fs.existsSync(csvPath)) {

        models.sensorTripResult.create({
            email: uname,
            credits: 0
        })
            .then((result) => {
                let flag = false;
                let newTrip = result.trip;
                let csvData = [];
                fs.createReadStream(csvPath)
                    .pipe(parse({delimiter: ','}))
                    .on('data', function (csvrow) {
                        //do something with csvrow
                        // console.log(csvrow[0]);
                        if (flag) {
                            result.trip.push({
                                class: csvrow[3],
                                time: csvrow[0],
                                latitude: csvrow[1],
                                longitude: csvrow[2],
                            });
                        } else
                            flag = true;
                        csvData.push(csvrow);
                    })
                    .on('end', function () {
                        //do something with csvData
                        // console.log(csvData[1][0]);
                        for (let i = 0; i < result.trip.length - 1; i++) {
                            if (result.trip[i + 1].class === 4) {
                                result.credits += getDistance(result.trip[i], result.trip[i + 1]) / 10;
                            }
                        }
                        result.save();
                        console.log(result.credits);
                        fs.unlink(path.join(__dirname, "../", "monitorResult/" + uname + ".csv"), (err) => {
                            fs.unlink(path.join(__dirname, "../", "monitorPrediction/" + uname + ".csv"), () => {
                            })
                        });
                        if (result.trip.length === 0) {
                            result.remove();
                        }
                        models.sensor.remove({
                            email: uname
                        }).then(() => {
                            console.log("removed");
                        }).catch((err) => {
                            console.log(err);
                        })

                    }).on('error', (err) => {
                    console.log(err);
                });

            })
            .catch((err) => {
                console.log(err);
            });

    } else {

    }
}

async function makePrediction(uname) {

    models.sensor.find({
        email: uname
    }).lean().exec()
        .then((sensorData) => {
            console.log(sensorData.length);
            if (sensorData.length > 100) {
                const json2csv = require('json2csv').parse;
                const fields = ['sensorType', 'x', 'y', 'z', 'time', 'latitude', 'longitude'];
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
                        args: [path.join(__dirname, "../", "sensors_pipeline_1.h5"), path.join(__dirname, "../", "sensor_pipeline_2.h5"), path.join(__dirname, "../", "monitorResult/" + uname + ".csv"), path.join(__dirname, "../", "monitorPrediction/" + uname + ".csv")]
                    };
                    PythonShell.run('sensors_prediction.py', options, function (err, results) {
                        if (err) console.log(err);
                        makeMongoDbFromCsv(uname).then(() => {
                            console.log("result-db built");
                        }).catch((err) => {
                            console.log(err);
                        })

                        // results is an array consisting of messages collected during execution

                    });
                });
            }
            else {
                models.sensor.remove({
                    email: uname
                }).then(() => {
                    console.log("very less data");
                }).catch((Err) => {
                    console.log(Err);
                })
            }
        }).catch((err) => {
        console.log(err);
    })

}

async function sendDriverNames(map, res) {
    let driverNames = [];
    for (let driver of map.drivers) {
        await   models.user.find({
            _id: mongoose.Types.ObjectId(driver)
        }).then((user) => {
            let email = user[0].email;
            driverNames.push(email);
        }).catch((err) => {
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
            if (req.body.profilePic !== null) {
                let options = {
                    mode: 'text',
                    pythonPath: '/usr/bin/python3.5',
                    pythonOptions: ['-u'],
                    scriptPath: path.join(__dirname, "../"),
                    args: [req.body.profilePic, path.join(__dirname, "../", "under18result/", req.body.email + ".csv"), "driver_age_detect.h5"]
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
            } else {
                res.send("done");
            }

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
    if (req.body.latitude !== "0.0") {
        models.sensor.create({
            email: req.body.email,
            x: req.body.x,
            y: req.body.y,
            z: req.body.z,
            sensorType: "accelerometer",
            time: req.body.time,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        }).then(() => {
            res.send("done")
        }).catch((err) => {
            res.send(err);
        })
    } else {
        res.send("done");
    }
});

route.post('/linearAcceleration', (req, res) => {
    if (req.body.latitude !== "0.0") {
        models.sensor.create({
            email: req.body.email,
            x: req.body.x,
            y: req.body.y,
            z: req.body.z,
            sensorType: "linearAcceleration",
            time: req.body.time,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        }).then(() => {
            res.send("done")
        }).catch((err) => {
            res.send(err);
        })
    } else {
        res.send("done");
    }
});
route.post('/magnetometer', (req, res) => {
    if (req.body.latitude !== "0.0") {
        models.sensor.create({
            email: req.body.email,
            x: req.body.x,
            y: req.body.y,
            z: req.body.z,
            sensorType: "magnetometer",
            time: req.body.time,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        }).then(() => {
            res.send("done");
        }).catch((err) => {
            res.send(err);
        })
    } else {
        res.send("done");
    }
});
route.get('/prediction/:uname', (req, res) => {
    //prediction
    console.log("make prediction");
    makePrediction(req.params.uname).then(() => {
        console.log("made prediction");
    }).catch((err) => {
        console.log(err);
    });

    res.send("done");
});
route.post('/gyroscope', (req, res) => {
    if (req.body.latitude !== "0.0") {
        models.sensor.create({
            email: req.body.email,
            x: req.body.x,
            y: req.body.y,
            z: req.body.z,
            sensorType: "gyroscope",
            time: req.body.time,
            latitude: req.body.latitude,
            longitude: req.body.longitude
        }).then(() => {
            res.send("done")
        }).catch((err) => {
            res.send(err);
        })
    } else {
        res.send("done");
    }
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
            reports: reports.reverse()
        })
    }).catch((err) => {
        res.send({
            reports: ["err"]
        });
    })
});
route.get('/result/:email', (req, res) => {
    models.sensorTripResult.find({
        email: req.params.email
    }).sort({createdAt: -1}).then((trip) => {
        res.send({
            trip: trip
        })
    }).catch((err) => {
        console.log(err);
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
route.get('/drivers/:email', (req, res) => {
    models.managerDriversMap.findOne({
        ownerID: req.params.email
    }).then((map) => {
        return sendDriverNames(map, res);
    }).catch(() => {
        res.send(["notDone"]);
    })
});
route.post('/addDriver', (req, res) => {

    if (req.body.driverKey.length !== 24)
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

async function getDriverNames(map) {
    let driverNames = [];
    for (let driver of map.drivers) {
        await   models.user.find({
            _id: mongoose.Types.ObjectId(driver)
        }).then((user) => {
            let email = user[0].email;
            driverNames.push(email);
        }).catch((err) => {
            console.log(err);
        })
    }
    return driverNames;
}

async function getNoOfOffences(driverNames) {
    let driverOffence = [];
    for (let driverName of driverNames) {
        await models.distractionResult.findOne({
            driver: driverName
        }).then((driverResult) => {
let noOfOffences = parseInt(driverResult.c1.length) + parseInt(driverResult.c2.length) + parseInt(driverResult.c3.length) + parseInt(driverResult.c4.length) + parseInt(driverResult.c5.length) + parseInt(driverResult.c6.length) + parseInt(driverResult.c7.length);

            driverOffence.push({
                driverName: driverName,
                offences: noOfOffences
            })
        }).catch((err) => {
            console.log(err);
        })
    }
    return driverOffence;
}

route.get('/all/distractionResult/:email', (req, res) => {

    models.managerDriversMap.findOne({
        ownerID: req.params.email
    }).then((map) => {
        getDriverNames(map).then((driverNames) => {
            getNoOfOffences(driverNames)
                .then((driverOffence) => {
                    res.send({
                        driverOffence: driverOffence
                    });
                }).catch((err) => {
                console.log(err);
            })

        }).catch((err) => {
            console.log(err);
        })


    })
});
route.get('/distractionResult/:driverName',(req,res)=>{

    models.distractionResult.findOne({
        driver:req.params.driverName
    }).then((driverResult)=>{
        res.send(driverResult)
    }).catch((err)=>{
      console.log(err);
    })

});

module.exports = route;

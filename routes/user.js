const route = require("express").Router();
const fs = require("fs");
const path = require("path");
//Import MongoDB models
const models = require("../models/mongodb/mongo");
const parse = require('csv-parse');
const PythonShell = require('python-shell');


route.get('/', (req, res) => {
    models.camera.create({
        ownerID: req.user.dataValues.id
    }).then((camera) => {
        camera.behaviour.push({
            cameraId: 1
        });
        camera.save().then((camera) => {
        });
        res.sendFile(path.join(__dirname, "../public_html/users.html"));
    })


});
route.get('/status', (req, res) => {
    //console.log(req.user.dataValues.id);
    // console.log(models.camera);
    models.camera.findOne({
        ownerID: req.user.dataValues.id
    }).then((camera) => {

        // console.log(camera);
        if (camera)
            for (let behavior of camera.behaviour) {
                let imgPath = path.join(__dirname, "../", "public_html/distractions", behavior.cameraId + ".jpg");
                let csvPath = path.join(__dirname, "../", "public_html/csv2", req.user.dataValues.id + ".csv");
                let options = {
                    mode: 'text',
                    pythonPath: '/usr/bin/python3.5',
                    pythonOptions: ['-u'],
                    scriptPath: path.join(__dirname, "../"),
                    args: [imgPath, csvPath, "18-2-18_Test-2.h5", "8"]
                };
                PythonShell.run('predicton.py', options, function (err, results) {
                    if (err) console.log(err);

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
                                let cameraID=behavior.cameraId;
                                models.camera.findOneAndUpdate({
                                    ownerID:camera.ownerID
                                },{
                                    $pull:{
                                        behaviour:{
                                            cameraId:cameraID
                                        }
                                    }
                                }).then(()=>{
                                    models.camera.findOneAndUpdate({
                                        ownerID:camera.ownerID
                                    },{
                                        $push:{
                                            behaviour:{
                                                cameraId:cameraID,
                                                distraction:csvData[1][0]
                                            }
                                        }
                                    }).then((cd)=>{
                                        console.log(cd);
                                    })
                                }).catch((err)=>{
                                    console.log(err);
                                })
                            });
                    }

                    // results is an array consisting of messages collected during execution
                    console.log('results: %j', results);
                });

            }
        res.send(camera);
    }).catch((err) => {
        console.log(err);
    })
});
route.get('/under18', (req, res) => {

    let csvPath = path.join(__dirname, "../", "public_html/csv", req.user.dataValues.id + ".csv");
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
        res.send("0");
    }

});
route.post('/report', upload.single('imgUploader'), (req, res) => {
    if (req.body.licencePlateNo !== null) {
        models.user.findOne({
            _id: req.user.dataValues.id
        })
            .then((user) => {
                models.report.create({
                    reporterID: user._id,
                    licencePlateNo: req.body.licencePlateNo
                })
                    .then((report) => {
                        models.culprits.findOne({licencePlateNo: report.licencePlateNo})
                            .then((culprit) => {
                                if (culprit !== null) {
                                    culprit.count = culprit.count + 1;
                                    culprit.save();
                                }
                                else {
                                    models.culprits.create({licencePlateNo: report.licencePlateNo})
                                }
                                for (let category of req.body.categories) {
                                    report.categories.push(category);
                                }
                                report.save();
                                res.send("report submitted");
                            })
                            .catch((err) => {
                                console.log(err);
                            })

                    })
                    .catch((err) => {
                        console.log(err);
                    })
            })
            .catch((err) => {
                console.log(err);
            })
    } else {
        fs.rename(path.join(__dirname, "../", "public_html/licencePlates/", req.file.filename), path.join(__dirname, "../", "public_html/licencePlates/", req.user.dataValues.id + ".jpg"), (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

});
module.exports = route;
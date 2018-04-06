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
        {
            models.user.create({
                email:req.body.email
            }).then(()=>{
                res.send("done")
            }).catch((err)=>{
                res.send("notDone")
            })
        }
        else{
            res.send("done")
        }
    }).catch((err)=> {
        res.send("notDone")
    })
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
module.exports = route;
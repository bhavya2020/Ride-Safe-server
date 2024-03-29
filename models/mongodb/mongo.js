//Import mongoose module
const mongoose = require("mongoose");
const CONFIG = require("../../config");

//Require DB models
const user = require("./user");
const culprits=require('./culprits');
const sensor=require('./sensor');
const camera=require('./camera');
const temp=require('./temp');
const managerDriversMap=require('./managerDriversMap');
const sensorTripResult=require('./sensorTripResult');
const distractionResult=require('./distractionResult');

//Use global promise instead of Mongoose's
mongoose.Promise = global.Promise;


//Connect to DB
mongoose.connect(`mongodb://${CONFIG.MONGO.HOST}:${CONFIG.MONGO.PORT}/${CONFIG.MONGO.DB_NAME}`, {

})
    .then(() => {
        console.log("Successful connection to MongoDB");
    })
    .catch((err) => {
        console.log("Mongoose connection error due to: ", err);
        process.exit();
    });

//Expose models for use elsewhere
module.exports = {
    user,culprits,sensor,camera,temp,managerDriversMap,sensorTripResult,distractionResult
};
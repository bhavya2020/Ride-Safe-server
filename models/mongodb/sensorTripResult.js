const mongoose = require("mongoose");

const sensorTripResultSchema = mongoose.Schema({
    email:String,
    trip:[{
        time:String,
        latitude:String,
        longitude:String,
        class:Number
    }]
},{
    timestamps:true
});

module.exports = mongoose.model("sensorTripResult", sensorTripResultSchema);
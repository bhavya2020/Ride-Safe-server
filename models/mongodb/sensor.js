const mongoose = require("mongoose");

const sensorSchema = mongoose.Schema({

    email: String,
    sensorType: String,
    x: String,
    y: String,
    z: String,
    time: String,
    latitude:String,
    longitude:String
});

module.exports = mongoose.model("sensor", sensorSchema);
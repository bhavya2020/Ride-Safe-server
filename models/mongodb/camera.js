const mongoose = require("mongoose");

const cameraSchema = mongoose.Schema({

    ownerID:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    behaviour:[{
        cameraId:String,
        distraction:{
            type:Number,
            default:0
        }
    }]
});

module.exports = mongoose.model("camera", cameraSchema);
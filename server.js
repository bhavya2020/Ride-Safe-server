/*
    Import Modules
 */
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const csv      = require('csv-express');
/*
    Import User Files
 */
const CONFIG = require("./config");


//Initialise Server
const app = express();
/*
    MiddleWares
 */



//Handle form-data (JSON & UrlEncoded)
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));

/*
    Routes
 */
app.use('/',express.static(path.join(__dirname,"./public_html")));
app.use("/",require("./routes/user"));
// app.use("/users",require("./routes/user"));


/*
    Other Routes
 */

app.use(function (req, res) {
    res.send('404');
});

//Listen on port
app.listen(CONFIG.SERVER.PORT, function () {
    console.log(`Server running @ http://${CONFIG.SERVER.HOST}:${CONFIG.SERVER.PORT}`);
});

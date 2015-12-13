var express = require('express');
var multer = require('multer');
var urls = require("../address_configure");

var router = express.Router();

router.use(multer({ dest: './public/uploadpics/' }));

router.post('/', function(req, res)
{
    for (var attr in req.files) {
        console.log(attr);
    }

    var thefile=req.files.upfile;
    if (thefile==null)
    {
        res.send("Nothing");
        return;
    }
    if (thefile instanceof Array)
        thefile=thefile[0];

    res.send("http://"+urls.IP+thefile.path.substr(6));
});

module.exports = router;

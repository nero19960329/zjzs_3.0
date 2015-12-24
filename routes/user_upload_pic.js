var express = require('express');
var multer = require('multer');
var urls = require("../address_configure");

var router = express.Router();

router.use(multer({
    dest: './public/uploadpics/',
    rename: function(fieldname, filename) {
        console.log('fieldname:' + fieldname);
        console.log('filename:' + filename);
        return filename + '.jpg';
    }
}));

router.post('/', function(req, res)
{
    if (req.files.blob != null) {
        res.send("http://"+urls.IP+req.files.blob.path.substr(6));
        return;
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

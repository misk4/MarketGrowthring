var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var multer = require('multer');
var s3 = require('multer-storage-s3');
//var AWS = require('aws-sdk'); 
//AWS.config.loadFromPath('./s3_config.json');
//var s3Bucket = new AWS.S3({params: {Bucket: 'minsoo'}});
//connection DB
var pool = mysql.createPool({
    connectionLimit: 1
    , host: ''
    , user: ''
    , password: ''
    , database: ''
});
var connection = mysql.createConnection({
    'host': ''
    , 'user': ''
    , 'password': ''
    , 'database': ''
, });
//console.log(req.file.originalname);
var storage = s3({
    destination: function (req, file, cb) {
        cb(null, 'profile/');
        console.log(req);
    }
    , filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
    , bucket: 'minsoo'
    , region: 'ap-northeast-2'
});
var upload = multer({
    storage: storage
    , onError: function (err, next) {
        console.log('error', err);
        next(err);
    }
});
/*
var _storage = multer.diskStorage({
	destination: function(req,file,cb){
		cb(null,'uploads/');
	},
	filename : function(req,file,cb){
		cb(null,Date.now() + "." +file.originalname.split('.').pop());
	}
});
var upload = multer({storage : _storage});
*/
console.log("connected");
/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', {
        title: 'Express'
    });
});
/* Sign Up */
router.post('/sign_up', function (req, res, next) {
    // unique : id email
    var id_exists = false;
    var email_exists = false;
    pool.getConnection(function (err, connection) {
        var query = connection.query('select * from members where login_id = ?;', [req.body.login_id], function (error, cursor) {
            if (!error && cursor.length > 0) {
                console.log("ID Exists");
                id_exists = true;
                connection.release();
                res.status(501).send("ID exists");
                res.end();
            }
            else {
                console.log("usable ID");
                id_exists = false;
                connection.release();
            }
        });
        //console.log(query);
    });
    pool.getConnection(function (err, connection) {
        var query = connection.query('select * from members where email = ?;', [req.body.email], function (error, cursor) {
            if (!error && cursor.length > 0) {
                console.log("Email Exists");
                email_exists = true;
                connection.release();
                //console.log(query[0].member_id);
                res.status(501).send("email exists");
                res.end();
            }
            else {
                console.log("usable Email");
                email_exists = false;
                connection.release();
            }
        });
        //console.log(query)
    });
    //(connection.query('select member_id from member_view where member_id ='+'"'+req.body.user_id+'"'));
    //회원가입
    if (id_exists || email_exists) {
        res.end();
        res.status(501).send("something wrong");
    }
    else {
        pool.getConnection(function (err, connection) {
            var query = connection.query('insert into members (name, gender, location, campus, phoneNum, myQuestion_id, myQuestion_answer, email, login_id, password, kakao) values (?,?,?,?,?,?,?,?,?,?,?);', [req.body.name, req.body.gender, req.body.location, req.body.campus, req.body.phoneNum, req.body.myQuestion_id, req.body.myQuestion_answer, req.body.email, req.body.login_id, req.body.password, req.body.kakao_id], function (error, info) {
                if (!error) {
                    console.log("SignUp Success");
                    connection.release();
                    res.status(201).send();
                }
                else {
                    connection.release();
                    res.status(503);
                    throw error;
                    console.log("SignUp fail");
                }
            });
        });
    }
    //res.redirect("/");
});
/* Sign in */
router.post('/sign_in', function (req, res, next) {
    var user = {
        id: req.body.login_id
        , pswd: req.body.password
    };
    var user_data = new Object();
    connection.query('select id,login_id,password from members where login_id = ? && password = ?', [user.id, user.pswd], function (err, cursor) {
        if (cursor.length > 0) {
            check = 1;
            console.log("found");
            req.session.regenerate(function (err) {
                if (err) {
                    console.log(err);
                    //	res.send("Login Failed.");
                }
                else {
                    req.session.user = user;
                    console.log("id..." + user.id);
                    //	res.send("Login Success. login id : " + user.id);
                }
            });
        }
        else {
            res.status(404).json(cursor[0]);
        }
    });
    connection.query('select name, gender, location, phoneNum, login_id, pic_path from members where login_id = ?;', [user.id], function (err, cursor) {
        console.log(user.id);
        if (cursor.length > 0) {
            user_data.name = cursor[0].name;
            user_data.gender = cursor[0].gender;
            user_data.location = cursor[0].location;
            user_data.phoneNum = cursor[0].phoneNum;
            //user_data.email = cursor[0].email;
            user_data.login_id = cursor[0].login_id;
            user_data.pic_path = cursor[0].pic_path;
            console.log(JSON.stringify(user_data));
            res.status(201).json(cursor[0]);
        }
        else {
            console.log(err);
            res.status(500).json(cursor[0]);
        }
    });
});
/* Log out */
router.get('/sign_out', function (req, res, next) {
    console.log(req.session.user);
    req.session.destroy(function (err) {
        if (err) {
            console.log(err);
            res.sendStatus(404);
        }
        else {
            console.log("logout successful");
            res.status(201).send("Logout successful");
        }
    });
});
router.post("/upload", upload.single('userPhoto'), function (req, res, next) {
    var user = req.body.login_id;
    var file_name = req.file.filename;
    var file_path;
    if (req.file) {
        file_path = req.file.s3.Location;
        file_path = file_path.replace("s", "");
    }
    console.log(req.file);
    console.log(file_name);
    console.log(file_path);
    console.log(user);
    //console.log(req.body.test);
    connection.query('update members set pic_name = ?, pic_path = ? where login_id = ?', [file_name, file_path, user], function (err) {
        console.log(err);
        if (!err) {
            res.status(201).send("file upload successful");
        }
        else {
            res.sendStatus(503);
        }
    });
});
/*
router.post('/upload',function(req,res,next){
	var buf = new Buffer(req.body.imageBinary.replace(/^data:image\/\w+;base64,/, ""),'base64')
	var data = {
		Key: req.body.login_id,
		Body: buf,
		ContentEncoding: 'base64',
		ContentType: 'image/jpeg'
	};
	s3Bucket.putObject(data, function(err,data){
		if(err){
			console.log(err);
			console.log('Error uploading',data);
		}else{
			console.log('succesc');
		}
	});
});*/
router.post('/download', function (req, res, next) {
    var user_login_id = req.body.login_id;
    var pic_path;
    connection.query('select pic_path from members where login_id = ?;', [user_login_id], function (err, cursor) {
        if (cursor.length > 0) {
            pic_path = cursor[0].pic_path;
            res.status(201).send(pic_path);
        }
        else {
            console.log("file not found");
            res.status(404).send("data not found");
        }
    });
});
module.exports = router;
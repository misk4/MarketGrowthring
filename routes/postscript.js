var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var multer = require('multer');
var s3 = require('multer-storage-s3');

var connection =mysql.createConnection({
    'host' : '',
    'user' : '',
    'password' : '',
    'database' :'',
});

var storage = s3({
        destination : function(req,file,cb){
                cb(null,'postscript/');
        },
        filename : function(req,file,cb){
                cb(null,file.originalname);
        },
        bucket : 'minsoo',
        region : 'ap-northeast-2'
});

var upload = multer({storage : storage});

router.get('/pslist',function(req,res,next){
	connection.query('select * from postscript order by written_date desc;',function (error,cursor, info){
        if(!error) {
            res.status(201).json(cursor);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    });
});

router.post('/postschit', function(req, res, next) {
    var psid = req.body.id;//postscript.id
    var uid = req.body.user_id;//members.id
connection.query('select * from postscript where writer_id = ?;',[uid],function(error,cursor){
	if(cursor.length > 0){
		console.log("cheating");
		res.status(403).send("writer is cheating");
	}else{
    connection.query('update postscript set hit = hit + 1 where id = ? and not writer_id=?;',[psid,uid],function (error, info){
        if(!error) {
            res.status(200).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    });}
});
});
//후기게시글 상세보기 화면액티비티에 불러줄함수2
router.get('/psview/:id', function(req, res, next) {
    connection.query('select * from postscript where id = ?;',[req.params.id],function (error, cursor, info){
        if(!error) {
            res.status(201).json(cursor[0]);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    });
});

//후기게시글 추가
router.post('/insertps', upload.single('psPhoto'), function(req, res, next){
    
    var pic_path;
	if(req.file){
		pic_path = req.file.s3.Location;
		pic_path = pic_path.replace("s",""); 
 	}   

    var date = new Date().toISOString().slice(0,19).replace('T',' ');
    var zero = 0;
    connection.query('insert into postscript(original_id,writer_id,title, content, pic1_path, written_date,hit) values (?, ?, ?, ?, ?, ?, ?);', [req.body.original_id,req.body.writer_id, req.body.title, req.body.content, pic_path , date, zero], function (error, info){
        if(!error) {
            res.status(201).send("");
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
        
    });
});

//후기게시글 수정
router.post('/updateps',upload.single('psPhoto'), function(req, res, next){ //후기게시글 수정

    var ps_id = req.body.ps_id;//postscript.id
    var pic_path;
        if(req.file){
                pic_path = req.file.s3.Location;
		pic_path = pic_path.replace("s","");
        }

    var date = new Date().toISOString().slice(0,19).replace('T',' ');

    connection.query('update postscript set title = ?, content = ?, pic1_path=?, edited_date = ? where id = ?;', [req.body.title, req.body.content,pic_path,date,ps_id], function (error, info){
        if(!error) {
            res.status(201).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    
    });
});

//후기게시글 삭제
router.post('/deleteps', function(req, res, next){ 
    connection.query('delete from postscript where id = ?', [req.body.ps_id], function (error, info){
        if(!error) {
            res.status(201).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    
    });
});

router.get('/getoriginal/:id',function(req, res, next){
	connection.query('select original_id from postscript where id = ?;',[req.params.id],function(error,cursor){
		if(cursor.length > 0){
			res.status(201).json(cursor[0]);
		}
		else{
			console.log(error);
			res.status(501).send("no original post for postscript");
		}
	});
});

module.exports = router;

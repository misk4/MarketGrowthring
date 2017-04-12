var express = require('express'); 
var mysql = require('mysql');
var router = express.Router();
var multer = require('multer');
var s3 = require('multer-storage-s3');

var connection =mysql.createConnection({
    'host' : '',
    'user' : '', 
    'password' : '', 
    'database' :''
});

var storage = s3({
        destination : function(req,file,cb){
                cb(null,'board/');
        },
        filename : function(req,file,cb){
                cb(null,file.originalname);
        },
        bucket : 'minsoo',
        region : 'ap-northeast-2'
});

var upload = multer({storage : storage});
/*
var _storage = multer.diskStorage({
        destination: function(req,file,cb){
                cb(null,'routes/uploads/');
        },
        filename : function(req,file,cb){
                cb(null,Date.now() + "." +file.originalname.split('.').pop());
        }
});
var upload = multer({storage : _storage});
*/
//최근 작성순으로 전체 나눔진행중 게시글 조회
router.get('/postlist',  function(req, res, next) {
	var status = 1;
    connection.query('select * from post order by written_date desc;',[status],function (error, info){
        if(!error) {
            res.status(201).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    });
});

router.get('/postcompletedlist', function(req,res,next){
var status = 0;
    connection.query('select * from post where status = 0 order by written_date desc;',[status],function (error, info){
        if(!error) {
            res.status(201).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    });
});

//게시글 개별 상세보기
router.get('/postview/:id', function(req, res, next) {
    connection.query('select * from post where id = ? order by written_date desc;',[req.params.id],function (error,cursor, info){
        if(cursor.length > 0 && !error) {
            res.status(201).json(cursor[0]);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    });
});
//게시글 추가(성공)
router.post('/insertpost',upload.single('postpic'), function(req, res, next){
	console.log(req.file.filename);
   // var writer_id = req.body.user_login_id;
	if(req.file){
		var path1=req.file.s3.Location;
		path1 = path1.replace("s","");
	}var path2; var path3;
	/*if(req.files[1]){
		var path2=req.files[1].filename;
	}
	if(req.files[2]){
		var path3=req.files[2].filename;
	}*/
	var date = new Date().toISOString().slice(0,19).replace('T',' ');
	var status = 1;
	var hit = 0;
    connection.query('insert into post (writer_id, title, content, pic1_path, pic2_path, pic3_path, status, location, campus, item_type, item_name,writer_intro, written_date, hit) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);', [req.body.writer_id, req.body.title, req.body.content, path1, path2, path3, status, req.body.location,req.body.campus, req.body.item_type,  req.body.item_name, req.body.writer_intro, date, req.body.hit], function (error, info){
        if(!error) {
            res.status(201).send();
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
        
    });
});
//게시글 수정(성공)
router.post('/updatepost', upload.array('postpic'), function(req, res, next){ 

	var date = new Date().toISOString().slice(0,19).replace('T',' ');

	if(req.file){
                var path1=req.file.s3.Location;
		path1 = path1.replace("s","");
        }


    connection.query('update post set title = ?, item_name = ?,  item_type = ?, pic1_path = ?, pic2_path = ?, pic3_path = ?, location = ?, content = ?, edited_date = ?  where id = ?;', [req.body.title, req.body.item_name,  req.body.item_type, path1 , path2 , path3 ,req.body.location,req.body.content,date,req.body.id], function (error, info){
        if(!error) {
            res.status(201).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    
    });
});
//게시글삭제(성공)
router.get('/deletepost/:id', function(req, res, next){ 
    connection.query('delete from post where id = ?', [req.params.id], function (error, info){
        if(!error) {
            res.status(201).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    
    });
});
//나눔 게시글 검색기능
router.get('/searchlist/:keyword', function(req, res, next) {
    var keyword = req.params.keyword;
    connection.query('select * from members,post  where members.login_id = post.writer_id and (post.item_name = ? or post.title = ? or post.location = ? or members.email = ? or members.location = ?) order by written_date desc;', [keyword, keyword, keyword, keyword, keyword], function(error, cursor){
       if(error == null)
      res.status(201).json(cursor);
        else
                res.status(503).json(error);
    });
});
//나의 게시글 조회
router.get('/mypostlist/:login_id', function(req, res, next) {
    
    connection.query('select * from post where post.writer_id=?;',[req.params.login_id],function (error,cursor, info){
        if(cursor.length > 0) {
            res.status(200).json(cursor);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while getting data');
        }
    });
});

//현재 나눔게시글의 사연글 총갯수
router.get('/storylistcount/:pid', function(req, res, next) {
    var pid = req.params.pid;
    var count;
    connection.query('select count(id) as count from story where story.post_id = ?;', [pid],function (error,cursor, info){
         if(!error) {
		console.log(cursor[0]);
            res.status(201).json(cursor[0]);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
            
    });
       
});

router.get('/download/:filepath',function(req,res,next){
	var options = {
		root: __dirname +'/uploads/',
		dotfiles:'deny',
		headers: {
			'x-timestamp' : Date.now(),
			'x-sent' : true
		}
	};

	var fileName = req.params.filepath;
	res.sendFile(fileName,options,function(err){
		if(err){
			console.log(err);
			res.status(err.status).end();
		}
		else{
			console.log('Sendt:', fileName);
		}
	});
});
	
	
module.exports =router;

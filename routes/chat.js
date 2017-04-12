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

router.post('/insertchat', function(req, res, next){

	 var date = new Date().toISOString().slice(0,19).replace('T',' ');

    connection.query('insert into chat (sender_id , receiver_id, content, written_date) values (?, ?, ?, ?);', [req.body.sender_id, req.body.receiver_id, req.body.content,date], function (error, info){
        if(!error) {
            res.status(201).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }

    });
});

/*router.get('/chatlist/:login_id',function(req,res,next){
	connection.query('select sender_id , content, kakao from chat where receiver_id = ?;', [req.params.login_id], function(error, cursor){
*/ 


router.post('/chatview', function(req, res, next) {
    var s_id = req.body.sender_id;
    var r_id = req.body.receiver_id;
    var s_content;
    var r_content;
	var content = new Object();
	var contentArray = new Array();
	connection.query('select * from chat where sender_id = ? and receiver_id = ? order by written_date asc;', [req.body.sender_id, req.body.receiver_id],function (error, cursor){
	if(error){
		console.log(error);
	}
         if(cursor.length > 0) {
		for(var i = 0; i < cursor.length;i++){
			content = cursor[i];
			contentArray.push(content);
		}
		s_content = cursor;
		console.log(cursor);
		console.log(1);
		//res.status(201).json(cursor);
	}

 	else{
		//console.log(error);
		console.log("no data for sender");
		//res.status(501).send("error");
		
	}
});
connection.query('select * from chat where sender_id = ? and receiver_id = ? order by written_date desc;', [req.body.receiver_id, req.body.sender_id],function (error, cursor){
        if(error){
                console.log(error);
        }
         if(cursor.length > 0) {
		for(var i = 0; i < cursor.length;i++){
                        content = cursor[i];
                        contentArray.push(content);
                }

                r_content = cursor;
                console.log(cursor);
		res.status(201).json(contentArray);
                //res.status(201).json(cursor);
        }

        else{
                //console.log(error);
		if(s_content = null){
			res.status(501).send("no data");
		}
		else{
			res.status(201).json(contentArray);
		}
                console.log("no data for sender");
                //res.status(501).send("error");

        }
});
/*
if(r_content = null && s_content = null){
	res.status(501).send("no data");
}else{
	res.status(201).json(s_content+r_content);
}*/


	
          
});

module.exports =router;

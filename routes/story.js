var express = require('express'); 
var router = express.Router();

var mysql =require('mysql');
var connection =mysql.createConnection({
    'host' : '',
    'user' : '', 
    'password' : '', 
    'database' :'',
});

//사연리스트(일반사용자)
router.get('/storylist/:user_login_id/:post_id', function(req, res, next) {
    var user_id = req.params.user_login_id;
    var post_id  = req.params.post_id;


connection.query('select * from post where writer_id = ? and id = ?;',[user_id,post_id],function(error,cursor){
	if(cursor.length>0){
		connection.query('select * from story where post_id = ?;',[post_id],function(error,info){
			if(!error){
				res.status(201).json(info);
			}
			else{
				console.log("postwriter"+error);
				res.writeHead(501, { 'Content-Type' : 'text/plain' });
            			res.end('Error while reading data');
			
			}
		});
	}else{

			
    connection.query('select * from story where story.writer_id = ? and story.post_id =?;', [user_id,post_id], function (error, info){
         if(!error) {
            res.status(201).json(info);
        } else {
		throw error;
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
            
    });
    }   
});
});

/*/사연리스트(작성자) 인자로 post id를 받을 것
router.get('/storylist/:id', function(req, res, next) {
    connection.query('select * from story where story.post_id = ?;', function (error, info){
         if(!error) {
            res.status(200).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
            
    });
       
});

//내사연 리스트 - member id
router.get('/mystorylist/:id', function(req, res, next){
    connection.query('select * from story where story.writer_id=?;',[req.params.id], function (error, info){
        if(!error) {
            res.status(200).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    
    });
});
*/

//사연작성
router.post('/insertstory', function(req, res, next){ 

	 var date = new Date().toISOString().slice(0,19).replace('T',' ');
	var status = 1;

    connection.query('insert into story(content,post_id,writer_id,written_date,status,title,item_type) values (?,?,?,?,?,?,?);', [req.body.content, req.body.post_id, req.body.writer_id,date,status,req.body.title,req.body.item_type], function (error, info){
       if(!error) {
            res.status(201).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
            
    });
                
});

//사연 수정
router.post('/updatestory', function(req, res, next){
    connection.query('UPDATE story SET content = ? where id = ?;', [req.body.content,req.body.id], function (error, info){
        if(!error) {
            res.status(201).json(info);
        } else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
   
    });
          
});
//사연 삭제
router.get('/deletestory/:id', function(req, res, next){ 
    connection.query('delete from story where id = ?', [req.params.id], function (error, info){
        if(!error) {
            res.status(201).json(info);
        } 
        else {
            console.log(error);
            res.writeHead(501, { 'Content-Type' : 'text/plain' });
            res.end('Error while reading a file');
        }
    
    });
});

router.post('/completestory',function(req,res,next){
	var post_id;
	var complete = 0;
	var selected = 2;

	connection.query('select post_id from story where id = ?;',[req.body.id],function(error,cursor){
		if(cursor.length>0){
			post_id = cursor[0].post_id;
			console.log("got postid");
			console.log(post_id);
						connection.query('update post set status = ? where id = ?;',[complete, post_id],function(error,info){
                						if(!error){
                        					console.log("edited post");
                        //res.status(201).json(info);
                				}

                						else{
                       							 console.log(error);
                        						res.writeHead(501, { 'Content-Type' : 'text/plain' });
                        						res.end('Error while reading a file');
                						}
       						 });

   					     connection.query('update story set status = ? where post_id = ?;',[complete, post_id],function(error,info){
                					if(!error){
                        					console.log("edited stories");
								connection.query('update story set status = ?  where id = ?;',[selected,req.body.id],function(error,info){
                							if(!error){
                        							console.log("edited the story " + selected);
                        							res.status(201).send("story completed");
                							}
                							else{
                        							console.log(error);
                        							res.writeHead(501, { 'Content-Type' : 'text/plain' });
                        							res.end('Error while reading a file');
                							}
        							});


                        					//res.status(201).json(info);
                					}
                					else{
                        					console.log(error);
                        					res.writeHead(501, { 'Content-Type' : 'text/plain' });
                        					res.end('Error while reading a file');
        	        				}
				        	});
	





		}else{
			res.status(404).send("no match for story_id");
		}
	});
	

});

router.get('/mystorylist/:writer_id',function(req,res,next){
	connection.query('select * from story where writer_id = ?;',[req.params.writer_id],function(err, info){
		 if(cursor.length > 0 ){
                                console.log("mystory");
                                res.status(201).json(cursor);
                }else{
                                console.log("my story failed");
                                res.status(501).send("mystoryfailed");
                }
        });
});




module.exports = router;

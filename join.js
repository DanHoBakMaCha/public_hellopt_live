//필요한 모듈 선언
var fs = require('fs');
var cors = require('cors');
var app = require('express')();

//SSL 인증 옵션
var options = {
	key: fs.readFileSync('./private.key'),
	cert: fs.readFileSync('./private.crt')
};

//서버(https) 
/*var server = require('https').createServer(options, app);*/

//http 서버
var server = require('http').createServer(app);

//크로스 도메인 사용 가능하도록 설정
app.use(cors());

//get요청시의 라우터(브라우저에서 Request가 왔을때 서버에서 할 작업)
app.get('/', function(req, res) {
	//크로스 도메인 가능하게 하는 설정 header에 추가
	res.header("Access-Control-Allow-Origin", "*");
	//현재 경로 + 실행할 파일
	res.sendFile(__dirname + '/chat.html');
})

//배열로 룸 생성
var rooms = [];

let broadcaster;

//socket io 
var io = require('socket.io')(server);

//socket io 연결
io.sockets.on('error', e => console.log(e))

io.on('connection', function(socket) {
	console.log("소켓아이디: " + socket.id + " 접속");
	
	//roomId로 룸에 join
	socket.on('joinroom', function(data) {
		console.log("roomId: " + data.roomId);
		socket.join(data.roomId);
		console.log(data.userId + " " + data.roomId + " 룸에 조인!!")
		  
		// 개별 룸에 이벤트 보내기
		io.sockets.in(data.roomId).emit('connect');
		console.log("개별 커넥트 이벤트 보내기 성공");
	});
	
	
	socket.on('send_msg', function(data) {
		console.log("roomId: " + data.roomId);
		console.log("sender: " + data.userId);
		console.log("msg: " + data.msg);
		
		//생성한 룸 배열에 socket id 저장
		rooms[data.roomId] = socket.id;
		
		console.log("rooms : " + rooms);
		
		//개별룸에 데이터 보내기
		io.sockets.in(data.roomId).emit('send_msg', data);
	});
	
	  socket.on('broadcaster', function(roomId) {
		  broadcaster = socket.id;
		  //rooms[roomId] = broadcaster;
		  
		  // broadcaster 이벤트를 특정 룸에만 전송
		  io.sockets.in(roomId).emit('broadcaster');
		  console.log("roomId : " + roomId + ", broadcaster : " + broadcaster);
	  })
	  
	  socket.on('offer', function (id, description) {
		  socket.to(id).emit('offer', socket.id, description);
		  console.log("offer 이벤트 id : " + id + " description : " + description);
	  })
	  
	  socket.on('viewer', function(roomId) {
	    roomId && socket.to(roomId).emit('viewer', socket.id);
	    console.log("broadcaster : " + broadcaster + ", socket.id: " + socket.id);
	  })
	  
	  socket.on('answer', function (id, description) {
	    socket.to(id).emit('answer', socket.id, description);
	    console.log("answer 이벤트 id - " + id + "des - " + description);
	  })
	  
	  socket.on('candidate', function (id, candidate) {
	    socket.to(id).emit('candidate', socket.id, candidate);
	    console.log("candidate이벤트 id : " + id + ", candidate : " + candidate);
	  })
	
	//연결 해제시
	socket.on('disconnect', function() {
		broadcaster && socket.to(broadcaster).emit('out', socket.id);
		console.log("소켓아이디 " + socket.id + "접속 해제");
	});
});

//서버 3000번 포트 열기
server.listen(3000, function() {
	console.log("3000번 포트 열림");
});
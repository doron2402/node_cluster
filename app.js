var cluster = require('cluster'),
	http	= require('http'),
	numCPUs = require('os').cpus().length,
	workers = [],
	requests = 0,
	Port = 8000;

if (cluster.isMaster) {
	for (var i = 0; i < numCPUs; i++){
		workers[i] = cluster.fork();

		(function (i){
			workers[i].on('message', function(msg){
				if (msg.cmd == 'incrementRequestTotal') {
					requests++;
					for (var j = 0; j<numCPUs; j++){
						workers[j].send({
							cmd:	'updateOfRequestTotal',
							requests: requests
						});
					}
				}
			});
		})(i);
	}
	
	cluster.on('exit', function(worker, code, signal){
		console.log('Worker ' + worker.process.pid + ' died.');
	});

}else{
	process.on('message', function(message){
		if (message.cmd == 'updateOfRequestTotal'){
			requests = message.requests;
		}
	});

	http.Server(function(req, res){
		console.log('Server start working and listen on ' + Port)
		res.writeHead(200);
		res.end('Worker in process ' + process.pid 
		+ ' says cluster has responded to ' + requests + ' requests.');
		process.send({ cmd: 'incrementRequestTotal' });
	}).listen(Port);
}
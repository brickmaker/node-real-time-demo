const Koa = require('koa');
const app = new Koa();
const serve = require('koa-static');
const server = require('http').createServer(app.callback());
const io = require('socket.io')(server);

app.use(serve(__dirname + '/public'));

io.on('connection', (socket) => {
  console.log(`client ${socket.id} connected`)

  socket.on('draw', data => {
    socket.broadcast.emit('draw', data)
  });
});

server.listen(8102);


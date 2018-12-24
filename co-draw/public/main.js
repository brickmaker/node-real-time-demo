const socket = io.connect('/');

const canvas = document.getElementById('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const context = canvas.getContext('2d');

function drawLine(x1, y1, x2, y2) {
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
}

let drawing = false;
let prevPos = {};

canvas.onmousedown = e => {
  drawing = true;
  prevPos.x = e.pageX;
  prevPos.y = e.pageY;
};

canvas.onmouseup = e => {
  drawing = false;
};

canvas.onmousemove = e => {
  let currPos = {
    x: e.pageX,
    y: e.pageY
  }
  if (drawing) {
    drawLine(prevPos.x, prevPos.y, currPos.x, currPos.y);
    socket.emit('draw', {
      pos1: prevPos,
      pos2: currPos
    });
    prevPos.x = currPos.x;
    prevPos.y = currPos.y;
  }
};

socket.on('draw', data => {
  const { pos1: prevPos, pos2: currPos } = data
  drawLine(prevPos.x, prevPos.y, currPos.x, currPos.y);
});
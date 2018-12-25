const url = require('url');
const fs = require('fs');
const http = require('http');

const clients = {};
const clientSelectedQuestions = {};
const questions = {};
const answers = {};

let clientIdInc = 0;

function sendData(clientId, data, event) {
  let clientSocket = clients[clientId];
  if (clientSocket) {
    event && clientSocket.write(`event: ${event}\n`);
    clientSocket.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

function removeClient(clientId) {
  if (clientId) {
    delete clients[clientId];
  }
}

const server = http.createServer((request, response) => {
  const parsedURL = url.parse(request.url, true);
  let sseUserId = request.headers['_sse_user_id_'];
  if (parsedURL.path == '/event-source') {
    response.writeHead(200, {
      'content-type': 'text/event-stream',
      'cache-control': 'no-cache'
    })
    removeClient(sseUserId);
    sseUserId = clientIdInc++;
    clients[sseUserId] = response;

    sendData(sseUserId, sseUserId, 'connect'); // send client its ID
    sendData(sseUserId, Object.keys(questions), 'questions'); // send all questions

    response.on('close', () => {
      removeClient(sseUserId);
    });

    // heartbeat event to keep connection alive
    setInterval(() => {
      sendData(sseUserId, new Date().getTime(), 'ping');
    }, 10000);
  } else if (parsedURL.pathname === '/select-question') {
    const q = parsedURL.query['q'];
    clientSelectedQuestions[sseUserId] = q;
    if (!answers[q]) {
      answers[q] = [];
    }
    sendData(sseUserId, answers[q], 'answers');
    return response.end();
  } else if (request.method === 'POST') {
    // get post body
    let body = [];
    request.on('data', (chunk) => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString(); // got post body

      if (parsedURL.path === '/add-question') {
        questions[body] = sseUserId;
        for (const client in clients) {
          sendData(client, body, 'new-question');
        }
        return response.end();
      }
      if (parsedURL.path === '/add-answer') {
        const currUserQuestion = clientSelectedQuestions[sseUserId];
        if (!currUserQuestion) {
          return response.end('question not selected');
        }
        if (!answers[currUserQuestion]) {
          answers[currUserQuestion] = [];
        }
        answers[currUserQuestion].push(body);

        for (const id in clientSelectedQuestions) {
          if (clientSelectedQuestions[id] === currUserQuestion) {
            sendData(id, answers[currUserQuestion], 'answers');
          }
        }

        return response.end();
      }
    });
  } else {
    if (parsedURL.path == '/') {
      return fs.createReadStream('./public/index.html').pipe(response);
    } else {
      return fs.createReadStream(`./public/${parsedURL.path}`).pipe(response);
    }
  }
});

server.listen(8001);
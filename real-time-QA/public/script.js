const qInput = document.getElementById('q_field');
const aInput = document.getElementById('a_field');
const questionList = document.getElementById('q_list');
const answerList = document.getElementById('a_list');

const eventSource = new EventSource('/event-source');

let userId;

eventSource.addEventListener('connect', (event) => {
  userId = JSON.parse(event.data);
});

eventSource.addEventListener('questions', event => {
  const questions = JSON.parse(event.data);
  questions.map(q => {
    addQuestion(q);
  });
});

eventSource.addEventListener('answers', event => {
  const answers = JSON.parse(event.data);
  answerList.innerHTML = '';
  answers.map(a => {
    answerList.innerHTML += `<li>${a}</li>`
  });
});


eventSource.addEventListener('new-question', event => {
  const q = JSON.parse(event.data);
  addQuestion(q);
});

function addQuestion(q) {
  const el = document.createElement('li');
  el.innerHTML = q;
  el.onclick = (e) => {
    fetch(`/select-question?q=${e.target.innerHTML}`, {
      headers: {
        '_sse_user_id_': userId
      }
    }).then(res => res.json())
      .then(response => { })
      .catch(error => console.error('Error:', error));
  };
  questionList.appendChild(el);
}

function send(url, data) {
  console.log(data);
  fetch(url, {
    method: 'POST', // or 'PUT'
    body: data,
    headers: {
      'Content-Type': 'application/json',
      '_sse_user_id_': userId
    }
  }).then(response => { })
    .catch(error => console.error('Error:', error));
}

qInput.onkeypress = e => {
  if (e.keyCode === 13) {
    send('/add-question', e.target.value);
    e.target.value = '';
  }
};

aInput.onkeypress = e => {
  if (e.keyCode === 13) {
    send('/add-answer', e.target.value);
    e.target.value = '';
  }
};
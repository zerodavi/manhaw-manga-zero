// script.js - JS do Quiz Profissional

const quizData = {
  geral: [
    { q: "Qual é a capital do Brasil?", a: ["Brasília", "Rio", "São Paulo", "Salvador"], c: 0 },
    { q: "2 + 2 é?", a: ["3", "4", "5", "6"], c: 1 },
    { q: "Qual é o maior animal terrestre?", a: ["Elefante", "Girafa", "Rinoceronte", "Hipopótamo"], c: 0 },
    { q: "Quem escreveu 'Dom Casmurro'?", a: ["Machado de Assis", "José de Alencar", "Cecília Meireles", "Carlos Drummond"], c: 0 },
    { q: "Qual é a língua mais falada no mundo?", a: ["Inglês", "Mandarim", "Espanhol", "Hindi"], c: 1 },
    { q: "Quantos continentes existem?", a: ["5", "6", "7", "8"], c: 2 },
    { q: "Qual é a cor da esmeralda?", a: ["Vermelha", "Verde", "Azul", "Amarela"], c: 1 },
    { q: "Qual fruta é conhecida como 'banana da terra'?", a: ["Banana", "Plátano", "Manga", "Abacate"], c: 1 },
    { q: "O que é H2O?", a: ["Água", "Oxigênio", "Peróxido", "Dióxido de Carbono"], c: 0 },
    { q: "Qual planeta é conhecido como 'Planeta Vermelho'?", a: ["Marte", "Vênus", "Júpiter", "Mercúrio"], c: 0 }
  ],
  historia: [
    { q: "Quem descobriu o Brasil?", a: ["Pedro Álvares Cabral", "Cristóvão Colombo", "Vasco da Gama", "Fernão de Magalhães"], c: 0 },
    { q: "Quando começou a Segunda Guerra Mundial?", a: ["1914", "1939", "1945", "1929"], c: 1 },
    { q: "Quem foi o primeiro presidente do Brasil?", a: ["Getúlio Vargas", "Deodoro da Fonseca", "Juscelino Kubitschek", "Tancredo Neves"], c: 1 },
    { q: "Qual civilização construiu as pirâmides do Egito?", a: ["Romanos", "Egípcios", "Maias", "Gregos"], c: 1 },
    { q: "Em que ano caiu o Muro de Berlim?", a: ["1985", "1989", "1991", "1979"], c: 1 },
    { q: "Quem foi Napoleão Bonaparte?", a: ["Rei da França", "General Francês", "Imperador do Brasil", "Explorador"], c: 1 },
    { q: "Qual guerra terminou em 1945?", a: ["Primeira Guerra Mundial", "Segunda Guerra Mundial", "Guerra Fria", "Guerra do Vietnã"], c: 1 },
    { q: "O que foi a Revolução Industrial?", a: ["Transformação tecnológica", "Guerra", "Movimento cultural", "Descobrimento de terras"], c: 0 },
    { q: "Quem pintou a Mona Lisa?", a: ["Van Gogh", "Leonardo da Vinci", "Picasso", "Michelangelo"], c: 1 },
    { q: "O Império Romano caiu em que ano?", a: ["476 d.C.", "410 d.C.", "500 d.C.", "395 d.C."], c: 0 }
  ]
  // você pode adicionar ciência, geografia e mais categorias
};

let currentCategory = '';
let currentIndex = 0;
let score = 0;

// Inicializa o quiz
function startQuiz(category) {
  currentCategory = category;
  currentIndex = 0;
  score = 0;
  document.getElementById('categories').classList.add('hidden');
  document.getElementById('quiz').classList.remove('hidden');
  document.getElementById('restart').classList.add('hidden');
  showQuestion();
}

// Mostra a pergunta atual
function showQuestion() {
  const q = quizData[currentCategory][currentIndex];
  document.getElementById('question').textContent = q.q;

  const answersDiv = document.getElementById('answers');
  answersDiv.innerHTML = '';
  q.a.forEach((answer, i) => {
    const btn = document.createElement('button');
    btn.textContent = answer;
    btn.onclick = () => checkAnswer(i);
    answersDiv.appendChild(btn);
  });

  document.getElementById('score').textContent = `Pontuação: ${score}`;
  document.getElementById('nextBtn').classList.add('hidden');
}

// Verifica a resposta selecionada
function checkAnswer(selected) {
  const q = quizData[currentCategory][currentIndex];
  const buttons = document.querySelectorAll('#answers button');
  buttons.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.c) btn.classList.add('correct');
    if (i === selected && i !== q.c) btn.classList.add('wrong');
  });

  if (selected === q.c) score++;
  document.getElementById('score').textContent = `Pontuação: ${score}`;
  document.getElementById('nextBtn').classList.remove('hidden');
}

// Próxima pergunta
function nextQuestion() {
  currentIndex++;
  if (currentIndex < quizData[currentCategory].length) {
    showQuestion();
  } else {
    document.getElementById('question').textContent = "Quiz finalizado!";
    document.getElementById('answers').innerHTML = '';
    document.getElementById('score').textContent = `Pontuação final: ${score}/${quizData[currentCategory].length}`;
    document.getElementById('nextBtn').classList.add('hidden');
    document.getElementById('restart').classList.remove('hidden');
  }
}

// Reinicia o quiz
function restartQuiz() {
  document.getElementById('categories').classList.remove('hidden');
  document.getElementById('quiz').classList.add('hidden');
  document.getElementById('restart').classList.add('hidden');
}

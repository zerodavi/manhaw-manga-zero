// ── WEB AUDIO API ──────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getCtx(){
  if(!audioCtx) audioCtx = new AudioCtx();
  if(audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

// Som de mensagem ENVIADA — sobe 800Hz → 1500Hz
function somEnviada(){
  const ctx = getCtx();
  const now = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.1);
}

// Som de mensagem RECEBIDA — "Bi-Du" descendente em duas notas
function somRecebida(){
  const ctx = getCtx();

  // Nota 1: "Bi" (900Hz → 700Hz)
  const now1 = ctx.currentTime;
  const osc1  = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(900, now1);
  osc1.frequency.exponentialRampToValueAtTime(700, now1 + 0.08);
  gain1.gain.setValueAtTime(0.2, now1);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now1 + 0.08);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now1);
  osc1.stop(now1 + 0.08);

  // Nota 2: "Du" (600Hz → 300Hz) — 100ms depois
  setTimeout(() => {
    const now2 = ctx.currentTime;
    const osc2  = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(600, now2);
    osc2.frequency.exponentialRampToValueAtTime(300, now2 + 0.1);
    gain2.gain.setValueAtTime(0.2, now2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now2);
    osc2.stop(now2 + 0.1);
  }, 100);
}
// ────────────────────────────────────────────────────────────

// ── SUPABASE ─────────────────────────────────────────────────
const url = "https://swenhgmatpxuqjhdghuv.supabase.co";
const key = "sb_publishable__kkMzLJQtt_My1sPZZ35hw_vpsJV4HN";

const cliente = supabase.createClient(url, key);

const chat  = document.getElementById("chat");
const campo = document.getElementById("msg");

let nome = localStorage.getItem("nome");
let icone = localStorage.getItem("icone") || "perfil/icone1.png";
let iconeSelecionado = icone;

// ── LOGIN ─────────────────────────────────────────────────────
// Marcar ícone salvo como selecionado
document.querySelectorAll(".icone-opcao").forEach(el => {
  if(el.dataset.icone === icone){
    document.querySelectorAll(".icone-opcao").forEach(e => e.classList.remove("selecionado"));
    el.classList.add("selecionado");
  }
});

function selecionarIcone(el){
  document.querySelectorAll(".icone-opcao").forEach(e => e.classList.remove("selecionado"));
  el.classList.add("selecionado");
  iconeSelecionado = el.dataset.icone;
}

if(nome && nome.trim() !== ""){
  document.getElementById("loginTela").style.display = "none";
  iniciarChat();
}

function salvarNome(){
  let valor = document.getElementById("nomeInput").value.trim();
  if(valor === "") return;
  nome  = valor;
  icone = iconeSelecionado;
  localStorage.setItem("nome",  nome);
  localStorage.setItem("icone", icone);
  document.getElementById("loginTela").style.display  = "none";
  document.getElementById("cancelarBtn").style.display = "none";
  document.getElementById("entrarBtn").textContent     = "Entrar no Chat";
  document.getElementById("titulo").innerText          = "Chat - " + nome;
  document.getElementById("headerAvatar").src          = icone;
  if(!document.getElementById("chat").children.length){
    iniciarChat();
  }
}

function trocarNome(){
  document.getElementById("nomeInput").value           = nome || "";
  document.getElementById("entrarBtn").textContent     = "Salvar";
  document.getElementById("cancelarBtn").style.display = "block";
  document.getElementById("loginTela").style.display   = "flex";
  document.getElementById("nomeInput").focus();
}

function cancelarEdicao(){
  document.getElementById("loginTela").style.display  = "none";
  document.getElementById("cancelarBtn").style.display = "none";
  document.getElementById("entrarBtn").textContent     = "Entrar no Chat";
}

// ── CHAT ──────────────────────────────────────────────────────
function iniciarChat(){
  document.getElementById("titulo").innerText = "Chat - " + nome;
  document.getElementById("headerAvatar").src = icone;

  carregar();

  cliente
    .channel("sala1")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mensagens" },
      (payload) => {
        mostrar(payload.new.nome, payload.new.texto, payload.new.id, payload.new.icone);
      }
    )
    .subscribe();
}

function mostrar(usuario, texto, id, iconeUsuario){
  if(document.getElementById("msg_" + id)) return;

  const sou_eu   = usuario === nome;
  const avatarSrc = iconeUsuario || "perfil/icone1.png";

  if(!sou_eu) somRecebida();

  let div = document.createElement("div");
  div.id        = "msg_" + id;
  div.className = "msg " + (sou_eu ? "eu" : "outro");

  div.innerHTML = `
    <img class="msg-avatar" src="${avatarSrc}" alt="${usuario}" onerror="this.style.display='none'">
    <div>
      <div class="msg-nome">${sou_eu ? "Você" : usuario}</div>
      <div class="msg-bubble">${texto}</div>
    </div>
  `;

  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

async function carregar(){
  chat.innerHTML = "";

  const { data } = await cliente
    .from("mensagens")
    .select("*")
    .order("id", { ascending: true });

  // Silencia sons durante carregamento do histórico
  const _som = somRecebida;
  somRecebida  = () => {};
  if(data) data.forEach(item => {
    mostrar(item.nome, item.texto, item.id, item.icone);
  });
  somRecebida  = _som;
}

async function enviar(){
  let texto = campo.value.trim();
  if(texto === "") return;
  campo.value = "";

  somEnviada();

  await cliente
    .from("mensagens")
    .insert([{ nome: nome, texto: texto, icone: icone }]);
}

// ── EVENTOS ───────────────────────────────────────────────────
campo.addEventListener("keydown", function(e){
  if(e.key === "Enter") enviar();
});

document.getElementById("nomeInput").addEventListener("keydown", function(e){
  if(e.key === "Enter") salvarNome();
});

// Corrige altura no Android quando teclado abre/fecha
if(window.visualViewport){
  window.visualViewport.addEventListener("resize", () => {
    document.body.style.height = window.visualViewport.height + "px";
    chat.scrollTop = chat.scrollHeight;
  });
}

// ── WEB AUDIO API ──────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let somAtivo  = true; // controlado pelo toggle

function getCtx(){
  if(!audioCtx) audioCtx = new AudioCtx();
  if(audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function somEnviada(){
  if(!somAtivo) return;
  const ctx = getCtx();
  const now  = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(1500, now + 0.1);
  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
  osc.connect(gain); gain.connect(ctx.destination);
  osc.start(now); osc.stop(now + 0.1);
}

function somRecebida(){
  if(!somAtivo) return;
  const ctx = getCtx();

  const now1 = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(900, now1);
  osc1.frequency.exponentialRampToValueAtTime(700, now1 + 0.08);
  gain1.gain.setValueAtTime(0.2, now1);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now1 + 0.08);
  osc1.connect(gain1); gain1.connect(ctx.destination);
  osc1.start(now1); osc1.stop(now1 + 0.08);

  setTimeout(() => {
    const now2 = ctx.currentTime;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(600, now2);
    osc2.frequency.exponentialRampToValueAtTime(300, now2 + 0.1);
    gain2.gain.setValueAtTime(0.2, now2);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.1);
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc2.start(now2); osc2.stop(now2 + 0.1);
  }, 100);
}
// ──────────────────────────────────────────────────────────────

// ── SUPABASE ──────────────────────────────────────────────────
const url = "https://swenhgmatpxuqjhdghuv.supabase.co";
const key = "sb_publishable__kkMzLJQtt_My1sPZZ35hw_vpsJV4HN";

const cliente = supabase.createClient(url, key);

const chat  = document.getElementById("chat");
const campo = document.getElementById("msg");

let nome           = localStorage.getItem("nome");
let icone          = localStorage.getItem("icone") || "perfil/icone1.png";
let iconeSelecionado = icone;
let salaAtual      = localStorage.getItem("sala") || "geral";
let tipoSala       = "geral";
let canalAtivo     = null;

// ── TEMA ──────────────────────────────────────────────────────
(function aplicarTemaInicial(){
  const temaGuardado = localStorage.getItem("tema") || "escuro";
  const modoClaro = temaGuardado === "claro";
  document.documentElement.setAttribute("data-tema", temaGuardado);
  const tog = document.getElementById("toggleTema");
  if(tog) tog.checked = modoClaro;
  atualizarIconeTema(modoClaro);
})();

function alternarTema(input){
  const claro = input.checked;
  const tema  = claro ? "claro" : "escuro";
  document.documentElement.setAttribute("data-tema", tema);
  localStorage.setItem("tema", tema);
  atualizarIconeTema(claro);
}

function atualizarIconeTema(modoClaro){
  const ic  = document.getElementById("icTema");
  const lbl = document.getElementById("labelTema");
  if(ic)  ic.textContent  = modoClaro ? "☀️" : "🌙";
  if(lbl) lbl.textContent = modoClaro ? "Modo claro" : "Modo escuro";
}

// ── ÁUDIO TOGGLE ──────────────────────────────────────────────
(function aplicarSomInicial(){
  const somGuardado = localStorage.getItem("som");
  somAtivo = somGuardado !== "off";
  const tog = document.getElementById("toggleSom");
  if(tog) tog.checked = somAtivo;
})();

function alternarSom(input){
  somAtivo = input.checked;
  localStorage.setItem("som", somAtivo ? "on" : "off");
}

// ── MINI MENU ─────────────────────────────────────────────────
const menuEl = document.getElementById("menuConfig");

function toggleMenu(e){
  e.stopPropagation();
  menuEl.classList.toggle("aberto");
}

document.addEventListener("click", (e) => {
  if(!menuEl.contains(e.target) && e.target.id !== "btnConfig"){
    menuEl.classList.remove("aberto");
  }
});

function fecharMenu(){
  menuEl.classList.remove("aberto");
}

function menuAcao(acao){
  fecharMenu();
  if(acao === "nome")   trocarNome();
  if(acao === "sala")   abrirTrocaSala();
  if(acao === "apagar") abrirModal();
}

// ── APAGAR CONTA ──────────────────────────────────────────────
function abrirModal(){
  document.getElementById("modalConfirm").classList.add("aberto");
}

function fecharModal(){
  document.getElementById("modalConfirm").classList.remove("aberto");
}

async function confirmarApagar(){
  fecharModal();
  if(canalAtivo){
    await cliente.removeChannel(canalAtivo);
    canalAtivo = null;
  }
  localStorage.removeItem("nome");
  localStorage.removeItem("icone");
  localStorage.removeItem("sala");
  location.reload();
}

// ── LOGIN ─────────────────────────────────────────────────────
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

// Entrada inicial
if(nome && nome.trim() !== ""){
  document.getElementById("loginTela").style.display = "none";
  if(salaAtual){
    iniciarChat();
  } else {
    mostrarTelaSala();
  }
}

function salvarNome(){
  let valor = document.getElementById("nomeInput").value.trim();
  if(valor === "") return;

  const eraEdicao = nome !== null && canalAtivo !== null;

  nome  = valor;
  icone = iconeSelecionado;
  localStorage.setItem("nome",  nome);
  localStorage.setItem("icone", icone);
  document.getElementById("loginTela").style.display  = "none";
  document.getElementById("cancelarBtn").style.display = "none";
  document.getElementById("entrarBtn").textContent     = "Continuar →";

  if(eraEdicao){
    // Só atualiza o header — canal Realtime não depende do nome
    document.getElementById("titulo").innerText = "Chat - " + nome;
    document.getElementById("headerAvatar").src = icone;
  } else {
    mostrarTelaSala();
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
  document.getElementById("entrarBtn").textContent     = "Continuar →";
}

// ── TELA DE SALA ──────────────────────────────────────────────
function mostrarTelaSala(){
  if(salaAtual && salaAtual !== "geral"){
    tipoSala = "privada";
    document.getElementById("codigoSala").value = salaAtual.replace("privada_", "");
    document.getElementById("camposPrivada").classList.add("visivel");
    document.getElementById("btnSalaGeral").classList.remove("ativo");
    document.getElementById("btnSalaPrivada").classList.add("ativo");
  } else {
    tipoSala = "geral";
    document.getElementById("camposPrivada").classList.remove("visivel");
    document.getElementById("btnSalaGeral").classList.add("ativo");
    document.getElementById("btnSalaPrivada").classList.remove("ativo");
  }
  document.getElementById("salaTela").style.display = "flex";
}

function voltarParaLogin(){
  document.getElementById("salaTela").style.display = "none";
  if(!nome) document.getElementById("loginTela").style.display = "flex";
}

function escolherTipoSala(tipo){
  tipoSala = tipo;
  document.getElementById("btnSalaGeral").classList.toggle("ativo",    tipo === "geral");
  document.getElementById("btnSalaPrivada").classList.toggle("ativo",  tipo === "privada");
  const campos = document.getElementById("camposPrivada");
  if(tipo === "privada"){
    campos.classList.add("visivel");
    document.getElementById("codigoSala").focus();
  } else {
    campos.classList.remove("visivel");
  }
}

function entrarNaSala(){
  if(tipoSala === "privada"){
    const codigo = document.getElementById("codigoSala").value.trim();
    if(codigo === ""){
      document.getElementById("codigoSala").focus();
      document.getElementById("codigoSala").style.border = "2px solid #ff5252";
      setTimeout(() => document.getElementById("codigoSala").style.border = "", 1500);
      return;
    }
    salaAtual = "privada_" + codigo;
  } else {
    salaAtual = "geral";
  }
  localStorage.setItem("sala", salaAtual);
  document.getElementById("salaTela").style.display = "none";
  iniciarChat();
}

async function abrirTrocaSala(){
  if(canalAtivo){
    await cliente.removeChannel(canalAtivo);
    canalAtivo = null;
  }
  mostrarTelaSala();
}

// ── CHAT ──────────────────────────────────────────────────────
async function iniciarChat(){
  document.getElementById("titulo").innerText = "Chat - " + nome;
  document.getElementById("headerAvatar").src = icone;
  atualizarBadgeSala();

  if(canalAtivo){
    await cliente.removeChannel(canalAtivo);
    canalAtivo = null;
  }

  carregar();

  canalAtivo = cliente
    .channel("canal_" + salaAtual + "_" + Date.now())
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mensagens", filter: `sala=eq.${salaAtual}` },
      (payload) => {
        mostrar(payload.new.nome, payload.new.texto, payload.new.id, payload.new.icone);
      }
    )
    .subscribe();
}

function atualizarBadgeSala(){
  const badge = document.getElementById("salaBadge");
  if(salaAtual === "geral"){
    badge.innerHTML = "🌐 Chat Geral";
  } else {
    const codigo = salaAtual.replace("privada_", "");
    badge.innerHTML = `🔒 #${codigo}`;
  }
}

function mostrar(usuario, texto, id, iconeUsuario){
  if(document.getElementById("msg_" + id)) return;

  const aviso = document.getElementById("avisoSala");
  if(aviso) aviso.classList.remove("visivel");

  const sou_eu    = usuario === nome;
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
  Array.from(chat.children).forEach(el => {
    if(el.id !== "avisoSala") el.remove();
  });

  const { data } = await cliente
    .from("mensagens")
    .select("*")
    .eq("sala", salaAtual)
    .order("id", { ascending: true });

  const aviso = document.getElementById("avisoSala");
  const _som  = somRecebida;
  somRecebida  = () => {};

  if(data && data.length > 0){
    if(aviso) aviso.classList.remove("visivel");
    data.forEach(item => mostrar(item.nome, item.texto, item.id, item.icone));
  } else {
    if(aviso){
      if(salaAtual !== "geral") aviso.classList.add("visivel");
      else aviso.classList.remove("visivel");
    }
  }

  somRecebida = _som;
}

async function enviar(){
  let texto = campo.value.trim();
  if(texto === "") return;
  campo.value = "";

  somEnviada();

  const { data } = await cliente
    .from("mensagens")
    .insert([{ nome: nome, texto: texto, icone: icone, sala: salaAtual }])
    .select()
    .single();

  if(data) mostrar(data.nome, data.texto, data.id, data.icone);
}

// ── EVENTOS ───────────────────────────────────────────────────
campo.addEventListener("keydown", e => { if(e.key === "Enter") enviar(); });
document.getElementById("nomeInput").addEventListener("keydown", e => { if(e.key === "Enter") salvarNome(); });
document.getElementById("codigoSala").addEventListener("keydown", e => { if(e.key === "Enter") entrarNaSala(); });

if(window.visualViewport){
  window.visualViewport.addEventListener("resize", () => {
    document.body.style.height = window.visualViewport.height + "px";
    chat.scrollTop = chat.scrollHeight;
  });
}

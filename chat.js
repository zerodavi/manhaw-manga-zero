// ── WEB AUDIO API ──────────────────────────────────────────
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let somAtivo  = true;

function getCtx(){
  if(!audioCtx) audioCtx = new AudioCtx();
  if(audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function somEnviada(){
  if(!somAtivo) return;
  try{
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
  }catch(e){}
}

function somRecebidaFn(){
  if(!somAtivo) return;
  try{
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
      try{
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
      }catch(e){}
    }, 100);
  }catch(e){}
}

// Wrapper mutável para poder silenciar durante carregamento
let somRecebida = somRecebidaFn;

// ── SUPABASE ──────────────────────────────────────────────────
const url = "https://swenhgmatpxuqjhdghuv.supabase.co";
const key = "sb_publishable__kkMzLJQtt_My1sPZZ35hw_vpsJV4HN";

const cliente = supabase.createClient(url, key);

const chat  = document.getElementById("chat");
const campo = document.getElementById("msg");

let nome           = localStorage.getItem("nome");
let icone          = localStorage.getItem("icone") || "🐱";
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

// ── TECLADO VIRTUAL ANDROID/iOS ────────────────────────────────
// Usa visualViewport API para detectar teclado e ajustar layout
if(window.visualViewport){
  let scrollPendente = false;
  window.visualViewport.addEventListener("resize", () => {
    // Rola o chat para o final quando o teclado abre/fecha
    if(!scrollPendente){
      scrollPendente = true;
      requestAnimationFrame(() => {
        chat.scrollTop = chat.scrollHeight;
        scrollPendente = false;
      });
    }
  });
}

// Previne que a página encolha quando o teclado virtual abre no Android
// usando a diferença entre window.innerHeight e visualViewport.height
function ajustarAltura(){
  if(window.visualViewport){
    // Isso garante que body não seja encolhido pelo teclado
    document.body.style.height = window.visualViewport.height + "px";
  }
}
if(window.visualViewport){
  window.visualViewport.addEventListener("resize", ajustarAltura);
  window.visualViewport.addEventListener("scroll", ajustarAltura);
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

// Touch fora fecha o menu
document.addEventListener("touchstart", (e) => {
  if(!menuEl.contains(e.target) && e.target.id !== "btnConfig"){
    menuEl.classList.remove("aberto");
  }
}, {passive:true});

function fecharMenu(){ menuEl.classList.remove("aberto"); }

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

// ── ÍCONES EMOJI ──────────────────────────────────────────────
// Marca o ícone salvo como selecionado ao carregar
document.querySelectorAll(".icone-opcao").forEach(el => {
  el.classList.toggle("selecionado", el.dataset.icone === icone);
});

function selecionarIcone(el){
  document.querySelectorAll(".icone-opcao").forEach(e => e.classList.remove("selecionado"));
  el.classList.add("selecionado");
  iconeSelecionado = el.dataset.icone;
}

// ── HELPER: renderiza avatar (emoji ou img) ────────────────────
function criarAvatarEl(iconeStr, classname, alt){
  // Se o ícone é emoji (não começa com http nem /)
  const ehEmoji = iconeStr && !iconeStr.startsWith("http") && !iconeStr.startsWith("/") && !iconeStr.startsWith("perfil");
  const div = document.createElement("div");
  div.className = classname || "msg-avatar";
  if(ehEmoji){
    div.textContent = iconeStr || "🐱";
  } else {
    const img = document.createElement("img");
    img.src = iconeStr;
    img.alt = alt || "";
    img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%";
    img.onerror = () => { img.remove(); div.textContent = "🐱"; };
    div.appendChild(img);
  }
  return div;
}

// ── ENTRADA INICIAL ──────────────────────────────────────────
if(nome && nome.trim() !== ""){
  document.getElementById("loginTela").style.display = "none";
  if(salaAtual){
    iniciarChat();
  } else {
    mostrarTelaSala();
  }
}

// ── LOGIN ─────────────────────────────────────────────────────
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
    atualizarHeaderAvatar();
    document.getElementById("titulo").innerText = "Chat - " + nome;
  } else {
    mostrarTelaSala();
  }
}

function trocarNome(){
  document.getElementById("nomeInput").value           = nome || "";
  document.getElementById("entrarBtn").textContent     = "Salvar";
  document.getElementById("cancelarBtn").style.display = "block";
  document.getElementById("loginTela").style.display   = "flex";
  setTimeout(() => document.getElementById("nomeInput").focus(), 100);
}

function cancelarEdicao(){
  document.getElementById("loginTela").style.display  = "none";
  document.getElementById("cancelarBtn").style.display = "none";
  document.getElementById("entrarBtn").textContent     = "Continuar →";
}

function atualizarHeaderAvatar(){
  const wrap = document.getElementById("headerAvatarWrap");
  if(!wrap) return;
  wrap.innerHTML = "";
  const ehEmoji = icone && !icone.startsWith("http") && !icone.startsWith("/") && !icone.startsWith("perfil");
  if(ehEmoji){
    wrap.textContent = icone || "🐱";
  } else {
    const img = document.createElement("img");
    img.src = icone;
    img.style.cssText = "width:100%;height:100%;object-fit:cover;border-radius:50%";
    img.onerror = () => { img.remove(); wrap.textContent = "🐱"; };
    wrap.appendChild(img);
  }
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
  document.getElementById("btnSalaGeral").classList.toggle("ativo",   tipo === "geral");
  document.getElementById("btnSalaPrivada").classList.toggle("ativo", tipo === "privada");
  const campos = document.getElementById("camposPrivada");
  if(tipo === "privada"){
    campos.classList.add("visivel");
    setTimeout(() => document.getElementById("codigoSala").focus(), 100);
  } else {
    campos.classList.remove("visivel");
  }
}

function entrarNaSala(){
  if(tipoSala === "privada"){
    const codigo = document.getElementById("codigoSala").value.trim();
    if(codigo === ""){
      const el = document.getElementById("codigoSala");
      el.focus();
      el.style.borderColor = "#ff5252";
      setTimeout(() => el.style.borderColor = "", 1500);
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
  atualizarHeaderAvatar();
  atualizarBadgeSala();

  if(canalAtivo){
    await cliente.removeChannel(canalAtivo);
    canalAtivo = null;
  }

  await carregar();

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

  const sou_eu = usuario === nome;
  const avatarIcone = iconeUsuario || "🐱";

  if(!sou_eu) somRecebida();

  const div = document.createElement("div");
  div.id        = "msg_" + id;
  div.className = "msg " + (sou_eu ? "eu" : "outro");

  // Cria avatar
  const avatarEl = criarAvatarEl(avatarIcone, "msg-avatar", usuario);
  if(sou_eu) avatarEl.style.borderColor = "#00c853";

  const inner = document.createElement("div");
  inner.innerHTML = `
    <div class="msg-nome">${sou_eu ? "Você" : escapeHtml(usuario)}</div>
    <div class="msg-bubble">${escapeHtml(texto)}</div>
  `;

  div.appendChild(avatarEl);
  div.appendChild(inner);
  chat.appendChild(div);

  // Scroll suave ao final
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

// Previne XSS em nomes/mensagens
function escapeHtml(str){
  return String(str)
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#39;");
}

async function carregar(){
  // Limpa mensagens anteriores
  Array.from(chat.children).forEach(el => {
    if(el.id !== "avisoSala") el.remove();
  });

  const { data, error } = await cliente
    .from("mensagens")
    .select("*")
    .eq("sala", salaAtual)
    .order("id", { ascending: true });

  const aviso = document.getElementById("avisoSala");
  const somBackup = somRecebida;
  somRecebida = () => {}; // silencia durante carregamento

  if(data && data.length > 0){
    if(aviso) aviso.classList.remove("visivel");
    data.forEach(item => mostrar(item.nome, item.texto, item.id, item.icone));
  } else {
    if(aviso){
      if(salaAtual !== "geral") aviso.classList.add("visivel");
      else aviso.classList.remove("visivel");
    }
  }

  somRecebida = somBackup;
}

async function enviar(){
  let texto = campo.value.trim();
  if(texto === "") return;
  campo.value = "";
  campo.focus(); // mantém o foco no campo (importante no mobile)

  somEnviada();

  const { data, error } = await cliente
    .from("mensagens")
    .insert([{ nome: nome, texto: texto, icone: icone, sala: salaAtual }])
    .select()
    .single();

  if(data) mostrar(data.nome, data.texto, data.id, data.icone);
  if(error) console.error("Erro ao enviar:", error);
}

// ── EVENTOS ───────────────────────────────────────────────────
campo.addEventListener("keydown", e => {
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    enviar();
  }
});

document.getElementById("nomeInput").addEventListener("keydown", e => {
  if(e.key === "Enter") salvarNome();
});

document.getElementById("codigoSala").addEventListener("keydown", e => {
  if(e.key === "Enter") entrarNaSala();
});

// ── RECONEXÃO AUTOMÁTICA ─────────────────────────────────────
// Recarrega mensagens ao voltar para o app (útil no mobile)
document.addEventListener("visibilitychange", () => {
  if(document.visibilityState === "visible" && canalAtivo){
    carregar();
  }
});

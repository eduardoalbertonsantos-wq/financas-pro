// ==========================================
// FINANÇAS PRO - RELATÓRIO WHATSAPP
// ==========================================

function moedaWhatsApp(valor) {
  const numero = Number(valor) || 0;

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function textoElemento(id, padrao = "R$ 0,00") {
  const elemento = document.getElementById(id);

  if (!elemento) return padrao;

  return elemento.textContent.trim() || padrao;
}

function gerarRelatorioWhatsApp() {

  const saldo = textoElemento("saldo");
  const entradas = textoElemento("entradas");
  const despesas = textoElemento("despesas");
  const poupado = textoElemento("poupado");

  const filtroMes = document.getElementById("monthFilter");

  let mes = "mês atual";

  if (filtroMes && filtroMes.value) {
    const partes = filtroMes.value.split("-");

    if (partes.length === 2) {
      const data = new Date(
        Number(partes[0]),
        Number(partes[1]) - 1,
        1
      );

      mes = data.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
      });
    }
  }

  const mensagem =
`💰 *FINANÇAS PRO*
📊 *Relatório financeiro*

📅 *Período:* ${mes}

━━━━━━━━━━━━━━━━━━

💵 *Saldo disponível*
${saldo}

📥 *Entradas*
${entradas}

📤 *Despesas*
${despesas}

🐷 *Poupado*
${poupado}

━━━━━━━━━━━━━━━━━━

📌 Relatório gerado pelo *Finanças Pro*.

_Controle suas finanças. Planeje seu futuro._`;

  return mensagem;
}


// ==========================================
// ABRIR WHATSAPP
// ==========================================

function enviarRelatorioWhatsApp() {

  const mensagem = gerarRelatorioWhatsApp();

  const url =
    "https://wa.me/?text=" +
    encodeURIComponent(mensagem);

  window.open(url, "_blank");
}


// ==========================================
// COPIAR RELATÓRIO
// ==========================================

async function copiarRelatorioWhatsApp() {

  const mensagem = gerarRelatorioWhatsApp();

  try {

    await navigator.clipboard.writeText(mensagem);

    alert("✅ Relatório copiado!\n\nAgora é só colar no WhatsApp.");

  } catch (erro) {

    prompt(
      "Copie o relatório abaixo:",
      mensagem
    );

  }
}


// ==========================================
// DISPONIBILIZAR FUNÇÕES PARA O SISTEMA
// ==========================================

window.FinancasWhatsApp = {
  gerar: gerarRelatorioWhatsApp,
  enviar: enviarRelatorioWhatsApp,
  copiar: copiarRelatorioWhatsApp
};

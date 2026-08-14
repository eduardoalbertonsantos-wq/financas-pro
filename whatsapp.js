// ==========================================
// FINANÇAS PRO - WHATSAPP
// ==========================================

(function () {

  function texto(id, fallback) {

    const elemento =
      document.getElementById(id);

    if (!elemento)
      return fallback || "";

    return (
      elemento.textContent ||
      fallback ||
      ""
    ).trim();

  }


  function moeda(valor) {

    return Number(valor || 0)
      .toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
      });

  }


  function obterEntradas() {

    const textoEntradas =
      texto(
        "entradas",
        "R$ 0,00"
      );

    return Number(
      textoEntradas
        .replace(/[^0-9,-]/g, "")
        .replace(/\./g, "")
        .replace(",", ".")
    ) || 0;

  }


  function gerarRelatorioWhatsApp() {

    const entradas =
      obterEntradas();

    const dizimo =
      entradas * 0.10;

    const aposDizimo =
      entradas - dizimo;


    const filtro =
      document.getElementById(
        "monthFilter"
      );

    let mes =
      "mês atual";


    if (
      filtro &&
      filtro.value
    ) {

      const partes =
        filtro.value.split("-");

      if (partes.length === 2) {

        const data =
          new Date(
            Number(partes[0]),
            Number(partes[1]) - 1,
            1
          );

        mes =
          data.toLocaleDateString(
            "pt-BR",
            {
              month: "long",
              year: "numeric"
            }
          );

      }

    }


    return `💰 *FINANÇAS PRO*
📊 *RELATÓRIO FINANCEIRO*

📅 *Período:* ${mes}

━━━━━━━━━━━━━━━━━━

💵 *SALDO DISPONÍVEL*
${texto("saldo", "R$ 0,00")}

📥 *ENTRADAS*
${texto("entradas", "R$ 0,00")}

📤 *DESPESAS*
${texto("despesas", "R$ 0,00")}

🙏 *DÍZIMO — 10%*
${moeda(dizimo)}

💵 *ENTRADA APÓS DÍZIMO*
${moeda(aposDizimo)}

🐷 *POUPADO*
${texto("poupado", "R$ 0,00")}

📊 *COMPROMETIDO*
${texto("comprometido", "0%")}

━━━━━━━━━━━━━━━━━━

📌 Relatório gerado pelo *Finanças Pro*.

_Controle suas finanças. Planeje seu futuro._`;

  }


  function enviarRelatorioWhatsApp() {

    const mensagem =
      gerarRelatorioWhatsApp();

    const url =
      "https://wa.me/?text=" +
      encodeURIComponent(mensagem);

    window.location.href =
      url;

  }


  async function copiarRelatorioWhatsApp() {

    const mensagem =
      gerarRelatorioWhatsApp();

    try {

      await navigator
        .clipboard
        .writeText(mensagem);

      alert(
        "✅ Relatório copiado!\n\n" +
        "Agora é só colar no WhatsApp."
      );

    } catch (erro) {

      window.prompt(
        "Copie o relatório abaixo:",
        mensagem
      );

    }

  }


  window.FinancasWhatsApp = {

    gerar:
      gerarRelatorioWhatsApp,

    enviar:
      enviarRelatorioWhatsApp,

    copiar:
      copiarRelatorioWhatsApp

  };

})();

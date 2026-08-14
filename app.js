(() => {

  // =========================================================
  // FINANÇAS PRO
  // APP PRINCIPAL
  // =========================================================

  const KEY = "financas-pro-dados-v1";

  const GOAL = 1200;

  // =========================================================
  // DÍZIMO
  // =========================================================

  const TITHE_RATE = 0.10;

  // =========================================================
  // UTILIDADES
  // =========================================================

  const $ = id => document.getElementById(id);

  const money = value =>
    (Number(value) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const today = () =>
    new Date().toISOString().slice(0, 10);

  function escapeHTML(value) {

    return String(value ?? "")
      .replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[character]));

  }

  function formatDate(date) {

    if (!date) return "";

    const parts = String(date).split("-");

    if (parts.length !== 3)
      return date;

    return (
      parts[2] +
      "/" +
      parts[1] +
      "/" +
      parts[0]
    );

  }

  // =========================================================
  // CARREGAR DADOS
  // =========================================================

  let state = {};

  try {

    state = JSON.parse(
      localStorage.getItem(KEY) || "{}"
    );

  } catch (erro) {

    console.error("Erro ao carregar dados:", erro);

    state = {};

  }

  // Mantém os dados existentes
  state.entries = Array.isArray(state.entries)
    ? state.entries
    : [];

  state.savings = Array.isArray(state.savings)
    ? state.savings
    : [];

  state.goals = Array.isArray(state.goals)
    ? state.goals
    : [];

  state.accounts = Array.isArray(state.accounts)
    ? state.accounts
    : [];

  state.cards = Array.isArray(state.cards)
    ? state.cards
    : [];

  state.debts = Array.isArray(state.debts)
    ? state.debts
    : [];

  state.investments = Array.isArray(state.investments)
    ? state.investments
    : [];

  state.budgets = Array.isArray(state.budgets)
    ? state.budgets
    : [];

  // Dízimo ativado por padrão
  if (typeof state.titheEnabled !== "boolean") {
    state.titheEnabled = true;
  }

  function save() {

    localStorage.setItem(
      KEY,
      JSON.stringify(state)
    );

  }

  // =========================================================
  // MÊS
  // =========================================================

  function getMonth() {

    return (
      $("monthFilter")?.value ||
      today().slice(0, 7)
    );

  }

  function getMonthEntries() {

    return state.entries.filter(item =>
      String(item.date || "")
        .slice(0, 7) === getMonth()
    );

  }

  // =========================================================
  // CÁLCULO DO DÍZIMO
  // =========================================================

  function getTithe(monthEntries = getMonthEntries()) {

    if (!state.titheEnabled)
      return 0;

    const entradas = monthEntries
      .filter(item =>
        item.type === "entrada"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

    return entradas * TITHE_RATE;

  }

  // =========================================================
  // TOTAIS
  // =========================================================

  function getTotals() {

    const entries = getMonthEntries();

    const entradas = entries
      .filter(item =>
        item.type === "entrada"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

    const despesas = entries
      .filter(item =>
        item.type === "despesa"
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

    const dizimo = getTithe(entries);

    const poupado = state.savings
      .filter(item =>
        String(item.date || "")
          .slice(0, 7) === getMonth()
      )
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

    // Saldo já descontando o dízimo
    const saldo =
      entradas -
      dizimo -
      despesas;

    const totalComprometido =
      despesas +
      dizimo;

    const comprometido =
      entradas > 0
        ? Math.min(
            100,
            (totalComprometido / entradas) * 100
          )
        : 0;

    return {

      entradas,
      despesas,
      dizimo,
      poupado,
      saldo,
      comprometido

    };

  }

  // =========================================================
  // NAVEGAÇÃO
  // =========================================================

  function abrirPagina(page) {

    document
      .querySelectorAll(".page")
      .forEach(pagina => {

        pagina.classList.remove("active");

      });

    const pagina =
      document.getElementById(page);

    if (pagina) {

      pagina.classList.add("active");

    }

    document
      .querySelectorAll(
        "nav button[data-page]"
      )
      .forEach(botao => {

        botao.classList.toggle(
          "selected",
          botao.dataset.page === page
        );

      });

    // Volta para o topo da página
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }

  window.abrirPagina = abrirPagina;

  // =========================================================
  // MENU
  // =========================================================

  document.addEventListener(
    "click",
    event => {

      const botao =
        event.target.closest(
          "button[data-page]"
        );

      if (!botao)
        return;

      event.preventDefault();
      event.stopPropagation();

      abrirPagina(
        botao.dataset.page
      );

    }
  );

  // =========================================================
  // DÍZIMO - PAINEL AUTOMÁTICO
  // =========================================================

  function renderTithePanel() {

    const dashboard =
      $("dashboard");

    if (!dashboard)
      return;

    let panel =
      $("tithePanel");

    if (!panel) {

      panel =
        document.createElement("div");

      panel.id =
        "tithePanel";

      panel.className =
        "panel";

      const resumo =
        dashboard.querySelector(".grid");

      if (resumo) {

        resumo.insertAdjacentElement(
          "afterend",
          panel
        );

      } else {

        dashboard.prepend(panel);

      }

    }

    const totals =
      getTotals();

    panel.innerHTML = `

      <div class="panel-head">

        <div>

          <h2>🙏 Dízimo</h2>

          <p>
            10% calculado automaticamente sobre tudo que entrou.
          </p>

        </div>

        <strong style="
          font-size:1.35rem;
        ">
          ${money(totals.dizimo)}
        </strong>

      </div>

      <div style="
        display:grid;
        grid-template-columns:
        repeat(auto-fit,minmax(180px,1fr));
        gap:12px;
        margin-top:15px;
      ">

        <div style="
          padding:15px;
          border-radius:14px;
          background:#f8fafc;
        ">

          <small>
            Total de entradas
          </small>

          <strong style="
            display:block;
            margin-top:5px;
            font-size:1.15rem;
          ">
            ${money(totals.entradas)}
          </strong>

        </div>

        <div style="
          padding:15px;
          border-radius:14px;
          background:#f8fafc;
        ">

          <small>
            Dízimo (10%)
          </small>

          <strong style="
            display:block;
            margin-top:5px;
            font-size:1.15rem;
          ">
            ${money(totals.dizimo)}
          </strong>

        </div>

        <div style="
          padding:15px;
          border-radius:14px;
          background:#f8fafc;
        ">

          <small>
            Entrada após dízimo
          </small>

          <strong style="
            display:block;
            margin-top:5px;
            font-size:1.15rem;
          ">
            ${money(
              totals.entradas -
              totals.dizimo
            )}
          </strong>

        </div>

      </div>

      <div style="
        margin-top:15px;
        padding:12px;
        border-radius:12px;
        background:#f1f5f9;
      ">

        <label style="
          display:flex;
          align-items:center;
          gap:10px;
          cursor:pointer;
        ">

          <input
            type="checkbox"
            id="titheToggle"
            ${state.titheEnabled ? "checked" : ""}
          >

          <span>
            Calcular dízimo automaticamente
          </span>

        </label>

      </div>

    `;

    $("titheToggle")
      ?.addEventListener(
        "change",
        event => {

          state.titheEnabled =
            event.target.checked;

          save();

          render();

        }
      );

  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  function renderDashboard() {

    const totals =
      getTotals();

    const progresso =
      Math.min(
        100,
        (totals.poupado / GOAL) * 100
      );

    if ($("saldo"))
      $("saldo").textContent =
        money(totals.saldo);

    if ($("entradas"))
      $("entradas").textContent =
        money(totals.entradas);

    if ($("despesas"))
      $("despesas").textContent =
        money(totals.despesas);

    if ($("poupado"))
      $("poupado").textContent =
        money(totals.poupado);

    if ($("comprometido"))
      $("comprometido").textContent =
        totals.comprometido.toFixed(0) +
        "%";

    if ($("savingTotal"))
      $("savingTotal").textContent =
        money(totals.poupado);

    if ($("saveBar"))
      $("saveBar").style.width =
        progresso + "%";

    if ($("goalBar"))
      $("goalBar").style.width =
        progresso + "%";

    if ($("goalPercent"))
      $("goalPercent").textContent =
        progresso.toFixed(0) +
        "% da meta atingida";

    if ($("saveText"))
      $("saveText").textContent =
        "Meta mensal: " +
        money(GOAL) +
        " • Poupado: " +
        money(totals.poupado);

    if ($("insight")) {

      if (totals.saldo < 0) {

        $("insight").textContent =
          "⚠️ Atenção: suas despesas estão maiores que o valor disponível após o dízimo.";

      }

      else if (
        totals.poupado >= GOAL
      ) {

        $("insight").textContent =
          "🎉 Parabéns! Sua meta de poupança foi atingida.";

      }

      else {

        $("insight").textContent =
          "💡 Faltam " +
          money(
            GOAL -
            totals.poupado
          ) +
          " para atingir sua meta.";

      }

    }

    renderCategories();
    renderRecent();
    renderTithePanel();

  }

  // =========================================================
  // CATEGORIAS
  // =========================================================

  function renderCategories() {

    const container =
      $("categories");

    if (!container)
      return;

    const categorias = {};

    getMonthEntries()
      .filter(item =>
        item.type === "despesa"
      )
      .forEach(item => {

        const categoria =
          item.category ||
          "Outros";

        categorias[categoria] =
          (categorias[categoria] || 0) +
          Number(item.amount || 0);

      });

    const lista =
      Object.entries(categorias)
        .sort(
          (a, b) =>
            b[1] - a[1]
        );

    if (!lista.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma despesa cadastrada neste mês.
        </div>`;

      return;

    }

    const maior =
      lista[0][1] || 1;

    container.innerHTML =
      lista
        .map(
          ([categoria, valor]) => {

            const percentual =
              (valor / maior) * 100;

            return `

              <div class="category-row">

                <div>

                  <span>
                    ${escapeHTML(
                      categoria
                    )}
                  </span>

                  <b>
                    ${money(valor)}
                  </b>

                </div>

                <div class="category-track">

                  <i
                    style="
                      width:${percentual}%;
                    ">
                  </i>

                </div>

              </div>

            `;

          }
        )
        .join("");

  }

  // =========================================================
  // LANÇAMENTOS
  // =========================================================

  function renderRecent() {

    const lista =
      [...getMonthEntries()]
        .sort(
          (a, b) =>
            String(b.date)
              .localeCompare(
                String(a.date)
              )
        );

    if ($("recent")) {

      $("recent").innerHTML =
        lista
          .slice(0, 8)
          .map(item => {

            const sinal =
              item.type === "entrada"
                ? "+"
                : "-";

            return `

              <div class="item">

                <div>

                  <strong>
                    ${escapeHTML(
                      item.desc
                    )}
                  </strong>

                  <small>

                    ${formatDate(
                      item.date
                    )}

                    •

                    ${escapeHTML(
                      item.category ||
                      "Outros"
                    )}

                  </small>

                </div>

                <div
                  class="${item.type}"
                >

                  ${sinal}
                  ${money(item.amount)}

                  <button
                    class="iconbtn"
                    data-del="${item.id}"
                    title="Excluir"
                  >
                    🗑️
                  </button>

                </div>

              </div>

            `;

          })
          .join("") ||

        `<div class="empty">
          Nenhum lançamento neste mês.
        </div>`;

    }

    if ($("allList")) {

      $("allList").innerHTML =
        lista
          .map(item => {

            const sinal =
              item.type === "entrada"
                ? "+"
                : "-";

            return `

              <div class="item">

                <div>

                  <strong>
                    ${escapeHTML(
                      item.desc
                    )}
                  </strong>

                  <small>

                    ${formatDate(
                      item.date
                    )}

                    •

                    ${escapeHTML(
                      item.category ||
                      "Outros"
                    )}

                  </small>

                </div>

                <div
                  class="${item.type}"
                >

                  ${sinal}
                  ${money(item.amount)}

                  <button
                    class="iconbtn"
                    data-del="${item.id}"
                    title="Excluir"
                  >
                    🗑️
                  </button>

                </div>

              </div>

            `;

          })
          .join("") ||

        `<div class="empty">
          Nenhum lançamento cadastrado.
        </div>`;

    }

  }

  // =========================================================
  // POUPANÇA
  // =========================================================

  function renderSavings() {

    const total =
      state.savings
        .filter(item =>
          String(item.date || "")
            .slice(0, 7) ===
          getMonth()
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),
          0
        );

    const percentual =
      Math.min(
        100,
        (total / GOAL) * 100
      );

    if ($("savingTotal"))
      $("savingTotal").textContent =
        money(total);

    if ($("goalPercent"))
      $("goalPercent").textContent =
        percentual.toFixed(0) +
        "% da meta atingida";

    if ($("goalBar"))
      $("goalBar").style.width =
        percentual + "%";

  }

  // =========================================================
  // METAS
  // =========================================================

  function renderGoals() {

    const container =
      $("goals");

    if (!container)
      return;

    if (!state.goals.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma meta criada.
        </div>`;

      return;

    }

    container.innerHTML =
      state.goals
        .map(meta => {

          const objetivo =
            Number(meta.target) || 1;

          const atual =
            Number(meta.current) || 0;

          const percentual =
            Math.min(
              100,
              (atual / objetivo) * 100
            );

          return `

            <div class="goal-card">

              <div class="panel-head">

                <div>

                  <strong>
                    ${escapeHTML(
                      meta.name
                    )}
                  </strong>

                  <small>

                    ${money(atual)}
                    de
                    ${money(objetivo)}

                  </small>

                </div>

                <button
                  class="iconbtn"
                  data-goaldel="${meta.id}"
                >
                  🗑️
                </button>

              </div>

              <div class="bar">

                <i
                  style="
                    width:${percentual}%;
                  ">
                </i>

              </div>

              <small>
                ${percentual.toFixed(0)}%
                concluído
              </small>

            </div>

          `;

        })
        .join("");

  }

  // =========================================================
  // CONTAS
  // =========================================================

  function renderAccounts() {

    const container =
      $("accounts");

    if (!container)
      return;

    if (!state.accounts.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma conta cadastrada.
        </div>`;

      return;

    }

    container.innerHTML =
      state.accounts
        .map(
          conta => `

            <div class="entity">

              <div>

                <strong>
                  ${escapeHTML(
                    conta.name
                  )}
                </strong>

                <small>

                  ${escapeHTML(
                    conta.bank || ""
                  )}

                  •

                  ${escapeHTML(
                    conta.type || ""
                  )}

                </small>

              </div>

              <strong>
                ${money(conta.amount)}
              </strong>

              <button
                class="iconbtn"
                data-entitydel="accounts"
                data-id="${conta.id}"
              >
                🗑️
              </button>

            </div>

          `
        )
        .join("");

  }

  // =========================================================
  // CARTÕES
  // =========================================================

  function renderCards() {

    const container =
      $("cardsList");

    if (!container)
      return;

    if (!state.cards.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhum cartão cadastrado.
        </div>`;

      return;

    }

    container.innerHTML =
      state.cards
        .map(
          cartao => `

            <div class="entity">

              <div>

                <strong>
                  ${escapeHTML(
                    cartao.name
                  )}
                </strong>

                <small>

                  ${escapeHTML(
                    cartao.bank || ""
                  )}

                  •

                  Limite:
                  ${money(
                    cartao.amount
                  )}

                  •

                  Vencimento:
                  ${escapeHTML(
                    cartao.due || ""
                  )}

                </small>

              </div>

              <button
                class="iconbtn"
                data-entitydel="cards"
                data-id="${cartao.id}"
              >
                🗑️
              </button>

            </div>

          `
        )
        .join("");

  }

  // =========================================================
  // DÍVIDAS
  // =========================================================

  function renderDebts() {

    const container =
      $("debtsList");

    if (!container)
      return;

    if (!state.debts.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma dívida cadastrada.
        </div>`;

      return;

    }

    container.innerHTML =
      state.debts
        .map(
          divida => `

            <div class="entity">

              <div>

                <strong>
                  ${escapeHTML(
                    divida.name
                  )}
                </strong>

                <small>

                  Vencimento:
                  ${escapeHTML(
                    divida.due || ""
                  )}

                  •

                  Parcelas:
                  ${escapeHTML(
                    divida.installments ||
                    ""
                  )}

                </small>

              </div>

              <strong>
                ${money(
                  divida.amount
                )}
              </strong>

              <button
                class="iconbtn"
                data-entitydel="debts"
                data-id="${divida.id}"
              >
                🗑️
              </button>

            </div>

          `
        )
        .join("");

  }

  // =========================================================
  // INVESTIMENTOS
  // =========================================================

  function renderInvestments() {

    const container =
      $("investmentsList");

    if (!container)
      return;

    if (!state.investments.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhum investimento cadastrado.
        </div>`;

      return;

    }

    container.innerHTML =
      state.investments
        .map(
          investimento => `

            <div class="entity">

              <div>

                <strong>
                  ${escapeHTML(
                    investimento.name
                  )}
                </strong>

                <small>

                  ${escapeHTML(
                    investimento.type ||
                    ""
                  )}

                  •

                  ${escapeHTML(
                    investimento.institution ||
                    ""
                  )}

                </small>

              </div>

              <strong>
                ${money(
                  investimento.amount
                )}
              </strong>

              <button
                class="iconbtn"
                data-entitydel="investments"
                data-id="${investimento.id}"
              >
                🗑️
              </button>

            </div>

          `
        )
        .join("");

  }

  // =========================================================
  // ORÇAMENTO
  // =========================================================

  function renderBudgets() {

    const container =
      $("budgetList");

    if (!container)
      return;

    const lista =
      state.budgets.filter(
        item =>
          item.month ===
          getMonth()
      );

    if (!lista.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhum orçamento definido para este mês.
        </div>`;

      return;

    }

    container.innerHTML =
      lista
        .map(
          orcamento => {

            const gasto =
              getMonthEntries()
                .filter(
                  item =>
                    item.type ===
                      "despesa" &&
                    item.category ===
                      orcamento.category
                )
                .reduce(
                  (total, item) =>
                    total +
                    Number(
                      item.amount || 0
                    ),
                  0
                );

            const percentual =
              orcamento.amount
                ? Math.min(
                    100,
                    (gasto /
                      orcamento.amount) *
                      100
                  )
                : 0;

            return `

              <div class="entity">

                <div>

                  <strong>
                    ${escapeHTML(
                      orcamento.category
                    )}
                  </strong>

                  <small>

                    Orçamento:
                    ${money(
                      orcamento.amount
                    )}

                    •

                    Gasto:
                    ${money(gasto)}

                  </small>

                  <div class="bar mini">

                    <i
                      style="
                        width:${percentual}%;
                      ">
                    </i>

                  </div>

                </div>

                <strong>
                  ${percentual.toFixed(0)}%
                </strong>

              </div>

            `;

          }
        )
        .join("");

  }

  // =========================================================
  // RENDER GERAL
  // =========================================================

  function render() {

    renderDashboard();
    renderSavings();
    renderGoals();
    renderAccounts();
    renderCards();
    renderDebts();
    renderInvestments();
    renderBudgets();

  }

  // =========================================================
  // MODAL
  // =========================================================

  function openModal(
    tipo,
    subtipo = ""
  ) {

    if (!$("modal"))
      return;

    $("formKind").value =
      tipo;

    $("type").value =
      subtipo;

    let titulo =
      "Novo registro";

    if (tipo === "entry") {

      titulo =
        subtipo === "entrada"
          ? "Nova entrada"
          : "Nova despesa";

    }

    if (tipo === "account")
      titulo =
        "Nova conta";

    if (tipo === "card")
      titulo =
        "Novo cartão";

    if (tipo === "debt")
      titulo =
        "Nova dívida";

    if (tipo === "investment")
      titulo =
        "Novo investimento";

    if (tipo === "goal")
      titulo =
        "Nova meta";

    if (tipo === "budget")
      titulo =
        "Novo orçamento";

    $("modalTitle").textContent =
      titulo;

    let html = "";

    // =======================================================
    // ENTRADA / DESPESA
    // =======================================================

    if (tipo === "entry") {

      const categorias =
        subtipo === "entrada"

          ? [
              "Salário",
              "Renda extra",
              "Investimentos",
              "Outros"
            ]

          : [
              "Moradia",
              "Alimentação",
              "Transporte",
              "Cartão",
              "Saúde",
              "Academia",
              "Lazer",
              "Contas",
              "Dívidas",
              "Outros"
            ];

      html = `

        <label>

          Data

          <input
            id="f_date"
            type="date"
            value="${today()}"
            required
          >

        </label>

        <label>

          Descrição

          <input
            id="f_name"
            placeholder="Ex.: Salário"
            required
          >

        </label>

        <label>

          Categoria

          <select
            id="f_category"
          >

            ${categorias
              .map(
                categoria =>
                  `<option>
                    ${categoria}
                  </option>`
              )
              .join("")}

          </select>

        </label>

        <label>

          Valor

          <input
            id="f_amount"
            type="number"
            min="0.01"
            step="0.01"
            required
          >

        </label>

        <label>

          Forma de pagamento

          <input
            id="f_method"
            placeholder="Pix, débito, crédito..."
          >

        </label>

        <label>

          Observação

          <textarea
            id="f_note"
          ></textarea>

        </label>

      `;

    }

    // =======================================================
    // CONTA
    // =======================================================

    if (tipo === "account") {

      html = `

        <label>

          Nome da conta

          <input
            id="f_name"
            placeholder="Ex.: Nubank"
            required
          >

        </label>

        <label>

          Banco

          <input
            id="f_bank"
          >

        </label>

        <label>

          Tipo

          <input
            id="f_type"
            placeholder="Corrente ou poupança"
          >

        </label>

        <label>

          Saldo

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required
          >

        </label>

      `;

    }

    // =======================================================
    // CARTÃO
    // =======================================================

    if (tipo === "card") {

      html = `

        <label>

          Nome do cartão

          <input
            id="f_name"
            placeholder="Ex.: Nubank"
            required
          >

        </label>

        <label>

          Banco

          <input
            id="f_bank"
          >

        </label>

        <label>

          Limite

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required
          >

        </label>

        <label>

          Vencimento

          <input
            id="f_due"
            placeholder="Dia 10"
          >

        </label>

      `;

    }

    // =======================================================
    // DÍVIDA
    // =======================================================

    if (tipo === "debt") {

      html = `

        <label>

          Nome da dívida

          <input
            id="f_name"
            placeholder="Ex.: Empréstimo"
            required
          >

        </label>

        <label>

          Valor

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required
          >

        </label>

        <label>

          Vencimento

          <input
            id="f_due"
          >

        </label>

        <label>

          Parcelas

          <input
            id="f_installments"
            type="number"
            min="1"
          >

        </label>

      `;

    }

    // =======================================================
    // INVESTIMENTO
    // =======================================================

    if (tipo === "investment") {

      html = `

        <label>

          Investimento

          <input
            id="f_name"
            placeholder="Ex.: Tesouro Direto"
            required
          >

        </label>

        <label>

          Tipo

          <input
            id="f_type"
          >

        </label>

        <label>

          Instituição

          <input
            id="f_institution"
          >

        </label>

        <label>

          Valor atual

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required
          >

        </label>

      `;

    }

    // =======================================================
    // META
    // =======================================================

    if (tipo === "goal") {

      html = `

        <label>

          Nome da meta

          <input
            id="f_name"
            placeholder="Ex.: Reserva de emergência"
            required
          >

        </label>

        <label>

          Valor da meta

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required
          >

        </label>

        <label>

          Já acumulado

          <input
            id="f_current"
            type="number"
            step="0.01"
            value="0"
          >

        </label>

      `;

    }

    // =======================================================
    // ORÇAMENTO
    // =======================================================

    if (tipo === "budget") {

      const categorias = [

        "Moradia",
        "Alimentação",
        "Transporte",
        "Cartão",
        "Saúde",
        "Academia",
        "Lazer",
        "Contas",
        "Dívidas",
        "Outros"

      ];

      html = `

        <label>

          Categoria

          <select
            id="f_category"
          >

            ${categorias
              .map(
                categoria =>
                  `<option>
                    ${categoria}
                  </option>`
              )
              .join("")}

          </select>

        </label>

        <label>

          Valor mensal

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required
          >

        </label>

      `;

    }

    $("dynamicFields").innerHTML =
      html;

    $("modal")
      .classList
      .remove("hidden");

  }

  function closeModal() {

    if ($("modal")) {

      $("modal")
        .classList
        .add("hidden");

    }

  }

  // =========================================================
  // BOTÕES
  // =========================================================

  $("newEntry")?.addEventListener(
    "click",
    () =>
      openModal(
        "entry",
        "entrada"
      )
  );

  $("newExpense")?.addEventListener(
    "click",
    () =>
      openModal(
        "entry",
        "despesa"
      )
  );

  $("addAccount")?.addEventListener(
    "click",
    () =>
      openModal(
        "account"
      )
  );

  $("addCard")?.addEventListener(
    "click",
    () =>
      openModal(
        "card"
      )
  );

  $("addDebt")?.addEventListener(
    "click",
    () =>
      openModal(
        "debt"
      )
  );

  $("addInvestment")?.addEventListener(
    "click",
    () =>
      openModal(
        "investment"
      )
  );

  $("addGoal")?.addEventListener(
    "click",
    () =>
      openModal(
        "goal"
      )
  );

  $("setBudget")?.addEventListener(
    "click",
    () =>
      openModal(
        "budget"
      )
  );

  $("closeModal")?.addEventListener(
    "click",
    closeModal
  );

  $("monthFilter")?.addEventListener(
    "change",
    render
  );

  // =========================================================
  // POUPANÇA
  // =========================================================

  $("addSaving")?.addEventListener(
    "click",
    () => {

      const resposta =
        prompt(
          "Quanto você poupou?",
          "100"
        );

      if (
        resposta === null
      )
        return;

      const valor =
        Number(
          resposta
            .replace(",", ".")
        );

      if (
        !valor ||
        valor <= 0
      )
        return;

      state.savings.push({

        id:
          Date.now(),

        date:
          today(),

        amount:
          valor

      });

      save();

      render();

    }
  );

  // =========================================================
  // FORMULÁRIO
  // =========================================================

  $("form")?.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const tipo =
        $("formKind").value;

      const id =
        Date.now();

      const nome =
        $("f_name")
          ?.value
          ?.trim() ||
        "";

      const valor =
        Number(
          $("f_amount")
            ?.value ||
          0
        );

      // =====================================================
      // LANÇAMENTO
      // =====================================================

      if (
        tipo === "entry"
      ) {

        const tipoLancamento =
          $("type").value;

        state.entries.push({

          id,

          type:
            tipoLancamento,

          date:
            $("f_date").value,

          desc:
            nome,

          category:
            $("f_category").value,

          amount:
            valor,

          method:
            $("f_method")
              ?.value
              ?.trim() ||
            "",

          note:
            $("f_note")
              ?.value
              ?.trim() ||
            ""

        });

      }

      // =====================================================
      // CONTA
      // =====================================================

      else if (
        tipo === "account"
      ) {

        state.accounts.push({

          id,

          name:
            nome,

          bank:
            $("f_bank")
              .value
              .trim(),

          type:
            $("f_type")
              .value
              .trim(),

          amount:
            valor

        });

      }

      // =====================================================
      // CARTÃO
      // =====================================================

      else if (
        tipo === "card"
      ) {

        state.cards.push({

          id,

          name:
            nome,

          bank:
            $("f_bank")
              .value
              .trim(),

          amount:
            valor,

          due:
            $("f_due")
              .value
              .trim()

        });

      }

      // =====================================================
      // DÍVIDA
      // =====================================================

      else if (
        tipo === "debt"
      ) {

        state.debts.push({

          id,

          name:
            nome,

          amount:
            valor,

          due:
            $("f_due")
              .value
              .trim(),

          installments:
            $("f_installments")
              .value

        });

      }

      // =====================================================
      // INVESTIMENTO
      // =====================================================

      else if (
        tipo === "investment"
      ) {

        state.investments.push({

          id,

          name:
            nome,

          type:
            $("f_type")
              .value
              .trim(),

          institution:
            $("f_institution")
              .value
              .trim(),

          amount:
            valor

        });

      }

      // =====================================================
      // META
      // =====================================================

      else if (
        tipo === "goal"
      ) {

        state.goals.push({

          id,

          name:
            nome,

          target:
            valor,

          current:
            Number(
              $("f_current")
                .value ||
              0
            )

        });

      }

      // =====================================================
      // ORÇAMENTO
      // =====================================================

      else if (
        tipo === "budget"
      ) {

        state.budgets.push({

          id,

          month:
            getMonth(),

          category:
            $("f_category")
              .value,

          amount:
            valor

        });

      }

      save();

      closeModal();

      render();

    }
  );

  // =========================================================
  // EXCLUSÃO
  // =========================================================

  document.addEventListener(
    "click",
    event => {

      // -----------------------------------------------------
      // LANÇAMENTO
      // -----------------------------------------------------

      const lancamento =
        event.target.closest(
          "[data-del]"
        );

      if (lancamento) {

        state.entries =
          state.entries.filter(
            item =>
              String(item.id) !==
              String(
                lancamento.dataset.del
              )
          );

        save();

        render();

        return;

      }

      // -----------------------------------------------------
      // META
      // -----------------------------------------------------

      const meta =
        event.target.closest(
          "[data-goaldel]"
        );

      if (meta) {

        state.goals =
          state.goals.filter(
            item =>
              String(item.id) !==
              String(
                meta.dataset.goaldel
              )
          );

        save();

        render();

        return;

      }

      // -----------------------------------------------------
      // ENTIDADES
      // -----------------------------------------------------

      const entidade =
        event.target.closest(
          "[data-entitydel]"
        );

      if (entidade) {

        const grupo =
          entidade.dataset.entitydel;

        if (
          state[grupo]
        ) {

          state[grupo] =
            state[grupo].filter(
              item =>
                String(item.id) !==
                String(
                  entidade.dataset.id
                )
            );

          save();

          render();

        }

      }

    }
  );

  // =========================================================
  // EXPORTAR CSV
  // =========================================================

  $("exportBtn")?.addEventListener(
    "click",
    () => {

      const linhas = [

        [
          "Tipo",
          "Data",
          "Descrição",
          "Categoria",
          "Valor",
          "Forma",
          "Observação"
        ],

        ...state.entries.map(
          item => [

            item.type,
            item.date,
            item.desc,
            item.category,
            item.amount,
            item.method,
            item.note

          ]
        )

      ];

      const csv =
        linhas
          .map(
            linha =>
              linha
                .map(
                  valor =>
                    `"${String(
                      valor ?? ""
                    ).replaceAll(
                      '"',
                      '""'
                    )}"`
                )
                .join(";")
          )
          .join("\n");

      const blob =
        new Blob(
          [
            "\ufeff" +
            csv
          ],
          {
            type:
              "text/csv;charset=utf-8"
          }
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        URL.createObjectURL(
          blob
        );

      link.download =
        "financas-pro.csv";

      document.body.appendChild(
        link
      );

      link.click();

      link.remove();

    }
  );

  // =========================================================
  // LIMPAR DADOS
  // =========================================================

  $("clearBtn")?.addEventListener(
    "click",
    () => {

      if (
        !confirm(
          "Tem certeza que deseja apagar todos os dados?"
        )
      )
        return;

      state = {

        entries: [],
        savings: [],
        goals: [],
        accounts: [],
        cards: [],
        debts: [],
        investments: [],
        budgets: [],

        // mantém o dízimo ligado
        titheEnabled: true

      };

      save();

      render();

    }
  );

  // =========================================================
  // INICIALIZAÇÃO
  // =========================================================

  if ($("monthFilter")) {

    $("monthFilter").value =
      today().slice(0, 7);

  }

  render();

  abrirPagina(
    "dashboard"
  );

})();

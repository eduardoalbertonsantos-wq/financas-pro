(() => {

  "use strict";

  // =========================================================
  // FINANCEIRO EDUARDO E VIVIANE
  // APP PRINCIPAL
  // =========================================================

  const KEY = "financas-pro-dados-v1";

  const GOAL = 1200;

  const TITHE_RATE = 0.10;


  // =========================================================
  // UTILIDADES
  // =========================================================

  const $ = id =>
    document.getElementById(id);


  function money(value) {

    return (Number(value) || 0).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL"
      }
    );

  }


  function today() {

    const d = new Date();

    const year =
      d.getFullYear();

    const month =
      String(d.getMonth() + 1)
        .padStart(2, "0");

    const day =
      String(d.getDate())
        .padStart(2, "0");

    return `${year}-${month}-${day}`;

  }


  function currentMonth() {

    return today().slice(0, 7);

  }


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

    if (!date)
      return "";

    const parts =
      String(date).split("-");

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


  function uid(prefix = "id") {

    return (
      prefix +
      "_" +
      Date.now() +
      "_" +
      Math.random()
        .toString(36)
        .slice(2, 8)
    );

  }


  // =========================================================
  // CARREGAMENTO DOS DADOS
  // =========================================================

  let state = {};

  try {

    state = JSON.parse(
      localStorage.getItem(KEY) || "{}"
    );

  } catch (error) {

    console.error(
      "Erro ao carregar dados:",
      error
    );

    state = {};

  }


  state.entries =
    Array.isArray(state.entries)
      ? state.entries
      : [];


  state.savings =
    Array.isArray(state.savings)
      ? state.savings
      : [];


  state.goals =
    Array.isArray(state.goals)
      ? state.goals
      : [];


  state.accounts =
    Array.isArray(state.accounts)
      ? state.accounts
      : [];


  state.cards =
    Array.isArray(state.cards)
      ? state.cards
      : [];


  state.debts =
    Array.isArray(state.debts)
      ? state.debts
      : [];


  state.investments =
    Array.isArray(state.investments)
      ? state.investments
      : [];


  state.budgets =
    Array.isArray(state.budgets)
      ? state.budgets
      : [];


  state.bankConnections =
    Array.isArray(state.bankConnections)
      ? state.bankConnections
      : [];


  state.titheEnabled =
    typeof state.titheEnabled === "boolean"
      ? state.titheEnabled
      : true;


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
      currentMonth()
    );

  }


  function getMonthEntries() {

    return state.entries.filter(
      item =>
        String(item.date || "")
          .slice(0, 7) === getMonth()
    );

  }


  // =========================================================
  // DÍZIMO
  // =========================================================

  function getTithe(entries) {

    if (!state.titheEnabled)
      return 0;

    const lista =
      entries || getMonthEntries();

    const entradas =
      lista
        .filter(
          item =>
            item.type === "entrada"
        )
        .reduce(
          (total, item) =>
            total +
            Number(item.amount || 0),
          0
        );

    return entradas * TITHE_RATE;

  }


  // =========================================================
  // TOTAIS
  // =========================================================

  function getTotals() {

    const entries =
      getMonthEntries();


    const entradas =
      entries
        .filter(
          item =>
            item.type === "entrada"
        )
        .reduce(
          (total, item) =>
            total +
            Number(item.amount || 0),
          0
        );


    const despesas =
      entries
        .filter(
          item =>
            item.type === "despesa"
        )
        .reduce(
          (total, item) =>
            total +
            Number(item.amount || 0),
          0
        );


    const dizimo =
      getTithe(entries);


    const poupado =
      state.savings
        .filter(
          item =>
            String(item.date || "")
              .slice(0, 7) ===
            getMonth()
        )
        .reduce(
          (total, item) =>
            total +
            Number(item.amount || 0),
          0
        );


    const saldo =
      entradas -
      dizimo -
      despesas;


    const comprometido =
      entradas > 0
        ? Math.min(
            100,
            (
              (
                despesas +
                dizimo
              ) /
              entradas
            ) * 100
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
      .forEach(
        pagina =>
          pagina.classList.remove(
            "active"
          )
      );


    const pagina =
      document.getElementById(page);


    if (!pagina)
      return;


    pagina.classList.add(
      "active"
    );


    document
      .querySelectorAll(
        "nav button[data-page]"
      )
      .forEach(
        botao =>
          botao.classList.toggle(
            "selected",
            botao.dataset.page === page
          )
      );


    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }


  window.abrirPagina =
    abrirPagina;


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


      abrirPagina(
        botao.dataset.page
      );

    }
  );


  // =========================================================
  // DASHBOARD
  // =========================================================

  function renderDashboard() {

    const totals =
      getTotals();


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
        totals.comprometido
          .toFixed(0) +
        "%";


    if ($("savingTotal"))
      $("savingTotal").textContent =
        money(totals.poupado);


    const progresso =
      Math.min(
        100,
        (
          totals.poupado /
          GOAL
        ) * 100
      );


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
          "⚠️ Atenção: o saldo está negativo após despesas e dízimo.";

      }

      else if (
        totals.poupado >= GOAL
      ) {

        $("insight").textContent =
          "🎉 Meta mensal de poupança atingida!";

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
  // DÍZIMO
  // =========================================================

  function renderTithePanel() {

    const panel =
      $("tithePanel");


    if (!panel)
      return;


    const totals =
      getTotals();


    panel.innerHTML = `

      <div class="panel-head">

        <div>

          <h2>🙏 Dízimo</h2>

          <p>
            10% calculado automaticamente
            sobre tudo que entrou.
          </p>

        </div>

        <strong
          style="
            font-size:1.35rem;
          "
        >
          ${money(totals.dizimo)}
        </strong>

      </div>


      <div
        style="
          display:grid;
          grid-template-columns:
          repeat(auto-fit,minmax(180px,1fr));
          gap:12px;
          margin-top:15px;
        "
      >

        <div
          style="
            padding:15px;
            border-radius:14px;
            background:#f8fafc;
          "
        >

          <small>
            Total de entradas
          </small>

          <strong
            style="
              display:block;
              margin-top:5px;
            "
          >
            ${money(totals.entradas)}
          </strong>

        </div>


        <div
          style="
            padding:15px;
            border-radius:14px;
            background:#f8fafc;
          "
        >

          <small>
            Dízimo 10%
          </small>

          <strong
            style="
              display:block;
              margin-top:5px;
            "
          >
            ${money(totals.dizimo)}
          </strong>

        </div>


        <div
          style="
            padding:15px;
            border-radius:14px;
            background:#f8fafc;
          "
        >

          <small>
            Após dízimo
          </small>

          <strong
            style="
              display:block;
              margin-top:5px;
            "
          >
            ${money(
              totals.entradas -
              totals.dizimo
            )}
          </strong>

        </div>

      </div>


      <div
        style="
          margin-top:15px;
          padding:12px;
          border-radius:12px;
          background:#f1f5f9;
        "
      >

        <label
          style="
            display:flex;
            align-items:center;
            gap:10px;
          "
        >

          <input
            type="checkbox"
            id="titheToggle"
            ${
              state.titheEnabled
                ? "checked"
                : ""
            }
          >

          Calcular dízimo automaticamente

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
  // CATEGORIAS
  // =========================================================

  function renderCategories() {

    const container =
      $("categories");


    if (!container)
      return;


    const categorias = {};


    getMonthEntries()
      .filter(
        item =>
          item.type === "despesa"
      )
      .forEach(
        item => {

          const categoria =
            item.category ||
            "Outros";


          categorias[categoria] =
            (
              categorias[categoria] ||
              0
            ) +
            Number(
              item.amount || 0
            );

        }
      );


    const lista =
      Object.entries(categorias)
        .sort(
          (a, b) =>
            b[1] - a[1]
        );


    if (!lista.length) {

      container.innerHTML =
        `
        <div class="empty">
          Nenhuma despesa cadastrada neste mês.
        </div>
        `;

      return;

    }


    const maior =
      lista[0][1] || 1;


    container.innerHTML =
      lista
        .map(
          ([categoria, valor]) => {

            const percentual =
              (
                valor /
                maior
              ) * 100;


            return `

              <div
                class="category-row"
              >

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


                <div
                  class="category-track"
                >

                  <i
                    style="
                      width:
                      ${percentual}%;
                    "
                  ></i>

                </div>

              </div>

            `;

          }
        )
        .join("");

  }


  // =========================================================
  // LANÇAMENTOS RECENTES
  // =========================================================

  function renderRecent() {

    const container =
      $("recent");


    if (!container)
      return;


    const lista =
      [...getMonthEntries()]
        .sort(
          (a, b) =>
            String(b.date)
              .localeCompare(
                String(a.date)
              )
        );


    if (!lista.length) {

      container.innerHTML =
        `
        <div class="empty">
          Nenhum lançamento neste mês.
        </div>
        `;

      return;

    }


    container.innerHTML =
      lista
        .slice(0, 8)
        .map(
          item => {

            const entrada =
              item.type === "entrada";


            return `

              <div
                class="list-item"
              >

                <div>

                  <strong>
                    ${escapeHTML(
                      item.description ||
                      "Sem descrição"
                    )}
                  </strong>

                  <small>
                    ${formatDate(
                      item.date
                    )}
                    •
                    ${
                      escapeHTML(
                        item.category ||
                        ""
                      )
                    }
                  </small>

                </div>


                <strong>
                  ${
                    entrada
                      ? "+"
                      : "-"
                  }
                  ${money(
                    item.amount
                  )}
                </strong>

              </div>

            `;

          }
        )
        .join("");

  }


  // =========================================================
  // TODOS OS LANÇAMENTOS
  // =========================================================

  function renderAllEntries() {

    const container =
      $("allList");


    if (!container)
      return;


    const lista =
      [...state.entries]
        .sort(
          (a, b) =>
            String(b.date)
              .localeCompare(
                String(a.date)
              )
        );


    if (!lista.length) {

      container.innerHTML =
        `
        <div class="empty">
          Nenhum lançamento cadastrado.
        </div>
        `;

      return;

    }


    container.innerHTML =
      lista
        .map(
          item => {

            const entrada =
              item.type === "entrada";


            return `

              <div
                class="list-item"
              >

                <div>

                  <strong>
                    ${escapeHTML(
                      item.description ||
                      "Sem descrição"
                    )}
                  </strong>

                  <small>
                    ${formatDate(
                      item.date
                    )}
                    •
                    ${escapeHTML(
                      item.category ||
                      ""
                    )}
                  </small>

                </div>


                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                  "
                >

                  <strong>
                    ${
                      entrada
                        ? "+"
                        : "-"
                    }
                    ${money(
                      item.amount
                    )}
                  </strong>

                  <button
                    type="button"
                    class="danger"
                    data-delete-entry="${item.id}"
                  >
                    🗑️
                  </button>

                </div>

              </div>

            `;

          }
        )
        .join("");

  }


  // =========================================================
  // POUPANÇA
  // =========================================================

  function renderSavings() {

    const total =
      state.savings
        .filter(
          item =>
            String(item.date)
              .slice(0, 7) ===
            getMonth()
        )
        .reduce(
          (sum, item) =>
            sum +
            Number(item.amount || 0),
          0
        );


    if ($("savingTotal"))
      $("savingTotal").textContent =
        money(total);


    const percentual =
      Math.min(
        100,
        (total / GOAL) * 100
      );


    if ($("goalBar"))
      $("goalBar").style.width =
        percentual + "%";


    if ($("goalPercent"))
      $("goalPercent").textContent =
        percentual.toFixed(0) +
        "% da meta atingida";

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
        `
        <div class="empty">
          Nenhuma meta cadastrada.
        </div>
        `;

      return;

    }


    container.innerHTML =
      state.goals
        .map(
          goal => {

            const valor =
              Number(
                goal.current || 0
              );

            const alvo =
              Number(
                goal.target || 0
              );


            const percentual =
              alvo > 0
                ? Math.min(
                    100,
                    (
                      valor /
                      alvo
                    ) * 100
                  )
                : 0;


            return `

              <div
                class="goal-item"
              >

                <div>

                  <strong>
                    ${escapeHTML(
                      goal.name
                    )}
                  </strong>

                  <small>
                    ${money(valor)}
                    de
                    ${money(alvo)}
                  </small>

                </div>


                <div
                  class="bar"
                >

                  <i
                    style="
                      width:
                      ${percentual}%;
                    "
                  ></i>

                </div>


                <button
                  type="button"
                  class="danger"
                  data-delete-goal="${goal.id}"
                >
                  Excluir
                </button>

              </div>

            `;

          }
        )
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
        `
        <div class="empty">
          Nenhuma conta cadastrada.
        </div>
        `;

      return;

    }


    container.innerHTML =
      state.accounts
        .map(
          account => `

            <div
              class="entity-card"
            >

              <div>

                <strong>
                  ${escapeHTML(
                    account.name
                  )}
                </strong>

                <span>
                  ${escapeHTML(
                    account.bank ||
                    "Conta"
                  )}
                </span>

              </div>


              <div>

                <strong>
                  ${money(
                    account.balance
                  )}
                </strong>

                <button
                  type="button"
                  class="danger"
                  data-delete-account="${account.id}"
                >
                  🗑️
                </button>

              </div>

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
        `
        <div class="empty">
          Nenhum cartão cadastrado.
        </div>
        `;

      return;

    }


    container.innerHTML =
      state.cards
        .map(
          card => `

            <div
              class="entity-card"
            >

              <div>

                <strong>
                  ${escapeHTML(
                    card.name
                  )}
                </strong>

                <span>
                  ${escapeHTML(
                    card.bank ||
                    "Cartão"
                  )}
                </span>

              </div>


              <div>

                <strong>
                  Limite:
                  ${money(
                    card.limit
                  )}
                </strong>

                <button
                  type="button"
                  class="danger"
                  data-delete-card="${card.id}"
                >
                  🗑️
                </button>

              </div>

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
        `
        <div class="empty">
          Nenhuma dívida cadastrada.
        </div>
        `;

      return;

    }


    container.innerHTML =
      state.debts
        .map(
          debt => `

            <div
              class="entity-card"
            >

              <div>

                <strong>
                  ${escapeHTML(
                    debt.name
                  )}
                </strong>

                <span>
                  Vencimento:
                  ${formatDate(
                    debt.dueDate
                  )}
                </span>

              </div>


              <div>

                <strong>
                  ${money(
                    debt.amount
                  )}
                </strong>

                <button
                  type="button"
                  class="danger"
                  data-delete-debt="${debt.id}"
                >
                  🗑️
                </button>

              </div>

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
        `
        <div class="empty">
          Nenhum investimento cadastrado.
        </div>
        `;

      return;

    }


    container.innerHTML =
      state.investments
        .map(
          item => `

            <div
              class="entity-card"
            >

              <div>

                <strong>
                  ${escapeHTML(
                    item.name
                  )}
                </strong>

                <span>
                  ${escapeHTML(
                    item.type ||
                    "Investimento"
                  )}
                </span>

              </div>


              <div>

                <strong>
                  ${money(
                    item.amount
                  )}
                </strong>

                <button
                  type="button"
                  class="danger"
                  data-delete-investment="${item.id}"
                >
                  🗑️
                </button>

              </div>

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


    if (!state.budgets.length) {

      container.innerHTML =
        `
        <div class="empty">
          Nenhum orçamento cadastrado.
        </div>
        `;

      return;

    }


    container.innerHTML =
      state.budgets
        .map(
          item => `

            <div
              class="entity-card"
            >

              <div>

                <strong>
                  ${escapeHTML(
                    item.category
                  )}
                </strong>

                <span>
                  Orçamento mensal
                </span>

              </div>


              <div>

                <strong>
                  ${money(
                    item.amount
                  )}
                </strong>

                <button
                  type="button"
                  class="danger"
                  data-delete-budget="${item.id}"
                >
                  🗑️
                </button>

              </div>

            </div>

          `
        )
        .join("");

  }


  // =========================================================
  // OPEN FINANCE
  // =========================================================

  function renderOpenFinance() {

    const balance =
      $("openFinanceBalance");


    if (balance) {

      const saldo =
        state.bankConnections
          .filter(
            item =>
              item.connected
          )
          .reduce(
            (total, item) =>
              total +
              Number(
                item.balance || 0
              ),
            0
          );


      balance.textContent =
        money(saldo);

    }


    const status =
      $("openFinanceStatus");


    if (status) {

      if (
        state.bankConnections.length
      ) {

        status.textContent =
          "🔄 Contas preparadas para sincronização.";

      } else {

        status.textContent =
          "Nenhuma conta bancária conectada.";

      }

    }

  }


  // =========================================================
  // MODAL
  // =========================================================

  function openModal(
    kind,
    type = ""
  ) {

    const modal =
      $("modal");


    const fields =
      $("dynamicFields");


    if (!modal || !fields)
      return;


    $("formKind").value =
      kind;


    $("type").value =
      type;


    let title =
      "Novo registro";


    if (
      kind === "entry"
    ) {

      title =
        type === "entrada"
          ? "Nova entrada"
          : "Nova despesa";

    }


    if (
      kind === "saving"
    )
      title =
        "Registrar poupança";


    if (
      kind === "goal"
    )
      title =
        "Nova meta";


    if (
      kind === "account"
    )
      title =
        "Nova conta";


    if (
      kind === "card"
    )
      title =
        "Novo cartão";


    if (
      kind === "debt"
    )
      title =
        "Nova dívida";


    if (
      kind === "investment"
    )
      title =
        "Novo investimento";


    if (
      kind === "budget"
    )
      title =
        "Novo orçamento";


    $("modalTitle").textContent =
      title;


    if (
      kind === "entry"
    ) {

      fields.innerHTML = `

        <label>
          Descrição
          <input
            name="description"
            required
            placeholder="Ex.: Salário"
          >
        </label>

        <label>
          Valor
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
          >
        </label>

        <label>
          Data
          <input
            name="date"
            type="date"
            value="${today()}"
            required
          >
        </label>

        <label>
          Categoria
          <input
            name="category"
            placeholder="Ex.: Salário, Mercado, Casa"
          >
        </label>

        <label>
          Conta
          <select name="account">
            <option value="">
              Não informar
            </option>
            ${state.accounts
              .map(
                account => `
                  <option value="${escapeHTML(
                    account.id
                  )}">
                    ${escapeHTML(
                      account.name
                    )}
                  </option>
                `
              )
              .join("")}
          </select>
        </label>

      `;

    }


    else if (
      kind === "saving"
    ) {

      fields.innerHTML = `

        <label>
          Valor poupado
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
          >
        </label>

        <label>
          Data
          <input
            name="date"
            type="date"
            value="${today()}"
            required
          >
        </label>

        <label>
          Observação
          <input
            name="description"
            placeholder="Ex.: Reserva mensal"
          >
        </label>

      `;

    }


    else if (
      kind === "goal"
    ) {

      fields.innerHTML = `

        <label>
          Nome da meta
          <input
            name="name"
            required
            placeholder="Ex.: Viagem"
          >
        </label>

        <label>
          Valor da meta
          <input
            name="target"
            type="number"
            step="0.01"
            min="0"
            required
          >
        </label>

        <label>
          Valor já acumulado
          <input
            name="current"
            type="number"
            step="0.01"
            min="0"
            value="0"
          >
        </label>

      `;

    }


    else if (
      kind === "account"
    ) {

      fields.innerHTML = `

        <label>
          Nome da conta
          <input
            name="name"
            required
            placeholder="Ex.: Nubank Eduardo"
          >
        </label>

        <label>
          Banco
          <select name="bank">
            <option>Nubank</option>
            <option>Banco do Brasil</option>
            <option>Santander</option>
            <option>Outro</option>
          </select>
        </label>

        <label>
          Saldo inicial
          <input
            name="balance"
            type="number"
            step="0.01"
            value="0"
          >
        </label>

      `;

    }


    else if (
      kind === "card"
    ) {

      fields.innerHTML = `

        <label>
          Nome do cartão
          <input
            name="name"
            required
            placeholder="Ex.: Nubank Eduardo"
          >
        </label>

        <label>
          Banco
          <select name="bank">
            <option>Nubank</option>
            <option>Banco do Brasil</option>
            <option>Santander</option>
            <option>Outro</option>
          </select>
        </label>

        <label>
          Limite
          <input
            name="limit"
            type="number"
            step="0.01"
            value="0"
          >
        </label>

      `;

    }


    else if (
      kind === "debt"
    ) {

      fields.innerHTML = `

        <label>
          Nome da dívida
          <input
            name="name"
            required
          >
        </label>

        <label>
          Valor
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
          >
        </label>

        <label>
          Vencimento
          <input
            name="dueDate"
            type="date"
          >
        </label>

      `;

    }


    else if (
      kind === "investment"
    ) {

      fields.innerHTML = `

        <label>
          Investimento
          <input
            name="name"
            required
            placeholder="Ex.: Tesouro Direto"
          >
        </label>

        <label>
          Tipo
          <input
            name="type"
            placeholder="Renda fixa, ações..."
          >
        </label>

        <label>
          Valor
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
          >
        </label>

      `;

    }


    else if (
      kind === "budget"
    ) {

      fields.innerHTML = `

        <label>
          Categoria
          <input
            name="category"
            required
            placeholder="Ex.: Mercado"
          >
        </label>

        <label>
          Valor mensal
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
          >
        </label>

      `;

    }


    modal.classList.remove(
      "hidden"
    );

  }


  function closeModal() {

    $("modal")
      ?.classList.add(
        "hidden"
      );

  }


  // =========================================================
  // FORMULÁRIO
  // =========================================================

  $("form")
    ?.addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const form =
          event.target;


        const data =
          Object.fromEntries(
            new FormData(form)
          );


        const kind =
          $("formKind").value;


        const type =
          $("type").value;


        if (
          kind === "entry"
        ) {

          state.entries.push({

            id:
              uid("entry"),

            description:
              data.description,

            amount:
              Number(
                data.amount
              ),

            date:
              data.date,

            category:
              data.category ||
              "Outros",

            account:
              data.account ||
              "",

            type

          });

        }


        else if (
          kind === "saving"
        ) {

          state.savings.push({

            id:
              uid("saving"),

            amount:
              Number(
                data.amount
              ),

            date:
              data.date,

            description:
              data.description ||
              ""

          });

        }


        else if (
          kind === "goal"
        ) {

          state.goals.push({

            id:
              uid("goal"),

            name:
              data.name,

            target:
              Number(
                data.target
              ),

            current:
              Number(
                data.current || 0
              )

          });

        }


        else if (
          kind === "account"
        ) {

          state.accounts.push({

            id:
              uid("account"),

            name:
              data.name,

            bank:
              data.bank,

            balance:
              Number(
                data.balance || 0
              ),

            source:
              "manual"

          });

        }


        else if (
          kind === "card"
        ) {

          state.cards.push({

            id:
              uid("card"),

            name:
              data.name,

            bank:
              data.bank,

            limit:
              Number(
                data.limit || 0
              ),

            source:
              "manual"

          });

        }


        else if (
          kind === "debt"
        ) {

          state.debts.push({

            id:
              uid("debt"),

            name:
              data.name,

            amount:
              Number(
                data.amount
              ),

            dueDate:
              data.dueDate ||
              ""

          });

        }


        else if (
          kind === "investment"
        ) {

          state.investments.push({

            id:
              uid("investment"),

            name:
              data.name,

            type:
              data.type ||
              "",

            amount:
              Number(
                data.amount
              )

          });

        }


        else if (
          kind === "budget"
        ) {

          state.budgets.push({

            id:
              uid("budget"),

            category:
              data.category,

            amount:
              Number(
                data.amount
              )

          });

        }


        save();

        closeModal();

        render();

      }
    );


  // =========================================================
  // BOTÕES DE NOVO REGISTRO
  // =========================================================

  $("newEntry")
    ?.addEventListener(
      "click",
      () =>
        openModal(
          "entry",
          "entrada"
        )
    );


  $("newExpense")
    ?.addEventListener(
      "click",
      () =>
        openModal(
          "entry",
          "despesa"
        )
    );


  $("addSaving")
    ?.addEventListener(
      "click",
      () =>
        openModal(
          "saving"
        )
    );


  $("addGoal")
    ?.addEventListener(
      "click",
      () =>
        openModal(
          "goal"
        )
    );


  $("addAccount")
    ?.addEventListener(
      "click",
      () =>
        openModal(
          "account"
        )
    );


  $("addCard")
    ?.addEventListener(
      "click",
      () =>
        openModal(
          "card"
        )
    );


  $("addDebt")
    ?.addEventListener(
      "click",
      () =>
        openModal(
          "debt"
        )
    );


  $("addInvestment")
    ?.addEventListener(
      "click",
      () =>
        openModal(
          "investment"
        )
    );


  $("setBudget")
    ?.addEventListener(
      "click",
      () =>
        openModal(
          "budget"
        )
    );


  $("closeModal")
    ?.addEventListener(
      "click",
      closeModal
    );


  $("cancelModal")
    ?.addEventListener(
      "click",
      closeModal
    );


  $("modal")
    ?.addEventListener(
      "click",
      event => {

        if (
          event.target.id ===
          "modal"
        ) {

          closeModal();

        }

      }
    );


  // =========================================================
  // EXCLUSÕES
  // =========================================================

  document.addEventListener(
    "click",
    event => {

      const entry =
        event.target.closest(
          "[data-delete-entry]"
        );


      if (entry) {

        const id =
          entry.dataset.deleteEntry;


        if (
          confirm(
            "Excluir este lançamento?"
          )
        ) {

          state.entries =
            state.entries.filter(
              item =>
                item.id !== id
            );

          save();

          render();

        }

        return;

      }


      const goal =
        event.target.closest(
          "[data-delete-goal]"
        );


      if (goal) {

        if (
          confirm(
            "Excluir esta meta?"
          )
        ) {

          state.goals =
            state.goals.filter(
              item =>
                item.id !==
                goal.dataset.deleteGoal
            );

          save();

          render();

        }

        return;

      }


      const account =
        event.target.closest(
          "[data-delete-account]"
        );


      if (account) {

        if (
          confirm(
            "Excluir esta conta?"
          )
        ) {

          state.accounts =
            state.accounts.filter(
              item =>
                item.id !==
                account.dataset.deleteAccount
            );

          save();

          render();

        }

        return;

      }


      const card =
        event.target.closest(
          "[data-delete-card]"
        );


      if (card) {

        if (
          confirm(
            "Excluir este cartão?"
          )
        ) {

          state.cards =
            state.cards.filter(
              item =>
                item.id !==
                card.dataset.deleteCard
            );

          save();

          render();

        }

        return;

      }


      const debt =
        event.target.closest(
          "[data-delete-debt]"
        );


      if (debt) {

        if (
          confirm(
            "Excluir esta dívida?"
          )
        ) {

          state.debts =
            state.debts.filter(
              item =>
                item.id !==
                debt.dataset.deleteDebt
            );

          save();

          render();

        }

        return;

      }


      const investment =
        event.target.closest(
          "[data-delete-investment]"
        );


      if (investment) {

        if (
          confirm(
            "Excluir este investimento?"
          )
        ) {

          state.investments =
            state.investments.filter(
              item =>
                item.id !==
                investment.dataset
                  .deleteInvestment
            );

          save();

          render();

        }

        return;

      }


      const budget =
        event.target.closest(
          "[data-delete-budget]"
        );


      if (budget) {

        if (
          confirm(
            "Excluir este orçamento?"
          )
        ) {

          state.budgets =
            state.budgets.filter(
              item =>
                item.id !==
                budget.dataset
                  .deleteBudget
            );

          save();

          render();

        }

      }

    }
  );


  // =========================================================
  // MÊS
  // =========================================================

  $("monthFilter")
    ?.addEventListener(
      "change",
      render
    );


  if ($("monthFilter")) {

    $("monthFilter").value =
      currentMonth();

  }


  // =========================================================
  // EXPORTAR CSV
  // =========================================================

  $("exportBtn")
    ?.addEventListener(
      "click",
      () => {

        if (!state.entries.length) {

          alert(
            "Não existem lançamentos para exportar."
          );

          return;

        }


        const linhas = [
          [
            "Data",
            "Descrição",
            "Tipo",
            "Categoria",
            "Valor"
          ]
        ];


        state.entries.forEach(
          item => {

            linhas.push([
              item.date,
              item.description,
              item.type,
              item.category,
              Number(
                item.amount || 0
              )
                .toFixed(2)
                .replace(".", ",")
            ]);

          }
        );


        const csv =
          linhas
            .map(
              linha =>
                linha
                  .map(
                    valor =>
                      `"${String(valor)
                        .replace(
                          /"/g,
                          '""'
                        )}"`
                  )
                  .join(";")
            )
            .join("\n");


        const blob =
          new Blob(
            [
              "\uFEFF" +
              csv
            ],
            {
              type:
                "text/csv;charset=utf-8;"
            }
          );


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        link.href =
          url;


        link.download =
          "financeiro-eduardo-viviane.csv";


        link.click();


        URL.revokeObjectURL(
          url
        );

      }
    );


  // =========================================================
  // LIMPAR DADOS
  // =========================================================

  $("clearBtn")
    ?.addEventListener(
      "click",
      () => {

        const confirmacao =
          prompt(
            "Digite APAGAR para excluir todos os dados deste aparelho:"
          );


        if (
          confirmacao !==
          "APAGAR"
        )
          return;


        localStorage.removeItem(
          KEY
        );


        location.reload();

      }
    );


  // =========================================================
  // OPEN FINANCE
  // =========================================================

  $("connectOpenFinanceBtn")
    ?.addEventListener(
      "click",
      () => {

        alert(
          "🏦 Open Finance\n\n" +
          "A estrutura está pronta.\n\n" +
          "A conexão real será ativada quando o Connect Token da Pluggy estiver configurado no backend."
        );

      }
    );


  $("syncOpenFinanceBtn")
    ?.addEventListener(
      "click",
      () => {

        alert(
          "🔄 Sincronização\n\n" +
          "Nenhuma conexão bancária real está ativa ainda."
        );

      }
    );


  // =========================================================
  // RENDER GERAL
  // =========================================================

  function render() {

    renderDashboard();

    renderAllEntries();

    renderSavings();

    renderGoals();

    renderAccounts();

    renderCards();

    renderDebts();

    renderInvestments();

    renderBudgets();

    renderOpenFinance();

  }


  // =========================================================
  // INICIALIZAÇÃO
  // =========================================================

  save();

  render();


})();

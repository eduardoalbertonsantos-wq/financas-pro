(() => {
  const KEY = "financas-pro-dados-v1";
  const GOAL = 1200;

  const $ = id => document.getElementById(id);

  const money = value =>
    (Number(value) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const today = () =>
    new Date().toISOString().slice(0, 10);

  // =====================================================
  // CARREGAR DADOS EXISTENTES
  // =====================================================

  let state = {};

  try {
    state = JSON.parse(
      localStorage.getItem(KEY) || "{}"
    );
  } catch (erro) {
    state = {};
  }

  state.entries = state.entries || [];
  state.savings = state.savings || [];
  state.goals = state.goals || [];
  state.accounts = state.accounts || [];
  state.cards = state.cards || [];
  state.debts = state.debts || [];
  state.investments = state.investments || [];
  state.budgets = state.budgets || [];

  function save() {
    localStorage.setItem(
      KEY,
      JSON.stringify(state)
    );
  }

  // =====================================================
  // MÊS ATUAL
  // =====================================================

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

  // =====================================================
  // TOTAIS
  // =====================================================

  function getTotals() {

    const entries = getMonthEntries();

    const entradas = entries
      .filter(item => item.type === "entrada")
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

    const despesas = entries
      .filter(item => item.type === "despesa")
      .reduce(
        (total, item) =>
          total + Number(item.amount || 0),
        0
      );

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

    const saldo =
      entradas - despesas;

    const comprometido =
      entradas > 0
        ? Math.min(
            100,
            (despesas / entradas) * 100
          )
        : 0;

    return {
      entradas,
      despesas,
      poupado,
      saldo,
      comprometido
    };
  }

  // =====================================================
  // SEGURANÇA HTML
  // =====================================================

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

  // =====================================================
  // DATA
  // =====================================================

  function formatDate(date) {

    if (!date) return "";

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

  // =====================================================
  // NAVEGAÇÃO
  // =====================================================

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
  }

  window.abrirPagina =
    abrirPagina;

  // =====================================================
  // MENU
  // =====================================================

  document.addEventListener(
    "click",
    event => {

      const botao =
        event.target.closest(
          "button[data-page]"
        );

      if (!botao) return;

      event.preventDefault();
      event.stopPropagation();

      abrirPagina(
        botao.dataset.page
      );

    }
  );

  // =====================================================
  // DASHBOARD
  // =====================================================

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
        totals.comprometido.toFixed(0) + "%";

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
          "⚠️ Atenção: suas despesas estão maiores que suas entradas.";

      } else if (
        totals.poupado >= GOAL
      ) {

        $("insight").textContent =
          "🎉 Parabéns! Sua meta de poupança foi atingida.";

      } else {

        $("insight").textContent =
          "💡 Faltam " +
          money(
            GOAL - totals.poupado
          ) +
          " para atingir sua meta.";

      }

    }

    renderCategories();
    renderRecent();
  }

  // =====================================================
  // CATEGORIAS
  // =====================================================

  function renderCategories() {

    const container =
      $("categories");

    if (!container) return;

    const categorias = {};

    getMonthEntries()
      .filter(
        item =>
          item.type === "despesa"
      )
      .forEach(item => {

        const categoria =
          item.category || "Outros";

        categorias[categoria] =
          (categorias[categoria] || 0) +
          Number(item.amount || 0);

      });

    const lista =
      Object.entries(categorias)
        .sort(
          (a, b) => b[1] - a[1]
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
      lista.map(
        ([categoria, valor]) => {

          const percentual =
            (valor / maior) * 100;

          return `
            <div class="category-row">

              <div>
                <span>
                  ${escapeHTML(categoria)}
                </span>

                <b>
                  ${money(valor)}
                </b>
              </div>

              <div class="category-track">
                <i
                  style="width:${percentual}%">
                </i>
              </div>

            </div>
          `;

        }
      ).join("");
  }

  // =====================================================
  // LANÇAMENTOS
  // =====================================================

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
                  class="${item.type}">
                  ${sinal}
                  ${money(item.amount)}

                  <button
                    class="iconbtn"
                    data-del="${item.id}">
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
                  class="${item.type}">
                  ${sinal}
                  ${money(item.amount)}

                  <button
                    class="iconbtn"
                    data-del="${item.id}">
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

  // =====================================================
  // POUPANÇA
  // =====================================================

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

  // =====================================================
  // METAS
  // =====================================================

  function renderGoals() {

    const container =
      $("goals");

    if (!container) return;

    if (!state.goals.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma meta criada.
        </div>`;

      return;
    }

    container.innerHTML =
      state.goals.map(meta => {

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
                data-goaldel="${meta.id}">
                🗑️
              </button>

            </div>

            <div class="bar">
              <i
                style="width:${percentual}%">
              </i>
            </div>

            <small>
              ${percentual.toFixed(0)}%
              concluído
            </small>

          </div>
        `;

      }).join("");
  }

  // =====================================================
  // CONTAS
  // =====================================================

  function renderAccounts() {

    const container =
      $("accounts");

    if (!container) return;

    if (!state.accounts.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma conta cadastrada.
        </div>`;

      return;
    }

    container.innerHTML =
      state.accounts.map(
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
              data-id="${conta.id}">
              🗑️
            </button>

          </div>

        `
      ).join("");
  }

  // =====================================================
  // CARTÕES
  // =====================================================

  function renderCards() {

    const container =
      $("cardsList");

    if (!container) return;

    if (!state.cards.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhum cartão cadastrado.
        </div>`;

      return;
    }

    container.innerHTML =
      state.cards.map(
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
                • Limite:
                ${money(
                  cartao.amount
                )}
                • Vencimento:
                ${escapeHTML(
                  cartao.due || ""
                )}
              </small>

            </div>

            <button
              class="iconbtn"
              data-entitydel="cards"
              data-id="${cartao.id}">
              🗑️
            </button>

          </div>

        `
      ).join("");
  }

  // =====================================================
  // DÍVIDAS
  // =====================================================

  function renderDebts() {

    const container =
      $("debtsList");

    if (!container) return;

    if (!state.debts.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma dívida cadastrada.
        </div>`;

      return;
    }

    container.innerHTML =
      state.debts.map(
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
                • Parcelas:
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
              data-id="${divida.id}">
              🗑️
            </button>

          </div>

        `
      ).join("");
  }

  // =====================================================
  // INVESTIMENTOS
  // =====================================================

  function renderInvestments() {

    const container =
      $("investmentsList");

    if (!container) return;

    if (!state.investments.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhum investimento cadastrado.
        </div>`;

      return;
    }

    container.innerHTML =
      state.investments.map(
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
              data-id="${investimento.id}">
              🗑️
            </button>

          </div>

        `
      ).join("");
  }

  // =====================================================
  // ORÇAMENTO
  // =====================================================

  function renderBudgets() {

    const container =
      $("budgetList");

    if (!container) return;

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
      lista.map(
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
                  • Gasto:
                  ${money(gasto)}
                </small>

                <div class="bar mini">
                  <i
                    style="width:${percentual}%">
                  </i>
                </div>

              </div>

              <strong>
                ${percentual.toFixed(0)}%
              </strong>

            </div>
          `;

        }
      ).join("");
  }

  // =====================================================
  // RENDER
  // =====================================================

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

  // =====================================================
  // MODAL
  // =====================================================

  function openModal(tipo, subtipo = "") {

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
      titulo = "Nova conta";

    if (tipo === "card")
      titulo = "Novo cartão";

    if (tipo === "debt")
      titulo = "Nova dívida";

    if (tipo === "investment")
      titulo = "Novo investimento";

    if (tipo === "goal")
      titulo = "Nova meta";

    if (tipo === "budget")
      titulo = "Novo orçamento";

    $("modalTitle").textContent =
      titulo;

    let html = "";

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
            required>
        </label>

        <label>
          Descrição
          <input
            id="f_name"
            placeholder="Ex.: Salário"
            required>
        </label>

        <label>
          Categoria

          <select id="f_category">

            ${categorias.map(
              categoria =>
                `<option>
                  ${categoria}
                </option>`
            ).join("")}

          </select>

        </label>

        <label>
          Valor

          <input
            id="f_amount"
            type="number"
            min="0.01"
            step="0.01"
            required>
        </label>

        <label>
          Forma de pagamento

          <input
            id="f_method"
            placeholder="Pix, débito, crédito...">
        </label>

        <label>
          Observação

          <textarea
            id="f_note"></textarea>
        </label>

      `;
    }

    if (tipo === "account") {

      html = `

        <label>
          Nome da conta

          <input
            id="f_name"
            placeholder="Ex.: Nubank"
            required>
        </label>

        <label>
          Banco

          <input
            id="f_bank">
        </label>

        <label>
          Tipo

          <input
            id="f_type"
            placeholder="Corrente ou poupança">
        </label>

        <label>
          Saldo

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required>
        </label>

      `;
    }

    if (tipo === "card") {

      html = `

        <label>
          Nome do cartão

          <input
            id="f_name"
            placeholder="Ex.: Nubank"
            required>
        </label>

        <label>
          Banco

          <input
            id="f_bank">
        </label>

        <label>
          Limite

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required>
        </label>

        <label>
          Vencimento

          <input
            id="f_due"
            placeholder="Dia 10">
        </label>

      `;
    }

    if (tipo === "debt") {

      html = `

        <label>
          Nome da dívida

          <input
            id="f_name"
            placeholder="Ex.: Empréstimo"
            required>
        </label>

        <label>
          Valor

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required>
        </label>

        <label>
          Vencimento

          <input
            id="f_due">
        </label>

        <label>
          Parcelas

          <input
            id="f_installments"
            type="number"
            min="1">
        </label>

      `;
    }

    if (tipo === "investment") {

      html = `

        <label>
          Investimento

          <input
            id="f_name"
            placeholder="Ex.: Tesouro Direto"
            required>
        </label>

        <label>
          Tipo

          <input
            id="f_type">
        </label>

        <label>
          Instituição

          <input
            id="f_institution">
        </label>

        <label>
          Valor atual

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required>
        </label>

      `;
    }

    if (tipo === "goal") {

      html = `

        <label>
          Nome da meta

          <input
            id="f_name"
            placeholder="Ex.: Reserva de emergência"
            required>
        </label>

        <label>
          Valor da meta

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required>
        </label>

        <label>
          Já acumulado

          <input
            id="f_current"
            type="number"
            step="0.01"
            value="0">
        </label>

      `;
    }

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

          <select id="f_category">

            ${categorias.map(
              categoria =>
                `<option>
                  ${categoria}
                </option>`
            ).join("")}

          </select>

        </label>

        <label>
          Valor mensal

          <input
            id="f_amount"
            type="number"
            step="0.01"
            required>
        </label>

      `;
    }

    $("dynamicFields").innerHTML =
      html;

    $("modal").classList.remove(
      "hidden"
    );
  }

  function closeModal() {

    if ($("modal"))
      $("modal").classList.add(
        "hidden"
      );

  }

  // =====================================================
  // BOTÕES
  // =====================================================

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
      openModal("account")
  );

  $("addCard")?.addEventListener(
    "click",
    () =>
      openModal("card")
  );

  $("addDebt")?.addEventListener(
    "click",
    () =>
      openModal("debt")
  );

  $("addInvestment")?.addEventListener(
    "click",
    () =>
      openModal("investment")
  );

  $("addGoal")?.addEventListener(
    "click",
    () =>
      openModal("goal")
  );

  $("setBudget")?.addEventListener(
    "click",
    () =>
      openModal("budget")
  );

  $("closeModal")?.addEventListener(
    "click",
    closeModal
  );

  $("monthFilter")?.addEventListener(
    "change",
    render
  );

  // =====================================================
  // POUPANÇA
  // =====================================================

  $("addSaving")?.addEventListener(
    "click",
    () => {

      const resposta =
        prompt(
          "Quanto você poupou?",
          "100"
        );

      if (resposta === null)
        return;

      const valor =
        Number(
          resposta.replace(
            ",",
            "."
          )
        );

      if (
        !valor ||
        valor <= 0
      )
        return;

      state.savings.push({

        id: Date.now(),

        date: today(),

        amount: valor

      });

      save();

      render();

    }
  );

  // =====================================================
  // FORMULÁRIO
  // =====================================================

  $("form")?.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const tipo =
        $("formKind").value;

      const id =
        Date.now();

      const nome =
        $("f_name")?.value?.trim() ||
        "";

      const valor =
        Number(
          $("f_amount")?.value ||
          0
        );

      if (tipo === "entry") {

        state.entries.push({

          id,

          type:
            $("type").value,

          date:
            $("f_date").value,

          desc:
            nome,

          category:
            $("f_category").value,

          amount:
            valor,

          method:
            $("f_method")?.value?.trim() ||
            "",

          note:
            $("f_note")?.value?.trim() ||
            ""

        });

      }

      else if (
        tipo === "account"
      ) {

        state.accounts.push({

          id,

          name:
            nome,

          bank:
            $("f_bank").value.trim(),

          type:
            $("f_type").value.trim(),

          amount:
            valor

        });

      }

      else if (
        tipo === "card"
      ) {

        state.cards.push({

          id,

          name:
            nome,

          bank:
            $("f_bank").value.trim(),

          amount:
            valor,

          due:
            $("f_due").value.trim()

        });

      }

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
            $("f_due").value.trim(),

          installments:
            $("f_installments").value

        });

      }

      else if (
        tipo === "investment"
      ) {

        state.investments.push({

          id,

          name:
            nome,

          type:
            $("f_type").value.trim(),

          institution:
            $("f_institution")
              .value
              .trim(),

          amount:
            valor

        });

      }

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
              $("f_current").value ||
              0
            )

        });

      }

      else if (
        tipo === "budget"
      ) {

        state.budgets.push({

          id,

          month:
            getMonth(),

          category:
            $("f_category").value,

          amount:
            valor

        });

      }

      save();

      closeModal();

      render();

    }
  );

  // =====================================================
  // EXCLUIR
  // =====================================================

  document.addEventListener(
    "click",
    event => {

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

      const entidade =
        event.target.closest(
          "[data-entitydel]"
        );

      if (entidade) {

        const grupo =
          entidade.dataset.entitydel;

        if (state[grupo]) {

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

  // =====================================================
  // EXPORTAR CSV
  // =====================================================

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
          ["\ufeff" + csv],
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

  // =====================================================
  // LIMPAR DADOS
  // =====================================================

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
        budgets: []

      };

      save();

      render();

    }
  );

  // =====================================================
  // INICIAR
  // =====================================================

  if ($("monthFilter")) {

    $("monthFilter").value =
      today().slice(0, 7);

  }

  render();

  abrirPagina("dashboard");

})();

(() => {
  const KEY = "financas-pro-dados-v1";
  const GOAL = 1200;

  const money = n =>
    (Number(n) || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const today = () => new Date().toISOString().slice(0, 10);
  const $ = id => document.getElementById(id);

  let state = JSON.parse(localStorage.getItem(KEY) || "{}");

  Object.assign(state, {
    entries: state.entries || [],
    savings: state.savings || [],
    goals: state.goals || [],
    accounts: state.accounts || [],
    cards: state.cards || [],
    debts: state.debts || [],
    investments: state.investments || [],
    budgets: state.budgets || []
  });

  const save = () => {
    localStorage.setItem(KEY, JSON.stringify(state));
  };

  function currentMonth() {
    return $("monthFilter")?.value || today().slice(0, 7);
  }

  function monthEntries() {
    return state.entries.filter(
      x => String(x.date || "").slice(0, 7) === currentMonth()
    );
  }

  function totals() {
    const entries = monthEntries();

    const entradas = entries
      .filter(x => x.type === "entrada")
      .reduce((total, x) => total + Number(x.amount || 0), 0);

    const despesas = entries
      .filter(x => x.type === "despesa")
      .reduce((total, x) => total + Number(x.amount || 0), 0);

    const poupado = state.savings
      .filter(
        x => String(x.date || "").slice(0, 7) === currentMonth()
      )
      .reduce((total, x) => total + Number(x.amount || 0), 0);

    return {
      entradas,
      despesas,
      poupado,
      saldo: entradas - despesas,
      comprometido: entradas
        ? Math.min(100, (despesas / entradas) * 100)
        : 0
    };
  }

  function escapeHTML(text) {
    return String(text ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function formatDate(date) {
    if (!date) return "";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  // =====================================================
  // NAVEGAÇÃO PRINCIPAL
  // =====================================================

  function abrirPagina(page) {

    document.querySelectorAll(".page").forEach(pagina => {
      pagina.classList.remove("active");
    });

    const pagina = $(page);

    if (pagina) {
      pagina.classList.add("active");
    }

    document
      .querySelectorAll("[data-page]")
      .forEach(botao => {

        botao.classList.toggle(
          "selected",
          botao.dataset.page === page
        );

      });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  window.abrirPagina = abrirPagina;

  // =====================================================
  // DASHBOARD
  // =====================================================

  function renderDashboard() {

    const t = totals();

    const porcentagem = Math.min(
      100,
      (t.poupado / GOAL) * 100
    );

    if ($("saldo"))
      $("saldo").textContent = money(t.saldo);

    if ($("entradas"))
      $("entradas").textContent = money(t.entradas);

    if ($("despesas"))
      $("despesas").textContent = money(t.despesas);

    if ($("poupado"))
      $("poupado").textContent = money(t.poupado);

    if ($("comprometido"))
      $("comprometido").textContent =
        `${t.comprometido.toFixed(0)}%`;

    if ($("savingTotal"))
      $("savingTotal").textContent =
        money(t.poupado);

    if ($("saveText")) {
      $("saveText").textContent =
        `Meta de poupança: ${money(GOAL)} • Acumulado no mês: ${money(t.poupado)}`;
    }

    if ($("saveBar"))
      $("saveBar").style.width =
        `${porcentagem}%`;

    if ($("goalPercent"))
      $("goalPercent").textContent =
        `${porcentagem.toFixed(0)}% da meta atingida`;

    if ($("insight")) {

      if (t.saldo < 0) {

        $("insight").textContent =
          "⚠️ Atenção: suas despesas estão maiores que suas entradas.";

      } else if (t.poupado >= GOAL) {

        $("insight").textContent =
          "🎉 Parabéns! Sua meta de poupança foi atingida.";

      } else {

        $("insight").textContent =
          `Faltam ${money(GOAL - t.poupado)} para atingir sua meta.`;

      }
    }

    renderCategories();
    renderRecent();
  }

  // =====================================================
  // CATEGORIAS
  // =====================================================

  function renderCategories() {

    const container = $("categories");

    if (!container) return;

    const categorias = {};

    monthEntries()
      .filter(x => x.type === "despesa")
      .forEach(x => {

        const categoria =
          x.category || "Outros";

        categorias[categoria] =
          (categorias[categoria] || 0) +
          Number(x.amount || 0);

      });

    const lista = Object.entries(categorias)
      .sort((a, b) => b[1] - a[1]);

    if (!lista.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma despesa cadastrada neste mês.
        </div>`;

      return;
    }

    const maior = lista[0][1] || 1;

    container.innerHTML = lista
      .map(([categoria, valor]) => {

        const porcentagem =
          (valor / maior) * 100;

        return `
          <div class="category-row">

            <div>
              <span>${escapeHTML(categoria)}</span>
              <b>${money(valor)}</b>
            </div>

            <div class="category-track">
              <i style="width:${porcentagem}%"></i>
            </div>

          </div>
        `;

      })
      .join("");
  }

  // =====================================================
  // LANÇAMENTOS
  // =====================================================

  function lancamentoHTML(item) {

    const sinal =
      item.type === "entrada"
        ? "+"
        : "-";

    return `
      <div class="item">

        <div>
          <strong>
            ${escapeHTML(item.desc)}
          </strong>

          <small>
            ${formatDate(item.date)}
            •
            ${escapeHTML(item.category || "Outros")}
            ${item.method
              ? " • " + escapeHTML(item.method)
              : ""}
          </small>
        </div>

        <div class="${item.type}">

          ${sinal} ${money(item.amount)}

          <button
            class="iconbtn"
            data-del="${item.id}">
            🗑️
          </button>

        </div>

      </div>
    `;
  }

  function renderRecent() {

    const lista = [...monthEntries()]
      .sort((a, b) =>
        String(b.date).localeCompare(
          String(a.date)
        )
      );

    if ($("recent")) {

      $("recent").innerHTML =
        lista
          .slice(0, 6)
          .map(lancamentoHTML)
          .join("") ||

        `<div class="empty">
          Nenhum lançamento neste mês.
        </div>`;
    }

    if ($("allList")) {

      $("allList").innerHTML =
        lista
          .map(lancamentoHTML)
          .join("") ||

        `<div class="empty">
          Nenhum lançamento cadastrado.
        </div>`;
    }
  }

  // =====================================================
  // METAS
  // =====================================================

  function renderGoals() {

    const container = $("goals");

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

        const alvo =
          Number(meta.target) || 1;

        const atual =
          Number(meta.current) || 0;

        const porcentagem =
          Math.min(
            100,
            (atual / alvo) * 100
          );

        return `
          <div class="goal-card">

            <div class="panel-head">

              <div>
                <strong>
                  ${escapeHTML(meta.name)}
                </strong>

                <small>
                  ${money(atual)}
                  de
                  ${money(alvo)}
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
                style="width:${porcentagem}%">
              </i>
            </div>

            <small>
              ${porcentagem.toFixed(0)}% concluído
            </small>

          </div>
        `;

      }).join("");
  }

  // =====================================================
  // CONTAS
  // =====================================================

  function renderAccounts() {

    const container = $("accounts");

    if (!container) return;

    if (!state.accounts.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma conta cadastrada.
        </div>`;

      return;
    }

    container.innerHTML =
      state.accounts.map(conta => {

        return `
          <div class="entity">

            <div>
              <strong>
                ${escapeHTML(conta.name)}
              </strong>

              <small>
                ${escapeHTML(conta.bank || "")}
                •
                ${escapeHTML(conta.type || "")}
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
        `;

      }).join("");
  }

  // =====================================================
  // CARTÕES
  // =====================================================

  function renderCards() {

    const container = $("cardsList");

    if (!container) return;

    if (!state.cards.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhum cartão cadastrado.
        </div>`;

      return;
    }

    container.innerHTML =
      state.cards.map(cartao => {

        return `
          <div class="entity">

            <div>

              <strong>
                ${escapeHTML(cartao.name)}
              </strong>

              <small>
                ${escapeHTML(cartao.bank || "")}
                • Limite:
                ${money(cartao.amount)}
                • Vencimento:
                ${escapeHTML(cartao.due || "")}
              </small>

            </div>

            <button
              class="iconbtn"
              data-entitydel="cards"
              data-id="${cartao.id}">
              🗑️
            </button>

          </div>
        `;

      }).join("");
  }

  // =====================================================
  // DÍVIDAS
  // =====================================================

  function renderDebts() {

    const container = $("debtsList");

    if (!container) return;

    if (!state.debts.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhuma dívida cadastrada.
        </div>`;

      return;
    }

    container.innerHTML =
      state.debts.map(divida => {

        return `
          <div class="entity">

            <div>

              <strong>
                ${escapeHTML(divida.name)}
              </strong>

              <small>
                Vencimento:
                ${escapeHTML(divida.due || "")}
                • Parcelas:
                ${escapeHTML(divida.installments || "")}
              </small>

            </div>

            <strong>
              ${money(divida.amount)}
            </strong>

            <button
              class="iconbtn"
              data-entitydel="debts"
              data-id="${divida.id}">
              🗑️
            </button>

          </div>
        `;

      }).join("");
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
      state.investments.map(inv => {

        return `
          <div class="entity">

            <div>

              <strong>
                ${escapeHTML(inv.name)}
              </strong>

              <small>
                ${escapeHTML(inv.type || "")}
                •
                ${escapeHTML(
                  inv.institution || ""
                )}
              </small>

            </div>

            <strong>
              ${money(inv.amount)}
            </strong>

            <button
              class="iconbtn"
              data-entitydel="investments"
              data-id="${inv.id}">
              🗑️
            </button>

          </div>
        `;

      }).join("");
  }

  // =====================================================
  // ORÇAMENTO
  // =====================================================

  function renderBudgets() {

    const container = $("budgetList");

    if (!container) return;

    const lista =
      state.budgets.filter(
        x => x.month === currentMonth()
      );

    if (!lista.length) {

      container.innerHTML =
        `<div class="empty">
          Nenhum orçamento definido para este mês.
        </div>`;

      return;
    }

    container.innerHTML =
      lista.map(orcamento => {

        const gasto =
          monthEntries()
            .filter(
              x =>
                x.type === "despesa" &&
                x.category === orcamento.category
            )
            .reduce(
              (total, x) =>
                total + Number(x.amount || 0),
              0
            );

        const porcentagem =
          orcamento.amount
            ? Math.min(
                100,
                (gasto / orcamento.amount) * 100
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
                ${money(orcamento.amount)}
                • Gasto:
                ${money(gasto)}
              </small>

              <div class="bar mini">
                <i
                  style="width:${porcentagem}%">
                </i>
              </div>

            </div>

            <strong>
              ${porcentagem.toFixed(0)}%
            </strong>

          </div>
        `;

      }).join("");
  }

  // =====================================================
  // RENDER GERAL
  // =====================================================

  function render() {

    renderDashboard();
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

    if (!$("modal")) return;

    $("formKind").value = tipo;
    $("type").value = subtipo;

    let titulo = "Novo registro";

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

    if ($("modalTitle"))
      $("modalTitle").textContent = titulo;

    let html = "";

    // -----------------------------------------------
    // LANÇAMENTO
    // -----------------------------------------------

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

            ${categorias.map(c =>
              `<option>${c}</option>`
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
            id="f_note">
          </textarea>
        </label>

      `;
    }

    // -----------------------------------------------
    // CONTA
    // -----------------------------------------------

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

          <input id="f_bank">
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

    // -----------------------------------------------
    // CARTÃO
    // -----------------------------------------------

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

          <input id="f_bank">
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

    // -----------------------------------------------
    // DÍVIDA
    // -----------------------------------------------

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

          <input id="f_due">
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

    // -----------------------------------------------
    // INVESTIMENTO
    // -----------------------------------------------

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

          <input id="f_type">
        </label>

        <label>
          Instituição

          <input id="f_institution">
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

    // -----------------------------------------------
    // META
    // -----------------------------------------------

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

    // -----------------------------------------------
    // ORÇAMENTO
    // -----------------------------------------------

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

            ${categorias.map(c =>
              `<option>${c}</option>`
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

    if ($("dynamicFields"))
      $("dynamicFields").innerHTML = html;

    $("modal").classList.remove("hidden");
  }

  function closeModal() {

    if ($("modal"))
      $("modal").classList.add("hidden");
  }

  // =====================================================
  // BOTÕES DO MENU
  // =====================================================

  document.addEventListener("click", event => {

    const botao =
      event.target.closest("[data-page]");

    if (!botao) return;

    event.preventDefault();

    abrirPagina(botao.dataset.page);
  });

  // =====================================================
  // NOVA ENTRADA
  // =====================================================

  $("newEntry")?.addEventListener(
    "click",
    () => openModal(
      "entry",
      "entrada"
    )
  );

  // =====================================================
  // NOVA DESPESA
  // =====================================================

  $("newExpense")?.addEventListener(
    "click",
    () => openModal(
      "entry",
      "despesa"
    )
  );

  // =====================================================
  // CONTAS
  // =====================================================

  $("addAccount")?.addEventListener(
    "click",
    () => openModal("account")
  );

  // =====================================================
  // CARTÕES
  // =====================================================

  $("addCard")?.addEventListener(
    "click",
    () => openModal("card")
  );

  // =====================================================
  // DÍVIDAS
  // =====================================================

  $("addDebt")?.addEventListener(
    "click",
    () => openModal("debt")
  );

  // =====================================================
  // INVESTIMENTOS
  // =====================================================

  $("addInvestment")?.addEventListener(
    "click",
    () => openModal("investment")
  );

  // =====================================================
  // METAS
  // =====================================================

  $("addGoal")?.addEventListener(
    "click",
    () => openModal("goal")
  );

  // =====================================================
  // ORÇAMENTO
  // =====================================================

  $("setBudget")?.addEventListener(
    "click",
    () => openModal("budget")
  );

  // =====================================================
  // FECHAR MODAL
  // =====================================================

  $("closeModal")?.addEventListener(
    "click",
    closeModal
  );

  // =====================================================
  // MÊS
  // =====================================================

  $("monthFilter")?.addEventListener(
    "change",
    render
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

      const id = Date.now();

      const nome =
        $("f_name")?.value?.trim() || "";

      const valor =
        Number(
          $("f_amount")?.value || 0
        );

      // ------------------------------
      // LANÇAMENTO
      // ------------------------------

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
            $("f_method")?.value?.trim() || "",

          note:
            $("f_note")?.value?.trim() || ""

        });
      }

      // ------------------------------
      // CONTA
      // ------------------------------

      else if (tipo === "account") {

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

      // ------------------------------
      // CARTÃO
      // ------------------------------

      else if (tipo === "card") {

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

      // ------------------------------
      // DÍVIDA
      // ------------------------------

      else if (tipo === "debt") {

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

      // ------------------------------
      // INVESTIMENTO
      // ------------------------------

      else if (tipo === "investment") {

        state.investments.push({

          id,

          name:
            nome,

          type:
            $("f_type").value.trim(),

          institution:
            $("f_institution").value.trim(),

          amount:
            valor

        });
      }

      // ------------------------------
      // META
      // ------------------------------

      else if (tipo === "goal") {

        state.goals.push({

          id,

          name:
            nome,

          target:
            valor,

          current:
            Number(
              $("f_current").value || 0
            )

        });
      }

      // ------------------------------
      // ORÇAMENTO
      // ------------------------------

      else if (tipo === "budget") {

        state.budgets.push({

          id,

          month:
            currentMonth(),

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
          resposta.replace(",", ".")
        );

      if (!valor || valor <= 0)
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

  // =====================================================
  // EXCLUSÕES
  // =====================================================

  document.addEventListener(
    "click",
    event => {

      // lançamento
      const apagar =
        event.target.closest(
          "[data-del]"
        );

      if (apagar) {

        state.entries =
          state.entries.filter(
            x =>
              String(x.id) !==
              String(apagar.dataset.del)
          );

        save();

        render();

        return;
      }

      // meta
      const apagarMeta =
        event.target.closest(
          "[data-goaldel]"
        );

      if (apagarMeta) {

        state.goals =
          state.goals.filter(
            x =>
              String(x.id) !==
              String(
                apagarMeta.dataset.goaldel
              )
          );

        save();

        render();

        return;
      }

      // conta/cartão/dívida/investimento
      const apagarItem =
        event.target.closest(
          "[data-entitydel]"
        );

      if (apagarItem) {

        const grupo =
          apagarItem.dataset.entitydel;

        if (state[grupo]) {

          state[grupo] =
            state[grupo].filter(
              x =>
                String(x.id) !==
                String(
                  apagarItem.dataset.id
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

        ...state.entries.map(x => [

          x.type,

          x.date,

          x.desc,

          x.category,

          x.amount,

          x.method,

          x.note

        ])

      ];

      const csv =
        linhas
          .map(linha =>
            linha
              .map(valor =>
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
        document.createElement("a");

      link.href =
        URL.createObjectURL(blob);

      link.download =
        "financas-pro.csv";

      document.body.appendChild(link);

      link.click();

      link.remove();

      setTimeout(() => {

        URL.revokeObjectURL(
          link.href
        );

      }, 1000);
    }
  );

  // =====================================================
  // LIMPAR DADOS
  // =====================================================

  $("clearBtn")?.addEventListener(
    "click",
    () => {

      const confirmar =
        confirm(
          "Tem certeza que deseja apagar todos os dados financeiros?"
        );

      if (!confirmar)
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
  // INICIALIZAÇÃO
  // =====================================================

  if ($("monthFilter")) {

    $("monthFilter").value =
      today().slice(0, 7);

  }

  render();

  // Abre a página inicial
  abrirPagina("dashboard");

})();

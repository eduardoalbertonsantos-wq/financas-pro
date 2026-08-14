// ==========================================
// CORREÇÃO DEFINITIVA DO MENU
// ==========================================

function abrirPagina(page) {

  // Esconde todas as páginas
  document.querySelectorAll(".page").forEach(function(pagina) {
    pagina.classList.remove("active");
  });

  // Abre a página escolhida
  const pagina = document.getElementById(page);

  if (pagina) {
    pagina.classList.add("active");
  }

  // Atualiza o botão selecionado do menu inferior
  document.querySelectorAll("nav button[data-page]").forEach(function(botao) {
    botao.classList.remove("selected");

    if (botao.dataset.page === page) {
      botao.classList.add("selected");
    }
  });

  // Volta para o topo
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// Torna a função disponível para os botões
window.abrirPagina = abrirPagina;


// Captura qualquer botão data-page
document.addEventListener("click", function(event) {

  const botao = event.target.closest("button[data-page]");

  if (!botao) return;

  event.preventDefault();

  abrirPagina(botao.dataset.page);

});

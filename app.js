(() => {
  const KEY = "financas-pro-dados-v1";
  const GOAL = 1200;
  const money = n => (Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
  const today = () => new Date().toISOString().slice(0,10);

  let state = JSON.parse(localStorage.getItem(KEY) || '{"entries":[],"savings":[],"goals":[]}');
  if (!state.entries) state.entries=[];
  if (!state.savings) state.savings=[];
  if (!state.goals) state.goals=[];

  const save = () => localStorage.setItem(KEY, JSON.stringify(state));
  const $ = id => document.getElementById(id);

  function selectedMonth(){
    const v = $("monthFilter")?.value;
    return v || today().slice(0,7);
  }
  function monthEntries(){
    return state.entries.filter(x => String(x.date||"").slice(0,7) === selectedMonth());
  }
  function totals(){
    const es=monthEntries();
    const entradas=es.filter(x=>x.type==="entrada").reduce((a,x)=>a+Number(x.amount||0),0);
    const despesas=es.filter(x=>x.type==="despesa").reduce((a,x)=>a+Number(x.amount||0),0);
    const savings=state.savings.filter(x=>String(x.date||"").slice(0,7)===selectedMonth()).reduce((a,x)=>a+Number(x.amount||0),0);
    return {entradas,despesas,savings,saldo:entradas-despesas,comp:entradas?Math.min(100,despesas/entradas*100):0};
  }

  function render(){
    const t=totals();
    if($("saldo")) $("saldo").textContent=money(t.saldo);
    if($("entradas")) $("entradas").textContent=money(t.entradas);
    if($("despesas")) $("despesas").textContent=money(t.despesas);
    if($("poupado")) $("poupado").textContent=money(t.savings);
    if($("comprometido")) $("comprometido").textContent=t.comp.toFixed(0)+"%";
    if($("saveText")) $("saveText").textContent=`Meta de poupança: ${money(GOAL)} • Acumulado no mês: ${money(t.savings)}`;
    const pct=Math.min(100,t.savings/GOAL*100);
    if($("saveBar")) $("saveBar").style.width=pct+"%";
    if($("goalBar")) $("goalBar").style.width=pct+"%";
    if($("savingTotal")) $("savingTotal").textContent=money(t.savings);
    if($("goalPercent")) $("goalPercent").textContent=`${pct.toFixed(0)}% da meta atingida`;
    renderCategories();
    renderRecent();
    renderAll();
    renderGoals();
    const insight=$("insight");
    if(insight){
      insight.textContent = t.saldo<0 ? "Atenção: as despesas estão maiores que as entradas neste mês." :
        t.savings>=GOAL ? "Parabéns! A meta de poupança do mês foi atingida." :
        `Faltam ${money(GOAL-t.savings)} para atingir sua meta de poupança.`;
    }
  }

  function renderCategories(){
    const el=$("categories"); if(!el) return;
    const map={};
    monthEntries().filter(x=>x.type==="despesa").forEach(x=>map[x.category||"Outros"]=(map[x.category||"Outros"]||0)+Number(x.amount||0));
    const rows=Object.entries(map).sort((a,b)=>b[1]-a[1]);
    if(!rows.length){el.innerHTML='<div class="empty">Nenhuma despesa cadastrada neste mês.</div>';return;}
    const max=rows[0][1]||1;
    el.innerHTML=rows.map(([k,v])=>`<div class="category-row"><div><span>${esc(k)}</span><b>${money(v)}</b></div><div class="category-track"><i style="width:${v/max*100}%"></i></div></div>`).join("");
  }

  function renderRecent(){
    const el=$("recent"); if(!el)return;
    const arr=[...monthEntries()].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,6);
    el.innerHTML=arr.length?arr.map(itemHTML).join(""):'<div class="empty">Nenhum lançamento neste mês.</div>';
  }
  function renderAll(){
    const el=$("allList"); if(!el)return;
    const arr=[...monthEntries()].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    el.innerHTML=arr.length?arr.map(itemHTML).join(""):'<div class="empty">Nenhum lançamento cadastrado.</div>';
  }
  function itemHTML(x){
    const cls=x.type==="entrada"?"entrada":"despesa";
    const sign=x.type==="entrada"?"+":"-";
    return `<div class="item"><div><strong>${esc(x.desc)}</strong><small>${formatDate(x.date)} • ${esc(x.category||"Outros")}${x.method?" • "+esc(x.method):""}</small></div><div class="${cls}">${sign} ${money(x.amount)} <button title="Excluir" data-del="${x.id}" style="border:0;background:transparent;margin-left:8px">🗑️</button></div></div>`;
  }

  function renderGoals(){
    const el=$("goals"); if(!el)return;
    if(!state.goals.length){el.innerHTML='<div class="empty">Nenhuma meta criada. Clique em “+ Nova meta”.</div>';return;}
    el.innerHTML=state.goals.map(g=>{
      const p=Math.min(100,(Number(g.current)||0)/(Number(g.target)||1)*100);
      return `<div class="goal-card"><div class="panel-head"><div><strong>${esc(g.name)}</strong><small style="display:block;color:#6b7280;margin-top:4px">${money(g.current)} de ${money(g.target)}</small></div><button data-goaldel="${g.id}">🗑️</button></div><div class="bar" style="margin-top:12px"><i style="width:${p}%"></i></div><small>${p.toFixed(0)}% concluído</small></div>`;
    }).join("");
  }

  function formatDate(d){ if(!d)return ""; const [y,m,day]=d.split("-"); return `${day}/${m}/${y}`; }
  function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

  function openModal(type){
    $("type").value=type;
    $("modalTitle").textContent=type==="entrada"?"Nova entrada":"Nova despesa";
    $("date").value=today(); $("desc").value=""; $("amount").value=""; $("method").value=""; $("note").value="";
    const cats=type==="entrada"?["Salário","Renda extra","Investimentos","Outros"]:["Moradia","Alimentação","Transporte","Cartão","Saúde","Academia","Lazer","Contas","Dívidas","Outros"];
    $("category").innerHTML=cats.map(c=>`<option>${c}</option>`).join("");
    $("modal").classList.remove("hidden");
  }
  function closeModal(){ $("modal").classList.add("hidden"); }

  document.addEventListener("click",e=>{
    const page=e.target.closest("[data-page]");
    if(page){
      const id=page.dataset.page;
      document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
      $(id)?.classList.add("active");
      document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("selected",b.dataset.page===id));
      return;
    }
    const del=e.target.closest("[data-del]");
    if(del){ state.entries=state.entries.filter(x=>String(x.id)!==String(del.dataset.del)); save(); render(); return; }
    const gd=e.target.closest("[data-goaldel]");
    if(gd){ state.goals=state.goals.filter(x=>String(x.id)!==String(gd.dataset.goaldel)); save(); render(); return; }
  });

  $("newEntry")?.addEventListener("click",()=>openModal("entrada"));
  $("newExpense")?.addEventListener("click",()=>openModal("despesa"));
  $("closeModal")?.addEventListener("click",closeModal);
  $("monthFilter")?.addEventListener("change",render);

  $("form")?.addEventListener("submit",e=>{
    e.preventDefault();
    state.entries.push({
      id:Date.now(), type:$("type").value, date:$("date").value, desc:$("desc").value.trim(),
      category:$("category").value, amount:Number($("amount").value), method:$("method").value.trim(), note:$("note").value.trim()
    });
    save(); closeModal(); render();
  });

  $("addSaving")?.addEventListener("click",()=>{
    const v=prompt("Quanto você poupou?","100");
    const n=Number(String(v||"").replace(",",".")); if(!(n>0))return;
    state.savings.push({id:Date.now(),date:today(),amount:n}); save(); render();
  });

  $("addGoal")?.addEventListener("click",()=>{
    const name=prompt("Nome da meta:","Reserva de emergência"); if(!name)return;
    const target=Number(String(prompt("Valor da meta:","5000")||"").replace(",",".")); if(!(target>0))return;
    state.goals.push({id:Date.now(),name,target,current:0}); save(); render();
  });

  $("clearBtn")?.addEventListener("click",()=>{
    if(confirm("Isso apagará os dados salvos neste navegador. Continuar?")){
      state={entries:[],savings:[],goals:[]}; save(); render();
    }
  });

  $("budgetBtn")?.addEventListener("click",()=>alert("Orçamento: use suas categorias e a meta mensal de R$ 1.200 na tela inicial."));
  $("debtBtn")?.addEventListener("click",()=>alert("Dívidas: registre-as como despesas e acompanhe por categoria."));
  $("exportBtn")?.addEventListener("click",()=>{
    const rows=[["tipo","data","descrição","categoria","valor","forma","observação"],...state.entries.map(x=>[x.type,x.date,x.desc,x.category,x.amount,x.method,x.note])];
    const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\n");
    const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="financas-pro.csv";a.click();URL.revokeObjectURL(a.href);
  });

  const mf=$("monthFilter"); if(mf && !mf.value)mf.value=today().slice(0,7);
  render();
})();
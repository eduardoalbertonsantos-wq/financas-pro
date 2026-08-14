(() => {
const KEY="financas-pro-dados-v1", GOAL=1200;
const money=n=>(Number(n)||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const today=()=>new Date().toISOString().slice(0,10);
const $=id=>document.getElementById(id);
let state=JSON.parse(localStorage.getItem(KEY)||"{}");
Object.assign(state,{entries:state.entries||[],savings:state.savings||[],goals:state.goals||[],accounts:state.accounts||[],cards:state.cards||[],debts:state.debts||[],investments:state.investments||[],budgets:state.budgets||[]});
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const month=()=>($("monthFilter")?.value||today().slice(0,7));
const monthEntries=()=>state.entries.filter(x=>String(x.date||"").slice(0,7)===month());
const totals=()=>{const e=monthEntries(),inm=e.filter(x=>x.type==="entrada").reduce((a,x)=>a+Number(x.amount||0),0),out=e.filter(x=>x.type==="despesa").reduce((a,x)=>a+Number(x.amount||0),0),sv=state.savings.filter(x=>String(x.date||"").slice(0,7)===month()).reduce((a,x)=>a+Number(x.amount||0),0);return{entradas:inm,despesas:out,savings:sv,saldo:inm-out,comp:inm?Math.min(100,out/inm*100):0}};
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function dateBR(d){if(!d)return"";const [y,m,day]=d.split("-");return`${day}/${m}/${y}`}
function render(){
 const t=totals(),p=Math.min(100,t.savings/GOAL*100);
 [["saldo",money(t.saldo)],["entradas",money(t.entradas)],["despesas",money(t.despesas)],["poupado",money(t.savings)],["comprometido",t.comp.toFixed(0)+"%"],["savingTotal",money(t.savings)],["goalPercent",p.toFixed(0)+"% da meta atingida"]].forEach(([id,v])=>{if($(id))$(id).textContent=v});
 if($("saveText"))$("saveText").textContent=`Meta de poupança: ${money(GOAL)} • Acumulado no mês: ${money(t.savings)}`;
 if($("saveBar"))$("saveBar").style.width=p+"%"; if($("goalBar"))$("goalBar").style.width=p+"%";
 if($("insight"))$("insight").textContent=t.saldo<0?"Atenção: despesas maiores que entradas.":t.savings>=GOAL?"Parabéns! Meta atingida.":`Faltam ${money(GOAL-t.savings)} para atingir sua meta.`;
 renderCategories();renderLists();renderGoals();renderEntities();
}
function renderCategories(){const el=$("categories");if(!el)return;const m={};monthEntries().filter(x=>x.type==="despesa").forEach(x=>m[x.category||"Outros"]=(m[x.category||"Outros"]||0)+Number(x.amount||0));const rows=Object.entries(m).sort((a,b)=>b[1]-a[1]);if(!rows.length){el.innerHTML='<div class="empty">Nenhuma despesa cadastrada neste mês.</div>';return}const max=rows[0][1]||1;el.innerHTML=rows.map(([k,v])=>`<div class="category-row"><div><span>${esc(k)}</span><b>${money(v)}</b></div><div class="category-track"><i style="width:${v/max*100}%"></i></div></div>`).join("")}
function itemHTML(x){const s=x.type==="entrada"?"+":"-";return`<div class="item"><div><strong>${esc(x.desc)}</strong><small>${dateBR(x.date)} • ${esc(x.category||"Outros")}${x.method?" • "+esc(x.method):""}</small></div><div class="${x.type}">${s} ${money(x.amount)} <button data-del="${x.id}" class="iconbtn">🗑️</button></div></div>`}
function renderLists(){const a=[...monthEntries()].sort((a,b)=>String(b.date).localeCompare(String(a.date)));if($("recent"))$("recent").innerHTML=a.slice(0,6).map(itemHTML).join("")||'<div class="empty">Nenhum lançamento neste mês.</div>';if($("allList"))$("allList").innerHTML=a.map(itemHTML).join("")||'<div class="empty">Nenhum lançamento cadastrado.</div>'}
function renderGoals(){const el=$("goals");if(!el)return;if(!state.goals.length){el.innerHTML='<div class="empty">Nenhuma meta criada.</div>';return}el.innerHTML=state.goals.map(g=>{const p=Math.min(100,(Number(g.current)||0)/(Number(g.target)||1)*100);return`<div class="goal-card"><div class="panel-head"><div><strong>${esc(g.name)}</strong><small>${money(g.current)} de ${money(g.target)}</small></div><button data-goaldel="${g.id}" class="iconbtn">🗑️</button></div><div class="bar"><i style="width:${p}%"></i></div><small>${p.toFixed(0)}% concluído</small></div>`}).join("")}
function entityRow(x,fields,delKey){return`<div class="entity"><div><strong>${esc(x.name)}</strong><small>${fields.map(f=>esc(x[f]??"")).filter(Boolean).join(" • ")}</small></div><strong>${x.amount!=null?money(x.amount):""}</strong><button class="iconbtn" data-entitydel="${delKey}" data-id="${x.id}">🗑️</button></div>`}
function renderEntities(){
 const a=$("accounts"),c=$("cardsList"),d=$("debtsList"),i=$("investmentsList"),b=$("budgetList");
 if(a)a.innerHTML=state.accounts.length?state.accounts.map(x=>entityRow(x,["bank","type","balance"],"accounts")).join(""):'<div class="empty">Nenhuma conta cadastrada.</div>';
 if(c)c.innerHTML=state.cards.length?state.cards.map(x=>entityRow(x,["bank","limit","due"],"cards")).join(""):'<div class="empty">Nenhum cartão cadastrado.</div>';
 if(d)d.innerHTML=state.debts.length?state.debts.map(x=>entityRow(x,["due","installments"],"debts")).join(""):'<div class="empty">Nenhuma dívida cadastrada.</div>';
 if(i)i.innerHTML=state.investments.length?state.investments.map(x=>entityRow(x,["type","institution"],"investments")).join(""):'<div class="empty">Nenhum investimento cadastrado.</div>';
 if(b){const arr=state.budgets.filter(x=>x.month===month());b.innerHTML=arr.length?arr.map(x=>{const spent=monthEntries().filter(e=>e.type==="despesa"&&e.category===x.category).reduce((s,e)=>s+Number(e.amount),0);const p=Math.min(100,spent/x.amount*100);return`<div class="entity"><div><strong>${esc(x.category)}</strong><small>Orçamento ${money(x.amount)} • gasto ${money(spent)}</small><div class="bar mini"><i style="width:${p}%"></i></div></div><strong>${p.toFixed(0)}%</strong></div>`}).join(""):'<div class="empty">Nenhum orçamento definido para este mês.</div>'}
}
function openModal(kind,type){
 $("formKind").value=kind;$("type").value=type||"";$("modalTitle").textContent=kind==="entry"?(type==="entrada"?"Nova entrada":"Nova despesa"):"Novo "+({account:"conta",card:"cartão",debt:"dívida",investment:"investimento",goal:"meta",budget:"orçamento"}[kind]||"registro");
 let h="";
 if(kind==="entry"){const cats=type==="entrada"?["Salário","Renda extra","Investimentos","Outros"]:["Moradia","Alimentação","Transporte","Cartão","Saúde","Academia","Lazer","Contas","Dívidas","Outros"];h=`<label>Data<input required type="date" id="f_date" value="${today()}"></label><label>Descrição<input required id="f_name" placeholder="Ex.: Salário"></label><label>Categoria<select id="f_category">${cats.map(c=>`<option>${c}</option>`).join("")}</select></label><label>Valor<input required type="number" min="0.01" step="0.01" id="f_amount"></label><label>Forma de pagamento/recebimento<input id="f_method" placeholder="Pix, débito, crédito..."></label><label>Observação<textarea id="f_note"></textarea></label>`}
 if(kind==="account")h=`<label>Nome<input required id="f_name" placeholder="Ex.: Nubank"></label><label>Banco<input id="f_bank"></label><label>Tipo<input id="f_type" placeholder="Conta corrente, poupança..."></label><label>Saldo atual<input required type="number" step="0.01" id="f_amount"></label>`;
 if(kind==="card")h=`<label>Nome<input required id="f_name" placeholder="Ex.: Nubank"></label><label>Banco<input id="f_bank"></label><label>Limite<input required type="number" step="0.01" id="f_amount"></label><label>Vencimento<input id="f_due" placeholder="Dia 10"></label>`;
 if(kind==="debt")h=`<label>Nome<input required id="f_name" placeholder="Ex.: Empréstimo"></label><label>Valor total<input required type="number" step="0.01" id="f_amount"></label><label>Vencimento<input id="f_due"></label><label>Parcelas<input id="f_installments" type="number" min="1"></label>`;
 if(kind==="investment")h=`<label>Nome<input required id="f_name" placeholder="Ex.: Tesouro Direto"></label><label>Tipo<input id="f_type"></label><label>Instituição<input id="f_institution"></label><label>Valor atual<input required type="number" step="0.01" id="f_amount"></label>`;
 if(kind==="goal")h=`<label>Nome<input required id="f_name" placeholder="Ex.: Reserva de emergência"></label><label>Valor da meta<input required type="number" step="0.01" id="f_amount"></label><label>Já acumulado<input type="number" step="0.01" id="f_current" value="0"></label>`;
 if(kind==="budget")h=`<label>Categoria<select id="f_category">${["Moradia","Alimentação","Transporte","Cartão","Saúde","Academia","Lazer","Contas","Dívidas","Outros"].map(c=>`<option>${c}</option>`).join("")}</select></label><label>Valor mensal<input required type="number" step="0.01" id="f_amount"></label>`;
 $("dynamicFields").innerHTML=h;$("modal").classList.remove("hidden");
}
function close(){ $("modal").classList.add("hidden") }
document.addEventListener("click",e=>{
 const pg=e.target.closest("[data-page]");if(pg){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(pg.dataset.page)?.classList.add("active");document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("selected",b.dataset.page===pg.dataset.page));return}
 const del=e.target.closest("[data-del]");if(del){state.entries=state.entries.filter(x=>String(x.id)!==String(del.dataset.del));save();render();return}
 const gd=e.target.closest("[data-goaldel]");if(gd){state.goals=state.goals.filter(x=>String(x.id)!==String(gd.dataset.goaldel));save();render();return}
 const ed=e.target.closest("[data-entitydel]");if(ed){state[ed.dataset.entitydel]=state[ed.dataset.entitydel].filter(x=>String(x.id)!==String(ed.dataset.id));save();render();return}
});
$("newEntry")?.addEventListener("click",()=>openModal("entry","entrada"));$("newExpense")?.addEventListener("click",()=>openModal("entry","despesa"));$("closeModal")?.addEventListener("click",close);$("monthFilter")?.addEventListener("change",render);
$("addAccount")?.addEventListener("click",()=>openModal("account"));$("addCard")?.addEventListener("click",()=>openModal("card"));$("addDebt")?.addEventListener("click",()=>openModal("debt"));$("addInvestment")?.addEventListener("click",()=>openModal("investment"));$("addGoal")?.addEventListener("click",()=>openModal("goal"));$("setBudget")?.addEventListener("click",()=>openModal("budget"));
$("addSaving")?.addEventListener("click",()=>{const v=Number(String(prompt("Quanto você poupou?","100")||"").replace(",","."));if(v>0){state.savings.push({id:Date.now(),date:today(),amount:v});save();render()}});
$("form")?.addEventListener("submit",e=>{e.preventDefault();const k=$("formKind").value,id=Date.now(),name=$("f_name")?.value?.trim(),amount=Number($("f_amount")?.value||0);if(k==="entry")state.entries.push({id,type:$("type").value,date:$("f_date").value,desc:name,category:$("f_category").value,amount,method:$("f_method").value.trim(),note:$("f_note").value.trim()});
else if(k==="account")state.accounts.push({id,name,bank:$("f_bank").value.trim(),type:$("f_type").value.trim(),balance:amount});
else if(k==="card")state.cards.push({id,name,bank:$("f_bank").value.trim(),limit:amount,due:$("f_due").value.trim(),amount});
else if(k==="debt")state.debts.push({id,name,amount,due:$("f_due").value.trim(),installments:$("f_installments").value});
else if(k==="investment")state.investments.push({id,name,type:$("f_type").value.trim(),institution:$("f_institution").value.trim(),amount});
else if(k==="goal")state.goals.push({id,name,target:amount,current:Number($("f_current").value||0)});
else if(k==="budget")state.budgets.push({id,month:month(),category:$("f_category").value,amount});
save();close();render()});
$("clearBtn")?.addEventListener("click",()=>{if(confirm("Isso apagará todos os dados salvos neste navegador. Continuar?")){state={entries:[],savings:[],goals:[],accounts:[],cards:[],debts:[],investments:[],budgets:[]};save();render()}});
$("exportBtn")?.addEventListener("click",()=>{const rows=[["tipo","data","descrição","categoria","valor","forma","observação"],...state.entries.map(x=>[x.type,x.date,x.desc,x.category,x.amount,x.method,x.note])];const csv=rows.map(r=>r.map(v=>`"${String(v??"").replaceAll('"','""')}"`).join(";")).join("\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="financas-pro.csv";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)});
$("monthFilter").value=today().slice(0,7);render();
})();
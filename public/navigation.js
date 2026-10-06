const extraPageTitles={},extraPageHandlers={};
const navigationGroups=[
 {id:'catalogs',label:'Cadastros e estoque',pages:['products','customers','suppliers','replenishment','inventories','richCatalog']},
 {id:'commercial',label:'Vendas e consultas',pages:['sales','quotes','productLookup','discountReport','returnsPage','reservations']},
 {id:'financial',label:'Financeiro e compras',pages:['finance','accountsPage','payables','expenses','cashPage','movements','purchases','purchaseCosts']},
 {id:'routine',label:'Rotina e relatórios',pages:['searchPage','tasksPage','centralPage','managerReports']},
 {id:'administration',label:'Administração',pages:['companySettings','changes','diagnosticsPage']}
];
function navigationMarkup(titles,current){
 let expanded=[];try{expanded=JSON.parse(scopedSessionStorage.getItem('navigationGroups')||'[]');if(!Array.isArray(expanded))expanded=[];}catch{}
 const button=key=>`<button data-page="${key}" class="${current===key?'active':''}" ${current===key?'aria-current="page"':''}>${titles[key][0]}</button>`;
 return button('dashboard')+navigationGroups.map(group=>`<details class="nav-group" data-nav-group="${group.id}" ${expanded.includes(group.id)||group.pages.includes(current)?'open':''}><summary>${group.label}<span class="nav-chevron" aria-hidden="true">⌄</span></summary><div class="nav-children">${group.pages.map(button).join('')}</div></details>`).join('');
}
function bindNavigationGroups(){document.querySelectorAll('[data-nav-group]').forEach(group=>group.addEventListener('toggle',()=>{try{scopedSessionStorage.setItem('navigationGroups',JSON.stringify([...document.querySelectorAll('[data-nav-group][open]')].map(g=>g.dataset.navGroup)));}catch{}}));}

(function(){
var KEY='viajes-camiones-v1', viajes=[];
var $=function(id){return document.getElementById(id)};
function load(){try{viajes=JSON.parse(localStorage.getItem(KEY)||'[]')||[]}catch(e){viajes=[]}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(viajes));return true}catch(e){return false}}
function num(v){var n=parseFloat(v);return isFinite(n)&&n>0?n:0}
function money(n){return 'S/ '+n.toLocaleString('es-PE',{minimumFractionDigits:2,maximumFractionDigits:2})}
function say(t){$('msg').textContent=t}

function addExtra(c,m){
  var d=document.createElement('div');d.className='extra-row';
  d.innerHTML='<label>Concepto<input class="ec" placeholder="Ej. Llanta, multa, estacionamiento"></label><label>Monto (S/)<input class="em" type="number" min="0" step="0.01" inputmode="decimal"></label><button type="button" class="small">Quitar</button>';
  d.querySelector('.ec').value=c||'';d.querySelector('.em').value=m||'';
  d.querySelector('button').onclick=function(){d.remove();totals()};
  d.addEventListener('input',totals);
  $('extras').appendChild(d);
}
function readForm(){
  var ex=[].map.call(document.querySelectorAll('.extra-row'),function(r){return{concepto:r.querySelector('.ec').value.trim(),monto:num(r.querySelector('.em').value)}}).filter(function(e){return e.concepto||e.monto});
  return{fecha:$('fecha').value,origen:$('origen').value.trim(),destino:$('destino').value.trim(),
    presupuesto:num($('presupuesto').value),petroleo:num($('petroleo').value),peaje:num($('peaje').value),viaticos:num($('viaticos').value),extras:ex};
}
function gastado(v){return v.petroleo+v.peaje+v.viaticos+v.extras.reduce(function(s,e){return s+e.monto},0)}
function totals(){
  var v=readForm(),g=gastado(v),s=v.presupuesto-g;
  $('tGasto').textContent=money(g);$('tPres').textContent=money(v.presupuesto);
  $('tSaldo').textContent=money(s);$('tSaldo').className=s<0?'neg':'pos';
}
function clearForm(){
  ['origen','destino','presupuesto','petroleo','peaje','viaticos'].forEach(function(i){$(i).value=''});
  $('fecha').value=new Date().toISOString().slice(0,10);
  $('extras').innerHTML='';totals();
}
function fmtFecha(f){if(!f)return 'Sin fecha';var p=f.split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:f}
function esc(s){var d=document.createElement('div');d.textContent=s;return d.innerHTML}

function render(){
  var L=$('lista');
  if(!viajes.length){L.innerHTML='<p class="empty">Todavía no hay viajes. Completa el formulario y pulsa «Guardar viaje».</p>';return}
  L.innerHTML='';
  viajes.slice().reverse().forEach(function(v){
    var g=gastado(v),s=v.presupuesto-g,d=document.createElement('div');d.className='trip';
    d.innerHTML='<div class="route">'+esc(v.origen||'—')+' a '+esc(v.destino||'—')+'</div>'+
    '<div class="meta">'+fmtFecha(v.fecha)+'</div>'+
    '<div class="row"><span>Presupuesto: <b>'+money(v.presupuesto)+'</b></span><span>Gastado: <b>'+money(g)+'</b></span><span>Ganancia: <b class="'+(s<0?'neg':'pos')+'">'+money(s)+'</b></span></div>'+
    '<div class="actions" style="margin:4px 0 0"><button class="small" data-a="pdf">PDF</button><button class="small" data-a="edit">Editar</button><button class="small" data-a="del">Eliminar</button></div>';
    d.querySelector('[data-a=pdf]').onclick=function(){exportPdf([v],'viaje-'+(v.fecha||'sin-fecha')+'.pdf')};
    d.querySelector('[data-a=edit]').onclick=function(){edit(v)};
    d.querySelector('[data-a=del]').onclick=function(){if(confirm('¿Eliminar este viaje?')){viajes=viajes.filter(function(x){return x.id!==v.id});persist();render();say('Viaje eliminado.')}};
    L.appendChild(d);
  });
}
var editId=null;
function edit(v){
  editId=v.id;$('fecha').value=v.fecha;$('origen').value=v.origen;$('destino').value=v.destino;
  $('presupuesto').value=v.presupuesto||'';$('petroleo').value=v.petroleo||'';$('peaje').value=v.peaje||'';$('viaticos').value=v.viaticos||'';
  $('extras').innerHTML='';v.extras.forEach(function(e){addExtra(e.concepto,e.monto||'')});totals();
  say('Editando viaje. Pulsa «Guardar viaje» para aplicar los cambios.');window.scrollTo({top:0,behavior:'smooth'});
}
function guardar(){
  var v=readForm();
  if(!v.origen||!v.destino){say('Escribe el lugar de partida y el de llegada.');return}
  if(editId){v.id=editId;viajes=viajes.map(function(x){return x.id===editId?v:x});editId=null}
  else{v.id=Date.now();viajes.push(v)}
  say(persist()?'Viaje guardado.':'Guardado solo en esta sesión: el navegador no permite almacenar datos.');
  render();clearForm();
}

function exportPdf(list,name){
  if(!list.length){say('No hay viajes para exportar.');return}
  if(!window.jspdf){say('No se pudo cargar el generador de PDF.');return}
  var doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),W=210,M=16,CW=W-2*M,y=0,ttl='';
  var INK=[28,38,48],YEL=[242,183,5],GRY=[93,107,120],GRN=[31,122,77],RED=[179,38,30],WHT=[255,255,255],PALE=[232,236,239],BOX=[241,243,245];
  var COL={pet:YEL,pea:[58,124,165],via:GRN,ext:[140,100,170],gan:[196,226,208]};
  var d=new Date(),p2=function(n){return String(n).padStart(2,'0')};
  var now={d:p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear(),t:p2(d.getHours())+':'+p2(d.getMinutes())};
  function fill(c){doc.setFillColor(c[0],c[1],c[2])}
  function ink(c){doc.setTextColor(c[0],c[1],c[2])}
  function font(b,s){doc.setFont('helvetica',b?'bold':'normal');doc.setFontSize(s)}
  function pct(a,b){return b>0?Math.round(a/b*100)+'%':'-'}
  function cut(t,w){return doc.splitTextToSize(t||'-',w)[0]}
  function truck(x,y,s){fill(YEL);doc.roundedRect(x,y,9*s,6*s,.8*s,.8*s,'F');doc.roundedRect(x+9.8*s,y+2*s,4.2*s,4*s,.8*s,.8*s,'F');
    fill(WHT);doc.circle(x+3*s,y+7*s,1.3*s,'F');doc.circle(x+11.5*s,y+7*s,1.3*s,'F');fill(INK);doc.circle(x+3*s,y+7*s,.5*s,'F');doc.circle(x+11.5*s,y+7*s,.5*s,'F')}
  function pin(x,y,c){fill(c);doc.circle(x,y,2.4,'F');fill(WHT);doc.circle(x,y,1,'F')}
  function head(t,sub){ttl=t;fill(INK);doc.rect(0,0,W,30,'F');fill(YEL);doc.rect(0,30,W,2,'F');truck(M,9,1.3);
    ink(WHT);font(1,18);doc.text(t,M+23,16);font(0,9);ink(YEL);doc.text(sub||'Control de gastos de transporte',M+23,23);
    ink(WHT);font(0,8);doc.text('Fecha y hora de descarga',W-M,11,{align:'right'});font(1,10.5);doc.text(now.d,W-M,17,{align:'right'});doc.text(now.t+' h',W-M,23,{align:'right'});ink(INK);y=42}
  function ensure(h){if(y+h>276){doc.addPage();head(ttl,'Continuación')}}
  function sec(t){ensure(16);ink(INK);font(1,11.5);doc.text(t,M,y);fill(YEL);doc.rect(M,y+1.8,10,.9,'F');y+=9}
  function cards(a){var cw=(CW-8)/3;a.forEach(function(c,i){var x=M+i*(cw+4);fill(BOX);doc.rect(x,y,cw,20,'F');fill(c[2]);doc.rect(x,y,1.6,20,'F');
    ink(GRY);font(0,8.5);doc.text(c[0],x+5,y+7);ink(c[2]);font(1,13);doc.text(money(c[1]),x+5,y+15.5)});y+=30}
  function trip(v){
    var g=gastado(v),s=v.presupuesto-g,hw=CW/2-8;
    ink(GRY);font(0,8.5);doc.text('Lugar de partida',M,y);doc.text('Lugar de llegada',W-M,y,{align:'right'});
    font(0,9);doc.text('Fecha: '+fmtFecha(v.fecha),W/2,y+5,{align:'center'});
    doc.setDrawColor(150,160,170);doc.setLineDashPattern([1.6,1.6],0);doc.line(M+7,y+7,W-M-7,y+7);doc.setLineDashPattern([],0);
    pin(M+2.4,y+7,GRN);pin(W-M-2.4,y+7,RED);
    ink(INK);font(1,13);doc.text(cut(v.origen,hw),M,y+16);doc.text(cut(v.destino,hw),W-M,y+16,{align:'right'});y+=26;
    cards([['Presupuesto',v.presupuesto,INK],['Total gastado',g,COL.pea],['Ganancia',s,s<0?RED:GRN]]);
    sec('Cómo se usó el presupuesto');
    var ext=v.extras.reduce(function(a,e){return a+e.monto},0);
    var cats=[['Petróleo',v.petroleo,COL.pet],['Peajes',v.peaje,COL.pea],['Viáticos',v.viaticos,COL.via]];
    if(ext>0)cats.push(['Adicionales',ext,COL.ext]);
    var base=Math.max(v.presupuesto,g)||1,x=M;
    fill(PALE);doc.rect(M,y,CW,10,'F');
    cats.forEach(function(c){var w=c[1]/base*CW;if(w>0){fill(c[2]);doc.rect(x,y,w,10,'F');x+=w}});
    if(s>0){fill(COL.gan);doc.rect(x,y,s/base*CW,10,'F')}
    y+=17;
    var leg=cats.slice();if(s>0)leg.push(['Ganancia',s,COL.gan]);
    leg.forEach(function(c,i){var lx=M+(i%3)*(CW/3),ly=y+Math.floor(i/3)*7;fill(c[2]);doc.rect(lx,ly-3,3.5,3.5,'F');ink(INK);font(0,9);doc.text(c[0]+': '+pct(c[1],v.presupuesto),lx+5,ly)});
    y+=Math.ceil(leg.length/3)*7+2;
    if(s<0){ink(RED);font(1,9);doc.text('Se superó el presupuesto en '+money(-s),M,y);y+=6}
    y+=6;sec('Detalle de gastos');
    ink(GRY);font(0,8);doc.text('Concepto',M+6,y);doc.text('Participación',M+68,y);doc.text('% presup.',M+120,y,{align:'right'});doc.text('Monto',W-M,y,{align:'right'});y+=6;
    var rows=[['Petróleo',v.petroleo,COL.pet],['Peajes',v.peaje,COL.pea],['Viáticos',v.viaticos,COL.via]].concat(v.extras.map(function(e){return[e.concepto||'Adicional',e.monto,COL.ext]}));
    rows.forEach(function(r){ensure(9);fill(r[2]);doc.rect(M,y-3.2,3.5,3.5,'F');ink(INK);font(0,10.5);doc.text(cut(r[0],58),M+6,y);
      fill(PALE);doc.rect(M+68,y-2.6,38,2.4,'F');if(g>0){fill(r[2]);doc.rect(M+68,y-2.6,r[1]/g*38,2.4,'F')}
      ink(GRY);font(0,9);doc.text(pct(r[1],v.presupuesto),M+120,y,{align:'right'});ink(INK);font(0,10.5);doc.text(money(r[1]),W-M,y,{align:'right'});y+=7.5});
    ensure(22);doc.setDrawColor(211,217,222);doc.line(M,y-3.5,W-M,y-3.5);y+=3;
    font(1,11);ink(INK);doc.text('Total gastado',M,y);doc.text(money(g),W-M,y,{align:'right'});y+=8;
    ink(s<0?RED:GRN);doc.text('Ganancia',M,y);doc.text(money(s),W-M,y,{align:'right'});
  }
  function summary(){
    head('Resumen de viajes',list.length+' viajes registrados');
    var tp=0,tg=0;list.forEach(function(v){tp+=v.presupuesto;tg+=gastado(v)});
    cards([['Presupuesto total',tp,INK],['Gasto total',tg,COL.pea],['Ganancia total',tp-tg,tp-tg<0?RED:GRN]]);
    sec('Viajes');
    font(0,8);ink(GRY);doc.text('Fecha',M,y);doc.text('Ruta',M+24,y);doc.text('Presupuesto',M+112,y,{align:'right'});doc.text('Gastado',M+143,y,{align:'right'});doc.text('Ganancia',W-M,y,{align:'right'});y+=6;
    list.forEach(function(v){ensure(8);var g=gastado(v),s=v.presupuesto-g;font(0,9.5);ink(INK);doc.text(fmtFecha(v.fecha),M,y);doc.text(cut((v.origen||'-')+' a '+(v.destino||'-'),58),M+24,y);
      doc.text(money(v.presupuesto),M+112,y,{align:'right'});doc.text(money(g),M+143,y,{align:'right'});font(1,9.5);ink(s<0?RED:GRN);doc.text(money(s),W-M,y,{align:'right'});y+=7});
    y+=4;sec('Presupuesto frente a gasto');
    var mx=1;list.forEach(function(v){mx=Math.max(mx,v.presupuesto,gastado(v))});
    fill(COL.pea);doc.rect(M,y-3,3.5,3.5,'F');font(0,9);ink(INK);doc.text('Presupuesto',M+5,y);fill(YEL);doc.rect(M+35,y-3,3.5,3.5,'F');doc.text('Gastado',M+40,y);y+=7;
    list.forEach(function(v){ensure(15);var g=gastado(v);font(0,9);ink(INK);doc.text(cut((v.origen||'-')+' a '+(v.destino||'-'),CW),M,y);
      fill(COL.pea);doc.rect(M,y+1.5,v.presupuesto/mx*CW,2.6,'F');fill(g>v.presupuesto?RED:YEL);doc.rect(M,y+4.8,g/mx*CW,2.6,'F');y+=12});
  }
  if(list.length>1){summary();list.forEach(function(v){doc.addPage();head('Registro de viaje');trip(v)})}
  else{head('Registro de viaje');trip(list[0])}
  var n=doc.getNumberOfPages();
  for(var i=1;i<=n;i++){doc.setPage(i);doc.setDrawColor(211,217,222);doc.line(M,284,W-M,284);font(0,8);ink(GRY);
    doc.text('Descargado el '+now.d+' a las '+now.t+' h',M,289);doc.text('Página '+i+' de '+n,W-M,289,{align:'right'})}
  var blob=doc.output('blob');
  if(!window.claude||!window.claude.use){fallback(blob,name);return}
  window.claude.use('downloads').then(function(dl){
    if(!dl){fallback(blob,name);return}
    return dl.save({filename:name,data:blob}).then(function(){say('PDF listo.')},function(e){say(e&&e.code==='declined'?'Descarga cancelada.':'No se pudo guardar el PDF.')});
  }).catch(function(){fallback(blob,name)});
}
function fallback(blob,name){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();say('PDF generado.')}

$('addExtra').onclick=function(){addExtra()};
$('guardar').onclick=guardar;
$('limpiar').onclick=function(){editId=null;clearForm();say('')};
$('pdfActual').onclick=function(){var v=readForm();if(!v.origen&&!v.destino){say('Completa al menos partida y llegada para generar el PDF.');return}exportPdf([v],'viaje-'+(v.fecha||'nuevo')+'.pdf')};
$('pdfTodos').onclick=function(){exportPdf(viajes,'viajes-registrados.pdf')};
['presupuesto','petroleo','peaje','viaticos'].forEach(function(i){$(i).addEventListener('input',totals)});
load();clearForm();render();
})();

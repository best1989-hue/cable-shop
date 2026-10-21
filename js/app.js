/* Прогрессивное улучшение поверх статического HTML: меню, фильтры, корзина-запрос, квиз, формы. Без библиотек. */
(function(){
'use strict';
var CFG=window.SITE_CONFIG||{}; var KEY='rfq_cart_v1';
document.documentElement.classList.add('js');
var root=(function(){var s=document.querySelector('script[src$="js/app.js"]');return s?s.getAttribute('src').replace(/js\/app\.js$/,''):'';})();
function $(s,c){return (c||document).querySelector(s);} function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
/* меню: на десктопе всегда раскрыто */
var mq=window.matchMedia('(min-width:900px)'); var bg=$('.burger'); if(bg)bg.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();var c=$('#nav-t');c.checked=!c.checked;}});
/* корзина */
function load(){try{return JSON.parse(localStorage.getItem(KEY))||[];}catch(e){return [];}}
function save(c){try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){} count();}
function count(){var n=load().length; $$('[data-cart-count]').forEach(function(el){el.textContent=n;});}
function add(it){var c=load(),f=null;c.forEach(function(x){if(x.id===it.id&&x.unit===it.unit)f=x;}); if(f)f.qty=(+f.qty||0)+(+it.qty||0); else c.push(it); save(c); toast('Добавлено в запрос счёта: '+it.name);}
function toast(t){var d=document.createElement('div');d.textContent=t;d.setAttribute('role','status');d.style.cssText='position:fixed;left:50%;bottom:84px;transform:translateX(-50%);background:#1c2833;color:#fff;padding:10px 14px;border-radius:8px;z-index:50;max-width:90vw;font-size:.92rem;box-shadow:0 6px 20px rgba(0,0,0,.25)';document.body.appendChild(d);setTimeout(function(){d.remove();},2200);}
document.addEventListener('click',function(e){var b=e.target.closest('[data-add]'); if(!b)return; add({id:b.dataset.id,name:b.dataset.name,url:b.dataset.url,qty:100,unit:'м'});});
$$('form[data-buy]').forEach(function(f){f.addEventListener('submit',function(e){e.preventDefault();add({id:f.dataset.id,name:f.dataset.name,url:f.dataset.url,qty:+f.qty.value||1,unit:f.unit.value});});});
count();
/* фильтры каталога */
var fr=$('[data-filter-root]');
if(fr){
  var form=$('.f-form',fr), cards=$$('[data-p]',fr), found=$('[data-found]',fr), empty=$('[data-empty]',fr), fd=$('[data-filters]',fr);
  var tg=$('[data-f-toggle]',fr); if(tg)tg.addEventListener('click',function(){var o=fd.classList.toggle('f-open');tg.setAttribute('aria-expanded',o);});
  var params=new URLSearchParams(location.search);
  params.forEach(function(v,k){ if(k==='q'){form.q.value=v;} else $$('input[name="'+k+'"]',form).forEach(function(i){ if(v.split(',').indexOf(i.value)>-1) i.checked=true; }); });
  function norm(s){return String(s||'').toLowerCase().replace(/[×х]/g,'x').replace(/,/g,'.').replace(/\s+/g,' ').trim();}
  function apply(){
    var sel={}; ['cat','mat','cores','sec','ex','mfr'].forEach(function(k){sel[k]=$$('input[name="'+k+'"]:checked',form).map(function(i){return i.value;});});
    var q=norm(form.q.value), n=0, act=0;
    Object.keys(sel).forEach(function(k){act+=sel[k].length;}); if(q)act++;
    cards.forEach(function(c){
      var ok=true, d=c.dataset;
      if(sel.cat.length&&sel.cat.indexOf(d.cat)<0)ok=false;
      if(sel.mat.length&&sel.mat.indexOf(d.mat)<0)ok=false;
      if(sel.cores.length&&sel.cores.indexOf(d.cores)<0)ok=false;
      if(sel.sec.length&&sel.sec.indexOf(d.sec)<0)ok=false;
      if(sel.mfr.length){var mf=d.mfr.split('|');if(!sel.mfr.some(function(x){return mf.indexOf(x)>-1;}))ok=false;}
      if(sel.ex.length){var ex=d.ex.split(',');sel.ex.forEach(function(x){if(ex.indexOf(x)<0)ok=false;});}
      if(q){var hay=norm(d.q); q.split(' ').forEach(function(w){if(hay.indexOf(w)<0)ok=false;});}
      c.hidden=!ok; if(ok)n++;
    });
    found.textContent=n; empty.hidden=n>0; var fc=$('[data-f-count]',fr); if(fc)fc.textContent=act?'· выбрано: '+act:'';
    // состояние в URL (без перезагрузки; такие URL закрыты в robots и склеены Clean-param)
    var p=new URLSearchParams(); if(form.q.value)p.set('q',form.q.value); Object.keys(sel).forEach(function(k){if(sel[k].length)p.set(k,sel[k].join(','));});
    var s=p.toString(); history.replaceState(null,'',location.pathname+(s?'?'+s:''));
  }
  form.addEventListener('input',apply); form.addEventListener('change',apply); form.addEventListener('reset',function(){setTimeout(apply,0);});
  apply();
}
/* страница запроса */
var cartBox=$('[data-cart]');
function renderCart(){
  if(!cartBox)return; var c=load();
  if(!c.length){cartBox.innerHTML='<p class="empty-cart">Запрос пока пуст. <a href="'+root+'catalog/">Перейти в каталог</a> или приложите спецификацию ниже.</p>';return;}
  cartBox.innerHTML=c.map(function(it,i){return '<div class="cart-item"><a href="'+root+esc(it.url)+'">'+esc(it.name)+'</a><button class="rm" type="button" data-rm="'+i+'" aria-label="Удалить '+esc(it.name)+'">×</button><div class="ci-ctl"><label class="sr" for="cq'+i+'">Количество</label><input id="cq'+i+'" type="number" min="1" value="'+esc(it.qty)+'" data-qty="'+i+'" inputmode="numeric"><label class="sr" for="cu'+i+'">Единица</label><select id="cu'+i+'" data-unit="'+i+'">'+['м','бухта','барабан'].map(function(u){return '<option'+(u===it.unit?' selected':'')+'>'+u+'</option>';}).join('')+'</select></div></div>';}).join('')+'<p class="hint">Цены и наличие пришлём в КП. Позиций: '+c.length+'.</p>';
}
if(cartBox){renderCart();
  cartBox.addEventListener('click',function(e){var b=e.target.closest('[data-rm]');if(!b)return;var c=load();c.splice(+b.dataset.rm,1);save(c);renderCart();});
  cartBox.addEventListener('change',function(e){var c=load(),t=e.target;if(t.dataset.qty!=null)c[+t.dataset.qty].qty=Math.max(1,+t.value||1);if(t.dataset.unit!=null)c[+t.dataset.unit].unit=t.value;save(c);});
  // данные из квиза
  var qp=new URLSearchParams(location.search), qz=sessionStorage.getItem('quiz_summary'); var ta=$('textarea[name="comment"]');
  if(qz&&ta&&!ta.value) ta.value=qz;
}
var rfq=$('form[data-rfq]');
if(rfq){rfq.addEventListener('submit',function(e){
  e.preventDefault(); var msg=$('[data-msg]',rfq); msg.className='form-msg';
  var err=[]; if(!rfq.name.value.trim())err.push('имя'); if(rfq.phone.value.replace(/\D/g,'').length<10)err.push('телефон');
  if(rfq.inn.value&&!/^(\d{10}|\d{12})$/.test(rfq.inn.value))err.push('ИНН (10 или 12 цифр)');
  if(rfq.email.value&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rfq.email.value))err.push('email');
  var f=rfq.file.files[0]; if(f&&f.size>10*1024*1024)err.push('файл больше 10 МБ');
  if(!rfq.consent.checked)err.push('согласие на обработку ПДн');
  if(!load().length&&!f&&!rfq.comment.value.trim())err.push('позиции, файл или комментарий');
  if(err.length){msg.classList.add('err');msg.textContent='Проверьте: '+err.join(', ')+'.';return;}
  rfq.items.value=JSON.stringify(load());
  var ep=(CFG.lptracker||{}).endpoint;
  if(!ep){msg.classList.add('ok');msg.textContent='Демо-режим: приём заявок не настроен (site.config.js → lptracker.endpoint). Данные никуда не отправлены.';return;}
  var fd=new FormData(rfq); fd.append('page',location.href); fd.append('project',(CFG.lptracker||{}).projectId||'');
  fetch(ep,{method:'POST',body:fd}).then(function(r){if(!r.ok)throw 0; msg.classList.add('ok'); msg.textContent='Запрос отправлен. Мы свяжемся с вами.'; save([]); renderCart(); rfq.reset();})
  .catch(function(){msg.classList.add('err');msg.textContent='Не удалось отправить. Позвоните нам или попробуйте ещё раз.';});
});}
/* квиз */
var qf=$('form[data-quiz]');
if(qf){
  var steps=$$('.q-step',qf), cur=0, bar=$('[data-q-bar]',qf), prev=$('[data-q-prev]',qf), next=$('[data-q-next]',qf);
  var M=JSON.parse(($('#quiz-marks')||{}).textContent||'{}');
  function vals(n){return $$('input[name="'+n+'"]:checked',qf).map(function(i){return i.value;});}
  function show(i){cur=Math.max(0,Math.min(steps.length-1,i));steps.forEach(function(s,k){s.classList.toggle('on',k===cur);});bar.style.width=((cur+1)/steps.length*100)+'%';prev.style.visibility=cur?'visible':'hidden';next.style.display=cur===steps.length-1?'none':'';if(cur===steps.length-1)result(); var t=steps[cur].querySelector('legend'); if(t&&i)t.scrollIntoView({block:'nearest'});}
  function rec(){
    var o=vals('object')[0], L=vals('line'), R=vals('route'), mat=vals('mat')[0], r=[];
    function a(k,why){if(M[k]&&!r.some(function(x){return x.k===k;}))r.push({k:k,why:why});}
    var mass=o==='mass';
    if(L.indexOf('fire')>-1){a(mass?'ppgng-a-frhf':'vvgng-a-frls','питание систем противопожарной защиты — огнестойкое исполнение FR');a('kpsng-a-frls','шлейфы ОПС и линии СОУЭ');a('kvvgng-a-frls','цепи управления СПЗ');}
    if(L.indexOf('power')>-1||L.indexOf('light')>-1){ if(R.indexOf('ground')>-1){a(mat==='al'?'apvbbshv':'vbshvng-a-ls','прокладка в земле — бронированный кабель');}
      if(R.indexOf('inside')>-1||!R.length){ if(mat==='al')a('avvgng-a-ls','внутри зданий, сечения от 16 мм²'); else a('vvgng-a-ls','внутренние сети зданий'); if(L.indexOf('light')>-1)a('vvg-png-a-ls','групповые сети освещения и розеток'); }
      if(R.indexOf('open')>-1&&L.indexOf('air')<0)a('vvgng-a','групповая прокладка в открытых кабельных сооружениях'); }
    if(L.indexOf('control')>-1){a('kvvgng-a-ls','цепи управления и сигнализации');a('kvvgeng-a-ls','если есть электромагнитные помехи');}
    if(L.indexOf('lowv')>-1){a('u-utp-5e','СКС, IP-видеонаблюдение');a('kspv','сигнализация, домофония');}
    if(L.indexOf('mobile')>-1)a('kg','подключение передвижного оборудования');
    if(L.indexOf('air')>-1||o==='outdoor'){a('sip-2','магистрали ВЛ 0,4 кВ');a('sip-4','ответвления и вводы');}
    if(o==='panel'||R.indexOf('cabinet')>-1)a('pugv','монтаж щитов и шкафов');
    if(mass)r.push({k:null,why:'для зданий с массовым пребыванием людей ГОСТ 31565-2012 предусматривает исполнение нг(А)-HF; для детских и лечебных учреждений — нг(А)-LSLTx'});
    if(!r.length)a('vvgng-a-ls','универсальный вариант для внутренних сетей');
    return r;
  }
  function result(){var r=rec(), box=$('[data-q-result]',qf);
    box.innerHTML='<p>Предварительно подходят:</p><ul>'+r.map(function(x){return x.k?'<li><a href="'+root+M[x.k].u+'"><b>'+esc(M[x.k].n)+'</b></a> — '+esc(x.why)+'</li>':'<li>'+esc(x.why)+'</li>';}).join('')+'</ul><p class="hint">Это подсказка, а не проект. Сечение и исполнение определяет проектная документация — пришлите спецификацию, проверим и подготовим КП.</p>';
    var lab=function(n){return $$('input[name="'+n+'"]:checked',qf).map(function(i){return i.parentNode.textContent.trim();}).join('; ');};
    var s='Подбор с сайта: объект — '+lab('object')+'; линии — '+lab('line')+'; прокладка — '+lab('route')+'; материал — '+lab('mat')+'; данные — '+lab('volume')+(qf.meters.value?'; метраж ≈ '+qf.meters.value+' м':'')+'. Рекомендовано: '+r.filter(function(x){return x.k;}).map(function(x){return M[x.k].n;}).join(', ');
    try{sessionStorage.setItem('quiz_summary',s);}catch(e){}
  }
  next.addEventListener('click',function(){var s=steps[cur], need=s.querySelector('input[type=radio],input[type=checkbox]'); if(need&&!s.querySelector('input:checked')){toast('Выберите вариант');return;} show(cur+1);});
  prev.addEventListener('click',function(){show(cur-1);});
  show(0);
}
})();

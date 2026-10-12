// Español en el HTML; el inglés va en data-en. Se recuerda la elección.
(function(){
  var nodes=[].slice.call(document.querySelectorAll('[data-en]'));
  nodes.forEach(function(n){n.setAttribute('data-es',n.innerHTML)});
  function set(lang){
    document.documentElement.lang=lang;
    nodes.forEach(function(n){n.innerHTML=n.getAttribute('data-'+lang)});
    [].forEach.call(document.querySelectorAll('.lang button'),function(b){b.setAttribute('aria-pressed',String(b.dataset.lang===lang))});
    var t=document.querySelector('title');if(t&&t.dataset[lang])document.title=t.dataset[lang];
    try{localStorage.setItem('cardon-lang',lang)}catch(e){}
  }
  var saved=null;try{saved=localStorage.getItem('cardon-lang')}catch(e){}
  var q=(location.search.match(/[?&]lang=(es|en)/)||[])[1];
  set(q||saved||((navigator.language||'es').toLowerCase().indexOf('es')===0?'es':'en'));
  [].forEach.call(document.querySelectorAll('.lang button'),function(b){b.addEventListener('click',function(){set(b.dataset.lang)})});
})();

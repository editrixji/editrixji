/* CONFIG: Replace these if using EmailJS for direct email sending (recommended) */
const EMAILJS_USER_ID = 'REPLACE_EMAILJS_USER_ID';
const EMAILJS_SERVICE_ID = 'REPLACE_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'REPLACE_TEMPLATE_ID';

/* YouTube IDs default — replace with your own from @editrix_ji channel */
const YOUTUBE_VIDEO_IDS = [
  'REPLACE_VIDEO_ID_1',
  'REPLACE_VIDEO_ID_2',
  'REPLACE_VIDEO_ID_3',
  'REPLACE_VIDEO_ID_4'
];

/* Initialize EmailJS if configured */
if (typeof emailjs !== 'undefined' && EMAILJS_USER_ID.indexOf('REPLACE') === -1) {
  emailjs.init(EMAILJS_USER_ID);
  console.log('EmailJS initialized');
}

/* Mobile menu toggle */
document.addEventListener('click', (e)=>{
  if(e.target.id === 'hamburger'){
    const mm = document.getElementById('mobileMenu');
    mm.style.display = mm.style.display === 'block' ? 'none' : 'block';
  }
});

/* Discount popup: show once per session */
window.addEventListener('load', ()=> {
  if(!sessionStorage.getItem('discountSeen')){
    setTimeout(()=> openModal('discountModal'), 1200);
    sessionStorage.setItem('discountSeen','1');
  }
});

/* Modal helpers */
function openModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.add('open');
}
function closeModal(id){
  const el = document.getElementById(id);
  if(el) el.classList.remove('open');
}

/* Chat toggles */
function toggleChat(){ document.getElementById('chatWindow').classList.toggle('open'); }
document.getElementById && document.getElementById('chatToggle') && document.getElementById('chatToggle').addEventListener('click', toggleChat);

/* Render YouTube videos on videos page */
function renderVideos(){
  const container = document.getElementById('videosList');
  if(!container) return;
  container.innerHTML = '';
  const ids = YOUTUBE_VIDEO_IDS.filter(Boolean);
  if(!ids.length){
    container.innerHTML = `<div style="color:var(--muted)">No video IDs found. Replace YOUTUBE_VIDEO_IDS in script.js with your video IDs from @editrix_ji.</div>`;
    return;
  }
  ids.slice(0,6).forEach(id=>{
    const wrap = document.createElement('div'); wrap.className='video-responsive';
    wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${id}?rel=0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    container.appendChild(wrap);
  });
}
document.addEventListener('DOMContentLoaded', renderVideos);

/* Save messages locally (admin demo) */
function saveMessageLocally(obj){
  const arr = JSON.parse(localStorage.getItem('editrix_messages')||'[]');
  arr.unshift(Object.assign({id:Date.now(), created: new Date().toISOString()}, obj));
  localStorage.setItem('editrix_messages', JSON.stringify(arr));
}

/* Contact form handler:
   - If EmailJS configured: send via EmailJS.
   - Else fallback: open mailto: with prefilled content.
*/
async function handleContactForm(formId, statusId){
  const form = document.getElementById(formId);
  const status = document.getElementById(statusId);
  if(!form || !status) return;
  const data = new FormData(form);
  const obj = {};
  for(const [k,v] of data.entries()) obj[k]=v;

  status.textContent = 'Sending...';

  if(EMAILJS_USER_ID.indexOf('REPLACE') === -1 && typeof emailjs !== 'undefined'){
    try{
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, obj);
      status.textContent = 'Message sent — I will contact you soon.';
      saveMessageLocally({name:obj.name,email:obj.email,service:obj.service,budget:obj.budget,message:obj.message});
      form.reset();
    }catch(err){
      status.textContent = 'Email failed — opening your mail app…';
      openMailFallback(obj);
      saveMessageLocally({name:obj.name,email:obj.email,service:obj.service,budget:obj.budget,message:obj.message});
    }
  } else {
    openMailFallback(obj);
    saveMessageLocally({name:obj.name,email:obj.email,service:obj.service,budget:obj.budget,message:obj.message});
    status.textContent = 'Mail draft opened — complete and send it.';
    form.reset();
  }
}

/* Open mail client with prefilled content (fallback) */
function openMailFallback(obj){
  const subject = encodeURIComponent(`Editrix Inquiry — ${obj.service || 'General'} — ${obj.name || ''}`);
  const body = encodeURIComponent(Object.entries(obj).map(([k,v]) => `${k}: ${v}`).join('\n\n'));
  location.href = `mailto:editrix.ji@gmail.com?subject=${subject}&body=${body}`;
}

/* Buy modal submit (similar to contact) */
async function submitBuyForm(e){
  e.preventDefault();
  const name = document.getElementById('buyName').value.trim();
  const email = document.getElementById('buyEmail').value.trim();
  const phone = document.getElementById('buyPhone').value.trim();
  const plan = document.getElementById('buyPlan').value;
  const price = document.getElementById('buyPrice').value;
  if(!name||!email||!phone){ document.getElementById('buyStatus').textContent = 'Please fill all fields.'; return false; }
  const payload = {name,email,phone,plan,price,promo:'EDITRIX80'};

  if(EMAILJS_USER_ID.indexOf('REPLACE') === -1 && typeof emailjs !== 'undefined'){
    try{
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, payload);
      document.getElementById('buyStatus').textContent = 'Reserved — we will contact you by email.';
      saveMessageLocally({name,email,service:plan,budget:price,message:`Reservation (promo EDITRIX80). Phone: ${phone}`});
      setTimeout(()=> closeModal('buyModal'), 1200);
    }catch(err){
      document.getElementById('buyStatus').textContent = 'Failed to send via EmailJS. Opening mail client…';
      openMailFallback(payload);
      saveMessageLocally({name,email,service:plan,budget:price,message:`Reservation (promo EDITRIX80). Phone: ${phone}`});
    }
  } else {
    openMailFallback(payload);
    saveMessageLocally({name,email,service:plan,budget:price,message:`Reservation (promo EDITRIX80). Phone: ${phone}`});
    document.getElementById('buyStatus').textContent = 'Email draft opened — complete to send.';
    setTimeout(()=> closeModal('buyModal'), 800);
  }
  return false;
}

/* Chat save (local) */
function sendChat(){
  const input = document.getElementById('chatInput');
  if(!input) return;
  const text = input.value.trim(); if(!text) return;
  const arr = JSON.parse(localStorage.getItem('editrix_chats')||'[]');
  arr.push({id:Date.now(), text, me:true, created:new Date().toISOString()});
  localStorage.setItem('editrix_chats', JSON.stringify(arr));
  saveMessageLocally({name:'(chat)', email:'', service:'Chat', budget:'', message:text});
  input.value='';
  renderChats();
}
function renderChats(){
  const wrap = document.getElementById('chatMessages');
  if(!wrap) return;
  const arr = JSON.parse(localStorage.getItem('editrix_chats')||'[]');
  if(!arr.length){ wrap.innerHTML = '<div class="bubble">No previous chats</div>'; return; }
  wrap.innerHTML = arr.map(m=>`<div class="bubble ${m.me? 'me':''}">${escapeHtml(m.text)}</div>`).join('');
  wrap.scrollTop = wrap.scrollHeight;
}
function escapeHtml(s){ if(!s) return ''; return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
document.addEventListener('DOMContentLoaded', renderChats);

/* Login demo */
function doDemoLogin(e){
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  if(email === 'admin@editrix.com' && pass === 'Pass1234'){
    localStorage.setItem('editrix_admin', JSON.stringify({email,logged:true}));
    closeModal('loginModal');
    openModal('adminModal');
    renderAdminData();
  } else {
    document.getElementById('loginResult') && (document.getElementById('loginResult').textContent = 'Invalid credentials (demo).');
  }
}
function renderAdminData(){
  const msgs = JSON.parse(localStorage.getItem('editrix_messages')||'[]');
  const chats = JSON.parse(localStorage.getItem('editrix_chats')||'[]');
  const mb = document.getElementById('adminMessages');
  const cb = document.getElementById('adminChats');
  if(mb) mb.innerHTML = msgs.length ? msgs.map(m=>`<div style="padding:10px;border-bottom:1px solid rgba(255,255,255,.03)"><div style="font-weight:800">${escapeHtml(m.name)} <span style="color:var(--muted);font-weight:600">(${escapeHtml(m.service||'')})</span></div><div style="color:var(--muted);font-size:13px">${escapeHtml(m.email)} • ${new Date(m.created).toLocaleString()}</div><div style="margin-top:6px">${escapeHtml(m.message)}</div></div>`).join('') : '<div style="color:var(--muted)">No messages</div>';
  if(cb) cb.innerHTML = chats.length ? chats.map(c=>`<div style="padding:8px;border-bottom:1px solid rgba(255,255,255,.03)"><div style="color:var(--muted);font-size:12px">${new Date(c.created).toLocaleString()}</div><div style="margin-top:6px">${escapeHtml(c.text)}</div></div>`).join('') : '<div style="color:var(--muted)">No chats</div>';
}

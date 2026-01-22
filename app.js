import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCnayL9y6dBtsHyc55fA9zvU5qI361LTe8",
  authDomain: "boutique-boissons.firebaseapp.com",
  projectId: "boutique-boissons",
  storageBucket: "boutique-boissons.firebasestorage.app",
  messagingSenderId: "997905411307",
  appId: "1:997905411307:web:94e454c8e80a3c746d62ae"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let produits = [];
let panier = [];
let user = JSON.parse(localStorage.getItem('user')) || null;
let isAdminMode = false;

const initBoutique = async () => {
    onSnapshot(collection(db, "produits"), (snap) => {
        produits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.afficherProduits(produits);
    });
};
initBoutique();

window.afficherProduits = (liste) => {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = liste.map(p => `
        <div class="product-card ${!p.stock ? 'oos' : ''}">
            <span class="product-img">${p.img}</span>
            <h3>${p.nom}</h3>
            ${isAdminMode ? `
                <div style="background:#f0f0f0; padding:8px; border-radius:10px; margin-top:5px;">
                    <input type="number" value="${p.prixDet}" onchange="window.updProd('${p.id}','prixDet',this.value)" style="width:60px; font-size:0.7rem">
                    <input type="number" value="${p.prixGros}" onchange="window.updProd('${p.id}','prixGros',this.value)" style="width:60px; font-size:0.7rem">
                    <button onclick="window.updProd('${p.id}','stock', ${!p.stock})" style="display:block; width:100%; margin-top:5px; font-size:0.6rem; background:var(--dark);">
                        ${p.stock ? 'En Stock' : 'Épuisé'}
                    </button>
                </div>
            ` : `
                <div class="pricing-zone">
                    <label class="price-row"><input type="radio" name="t-${p.id}" value="det" checked> Détail: <span class="price-val">${p.prixDet}F</span></label>
                    <label class="price-row"><input type="radio" name="t-${p.id}" value="gros"> Gros: <span class="price-val">${p.prixGros}F</span></label>
                </div>
                <button class="add-btn" ${!p.stock ? 'disabled' : ''} onclick="window.ajouterPanier('${p.id}')">
                    ${p.stock ? '🛒 Ajouter' : 'ÉPUISÉ'}
                </button>
            `}
        </div>
    `).join('');
};

window.ajouterPanier = (id) => {
    const p = produits.find(prod => prod.id === id);
    const type = document.querySelector(`input[name="t-${id}"]:checked`).value;
    const nomUnique = p.nom + (type === 'det' ? ' (D)' : ' (G)');
    const existant = panier.find(item => item.nom === nomUnique);
    if (existant) { existant.qty += 1; } 
    else { panier.push({ nom: nomUnique, prix: (type === 'det' ? p.prixDet : p.prixGros), qty: 1 }); }
    window.majPanierUI();
};

window.majPanierUI = () => {
    document.getElementById('cart-count').innerText = panier.reduce((a, b) => a + b.qty, 0);
    const total = panier.reduce((a, b) => a + (b.prix * b.qty), 0);
    document.getElementById('cart-total').innerText = total;
    document.getElementById('cart-items').innerHTML = panier.map((i, idx) => `
        <div class="cart-item">
            <div style="text-align:left">
                <span style="font-weight:600;"><span class="qty-badge">${i.qty}x</span>${i.nom}</span>
                <br><small>${i.prix * i.qty} F</small>
            </div>
            <button onclick="panier.splice(${idx},1); window.majPanierUI();" style="background:var(--danger); color:white; border:none; padding:5px; border-radius:5px;">🗑️</button>
        </div>
    `).join('');
};

window.goToCheckout = async () => {
    if(!user || !localStorage.getItem('isL')) return window.toggleAuthModal();
    if(panier.length === 0) return;
    const total = document.getElementById('cart-total').innerText;
    const liste = panier.map(i => `- ${i.qty}x ${i.nom}`).join('\n');
    const numAdmin = "22892239333"; // REMPLACE PAR TON NUMÉRO
    const msg = encodeURIComponent(`📦 *COMMANDE DRINKEXPRESS*\n\n*Client:* ${user.name}\n*Lieu:* ${user.address}\n*Tél:* ${user.phone}\n\n*Articles:*\n${liste}\n\n*TOTAL: ${total} F*`);
    window.open(`https://wa.me/${numAdmin}?text=${msg}`, '_blank');
    panier = []; window.majPanierUI(); window.toggleCart();
};

window.adminAccess = () => {
    if(prompt("Code Admin :") === "0000") {
        isAdminMode = !isAdminMode;
        document.getElementById('admin-panel').style.display = isAdminMode ? 'block' : 'none';
        window.afficherProduits(produits);
    }
};

window.handleRegister = () => {
    const name = document.getElementById('reg-name').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const addr = document.getElementById('reg-address').value.trim();
    const pass = document.getElementById('reg-pass').value;
    const passC = document.getElementById('reg-pass-confirm').value;
    if(!name || !phone || !addr || pass !== passC) return alert("Vérifiez vos informations !");
    user = { name, phone: document.getElementById('reg-prefix').value + phone, address: addr, pass };
    localStorage.setItem('user', JSON.stringify(user)); window.switchAuth('login');
};

window.handleLogin = () => {
    const n = document.getElementById('login-name').value;
    const p = document.getElementById('login-pass').value;
    if(user && n === user.name && p === user.pass) { localStorage.setItem('isL', '1'); location.reload(); }
    else { alert("Erreur !"); }
};

window.updProd = async (id, f, v) => { await updateDoc(doc(db, "produits", id), { [f]: (f==='stock'? v : parseInt(v)) }); };
window.filter = (c) => window.afficherProduits(c === 'all' ? produits : produits.filter(p => p.cat === c));
window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('active');
window.toggleAuthModal = () => document.getElementById('auth-modal').style.display = (document.getElementById('auth-modal').style.display==='block'?'none':'block');
window.switchAuth = (v) => { document.getElementById('login-view').style.display=(v==='login'?'block':'none'); document.getElementById('register-view').style.display=(v==='register'?'block':'none'); };

window.onload = () => {
    if(user && localStorage.getItem('isL')) {
        document.getElementById('btn-login-open').style.display='none';
        document.getElementById('user-welcome').style.display='block';
        document.getElementById('user-display-name').innerText = user.name;
    }
};

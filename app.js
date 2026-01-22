import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, getDocs, query, where, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// INITIALISATION
const initBoutique = async () => {
    onSnapshot(collection(db, "produits"), (snap) => {
        produits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.afficherProduits(produits);
    });
};
initBoutique();

window.afficherProduits = (liste) => {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = liste.map(p => `
        <div class="product-card ${!p.stock ? 'oos' : ''}">
            <span class="product-img">${p.img}</span>
            <h3>${p.nom}</h3>
            ${isAdminMode ? `
                <div style="background:#f0f0f0; padding:5px; border-radius:8px; margin-top:5px;">
                    <input type="number" value="${p.prixDet}" onchange="window.updProd('${p.id}','prixDet',this.value)" style="width:55px; font-size:0.7rem">
                    <input type="number" value="${p.prixGros}" onchange="window.updProd('${p.id}','prixGros',this.value)" style="width:55px; font-size:0.7rem">
                    <button onclick="window.updProd('${p.id}','stock', ${!p.stock})" style="display:block; width:100%; margin-top:5px; font-size:0.6rem;">
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

// --- PANIER : MULTIPLICATION ET SÉPARATION D/G ---
window.ajouterPanier = (id) => {
    const p = produits.find(prod => prod.id === id);
    const type = document.querySelector(`input[name="t-${id}"]:checked`).value;
    const nomUnique = p.nom + (type === 'det' ? ' (D)' : ' (G)');
    
    const existant = panier.find(item => item.nom === nomUnique);
    if (existant) { existant.qty += 1; } 
    else { panier.push({ nom: nomUnique, prix: (type === 'det' ? p.prixDet : p.prixGros), qty: 1 }); }
    window.majPanierUI();
};

window.supprimerDuPanier = (index) => {
    panier.splice(index, 1);
    window.majPanierUI();
};

window.majPanierUI = () => {
    document.getElementById('cart-count').innerText = panier.reduce((a, b) => a + b.qty, 0);
    const total = panier.reduce((a, b) => a + (b.prix * b.qty), 0);
    document.getElementById('cart-total').innerText = total;
    document.getElementById('cart-items').innerHTML = panier.map((i, idx) => `
        <div class="cart-item">
            <div style="text-align:left">
                <span style="display:block; font-weight:600;"><span class="qty-badge">${i.qty}x</span>${i.nom}</span>
                <small>${i.prix * i.qty} F</small>
            </div>
            <button class="btn-remove" onclick="window.supprimerDuPanier(${idx})">🗑️</button>
        </div>
    `).join('');
};

// --- NOTIFICATION WHATSAPP ---
window.goToCheckout = async () => {
    if(!user || !localStorage.getItem('isL')) {
        alert("Connectez-vous d'abord !"); return window.toggleAuthModal();
    }
    if(panier.length === 0) return alert("Panier vide");

    const total = document.getElementById('cart-total').innerText;
    const listeTexte = panier.map(i => `- ${i.qty}x ${i.nom}`).join('\n');

    await addDoc(collection(db, "commandes"), { 
        client: user.name, tel: user.phone, adresse: user.address, 
        articles: panier, total: total, statut: "En attente", date: new Date() 
    });

    const numAdmin = "22892239333"; // <--- METS TON NUMÉRO ICI
    const msg = encodeURIComponent(`📦 *NOUVELLE COMMANDE*\n\n*Client:* ${user.name}\n*Tél:* ${user.phone}\n\n*Articles:*\n${listeTexte}\n\n*TOTAL : ${total} F*`);
    window.open(`https://wa.me/${numAdmin}?text=${msg}`, '_blank');

    alert("Commande envoyée !");
    panier = []; window.majPanierUI(); window.toggleCart();
};

// --- ADMIN : TIRÉS ET HISTORIQUE ---
window.showAdminSection = (s) => {
    const content = document.getElementById('admin-content');
    isAdminMode = (s === 'products');
    window.afficherProduits(produits);
    
    if(s === 'orders' || s === 'history') {
        const stat = (s === 'orders') ? "En attente" : "Livré";
        const q = query(collection(db, "commandes"), where("statut", "==", stat), orderBy("date", "desc"));
        onSnapshot(q, (snap) => {
            content.innerHTML = `<h3>${s === 'orders' ? '📦 Commandes' : '📜 Historique'}</h3>` + snap.docs.map(d => {
                const c = d.data();
                return `
                <div class="order-card">
                    <div class="order-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                        <span>👤 ${c.client}</span> <b>${c.total} F 🔽</b>
                    </div>
                    <div class="order-details" style="display:none; padding-top:10px;">
                        <p>📞 ${c.tel} | 📍 ${c.adresse}</p>
                        <ul class="order-items-list">${c.articles.map(a => `<li>${a.qty}x ${a.nom}</li>`).join('')}</ul>
                        ${s === 'orders' ? `<button class="btn-delivered" onclick="window.marquerLivrer('${d.id}')">Livré ✅</button>` : ''}
                    </div>
                </div>`;
            }).join('');
        });
    } else { content.innerHTML = `<p>Modifiez les fiches en bas.</p>`; }
};

window.marquerLivrer = async (id) => { await updateDoc(doc(db, "commandes", id), { statut: "Livré" }); };
window.updProd = async (id, f, v) => { await updateDoc(doc(db, "produits", id), { [f]: (f==='stock'? v : parseInt(v)) }); };

// NAVIGATION ET AUTH (Garder intact)
window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('active');
window.toggleAuthModal = () => { document.getElementById('auth-modal').style.display = (document.getElementById('auth-modal').style.display==='block'?'none':'block'); };
window.switchAuth = (v) => { document.getElementById('login-view').style.display=(v==='login'?'block':'none'); document.getElementById('register-view').style.display=(v==='register'?'block':'none'); };
window.handleRegister = () => {
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-prefix').value + document.getElementById('reg-phone').value;
    const addr = document.getElementById('reg-address').value;
    const pass = document.getElementById('reg-pass').value;
    user = { name, phone, address: addr, pass };
    localStorage.setItem('user', JSON.stringify(user)); window.switchAuth('login');
};
window.handleLogin = () => {
    const n = document.getElementById('login-name').value;
    const p = document.getElementById('login-pass').value;
    if(user && n === user.name && p === user.pass) { localStorage.setItem('isL', '1'); location.reload(); }
    else { alert("Erreur"); }
};
window.filter = (c) => window.afficherProduits(c === 'all' ? produits : produits.filter(p => p.cat === c));
window.adminAccess = () => {
    const pnl = document.getElementById('admin-panel');
    if(pnl.style.display === 'none') {
        if(prompt("Code Admin :") === "0000") { pnl.style.display = 'block'; window.showAdminSection('orders'); }
    } else { pnl.style.display = 'none'; isAdminMode = false; window.afficherProduits(produits); }
};
window.onload = () => {
    if(user && localStorage.getItem('isL')) {
        document.getElementById('btn-login-open').style.display='none';
        document.getElementById('user-welcome').style.display='block';
        document.getElementById('user-display-name').innerText = user.name;
    }
};

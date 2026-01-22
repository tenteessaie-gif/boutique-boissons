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

// TES ARTICLES DE RÉFÉRENCE
const articlesInitiaux = [
    { nom: "Rush Energy (Canette)", prixDet: 500, prixGros: 11000, cat: "energy", stock: true, img: "⚡" },
    { nom: "Biggo Orange", prixDet: 600, prixGros: 6500, cat: "energy", stock: true, img: "🥤" },
    { nom: "Biggo Cola", prixDet: 600, prixGros: 6500, cat: "energy", stock: true, img: "🥤" },
    { nom: "Malta Guinness", prixDet: 800, prixGros: 18500, cat: "soda", stock: true, img: "🍺" },
    { nom: "Youki Cocktail", prixDet: 600, prixGros: 6500, cat: "soda", stock: true, img: "🍹" },
    { nom: "Sprite Canette", prixDet: 700, prixGros: 16000, cat: "soda", stock: true, img: "🍋" },
    { nom: "Casavino Petit", prixDet: 1500, prixGros: 16500, cat: "wine", stock: true, img: "🍷" }
];

let produits = [];
let panier = [];
let user = JSON.parse(localStorage.getItem('user')) || null;
let isAdminMode = false;

// INITIALISATION ET SYNC
const initBoutique = async () => {
    const querySnapshot = await getDocs(collection(db, "produits"));
    // Si la base est vide, on injecte les articles
    if (querySnapshot.empty) {
        for(let art of articlesInitiaux) { await addDoc(collection(db, "produits"), art); }
    }
    
    // Écoute en temps réel
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
                <div style="background:#f0f0f0; padding:10px; border-radius:10px; margin-top:10px;">
                    <p style="font-size:0.7rem">Prix Det / Gros</p>
                    <input type="number" value="${p.prixDet}" onchange="window.updProd('${p.id}','prixDet',this.value)" style="width:65px">
                    <input type="number" value="${p.prixGros}" onchange="window.updProd('${p.id}','prixGros',this.value)" style="width:65px">
                    <button onclick="window.updProd('${p.id}','stock', ${!p.stock})" style="display:block; width:100%; margin-top:5px;">
                        ${p.stock ? 'En Stock ✅' : 'Épuisé ❌'}
                    </button>
                </div>
            ` : `
                <div class="pricing-zone">
                    <label class="price-row"><input type="radio" name="t-${p.id}" value="det" checked> Détail: <span class="price-val">${p.prixDet} F</span></label>
                    <label class="price-row"><input type="radio" name="t-${p.id}" value="gros"> Gros: <span class="price-val">${p.prixGros} F</span></label>
                </div>
                <button class="add-btn" ${!p.stock ? 'disabled' : ''} onclick="window.ajouterPanier('${p.id}')">
                    ${p.stock ? '🛒 Ajouter' : 'ÉPUISÉ'}
                </button>
            `}
        </div>
    `).join('');
};

// --- GESTION PANIER ---
window.ajouterPanier = (id) => {
    const p = produits.find(prod => prod.id === id);
    const type = document.querySelector(`input[name="t-${id}"]:checked`).value;
    panier.push({ nom: p.nom + (type==='det'?' (D)':' (G)'), prix: type==='det'?p.prixDet:p.prixGros });
    window.majPanierUI();
};

window.supprimerDuPanier = (index) => {
    panier.splice(index, 1);
    window.majPanierUI();
};

window.majPanierUI = () => {
    document.getElementById('cart-count').innerText = panier.length;
    document.getElementById('cart-total').innerText = panier.reduce((a,b)=>a+b.prix,0);
    document.getElementById('cart-items').innerHTML = panier.map((i, idx)=> `
        <div class="cart-item">
            <div style="text-align:left">
                <span style="display:block; font-weight:600; font-size:0.9rem;">${i.nom}</span>
                <small>${i.prix} F</small>
            </div>
            <button class="btn-remove" onclick="window.supprimerDuPanier(${idx})">🗑️</button>
        </div>
    `).join('');
};

window.goToCheckout = async () => {
    if(!user || !localStorage.getItem('isL')) {
        alert("Action impossible : Connectez-vous ou créez un compte d'abord !");
        return window.toggleAuthModal();
    }
    if(panier.length === 0) return alert("Votre panier est vide");
    
    await addDoc(collection(db, "commandes"), { 
        client: user.name, tel: user.phone, adresse: user.address, 
        articles: panier, total: document.getElementById('cart-total').innerText, 
        statut: "En attente", date: new Date() 
    });
    alert("Commande envoyée ! Nous vous contacterons.");
    panier=[]; window.majPanierUI(); window.toggleCart();
};

// --- GESTION ADMIN ---
window.adminAccess = () => {
    const pnl = document.getElementById('admin-panel');
    if(pnl.style.display === 'none') {
        if(prompt("Code Secret Admin :") === "0000") {
            pnl.style.display = 'block';
            window.showAdminSection('orders');
        }
    } else {
        pnl.style.display = 'none'; isAdminMode = false; window.afficherProduits(produits);
    }
};

window.showAdminSection = (s) => {
    const content = document.getElementById('admin-content');
    isAdminMode = (s === 'products');
    window.afficherProduits(produits);
    
    if(s === 'orders') {
        onSnapshot(query(collection(db, "commandes"), where("statut", "==", "En attente")), (snap) => {
            content.innerHTML = `<h3>📦 Commandes en attente (${snap.size})</h3>` + snap.docs.map(d => {
                const c = d.data();
                return `
                <div class="order-card">
                    <div class="order-header" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
                        <span>👤 ${c.client}</span> <b>${c.total} F 🔽</b>
                    </div>
                    <div class="order-details" style="display:none; padding-top:10px; border-top:1px solid #eee; margin-top:5px;">
                        <p>📞 <b>Tél:</b> ${c.tel}</p>
                        <p>📍 <b>Adresse:</b> ${c.adresse}</p>
                        <p>🛒 <b>Articles:</b> ${c.articles.map(a => a.nom).join(', ')}</p>
                        <button class="btn-delivered" onclick="window.marquerLivrer('${d.id}')">Marquer comme Livré ✅</button>
                    </div>
                </div>`;
            }).join('');
        });
    } else if(s === 'history') {
        onSnapshot(query(collection(db, "commandes"), where("statut", "==", "Livré"), orderBy("date", "desc")), (snap) => {
            content.innerHTML = `<h3>📜 Historique des ventes</h3>` + snap.docs.map(d => {
                const c = d.data();
                const dateCmd = c.date ? c.date.toDate().toLocaleDateString() : 'Ancienne';
                return `<div class="order-card" style="opacity:0.8"><b>${c.client}</b> - ${c.total} F (Livré le ${dateCmd})</div>`;
            }).join('');
        });
    } else { content.innerHTML = `<p>👉 Modifiez les prix et le stock directement sur les fiches produits ci-dessous.</p>`; }
};

window.marquerLivrer = async (id) => { 
    if(confirm("Confirmer la livraison et archiver ?")) {
        await updateDoc(doc(db, "commandes", id), { statut: "Livré" }); 
    }
};

window.updProd = async (id, f, v) => { 
    await updateDoc(doc(db, "produits", id), { [f]: (f==='stock'? v : parseInt(v)) }); 
};

// --- AUTH & NAV ---
window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('active');
window.toggleAuthModal = () => { document.getElementById('auth-modal').style.display = (document.getElementById('auth-modal').style.display==='block'?'none':'block'); };
window.switchAuth = (v) => { document.getElementById('login-view').style.display=(v==='login'?'block':'none'); document.getElementById('register-view').style.display=(v==='register'?'block':'none'); };

window.handleRegister = () => {
    const name = document.getElementById('reg-name').value;
    const phone = document.getElementById('reg-prefix').value + document.getElementById('reg-phone').value;
    const addr = document.getElementById('reg-address').value;
    const pass = document.getElementById('reg-pass').value;
    if(!name || !phone || !pass) return alert("Remplissez tous les champs !");
    user = { name, phone, address: addr, pass };
    localStorage.setItem('user', JSON.stringify(user)); 
    alert("Compte créé ! Connectez-vous maintenant.");
    window.switchAuth('login');
};

window.handleLogin = () => {
    const n = document.getElementById('login-name').value;
    const p = document.getElementById('login-pass').value;
    if(user && n === user.name && p === user.pass) {
        localStorage.setItem('isL', '1'); 
        location.reload();
    } else { alert("Nom ou code secret incorrect !"); }
};

window.filter = (c) => window.afficherProduits(c === 'all' ? produits : produits.filter(p => p.cat === c));

window.onload = () => {
    if(user && localStorage.getItem('isL')) {
        document.getElementById('btn-login-open').style.display='none';
        document.getElementById('user-welcome').style.display='block';
        document.getElementById('user-display-name').innerText = user.name;
    }
};

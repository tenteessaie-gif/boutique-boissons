import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// TES ARTICLES ORIGINAUX (Pour l'initialisation)
const articlesInitiaux = [
    { nom: "Rush Energy (Canette)", prixDet: 500, prixGros: 11000, cat: "energy", stock: true, img: "⚡" },
    { nom: "Biggo Orange", prixDet: 600, prixGros: 6500, cat: "energy", stock: true, img: "🥤" },
    { nom: "Biggo Cola", prixDet: 600, prixGros: 6500, cat: "energy", stock: true, img: "🥤" },
    { nom: "Malta Guinness", prixDet: 800, prixGros: 18500, cat: "soda", stock: true, img: "🍺" },
    { nom: "Sprite Canette", prixDet: 700, prixGros: 16000, cat: "soda", stock: true, img: "🍋" },
    { nom: "Voddy", prixDet: 1000, prixGros: 22000, cat: "soda", stock: true, img: "🍸" },
    { nom: "Casavino Petit", prixDet: 1500, prixGros: 16500, cat: "wine", stock: true, img: "🍷" }
];

let produits = [];
let panier = [];
let user = JSON.parse(localStorage.getItem('user')) || null;
let isAdmin = false;

// --- FONCTION D'AFFICHAGE (TON DESIGN EXACT) ---
window.afficherProduits = (liste) => {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = liste.map(p => `
        <div class="product-card ${!p.stock ? 'oos' : ''}">
            <span class="product-img">${p.img}</span>
            <h3>${p.nom}</h3>
            ${isAdmin ? `
                <div class="admin-card-tools" style="background:#eee; padding:10px; border-radius:10px; margin-top:10px;">
                    <p style="font-size:0.7rem">Prix Det / Gros</p>
                    <input type="number" value="${p.prixDet}" onchange="window.upd('${p.id}','prixDet',this.value)" style="width:70px">
                    <input type="number" value="${p.prixGros}" onchange="window.upd('${p.id}','prixGros',this.value)" style="width:70px">
                    <button onclick="window.upd('${p.id}','stock', ${!p.stock})">${p.stock ? 'En Stock ✅' : 'Épuisé ❌'}</button>
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

// --- SYNC FIREBASE ---
const initBoutique = async () => {
    const querySnapshot = await getDocs(collection(db, "produits"));
    if (querySnapshot.empty) {
        // Si Firebase est vide, on envoie tes articles
        for(let art of articlesInitiaux) { await addDoc(collection(db, "produits"), art); }
    }
    
    // Écoute en temps réel
    onSnapshot(collection(db, "produits"), (snap) => {
        produits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        window.afficherProduits(produits);
    });
};

initBoutique();

// --- LOGIQUE ADMIN ---
window.adminAccess = () => {
    if(prompt("Code Admin :") === "0000") {
        isAdmin = !isAdmin;
        document.getElementById('admin-orders-zone').style.display = isAdmin ? 'block' : 'none';
        window.afficherProduits(produits);
        if(isAdmin) window.chargerCommandes();
    }
};

window.upd = async (id, f, v) => {
    const val = (f === 'stock') ? v : parseInt(v);
    await updateDoc(doc(db, "produits", id), { [f]: val });
};

window.chargerCommandes = () => {
    onSnapshot(query(collection(db, "commandes"), where("statut", "==", "En attente")), (snap) => {
        const zone = document.getElementById('admin-orders-zone');
        zone.innerHTML = `<h3>📦 Commandes en attente</h3>` + snap.docs.map(d => {
            const c = d.data();
            return `<div style="background:white; padding:10px; margin:5px; border-radius:10px;">
                <b>${c.client}</b> - ${c.total}F <button onclick="window.livrer('${d.id}')">OK</button>
            </div>`;
        }).join('');
    });
};
window.livrer = async (id) => await updateDoc(doc(db, "commandes", id), { statut: "Livré" });

// --- FONCTIONS INTERFACE (INDISPENSABLES) ---
window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('active');
window.toggleAuthModal = () => {
    const m = document.getElementById('auth-modal');
    m.style.display = (m.style.display === 'block') ? 'none' : 'block';
};
window.switchAuth = (v) => {
    document.getElementById('login-view').style.display = (v === 'login') ? 'block' : 'none';
    document.getElementById('register-view').style.display = (v === 'register') ? 'block' : 'none';
};

window.ajouterPanier = (id) => {
    const p = produits.find(prod => prod.id === id);
    const type = document.querySelector(`input[name="t-${id}"]:checked`).value;
    panier.push({ nom: p.nom + (type==='det'?' (D)':' (G)'), prix: type==='det'?p.prixDet:p.prixGros });
    document.getElementById('cart-count').innerText = panier.length;
    document.getElementById('cart-total').innerText = panier.reduce((a,b)=>a+b.prix,0);
    document.getElementById('cart-items').innerHTML = panier.map(i=>`<div class="cart-item"><span>${i.nom}</span><b>${i.prix}F</b></div>`).join('');
};

window.goToCheckout = async () => {
    if(!user) return window.toggleAuthModal();
    if(panier.length === 0) return alert("Vide !");
    await addDoc(collection(db, "commandes"), { 
        client: user.name, 
        tel: user.phone, 
        adresse: user.address, 
        articles: panier, 
        total: document.getElementById('cart-total').innerText, 
        statut: "En attente" 
    });
    alert("Commande envoyée !"); panier=[]; location.reload();
};

window.handleRegister = () => {
    const phone = document.getElementById('reg-prefix').value + document.getElementById('reg-phone').value;
    user = { name: document.getElementById('reg-name').value, phone: phone, address: document.getElementById('reg-address').value, pass: document.getElementById('reg-pass').value };
    localStorage.setItem('user', JSON.stringify(user));
    window.switchAuth('login');
};

window.handleLogin = () => {
    const n = document.getElementById('login-name').value;
    const p = document.getElementById('login-pass').value;
    if(user && n === user.name && p === user.pass) {
        localStorage.setItem('isL', '1');
        location.reload();
    } else { alert("Erreur"); }
};

window.filter = (c) => window.afficherProduits(c === 'all' ? produits : produits.filter(p => p.cat === c));

window.onload = () => {
    if(user && localStorage.getItem('isL')) {
        document.getElementById('btn-login-open').style.display = 'none';
        document.getElementById('user-welcome').style.display = 'block';
        document.getElementById('user-display-name').innerText = user.name;
    }
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let produits = [
    { id: "test1", nom: "Chargement des produits...", prixDet: 0, prixGros: 0, cat: "all", stock: true, img: "⏳" }
];
let panier = [];
let isAdmin = false;

// --- AFFICHAGE ---
window.afficherProduits = (liste) => {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = liste.map(p => `
        <div class="product-card ${!p.stock ? 'oos' : ''}">
            <span style="font-size:40px">${p.img || '🥤'}</span>
            <h3>${p.nom}</h3>
            <div class="pricing-zone">
                <div class="price-row">Détail: <span>${p.prixDet} F</span></div>
                <div class="price-row">Gros: <span>${p.prixGros} F</span></div>
            </div>
            <button class="add-btn ${!p.stock ? 'btn-oos' : ''}" onclick="window.ajouter('${p.id}')">
                ${p.stock ? '🛒 Ajouter' : 'ÉPUISÉ'}
            </button>
        </div>
    `).join('');
};

// --- LOGIQUE BOUTONS ---
window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('active');
window.toggleAuthModal = () => {
    const m = document.getElementById('auth-modal');
    m.style.display = (m.style.display === 'block') ? 'none' : 'block';
};
window.switchAuth = (v) => {
    document.getElementById('login-view').style.display = v==='login'?'block':'none';
    document.getElementById('register-view').style.display = v==='register'?'block':'none';
};

window.ajouter = (id) => {
    const p = produits.find(i => i.id === id);
    if(!p.stock) return alert("Produit épuisé");
    panier.push(p);
    document.getElementById('cart-count').innerText = panier.length;
    alert(p.nom + " ajouté !");
};

window.filter = (c) => {
    const res = c === 'all' ? produits : produits.filter(p => p.cat === c);
    window.afficherProduits(res);
};

// --- SYNC FIREBASE ---
onSnapshot(collection(db, "produits"), (snap) => {
    produits = snap.docs.map(d => ({id: d.id, ...d.data()}));
    window.afficherProduits(produits);
});

window.onload = () => window.afficherProduits(produits);

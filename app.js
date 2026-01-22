import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, onSnapshot, doc, updateDoc, addDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let isAdmin = false;

// AFFICHAGE DES ARTICLES AVEC OPTIONS ADMIN
window.afficherProduits = (liste) => {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = liste.map(p => `
        <div class="product-card ${!p.stock ? 'oos' : ''}">
            <span style="font-size:40px">${p.img || '🥤'}</span>
            <h3>${p.nom}</h3>
            ${isAdmin ? `
                <div class="admin-edit">
                    <input type="number" value="${p.prixDet}" onchange="window.upd('${p.id}','prixDet',this.value)" title="Prix Détail">
                    <input type="number" value="${p.prixGros}" onchange="window.upd('${p.id}','prixGros',this.value)" title="Prix Gros">
                    <button onclick="window.upd('${p.id}','stock', ${!p.stock})">${p.stock ? '✅ En Stock' : '❌ Épuisé'}</button>
                    <button onclick="window.suppr('${p.id}')" style="background:#ff4444; color:white;">🗑️</button>
                </div>
            ` : `
                <div class="pricing-zone">
                    <p>Détail: <b>${p.prixDet} F</b></p>
                    <p>Gros: <b>${p.prixGros} F</b></p>
                </div>
                <button class="btn-primary ${!p.stock ? 'btn-oos' : ''}" onclick="${p.stock ? `window.ajouterPanier('${p.id}')` : ''}">
                    ${p.stock ? '🛒 Ajouter' : 'ÉPUISÉ'}
                </button>
            `}
        </div>
    `).join('');
};

// ACTIONS ADMIN
window.upd = async (id, field, val) => {
    const v = (field === 'stock') ? val : parseInt(val);
    await updateDoc(doc(db, "produits", id), { [field]: v });
};
window.suppr = async (id) => { if(confirm("Supprimer l'article ?")) await deleteDoc(doc(db, "produits", id)); };

window.adminAccess = () => {
    if(prompt("Code Admin :") === "0000") {
        isAdmin = !isAdmin;
        document.getElementById('admin-orders-zone').style.display = isAdmin ? 'block' : 'none';
        window.afficherProduits(produits);
        if(isAdmin) window.chargerCommandes();
    }
};

// SYNC PRODUITS
onSnapshot(collection(db, "produits"), (snap) => {
    produits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    window.afficherProduits(produits);
});

// FONCTIONS NAVIGATION & AUTH (Rétablies)
window.toggleAuthModal = () => {
    const m = document.getElementById('auth-modal');
    m.style.display = (m.style.display === 'block') ? 'none' : 'block';
};
window.switchAuth = (v) => {
    document.getElementById('login-view').style.display = v === 'login' ? 'block' : 'none';
    document.getElementById('register-view').style.display = v === 'register' ? 'block' : 'none';
};
window.handleRegister = () => {
    user = { 
        name: document.getElementById('reg-name').value, 
        phone: document.getElementById('reg-phone').value, 
        address: document.getElementById('reg-address').value, 
        pass: document.getElementById('reg-pass').value 
    };
    localStorage.setItem('user', JSON.stringify(user));
    alert("Compte créé !"); window.switchAuth('login');
};
window.handleLogin = () => {
    const n = document.getElementById('login-name').value;
    const p = document.getElementById('login-pass').value;
    if(user && user.name === n && user.pass === p) {
        localStorage.setItem('isL', '1');
        location.reload();
    } else { alert("Erreur"); }
};

window.filter = (c) => window.afficherProduits(c === 'all' ? produits : produits.filter(p => p.cat === c));
window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('active');

window.onload = () => {
    if(user && localStorage.getItem('isL')) {
        document.getElementById('btn-login-open').style.display='none';
        document.getElementById('user-welcome').style.display='block';
        document.getElementById('user-display-name').innerText = user.name;
    }
};

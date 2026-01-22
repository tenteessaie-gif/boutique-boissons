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
const produitsRef = collection(db, "produits");
const commandesRef = collection(db, "commandes");

let produits = [
    { id: "1", nom: "Exemple : Youki Cocktail", prixDet: 500, prixGros: 5500, cat: "soda", stock: true, img: "🍹" }
];
let panier = [];
let user = JSON.parse(localStorage.getItem('user')) || null;
let isAdmin = false;

// --- AFFICHAGE ---
window.afficherProduits = (liste) => {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = liste.map(p => `
        <div class="product-card ${!p.stock ? 'oos' : ''}">
            <span style="font-size:40px">${p.img || '🥤'}</span>
            <h3>${p.nom}</h3>
            ${isAdmin ? `
                <div style="margin:10px 0">
                    <input type="number" value="${p.prixDet}" onchange="window.upd('${p.id}','prixDet',this.value)">
                    <input type="number" value="${p.prixGros}" onchange="window.upd('${p.id}','prixGros',this.value)">
                    <button onclick="window.upd('${p.id}','stock', ${!p.stock})">${p.stock ? '✅ En Stock' : '❌ Épuisé'}</button>
                </div>
            ` : `
                <div class="pricing-zone">
                    <label class="price-row"><span><input type="radio" name="p-${p.id}" value="det" checked> Détail</span> <b>${p.prixDet} F</b></label>
                    <label class="price-row"><span><input type="radio" name="p-${p.id}" value="gros"> Gros</span> <b>${p.prixGros} F</b></label>
                    <input type="number" id="qty-${p.id}" value="1" min="1" style="width:40px">
                </div>
            `}
            <button class="btn-primary ${!p.stock && !isAdmin ? 'btn-oos' : ''}" 
                onclick="${isAdmin ? `window.suppr('${p.id}')` : (p.stock ? `window.ajouter('${p.id}')` : '')}">
                ${isAdmin ? '🗑️ Supprimer' : (p.stock ? '🛒 Ajouter' : 'ÉPUISÉ')}
            </button>
        </div>
    `).join('');
};

// --- SYNC FIREBASE ---
onSnapshot(produitsRef, (snapshot) => {
    if (!snapshot.empty) {
        produits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        window.afficherProduits(produits);
    }
});

// --- ACTIONS ---
window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('active');
window.toggleAuthModal = () => {
    const m = document.getElementById('auth-modal');
    m.style.display = (m.style.display === 'block') ? 'none' : 'block';
};
window.switchAuth = (view) => {
    document.getElementById('login-view').style.display = view === 'login' ? 'block' : 'none';
    document.getElementById('register-view').style.display = view === 'register' ? 'block' : 'none';
};

window.ajouter = (id) => {
    const p = produits.find(i => i.id === id);
    const type = document.querySelector(`input[name="p-${id}"]:checked`).value;
    const qty = parseInt(document.getElementById(`qty-${id}`).value);
    const prix = type === 'det' ? p.prixDet : p.prixGros;
    panier.push({ nom: p.nom + (type==='det'?' (D)':' (G)'), prix, qty });
    window.majUI();
};

window.majUI = () => {
    document.getElementById('cart-count').innerText = panier.length;
    document.getElementById('cart-total').innerText = panier.reduce((a,b)=>a+(b.prix*b.qty),0);
    document.getElementById('cart-items').innerHTML = panier.map(i => `<div style="display:flex; justify-content:space-between; margin-bottom:5px"><span>${i.nom} x${i.qty}</span><b>${i.prix*i.qty}F</b></div>`).join('');
};

window.goToCheckout = async () => {
    if(!user) return window.toggleAuthModal();
    if(panier.length === 0) return alert("Panier vide !");
    const total = panier.reduce((a,b) => a + (b.prix*b.qty), 0);
    await addDoc(commandesRef, { client: user.name, tel: user.phone, adresse: user.address, articles: panier, total, statut: "En attente" });
    alert("✅ Commande envoyée !");
    panier = []; window.majUI(); window.toggleCart();
};

window.adminAccess = () => {
    if(prompt("Code Admin :") === "0000") {
        isAdmin = !isAdmin;
        document.getElementById('admin-orders-zone').style.display = isAdmin ? 'block' : 'none';
        if(isAdmin) {
            onSnapshot(query(commandesRef, where("statut", "==", "En attente")), (snap) => {
                const list = snap.docs.map(doc => ({id: doc.id, ...doc.data()}));
                document.getElementById('admin-orders-zone').innerHTML = `<h3>📦 Commandes (${list.length})</h3>` + 
                list.map(c => `<div class="order-card"><b>${c.client}</b> (${c.tel}) - ${c.total}F<br>📍 ${c.adresse}<br><button onclick="window.livrer('${c.id}')">Livré ✅</button></div>`).join('');
            });
        }
        window.afficherProduits(produits);
    }
};

window.upd = async (id, f, v) => await updateDoc(doc(db, "produits", id), { [f]: (f==='stock'?v:parseInt(v)) });
window.suppr = async (id) => { if(confirm("Supprimer ?")) await deleteDoc(doc(db, "produits", id)); };
window.livrer = async (id) => await updateDoc(doc(db, "commandes", id), { statut: "Livré" });

window.handleRegister = () => {
    user = { name: document.getElementById('reg-name').value, phone: document.getElementById('reg-phone').value, address: document.getElementById('reg-address').value, pass: document.getElementById('reg-pass').value };
    localStorage.setItem('user', JSON.stringify(user));
    alert("Compte créé !"); window.switchAuth('login');
};

window.handleLogin = () => {
    const n = document.getElementById('login-name').value;
    const p = document.getElementById('login-pass').value;
    if(user && user.name === n && user.pass === p) { localStorage.setItem('isL', '1'); location.reload(); }
    else { alert("Erreur d'identifiants"); }
};

window.filter = (cat) => {
    const boutons = document.querySelectorAll('.categories button');
    boutons.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    window.afficherProduits(cat === 'all' ? produits : produits.filter(p => p.cat === cat));
};

window.onload = () => {
    window.afficherProduits(produits);
    if(user && localStorage.getItem('isL')) {
        document.getElementById('btn-login-open').style.display='none';
        document.getElementById('user-welcome').style.display='block';
        document.getElementById('user-display-name').innerText = user.name;
    }
};

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

// TES PRODUITS (Initialisation)
const mesProduits = [
    { nom: "Rush Energy (Canette)", prixDet: 500, prixGros: 11000, cat: "energy", stock: true, img: "⚡" },
    { nom: "Biggo Orange", prixDet: 600, prixGros: 6500, cat: "energy", stock: true, img: "🥤" },
    { nom: "Biggo Cola", prixDet: 600, prixGros: 6500, cat: "energy", stock: true, img: "🥤" },
    { nom: "Malta Guinness", prixDet: 800, prixGros: 18500, cat: "soda", stock: true, img: "🍺" },
    { nom: "Sprite Canette", prixDet: 700, prixGros: 16000, cat: "soda", stock: true, img: "🍋" },
    { nom: "Voddy", prixDet: 1000, prixGros: 22000, cat: "soda", stock: true, img: "🍸" },
    { nom: "Casavino Petit", prixDet: 1500, prixGros: 16500, cat: "wine", stock: true, img: "🍷" },
    { nom: "Châteaux de France", prixDet: 5500, prixGros: 60000, cat: "wine", stock: true, img: "🍾" },
    { nom: "Vin Rouge Classique", prixDet: 3500, prixGros: 38000, cat: "wine", stock: true, img: "🍷" },
    { nom: "Vin Blanc Sec", prixDet: 4000, prixGros: 44000, cat: "wine", stock: false, img: "🥂" }
];

let produits = [];
let panier = [];
let user = JSON.parse(localStorage.getItem('user')) || null;
let isAdmin = false;

// --- AFFICHAGE ---
window.afficherProduits = (liste) => {
    const grid = document.getElementById('product-grid');
    if(!grid) return;
    grid.innerHTML = liste.map(p => `
        <div class="product-card ${!p.stock ? 'oos' : ''}">
            <span class="product-img">${p.img}</span>
            <h3>${p.nom}</h3>
            ${isAdmin ? `
                <div style="background:#f0f0f0; padding:5px; border-radius:8px; font-size:0.7rem;">
                    <input type="number" value="${p.prixDet}" onchange="window.upd('${p.id}','prixDet',this.value)" style="width:60px">
                    <input type="number" value="${p.prixGros}" onchange="window.upd('${p.id}','prixGros',this.value)" style="width:60px">
                    <button onclick="window.upd('${p.id}','stock',${!p.stock})">${p.stock?'✅':'❌'}</button>
                </div>
            ` : `
                <div class="pricing-zone">
                    <label class="price-row"><span><input type="radio" name="t-${p.id}" value="det" checked> Détail</span><span class="price-val">${p.prixDet} F</span></label>
                    <label class="price-row"><span><input type="radio" name="t-${p.id}" value="gros"> Gros</span><span class="price-val">${p.prixGros} F</span></label>
                    <div class="qty-control"><span>Qté:</span><input type="number" id="qty-${p.id}" value="1" min="1"></div>
                </div>
                <button class="add-btn" ${!p.stock ? 'disabled' : ''} onclick="window.ajouter('${p.id}')">${p.stock ? '🛒 Ajouter' : 'Épuisé'}</button>
            `}
        </div>
    `).join('');
};

// --- LOGIQUE FIREBASE ---
const checkAndInit = async () => {
    const snap = await getDocs(collection(db, "produits"));
    if (snap.empty) {
        for(let a of mesProduits) { await addDoc(collection(db, "produits"), a); }
    }
    onSnapshot(collection(db, "produits"), (s) => {
        produits = s.docs.map(d => ({ id: d.id, ...d.data() }));
        window.afficherProduits(produits);
    });
};
checkAndInit();

// --- FONCTIONS ACTIONS ---
window.ajouter = (id) => {
    const p = produits.find(item => item.id === id);
    const type = document.querySelector(`input[name="t-${id}"]:checked`).value;
    const qty = parseInt(document.getElementById(`qty-${id}`).value) || 1;
    const prix = type === 'det' ? p.prixDet : p.prixGros;
    panier.push({ nom: p.nom + (type==='det'?' (D)':' (G)'), prix, qty });
    window.updateUI();
};

window.updateUI = () => {
    document.getElementById('cart-count').innerText = panier.reduce((a,b)=>a+b.qty,0);
    document.getElementById('cart-total').innerText = panier.reduce((a,b)=>a+(b.prix*b.qty),0);
    document.getElementById('cart-items').innerHTML = panier.map(i=>`<div class="cart-item"><span>${i.nom} x${i.qty}</span><b>${i.prix*i.qty}F</b></div>`).join('');
};

window.goToCheckout = async () => {
    if(!user) return window.toggleAuthModal();
    if(panier.length === 0) return alert("Panier vide");
    await addDoc(collection(db, "commandes"), { client: user.name, tel: user.phone, total: document.getElementById('cart-total').innerText, articles: panier, statut: "En attente" });
    alert("Commande confirmée !"); panier=[]; window.updateUI(); window.toggleCart();
};

// --- AUTH & NAV ---
window.toggleCart = () => document.getElementById('cart-sidebar').classList.toggle('active');
window.toggleAuthModal = () => { const m=document.getElementById('auth-modal'); m.style.display=(m.style.display==='block'?'none':'block'); };
window.switchAuth = (v) => { document.getElementById('login-view').style.display=v==='login'?'block':'none'; document.getElementById('register-view').style.display=v==='register'?'block':'none'; };
window.filter = (c) => window.afficherProduits(c==='all'?produits:produits.filter(p=>p.cat===c));

window.handleRegister = () => {
    user = { name: document.getElementById('reg-name').value, phone: document.getElementById('reg-prefix').value + document.getElementById('reg-phone').value, address: document.getElementById('reg-address').value, pass: document.getElementById('reg-pass').value };
    localStorage.setItem('user', JSON.stringify(user));
    window.switchAuth('login');
};

window.handleLogin = () => {
    const n = document.getElementById('login-name').value;
    const p = document.getElementById('login-pass').value;
    if(user && n === user.name && p === user.pass) { localStorage.setItem('isL', '1'); location.reload(); }
};

window.adminAccess = () => {
    if(prompt("Code :") === "0000") {
        isAdmin = !isAdmin;
        document.getElementById('admin-orders-zone').style.display = isAdmin ? 'block' : 'none';
        window.afficherProduits(produits);
        if(isAdmin) {
            onSnapshot(query(collection(db, "commandes"), where("statut", "==", "En attente")), (snap) => {
                document.getElementById('admin-orders-zone').innerHTML = `<h3>📦 Commandes</h3>` + 
                snap.docs.map(d => { const c=d.data(); return `<div style="padding:10px; border-bottom:1px solid #ccc;">${c.client} - ${c.total}F <button onclick="window.finish('${d.id}')">OK</button></div>`}).join('');
            });
        }
    }
};

window.upd = async (id, f, v) => await updateDoc(doc(db,"produits",id),{[f]:(f==='stock'?v:parseInt(v))});
window.finish = async (id) => await updateDoc(doc(db,"commandes",id),{statut:"Livré"});

window.onload = () => {
    if(user && localStorage.getItem('isL')) {
        document.getElementById('btn-login-open').style.display='none';
        document.getElementById('user-welcome').style.display='block';
        document.getElementById('user-display-name').innerText = user.name;
    }
};

// BASE DE DONNÉES COMPLÈTE
let produits = [
    { id: 1, nom: "Rush Energy (Canette)", prixDet: 500, prixGros: 11000, cat: "energy", stock: true, img: "⚡" },
    { id: 2, nom: "Biggo Orange", prixDet: 600, prixGros: 6500, cat: "energy", stock: true, img: "🥤" },
    { id: 3, nom: "Biggo Cola", prixDet: 600, prixGros: 6500, cat: "energy", stock: true, img: "🥤" },
    { id: 4, nom: "Malta Guinness", prixDet: 800, prixGros: 18500, cat: "soda", stock: true, img: "🍺" },
    { id: 5, nom: "Sprite Canette", prixDet: 700, prixGros: 16000, cat: "soda", stock: true, img: "🍋" },
    { id: 6, nom: "Voddy", prixDet: 1000, prixGros: 22000, cat: "soda", stock: true, img: "🍸" },
    { id: 7, nom: "Casavino Petit", prixDet: 1500, prixGros: 16500, cat: "wine", stock: true, img: "🍷" },
    { id: 8, nom: "Châteaux de France", prixDet: 5500, prixGros: 60000, cat: "wine", stock: true, img: "🍾" },
    { id: 9, nom: "Vin Rouge Classique", prixDet: 3500, prixGros: 38000, cat: "wine", stock: true, img: "🍷" },
    { id: 10, nom: "Vin Blanc Sec", prixDet: 4000, prixGros: 44000, cat: "wine", stock: false, img: "🥂" }
];

let panier = [];
let user = JSON.parse(localStorage.getItem('user')) || null;

// AFFICHAGE DES PRODUITS
function afficherProduits(liste) {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = liste.map(p => `
        <div class="product-card ${!p.stock ? 'oos' : ''}">
            <span class="product-img">${p.img}</span>
            <h3>${p.nom}</h3>
            <div class="pricing-zone">
                <label class="price-row">
                    <span><input type="radio" name="type-${p.id}" value="det" checked> Détail</span>
                    <span class="price-val">${p.prixDet} F</span>
                </label>
                <label class="price-row">
                    <span><input type="radio" name="type-${p.id}" value="gros"> Gros (Carton)</span>
                    <span class="price-val">${p.prixGros} F</span>
                </label>
                <div class="qty-control">
                    <span>Qté:</span>
                    <input type="number" id="qty-${p.id}" value="1" min="1">
                </div>
            </div>
            <button class="add-btn" ${!p.stock ? 'disabled' : ''} onclick="ajouter(${p.id})">
                ${p.stock ? '🛒 Ajouter' : 'Épuisé'}
            </button>
        </div>
    `).join('');
}

// LOGIQUE DU PANIER
function ajouter(id) {
    const p = produits.find(prod => prod.id === id);
    const type = document.querySelector(`input[name="type-${id}"]:checked`).value;
    const qty = parseInt(document.getElementById(`qty-${id}`).value);
    const prix = type === 'det' ? p.prixDet : p.prixGros;
    const label = type === 'det' ? "(Détail)" : "(Gros)";

    panier.push({ id, nom: p.nom + " " + label, prix, qty });
    majInterface();
    // Petite animation de succès
    const btn = event.target;
    btn.innerText = "✅ Ajouté !";
    setTimeout(() => btn.innerText = "🛒 Ajouter", 1000);
}

function majInterface() {
    document.getElementById('cart-count').innerText = panier.reduce((a, b) => a + b.qty, 0);
    const total = panier.reduce((a, b) => a + (b.prix * b.qty), 0);
    document.getElementById('cart-total').innerText = total;
    
    document.getElementById('cart-items').innerHTML = panier.map((item, index) => `
        <div class="cart-item">
            <span>${item.nom} x${item.qty}</span>
            <span style="font-weight:600">${item.prix * item.qty} F</span>
        </div>
    `).join('');
}

// AUTHENTIFICATION
function toggleAuthModal() { 
    const m = document.getElementById('auth-modal');
    m.style.display = (m.style.display === 'block') ? 'none' : 'block'; 
}

function switchAuth(view) {
    document.getElementById('login-view').style.display = view === 'login' ? 'block' : 'none';
    document.getElementById('register-view').style.display = view === 'register' ? 'block' : 'none';
}

function handleRegister() {
    const name = document.getElementById('reg-name').value;
    const pass = document.getElementById('reg-pass').value;
    const pass2 = document.getElementById('reg-pass2').value;
    const address = document.getElementById('reg-address').value;
    
    if(!name || !pass || !address) return alert("Veuillez remplir tous les champs");
    if(pass !== pass2) return alert("Les mots de passe ne correspondent pas !");
    
    user = { 
        name, pass, address,
        phone: document.getElementById('reg-prefix').value + document.getElementById('reg-phone').value 
    };
    localStorage.setItem('user', JSON.stringify(user));
    alert("Compte créé avec succès ! Connectez-vous maintenant.");
    switchAuth('login');
}

function handleLogin() {
    const name = document.getElementById('login-name').value;
    const pass = document.getElementById('login-pass').value;
    if(user && name === user.name && pass === user.pass) {
        alert("Ravi de vous revoir " + name + " !");
        localStorage.setItem('isLoggedIn', 'true');
        location.reload();
    } else {
        alert("Identifiants incorrects.");
    }
}

// NAVIGATION & FILTRES
function filter(cat) {
    const btns = document.querySelectorAll('.categories button');
    btns.forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    afficherProduits(cat === 'all' ? produits : produits.filter(p => p.cat === cat));
}

function toggleCart() { document.getElementById('cart-sidebar').classList.toggle('active'); }

function goToCheckout() {
    if(panier.length === 0) return alert("Votre panier est vide !");
    if(!user) return toggleAuthModal();
    
    const total = document.getElementById('cart-total').innerText;
    alert(`📄 REÇU DRINKEXPRESS\n----------------------\nClient : ${user.name}\nAdresse : ${user.address}\nTotal : ${total} FCFA\n\nVotre commande est en préparation !`);
    panier = []; majInterface(); toggleCart();
}

function adminAccess() {
    const code = prompt("Code secret Administrateur :");
    if(code === "0000") alert("Interface Admin bientôt disponible sur cet espace !");
}

window.onload = () => {
    if(user && localStorage.getItem('isLoggedIn')) {
        document.getElementById('btn-login-open').style.display = 'none';
        document.getElementById('user-welcome').style.display = 'block';
        document.getElementById('user-display-name').innerText = user.name;
    }
    afficherProduits(produits);
};
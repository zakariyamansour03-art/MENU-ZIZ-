/* ============================================================
   CAFÉ ZIZ — SYSTÈME PANIER INTERACTIF
   ============================================================ */

const cart = {};   // { itemName: { price, qty } }

/* ── 1. INJECT BOUTON "+" f kull item li 3ndoh prix ───────── */
function initCart() {
    document.querySelectorAll('.items li').forEach(li => {
        const priceEl = li.querySelector('.item-price');
        const nameEl  = li.querySelector('.item-name');
        if (!priceEl || !nameEl) return;

        const priceText = priceEl.textContent.trim();
        const price     = parseInt(priceText);
        let name        = nameEl.textContent.trim();

        // --- Logic: Clarify item names by prefixing Category ---
        const categoryContainer = li.closest('.category');
        let categoryName = "";
        if (categoryContainer) {
            const catTitle = categoryContainer.querySelector('.category-title, .sub-cat');
            if (catTitle) {
                // Get text only, exclude icons
                categoryName = Array.from(catTitle.childNodes)
                    .filter(node => node.nodeType === Node.TEXT_NODE || (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('fas') && !node.classList.contains('fab')))
                    .map(node => node.textContent.trim())
                    .join(' ')
                    .trim()
                    .toUpperCase();
            }
        }

        // Prefix if name doesn't already contain the category (case insensitive check)
        if (categoryName) {
            // Simplified category mapping for cleaner prefixes
            const catMapping = {
                "BOISSONS CHAUDES": "BOISSON",
                "BOISSONS FROID": "BOISSON",
                "LES JUS": "JUS",
                "LES GLACES": "GLACE",
                "FOUR & SNACK": "SNACK",
                "PLAT": "PLAT",
                "SALADE": "SALADE",
                "PIZZA": "PIZZA",
                "BURGER": "BURGER",
                "PANINI": "PANINI",
                "TACOS": "TACOS",
                "SANDWICH": "SANDWICH"
            };

            let prefix = catMapping[categoryName] || categoryName;
            
            // Apply prefix if name doesn't already include it
            if (!name.toUpperCase().includes(prefix)) {
                name = `${prefix} ${name}`;
            }
        }

        // Store full name for sync logic
        li.dataset.fullName = name;

        // Make the whole LI a clickable toggle
        li.classList.add('cart-item-selectable');
        
        // Add a checkmark container
        if (!li.querySelector('.cart-check-box')) {
            const checkContainer = document.createElement('div');
            checkContainer.className = 'cart-check-box';
            checkContainer.innerHTML = '<i class="fas fa-check"></i>';
            li.appendChild(checkContainer);
        }

        li.onclick = (e) => {
            e.preventDefault();
            toggleItem(name, price);
        };
    });
}

function toggleItem(name, price) {
    if (cart[name]) {
        delete cart[name];
    } else {
        cart[name] = { price, qty: 1 };
        showCartPanel();
    }
    renderCart();
}

function addItem(name, price) {
    if (cart[name]) {
        cart[name].qty += 1;
    } else {
        cart[name] = { price, qty: 1 };
    }
    renderCart();
}

function removeItem(name) {
    if (!cart[name]) return;
    cart[name].qty -= 1;
    if (cart[name].qty <= 0) delete cart[name];
    renderCart();
}

/* ── 3. CALCULER TOTAL ────────────────────────────────────── */
function getTotal() {
    return Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
}

function getItemCount() {
    return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

/* ── 4. RENDER CART UI ────────────────────────────────────── */
function renderCart() {
    const list  = document.getElementById('cart-list');
    const total = document.getElementById('cart-total-price');
    const badge = document.getElementById('cart-badge');
    const count = getItemCount();

    // Sync Menu Visuals
    document.querySelectorAll('.items li').forEach(li => {
        const name = li.dataset.fullName;
        if (name && cart[name]) {
            li.classList.add('item-selected');
        } else {
            li.classList.remove('item-selected');
        }
    });

    // Badge
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';

    // List
    list.innerHTML = '';
    if (count === 0) {
        list.innerHTML = '<p class="cart-empty">Panier vide 🛒</p>';
        total.textContent = '0 DH';
        return;
    }

    Object.entries(cart).forEach(([name, { price, qty }]) => {
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.innerHTML = `
            <div class="cart-row-info">
                <span class="cart-row-name">${name}</span>
                <span class="cart-row-price">${qty} × ${price} DH</span>
            </div>
            <div class="cart-row-controls">
                <button class="cart-ctrl" onclick="removeItem('${name.replace(/'/g, "\\'")}')"><i class="fas fa-minus"></i></button>
                <span class="cart-qty">${qty}</span>
                <button class="cart-ctrl" onclick="addItem('${name.replace(/'/g, "\\'")}', ${price})"><i class="fas fa-plus"></i></button>
            </div>
        `;
        list.appendChild(row);
    });

    total.textContent = getTotal() + ' DH';

    // Auto-sync with order form if exists
    syncOrderField();
}

/* ── 4.1 SYNC ORDER FIELD ────────────────────────────────── */
function syncOrderField() {
    const orderField = document.getElementById('clientOrder');
    if (!orderField) return;

    if (getItemCount() === 0) {
        orderField.value = '';
        return;
    }

    let lines = [];
    Object.entries(cart).forEach(([name, { price, qty }]) => {
        lines.push(`${qty}x ${name} — ${qty * price} DH`);
    });
    lines.push('');
    lines.push(`💰 TOTAL : ${getTotal()} DH`);
    lines.push(`🚛 Livraison GRATUITE`);

    orderField.value = lines.join('\n');
}

/* ── 5. SHOW / HIDE PANEL ─────────────────────────────────── */
function showCartPanel() {
    const panel = document.getElementById('cart-panel');
    panel.classList.add('cart-open');
}

function toggleCart() {
    const panel = document.getElementById('cart-panel');
    panel.classList.toggle('cart-open');
}

/* ── 6. VIDER LE PANIER ───────────────────────────────────── */
function clearCart() {
    Object.keys(cart).forEach(k => delete cart[k]);
    renderCart();
}

/* ── 7. ALLER AU FORMULAIRE + AUTO-REMPLIR ───────────────── */
function goToOrder() {
    if (getItemCount() === 0) return;

    // Build commande text
    let lines = [];
    Object.entries(cart).forEach(([name, { price, qty }]) => {
        lines.push(`${qty}x ${name} — ${qty * price} DH`);
    });
    lines.push('');
    lines.push(`💰 TOTAL : ${getTotal()} DH`);
    lines.push(`🚛 Livraison GRATUITE`);

    const orderField = document.getElementById('clientOrder');
    if (orderField) orderField.value = lines.join('\n');

    // Scroll to form
    const liv = document.getElementById('livraison');
    if (liv) liv.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Close cart panel
    document.getElementById('cart-panel').classList.remove('cart-open');
}

/* ── 8. ANIMATION BOUTON ─────────────────────────────────── */
function animateBtn(btn) {
    btn.classList.add('btn-pop');
    setTimeout(() => btn.classList.remove('btn-pop'), 300);
}

/* ── 9. ACTIVER MODE LIVRAISON ───────────────────────────── */
function activateLivraisonMode(e) {
    if (e) e.preventDefault();
    document.body.classList.add('livraison-mode');
    
    // Si le panier est vide, on l''ouvre pour montrer qu''on peut commander
    if (getItemCount() === 0) {
        showCartPanel();
    }
}

/* ── INIT ─────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    // Petit delai bach ywait loading screen
    setTimeout(initCart, 2100);
});

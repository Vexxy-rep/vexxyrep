// ============================================================
//  VexxyRep — Admin Panel
// ============================================================

(function () {
  "use strict";

  // ---- State ----
  let token      = sessionStorage.getItem("admin_token") || "";
  let products   = [];
  let categories = [];
  let pendingDeleteFn = null;

  // ---- DOM ----
  const $ = id => document.getElementById(id);

  // Login
  const loginScreen   = $("loginScreen");
  const dashboard     = $("dashboard");
  const loginForm     = $("loginForm");
  const loginPassword = $("loginPassword");
  const loginError    = $("loginError");
  const logoutBtn     = $("logoutBtn");

  // Tabs
  const tabs      = document.querySelectorAll(".tab");
  const panels    = document.querySelectorAll(".tab-panel");

  // Products
  const prodBadge      = $("prodBadge");
  const adminSearch    = $("adminSearch");
  const catFilter      = $("catFilter");
  const addProductBtn  = $("addProductBtn");
  const productsList   = $("productsList");

  // Categories
  const addCatBtn      = $("addCatBtn");
  const categoriesList = $("categoriesList");

  // Product modal
  const productModal   = $("productModal");
  const modalTitle     = $("modalTitle");
  const productForm    = $("productForm");
  const fieldId        = $("fieldId");
  const fieldName      = $("fieldName");
  const fieldPrice     = $("fieldPrice");
  const fieldCategory  = $("fieldCategory");
  const fieldBrand     = $("fieldBrand");
  const fieldDesc      = null;
  const fieldImage     = $("fieldImage");
  const fieldFile      = $("fieldFile");
  const fieldVisible      = $("fieldVisible");
  const fieldCoupDeCoeur  = $("fieldCoupDeCoeur");
  const imgPreview     = $("imgPreview");
  const closeProductModal = $("closeProductModal");
  const cancelProduct  = $("cancelProduct");

  // Cat modal
  const catModal   = $("catModal");
  const catForm    = $("catForm");
  const catLabel   = $("catLabel");
  const catId      = $("catId");
  const closeCatModal = $("closeCatModal");
  const cancelCat  = $("cancelCat");

  // Confirm modal
  const confirmModal  = $("confirmModal");
  const confirmText   = $("confirmText");
  const confirmDelete = $("confirmDelete");
  const cancelConfirm = $("cancelConfirm");

  // Toast
  const aToast = $("aToast");

  // ---- API helper ----
  async function api(method, url, body) {
    const opts = {
      method,
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    };
    if (body) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(url, opts);
    } catch {
      throw new Error("Impossible de joindre le serveur. Lance npm start.");
    }

    // Vérifie que la réponse est bien du JSON
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      throw new Error(`Serveur indisponible (${res.status}). Vérifie que npm start est lancé.`);
    }

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erreur serveur");
    return data;
  }

  // ---- Toast ----
  let toastTimer;
  function toast(msg, type = "success") {
    clearTimeout(toastTimer);
    aToast.textContent = msg;
    aToast.className   = `a-toast show ${type}`;
    toastTimer = setTimeout(() => aToast.classList.remove("show"), 2800);
  }

  // ---- Auth ----
  function showDashboard() {
    loginScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    loadAll();
  }

  function showLogin() {
    dashboard.classList.add("hidden");
    loginScreen.classList.remove("hidden");
  }

  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    loginError.textContent = "";
    try {
      await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginPassword.value }),
      }).then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        return d;
      });
      token = loginPassword.value;
      sessionStorage.setItem("admin_token", token);
      showDashboard();
    } catch (err) {
      loginError.textContent = err.message;
    }
  });

  logoutBtn.addEventListener("click", () => {
    token = "";
    sessionStorage.removeItem("admin_token");
    showLogin();
  });

  // ---- Tabs ----
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));
      tab.classList.add("active");
      $(`tab-${tab.dataset.tab}`).classList.add("active");
    });
  });

  // ---- Load ----
  async function loadAll() {
    await Promise.all([loadProducts(), loadCategories()]);
  }

  async function loadProducts() {
    try {
      products = await api("GET", "/api/admin/products");
      renderProducts(products);
    } catch (err) {
      toast("Erreur chargement produits", "error");
    }
  }

  async function loadCategories() {
    try {
      categories = await api("GET", "/api/admin/categories");
      renderCategories();
      populateCatSelect();
      populateCatFilter();
    } catch (err) {
      toast("Erreur chargement catégories", "error");
    }
  }

  // ---- Render Products ----
  function renderProducts(list) {
    prodBadge.textContent = list.length;
    if (!list.length) {
      productsList.innerHTML = `
        <div class="empty-state">
          <p>Aucun produit</p>
          <span>Clique sur "+ Ajouter" pour commencer</span>
        </div>`;
      return;
    }
    productsList.innerHTML = list.map(p => `
      <div class="product-item" data-id="${p.id}">
        ${p.image
          ? `<img src="${esc(p.image)}" class="product-thumb" alt="" onerror="this.style.display='none'">`
          : `<div class="product-thumb-placeholder">👕</div>`
        }
        <div class="product-info">
          <div class="product-info-name">
            ${esc(p.name)}
            ${p.visible === false ? `<span class="badge-hidden">Masqué</span>` : ""}
          </div>
          <div class="product-info-meta">
            <span>🏷 ${esc(p.category_label || p.category_id || "—")}</span>
            <span>💰 ${esc(p.price || "—")}</span>
          </div>
        </div>
        <div class="product-actions">
          <button class="btn-fav" data-id="${p.id}" data-fav="${!!p.coup_de_coeur}" title="${p.coup_de_coeur ? "Retirer Coup de Coeur" : "Marquer Coup de Coeur"}">
            ${p.coup_de_coeur ? "💚" : "🤍"}
          </button>
          <button class="btn-toggle" data-id="${p.id}" data-visible="${p.visible !== false}" title="${p.visible !== false ? "Masquer du catalogue" : "Afficher dans le catalogue"}">
            ${p.visible !== false ? "👁 Visible" : "🚫 Masqué"}
          </button>
          <button class="btn-edit" data-id="${p.id}">Modifier</button>
          <button class="btn-del"  data-id="${p.id}">Supprimer</button>
        </div>
      </div>
    `).join("");
  }

  // ---- Render Categories ----
  function renderCategories() {
    if (!categories.length) {
      categoriesList.innerHTML = `
        <div class="empty-state"><p>Aucune catégorie</p></div>`;
      return;
    }
    categoriesList.innerHTML = categories.map(c => `
      <div class="cat-item">
        <div class="cat-item-info">
          <span class="cat-item-label">${esc(c.label)}</span>
          <span class="cat-item-id">id : ${esc(c.id)}</span>
        </div>
        <button class="btn-del" data-cat-id="${esc(c.id)}">Supprimer</button>
      </div>
    `).join("");
  }

  // ---- Populate category select ----
  function populateCatSelect() {
    fieldCategory.innerHTML =
      `<option value="">— Sans catégorie —</option>` +
      categories.map(c => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join("");
  }

  function populateCatFilter() {
    const current = catFilter.value;
    catFilter.innerHTML =
      `<option value="">Toutes catégories</option>` +
      categories.map(c => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join("");
    catFilter.value = current; // conserve la sélection si reload
  }

  // ---- Search + Category filter ----
  function applyFilters() {
    const q   = adminSearch.value.toLowerCase();
    const cat = catFilter.value;
    const filtered = products.filter(p => {
      const matchText = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category_label || "").toLowerCase().includes(q);
      const matchCat = !cat || p.category_id === cat;
      return matchText && matchCat;
    });
    renderProducts(filtered);
  }

  adminSearch.addEventListener("input",  applyFilters);
  catFilter.addEventListener("change",   applyFilters);

  // ---- Product Modal ----
  function openProductModal(product = null) {
    productForm.reset();
    imgPreview.src = "";
    imgPreview.classList.add("hidden");

    if (product) {
      modalTitle.textContent   = "Modifier le produit";
      fieldId.value            = product.id;
      fieldName.value          = product.name || "";
      fieldPrice.value         = product.price || "";
      fieldCategory.value      = product.category_id || "";
      fieldBrand.value         = product.brand || "";
      fieldImage.value         = product.image || "";
      fieldLink.value          = product.link || "";
      fieldVisible.checked       = product.visible !== false;
      fieldCoupDeCoeur.checked   = !!product.coup_de_coeur;
      if (product.image) {
        imgPreview.onload  = () => imgPreview.classList.remove("hidden");
        imgPreview.onerror = () => imgPreview.classList.add("hidden");
        imgPreview.src     = product.image;
      }
    } else {
      modalTitle.textContent = "Ajouter un produit";
      fieldId.value = "";
    }
    productModal.classList.remove("hidden");
    fieldName.focus();
  }

  function closeProductModalFn() {
    productModal.classList.add("hidden");
  }

  addProductBtn.addEventListener("click",  () => openProductModal());
  closeProductModal.addEventListener("click", closeProductModalFn);
  cancelProduct.addEventListener("click",     closeProductModalFn);
  productModal.addEventListener("click", e => {
    if (e.target === productModal) closeProductModalFn();
  });

  // Image file upload
  fieldFile.addEventListener("change", async () => {
    const file = fieldFile.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      fieldImage.value    = data.path;
      imgPreview.src      = data.path;
      imgPreview.classList.remove("hidden");
      toast("Image uploadée !");
    } catch (err) {
      toast("Erreur upload : " + err.message, "error");
    }
  });

  // Image URL preview
  fieldImage.addEventListener("input", () => {
    const val = fieldImage.value.trim();
    if (val) {
      imgPreview.src = val;
      imgPreview.classList.remove("hidden");
    } else {
      imgPreview.classList.add("hidden");
    }
  });

  // Save product
  productForm.addEventListener("submit", async e => {
    e.preventDefault();
    const payload = {
      name:        fieldName.value.trim(),
      price:       fieldPrice.value.trim(),
      category_id: fieldCategory.value || null,
      brand:       fieldBrand.value.trim(),
      image:       fieldImage.value.trim(),
      link:        fieldLink.value.trim(),
      visible:        fieldVisible.checked,
      coup_de_coeur:  fieldCoupDeCoeur.checked,
    };
    try {
      if (fieldId.value) {
        await api("PUT", `/api/admin/products/${fieldId.value}`, payload);
        toast("Produit modifié !");
      } else {
        await api("POST", "/api/admin/products", payload);
        toast("Produit ajouté !");
      }
      closeProductModalFn();
      loadProducts();
    } catch (err) {
      toast(err.message, "error");
    }
  });

  // Edit / Delete product (event delegation)
  productsList.addEventListener("click", async e => {
    const editBtn   = e.target.closest(".btn-edit");
    const delBtn    = e.target.closest(".btn-del[data-id]");
    const toggleBtn = e.target.closest(".btn-toggle");
    const favBtn    = e.target.closest(".btn-fav");

    if (favBtn) {
      const id      = favBtn.dataset.id;
      const current = favBtn.dataset.fav === "true";
      const p       = products.find(x => x.id == id);
      if (!p) return;
      try {
        await api("PUT", `/api/admin/products/${id}`, {
          name: p.name, category_id: p.category_id, brand: p.brand,
          image: p.image, link: p.link, price: p.price,
          visible: p.visible !== false, coup_de_coeur: !current,
        });
        p.coup_de_coeur = !current;
        favBtn.dataset.fav = String(!current);
        favBtn.textContent = !current ? "💚" : "🤍";
        favBtn.title = !current ? "Retirer Coup de Coeur" : "Marquer Coup de Coeur";
      } catch (err) {
        toast(err.message, "error");
      }
      return;
    }

    if (toggleBtn) {
      const id      = toggleBtn.dataset.id;
      const current = toggleBtn.dataset.visible === "true";
      const p       = products.find(x => x.id == id);
      if (!p) return;
      try {
        await api("PUT", `/api/admin/products/${id}`, {
          name: p.name, category_id: p.category_id, brand: p.brand,
          image: p.image, link: p.link, price: p.price,
          visible: !current, coup_de_coeur: !!p.coup_de_coeur,
        });
        p.visible = !current;
        toggleBtn.dataset.visible = String(!current);
        toggleBtn.textContent = !current ? "👁 Visible" : "🚫 Masqué";
        toggleBtn.title = !current ? "Masquer du catalogue" : "Afficher dans le catalogue";
        toast(!current ? "Produit masqué." : "Produit visible !");
      } catch (err) {
        toast(err.message, "error");
      }
      return;
    }

    if (editBtn) {
      const p = products.find(x => x.id == editBtn.dataset.id);
      if (p) openProductModal(p);
    }
    if (delBtn) {
      const id = delBtn.dataset.id;
      const p  = products.find(x => x.id == id);
      confirmText.textContent = `Supprimer "${p?.name}" ?`;
      pendingDeleteFn = async () => {
        await api("DELETE", `/api/admin/products/${id}`);
        toast("Produit supprimé.");
        loadProducts();
      };
      confirmModal.classList.remove("hidden");
    }
  });

  // ---- Category Modal ----
  catLabel.addEventListener("input", () => {
    catId.value = catLabel.value
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
  });

  addCatBtn.addEventListener("click", () => {
    catForm.reset();
    catModal.classList.remove("hidden");
    catLabel.focus();
  });
  closeCatModal.addEventListener("click",  () => catModal.classList.add("hidden"));
  cancelCat.addEventListener("click",      () => catModal.classList.add("hidden"));
  catModal.addEventListener("click", e => {
    if (e.target === catModal) catModal.classList.add("hidden");
  });

  catForm.addEventListener("submit", async e => {
    e.preventDefault();
    try {
      await api("POST", "/api/admin/categories", {
        id:    catId.value.trim(),
        label: catLabel.value.trim(),
      });
      toast("Catégorie créée !");
      catModal.classList.add("hidden");
      loadCategories();
    } catch (err) {
      toast(err.message, "error");
    }
  });

  // Delete category (event delegation)
  categoriesList.addEventListener("click", e => {
    const btn = e.target.closest(".btn-del[data-cat-id]");
    if (!btn) return;
    const id  = btn.dataset.catId;
    const cat = categories.find(c => c.id === id);
    confirmText.textContent = `Supprimer la catégorie "${cat?.label}" ?`;
    pendingDeleteFn = async () => {
      await api("DELETE", `/api/admin/categories/${id}`);
      toast("Catégorie supprimée.");
      loadCategories();
    };
    confirmModal.classList.remove("hidden");
  });

  // ---- Confirm modal ----
  confirmDelete.addEventListener("click", async () => {
    if (!pendingDeleteFn) return;
    try {
      await pendingDeleteFn();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      pendingDeleteFn = null;
      confirmModal.classList.add("hidden");
    }
  });
  cancelConfirm.addEventListener("click", () => {
    pendingDeleteFn = null;
    confirmModal.classList.add("hidden");
  });
  confirmModal.addEventListener("click", e => {
    if (e.target === confirmModal) {
      pendingDeleteFn = null;
      confirmModal.classList.add("hidden");
    }
  });

  // ---- Escape key ----
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    productModal.classList.add("hidden");
    catModal.classList.add("hidden");
    confirmModal.classList.add("hidden");
  });

  // ---- XSS escape ----
  function esc(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // ---- Init ----
  if (token) {
    showDashboard();
  }

})();

// ============================================================
//  VexxyRep — Application (fetch API backend)
// ============================================================

(function () {
  "use strict";

  // ---- State (rempli via /api/products) ----
  let PRODUCTS    = [];
  let CATEGORIES  = [];
  let SITE_CONFIG = {};
  let activeCategory = "all";
  let activeBrand    = "";
  let searchQuery    = "";
  let currentPage    = 1;
  const PAGE_SIZE    = 20;
  const DEFAULT_BRANDS = ["Adidas","Arc'teryx","Asics","Corteiz","Denim Tears","Nike","Ralph Lauren"];

  // ---- DOM References ----
  const $ = id => document.getElementById(id);
  const categoriesContainer  = $("categoriesContainer");
  const productsGrid         = $("productsGrid");
  const productsCount        = $("productsCount");
  const currentCategoryLabel = $("currentCategory");
  const noResults            = $("noResults");
  const searchInput          = $("searchInput");
  const themeToggle          = $("themeToggle");
  const toast                = $("toast");
  const navbar               = $("navbar");

  // ---- Escape HTML (sécurité XSS) ----
  function esc(str) {
    if (typeof str !== "string") return String(str);
    return str
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // ---- Apply social links depuis la config ----
  function applyConfig() {
    const links = {
      discordLink:   SITE_CONFIG.discordUrl,
      tiktokLink:    SITE_CONFIG.tiktokUrl,
      footerDiscord: SITE_CONFIG.discordUrl,
      footerTiktok:  SITE_CONFIG.tiktokUrl,
    };
    for (const [id, href] of Object.entries(links)) {
      const el = $(id);
      if (el && href) el.href = href;
    }
  }

  // ---- Charger les données depuis le backend ----
  async function loadData() {
    // Affiche un squelette de chargement
    productsGrid.innerHTML = Array(6).fill(0).map(() => `
      <div class="skeleton-card">
        <div class="skel skel-img"></div>
        <div class="skel-body">
          <div class="skel skel-title"></div>
          <div class="skel skel-desc"></div>
          <div class="skel skel-btn"></div>
        </div>
      </div>
    `).join("");

    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      PRODUCTS    = data.products    || [];
      CATEGORIES  = data.categories  || [];
      SITE_CONFIG = data.config      || {};

      applyConfig();
      renderCategories();
      populateBrandFilter();
      renderProducts();
    } catch (err) {
      console.error("Erreur chargement produits :", err);
      productsGrid.innerHTML = "";
      noResults.style.display = "flex";
      noResults.querySelector("p").textContent = "Impossible de charger les produits.";
      noResults.querySelector("span").textContent = "Vérifie que le serveur est démarré.";
    }
  }

  // ---- Render catégories ----
  function renderCategories() {
    const counts = {};
    PRODUCTS.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });

    // Boutons desktop
    categoriesContainer.innerHTML = CATEGORIES.map(cat => {
      const count  = cat.id === "all" ? PRODUCTS.length : (counts[cat.id] || 0);
      const active = cat.id === activeCategory;
      return `
        <button class="category-btn ${active ? "active" : ""}"
                data-id="${esc(cat.id)}" aria-pressed="${active}">
          ${esc(cat.label)}
          <span class="cat-count">${count}</span>
        </button>
      `;
    }).join("");

    // Dropdown mobile
    const catMenu  = $("catDropdownMenu");
    const catLabel = $("catDropdownLabel");
    if (catMenu) {
      catMenu.innerHTML = CATEGORIES.map(cat => {
        const count = cat.id === "all" ? PRODUCTS.length : (counts[cat.id] || 0);
        return `
          <button class="brand-option ${activeCategory === cat.id ? "active" : ""}"
                  data-value="${esc(cat.id)}" role="option">
            <span class="brand-dot"></span>${esc(cat.label)}
            <span class="cat-count" style="margin-left:auto">${count}</span>
          </button>
        `;
      }).join("");
    }
    if (catLabel) {
      const current = CATEGORIES.find(c => c.id === activeCategory);
      catLabel.textContent = current ? current.label : "Tous";
    }
  }

  // ---- Filtrage ----
  function getFiltered() {
    const q = searchQuery.toLowerCase().trim();
    return PRODUCTS.filter(p => {
      const matchCat    = activeCategory === "all" || p.category === activeCategory;
      const matchBrand  = !activeBrand || (p.brand || "").toLowerCase() === activeBrand.toLowerCase();
      const matchSearch = !q
        || p.name.toLowerCase().includes(q)
        || (p.category || "").toLowerCase().includes(q)
        || (p.brand || "").toLowerCase().includes(q);
      return matchCat && matchBrand && matchSearch;
    });
  }

  function populateBrandFilter() {
    const menu  = $("brandDropdownMenu");
    const label = $("brandDropdownLabel");
    if (!menu) return;
    const productBrands = PRODUCTS.map(p => p.brand).filter(Boolean);
    const brands = [...new Set([...DEFAULT_BRANDS, ...productBrands])].sort();
    const all = [{ value: "", text: "Toutes les marques" }, ...brands.map(b => ({ value: b, text: b }))];
    menu.innerHTML = all.map(b => `
      <button class="brand-option ${activeBrand === b.value ? "active" : ""}" data-value="${esc(b.value)}" role="option">
        <span class="brand-dot"></span>${esc(b.text)}
      </button>
    `).join("");
    label.textContent = activeBrand || "Toutes les marques";
  }

  // ---- Render cartes produits ----
  const searchResultsBar  = $("searchResultsBar");
  const searchResultsText = $("searchResultsText");
  const searchResultsClear = $("searchResultsClear");

  function hlName(name, q) {
    if (!q) return esc(name);
    const idx = name.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return esc(name);
    return esc(name.slice(0, idx))
      + `<mark>${esc(name.slice(idx, idx + q.length))}</mark>`
      + esc(name.slice(idx + q.length));
  }

  function renderProducts() {
    const filtered  = getFiltered();
    const q         = searchQuery.trim();
    const isSearch  = q.length > 0;
    const cat       = CATEGORIES.find(c => c.id === activeCategory);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

    // Clamp currentPage
    if (currentPage > totalPages) currentPage = totalPages;

    const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Header titre
    currentCategoryLabel.textContent =
      activeCategory === "all" ? "Tous les produits" : (cat?.label ?? "");
    productsCount.textContent =
      `${filtered.length} article${filtered.length !== 1 ? "s" : ""}`;

    // Barre résultats
    if (isSearch) {
      searchResultsText.innerHTML =
        `<strong>${filtered.length}</strong> résultat${filtered.length !== 1 ? "s" : ""} pour « <strong>${esc(q)}</strong> »`;
      searchResultsBar.classList.remove("hidden");
    } else {
      searchResultsBar.classList.add("hidden");
    }

    if (filtered.length === 0) {
      productsGrid.innerHTML = "";
      noResults.style.display = "flex";
      renderPagination(0, 1);
      return;
    }
    noResults.style.display = "none";

    productsGrid.innerHTML = pageItems.map((p, i) => {
      const catLabel = CATEGORIES.find(c => c.id === p.category)?.label ?? p.category;
      return `
        <article class="product-card ${p.category === 'shoes' ? 'cat-shoes' : ''}" data-id="${p.id}" style="animation-delay:${isSearch ? 0 : i * 0.06}s">
          <div class="card-img-wrapper">
            <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy"
                 onerror="this.src='https://picsum.photos/seed/fallback-${p.id}/400/500'">
            ${p.link ? `<a class="card-view-btn" href="${esc(p.link)}" target="_blank" rel="noopener noreferrer">Voir le produit →</a>` : ""}
          </div>
          <div class="card-body">
            <h3 class="card-name" title="${esc(p.name)}">${hlName(p.name, q)}</h3>
            <div class="card-footer">
              <span class="card-price">${esc(p.price)}</span>
              <button class="copy-btn" data-link="${esc(p.link)}"
                      title="Copier le lien" aria-label="Copier le lien de ${esc(p.name)}">
                ${svgClipboard()}
                <span>Copier le lien</span>
              </button>
            </div>
            <button class="report-btn" data-name="${esc(p.name)}" data-link="${esc(p.link)}"
                    title="Signaler un lien mort" aria-label="Signaler le lien mort de ${esc(p.name)}">
              ${svgFlag()}
              <span>Signaler lien mort</span>
            </button>
          </div>
        </article>
      `;
    }).join("");

    renderPagination(filtered.length, totalPages);
  }

  // ---- Pagination ----
  function renderPagination(total, totalPages) {
    const pagination = $("pagination");
    if (totalPages <= 1) { pagination.innerHTML = ""; return; }

    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end   = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

    let html = "";

    // Précédent
    html += `<button class="page-btn page-prev" ${currentPage === 1 ? "disabled" : ""} data-page="${currentPage - 1}">‹</button>`;

    // Première page + ellipse
    if (start > 1) {
      html += `<button class="page-btn" data-page="1">1</button>`;
      if (start > 2) html += `<span class="page-ellipsis">…</span>`;
    }

    // Pages visibles
    for (let p = start; p <= end; p++) {
      html += `<button class="page-btn ${p === currentPage ? "active" : ""}" data-page="${p}">${p}</button>`;
    }

    // Dernière page + ellipse
    if (end < totalPages) {
      if (end < totalPages - 1) html += `<span class="page-ellipsis">…</span>`;
      html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Suivant
    html += `<button class="page-btn page-next" ${currentPage === totalPages ? "disabled" : ""} data-page="${currentPage + 1}">›</button>`;

    pagination.innerHTML = html;
  }


  // ---- SVG helpers ----
  function svgClipboard() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>`;
  }
  function svgCheck() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
      <polyline points="20 6 9 17 4 12"/>
    </svg>`;
  }
  function svgFlag() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>`;
  }

  // ---- Copier dans le presse-papier ----
  function copyLink(link, btn) {
    const doSuccess = () => {
      btn.classList.add("copied");
      btn.innerHTML = svgCheck() + "<span>Copié !</span>";
      showToast("Lien copié !", "green");
      setTimeout(() => {
        btn.classList.remove("copied");
        btn.innerHTML = svgClipboard() + "<span>Copier</span>";
      }, 2200);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(doSuccess).catch(() => fallbackCopy(link, doSuccess));
    } else {
      fallbackCopy(link, doSuccess);
    }
  }

  function fallbackCopy(text, cb) {
    const ta = Object.assign(document.createElement("textarea"), {
      value: text,
      style: "position:fixed;opacity:0;pointer-events:none",
    });
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    cb();
  }

  // ---- Signaler lien mort → /api/report ----
  async function reportDeadLink(name, link, btn) {
    if (btn.disabled) return;
    btn.disabled = true;
    btn.classList.add("reporting");
    btn.innerHTML = svgFlag() + "<span>Envoi…</span>";

    try {
      const res = await fetch("/api/report", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ name, link }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        btn.classList.remove("reporting");
        btn.classList.add("reported");
        btn.innerHTML = svgCheck() + "<span>Signalé !</span>";
        showToast("Signalement envoyé !", "red");
      } else if (res.status === 429) {
        // Rate limited
        btn.disabled = false;
        btn.classList.remove("reporting");
        btn.innerHTML = svgFlag() + `<span>${data.error}</span>`;
        setTimeout(() => {
          btn.innerHTML = svgFlag() + "<span>Signaler lien mort</span>";
        }, 3000);
      } else {
        throw new Error(data.error || "Erreur serveur");
      }
    } catch (err) {
      btn.disabled = false;
      btn.classList.remove("reporting");
      btn.innerHTML = svgFlag() + "<span>Erreur, réessaie</span>";
      setTimeout(() => {
        btn.innerHTML = svgFlag() + "<span>Signaler lien mort</span>";
      }, 2500);
    }
  }

  // ---- Toast ----
  let toastTimer;
  function showToast(message = "Lien copié !", color = "green") {
    clearTimeout(toastTimer);
    toast.querySelector("span").textContent = message;
    toast.style.background = color === "red" ? "#E53E3E" : "var(--primary)";
    toast.style.boxShadow  = color === "red"
      ? "0 4px 24px rgba(229,62,62,.4)"
      : "0 4px 24px rgba(34,197,94,.4)";
    toast.classList.add("show");
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
  }

  // ---- Thème ----
  function toggleTheme() {
    const html  = document.documentElement;
    const next  = html.getAttribute("data-theme") === "dark" ? "light" : "dark";
    html.setAttribute("data-theme", next);
    localStorage.setItem("vexxyrep-theme", next);
  }

  function loadTheme() {
    const saved = localStorage.getItem("vexxyrep-theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }

  // ---- Events ----
  function bindEvents() {
    // Catégories (desktop)
    categoriesContainer.addEventListener("click", e => {
      const btn = e.target.closest(".category-btn");
      if (!btn) return;
      activeCategory = btn.dataset.id;
      currentPage = 1;
      document.querySelectorAll(".category-btn").forEach(b => {
        b.classList.toggle("active", b.dataset.id === activeCategory);
        b.setAttribute("aria-pressed", b.dataset.id === activeCategory);
      });
      renderCategories();
      renderProducts();
    });

    // ---- Dropdown catégorie (mobile) ----
    const catDropdown = $("catDropdown");
    const catDropdownMenu = $("catDropdownMenu");
    const catDropdownBtn  = $("catDropdownBtn");

    if (catDropdownBtn) {
      catDropdownBtn.addEventListener("click", e => {
        e.stopPropagation();
        const isOpen = catDropdown.classList.toggle("open");
        catDropdownMenu.classList.toggle("hidden", !isOpen);
      });

      catDropdownMenu.addEventListener("click", e => {
        const opt = e.target.closest(".brand-option");
        if (!opt) return;
        activeCategory = opt.dataset.value;
        currentPage = 1;
        catDropdown.classList.remove("open");
        catDropdownMenu.classList.add("hidden");
        // Sync boutons desktop
        document.querySelectorAll(".category-btn").forEach(b => {
          b.classList.toggle("active", b.dataset.id === activeCategory);
          b.setAttribute("aria-pressed", b.dataset.id === activeCategory);
        });
        renderCategories();
        renderProducts();
      });

      document.addEventListener("click", e => {
        if (!e.target.closest("#catDropdown")) {
          catDropdown.classList.remove("open");
          catDropdownMenu.classList.add("hidden");
        }
      });
    }

    // ---- Filtre marque (dropdown custom) ----
    const brandDropdown = $("brandDropdown");
    const brandMenu     = $("brandDropdownMenu");
    const brandBtn      = $("brandDropdownBtn");

    brandBtn.addEventListener("click", e => {
      e.stopPropagation();
      const isOpen = brandDropdown.classList.toggle("open");
      brandMenu.classList.toggle("hidden", !isOpen);
    });

    brandMenu.addEventListener("click", e => {
      const opt = e.target.closest(".brand-option");
      if (!opt) return;
      activeBrand = opt.dataset.value;
      currentPage = 1;
      brandDropdown.classList.remove("open");
      brandMenu.classList.add("hidden");
      populateBrandFilter();
      renderProducts();
    });

    document.addEventListener("click", e => {
      if (!e.target.closest("#brandDropdown")) {
        brandDropdown.classList.remove("open");
        brandMenu.classList.add("hidden");
      }
    });

    // ---- Smart search ----
    const suggestions = $("searchSuggestions");
    let searchTimer;
    let activeSuggIdx = -1;

    function highlight(text, q) {
      if (!q) return esc(text);
      const idx = text.toLowerCase().indexOf(q.toLowerCase());
      if (idx === -1) return esc(text);
      return esc(text.slice(0, idx))
        + `<mark>${esc(text.slice(idx, idx + q.length))}</mark>`
        + esc(text.slice(idx + q.length));
    }

    function showSuggestions(q) {
      if (!q || q.length < 1) { hideSuggestions(); return; }
      const matches = PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(q.toLowerCase()) ||
        (p.category || "").toLowerCase().includes(q.toLowerCase())
      ).slice(0, 7);

      if (!matches.length) {
        suggestions.innerHTML = `<div class="suggestion-empty">Aucun résultat pour « ${esc(q)} »</div>`;
      } else {
        suggestions.innerHTML = matches.map((p, i) => `
          <div class="suggestion-item" data-idx="${i}" data-id="${p.id}">
            ${p.image
              ? `<img class="suggestion-thumb" src="${esc(p.image)}" alt="" onerror="this.style.display='none'">`
              : `<div class="suggestion-thumb-ph">👕</div>`}
            <div class="suggestion-info">
              <div class="suggestion-name">${highlight(p.name, q)}</div>
              <div class="suggestion-meta">
                ${p.category ? `<span>${esc(p.category)}</span>` : ""}
                ${p.price    ? `<span class="suggestion-price">${esc(p.price)}</span>` : ""}
              </div>
            </div>
          </div>
        `).join("");
      }
      activeSuggIdx = -1;
      suggestions.classList.remove("hidden");
    }

    function hideSuggestions() {
      suggestions.classList.add("hidden");
      activeSuggIdx = -1;
    }

    function selectSuggestion(item) {
      const id = item.dataset.id;
      hideSuggestions();
      searchInput.value = "";
      searchQuery = "";
      renderProducts();
      // Scroll vers la carte
      setTimeout(() => {
        const card = document.querySelector(`.product-card[data-id="${id}"]`);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          card.classList.add("highlight-pulse");
          setTimeout(() => card.classList.remove("highlight-pulse"), 1200);
        }
      }, 50);
    }

    searchInput.addEventListener("input", e => {
      clearTimeout(searchTimer);
      const q = e.target.value;
      searchTimer = setTimeout(() => {
        searchQuery = q;
        currentPage = 1;
        renderProducts();
        showSuggestions(q.trim());
      }, 180);
    });

    // Navigation clavier dans les suggestions
    searchInput.addEventListener("keydown", e => {
      const items = suggestions.querySelectorAll(".suggestion-item");
      if (!items.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        activeSuggIdx = Math.min(activeSuggIdx + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle("active", i === activeSuggIdx));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        activeSuggIdx = Math.max(activeSuggIdx - 1, 0);
        items.forEach((el, i) => el.classList.toggle("active", i === activeSuggIdx));
      } else if (e.key === "Enter" && activeSuggIdx >= 0) {
        e.preventDefault();
        selectSuggestion(items[activeSuggIdx]);
      } else if (e.key === "Escape") {
        hideSuggestions();
      }
    });

    // Clic sur une suggestion
    suggestions.addEventListener("click", e => {
      const item = e.target.closest(".suggestion-item");
      if (item) selectSuggestion(item);
    });

    // Ferme en cliquant ailleurs
    document.addEventListener("click", e => {
      if (!e.target.closest(".nav-search")) hideSuggestions();
    });

    // Bouton "Effacer la recherche"
    searchResultsClear.addEventListener("click", () => {
      searchInput.value = "";
      searchQuery = "";
      currentPage = 1;
      hideSuggestions();
      renderProducts();
    });

    // Pagination (délégation)
    $("pagination").addEventListener("click", e => {
      const btn = e.target.closest(".page-btn");
      if (!btn || btn.disabled) return;
      currentPage = parseInt(btn.dataset.page);
      renderProducts();
      document.querySelector(".products-section").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Boutons copy & report (délégation)
    productsGrid.addEventListener("click", e => {
      const copyBtn   = e.target.closest(".copy-btn");
      const reportBtn = e.target.closest(".report-btn");
      if (copyBtn)   copyLink(copyBtn.dataset.link, copyBtn);
      if (reportBtn) reportDeadLink(reportBtn.dataset.name, reportBtn.dataset.link, reportBtn);
    });

    // Thème
    themeToggle.addEventListener("click", toggleTheme);

    // Scroll
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 10);
    }, { passive: true });
  }

  // ---- Recherche mobile ----
  function initMobileSearch() {
    const toggleBtn  = $("mobileSearchToggle");
    const bar        = $("mobileSearchBar");
    const closeBtn   = $("mobileSearchClose");
    const mobileInput = $("mobileSearchInput");
    if (!toggleBtn || !bar) return;

    function openSearch() {
      bar.classList.add("open");
      document.body.classList.add("search-open");
      mobileInput.focus();
    }
    function closeSearch() {
      bar.classList.remove("open");
      document.body.classList.remove("search-open");
      mobileInput.value = "";
      searchQuery = "";
      renderProducts();
    }

    toggleBtn.addEventListener("click", () => {
      bar.classList.contains("open") ? closeSearch() : openSearch();
    });
    closeBtn.addEventListener("click", closeSearch);

    // Sync avec la recherche desktop
    let mobileTimer;
    mobileInput.addEventListener("input", e => {
      clearTimeout(mobileTimer);
      mobileTimer = setTimeout(() => {
        searchQuery = e.target.value;
        renderProducts();
      }, 220);
    });

    // Fermer sur Échap
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && bar.classList.contains("open")) closeSearch();
    });
  }

  // ---- Bouton retour en haut ----
  function initScrollTop() {
    const btn = Object.assign(document.createElement("button"), {
      className:   "scroll-top",
      innerHTML:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`,
      ariaLabel:   "Retour en haut",
    });
    document.body.appendChild(btn);
    window.addEventListener("scroll", () => btn.classList.toggle("visible", window.scrollY > 400), { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  // ---- Init ----
  function init() {
    loadTheme();
    bindEvents();
    initScrollTop();
    initMobileSearch();
    loadData(); // async — charge produits depuis l'API

    const yearEl = $("footerYear");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

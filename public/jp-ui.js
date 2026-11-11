(() => {
  const ICONS = {
    search:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>',
    close:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    eye:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    eyeOff:
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m3 3 18 18"></path><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c6.5 0 10 7 10 7a17.7 17.7 0 0 1-3.2 4.2"></path><path d="M6.2 6.2C3.6 7.8 2 12 2 12s3.5 7 10 7a10.7 10.7 0 0 0 4.1-.8"></path></svg>',
  };

  const ACCOUNT_KEY = "jp_local_accounts_v1";
  const SESSION_KEY = "jp_local_session_v1";

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (character) => {
      const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[character];
    });

  const normalize = (value) =>
    String(value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const readAccounts = () => {
    try {
      const accounts = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || "[]");
      return Array.isArray(accounts) ? accounts : [];
    } catch {
      return [];
    }
  };

  const writeAccounts = (accounts) => {
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(accounts));
    } catch {
      return;
    }
  };

  const readSession = () => {
    try {
      return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    } catch {
      return null;
    }
  };

  const writeSession = (session) => {
    try {
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      return;
    }
  };

  const moveNavigation = () => {
    const header = document.querySelector("header");
    if (!header) return;

    const nav = header.querySelector("nav");
    if (nav && !nav.classList.contains("jp-nav-relocated")) {
      header.appendChild(nav);
      nav.classList.add("jp-nav-relocated");
    }

    header.querySelectorAll('a[href="/"]').forEach((link) => {
      if (link.textContent.trim() !== "JP") return;
      const isMobileLogo = (link.className || "").includes("lg:hidden");
      link.style.fontSize = isMobileLogo ? "24px" : "30px";
    });
  };

  const accountOverlay = document.createElement("div");
  accountOverlay.className = "jp-overlay jp-account-overlay";
  accountOverlay.setAttribute("data-jp-overlay", "account");
  accountOverlay.hidden = true;
  accountOverlay.innerHTML = `
    <div class="jp-modal jp-account-modal" role="dialog" aria-modal="true" aria-labelledby="jp-account-title">
      <div class="jp-modal-head">
        <h2 class="jp-modal-title" id="jp-account-title">Account</h2>
        <button class="jp-close" type="button" data-jp-close aria-label="Close account window">${ICONS.close}</button>
      </div>
      <div class="jp-tabs" role="tablist" aria-label="Account options">
        <button class="jp-tab is-active" type="button" role="tab" aria-selected="true" aria-controls="jp-panel-signin" id="jp-tab-signin" data-jp-tab="signin">Sign in</button>
        <button class="jp-tab" type="button" role="tab" aria-selected="false" aria-controls="jp-panel-register" id="jp-tab-register" data-jp-tab="register">Create account</button>
      </div>
      <div class="jp-modal-body">
        <div class="jp-panel" id="jp-panel-signin" role="tabpanel" aria-labelledby="jp-tab-signin" data-jp-panel="signin">
          <form data-jp-form="signin">
            <label class="jp-field">
              <span class="jp-field-label">Email</span>
              <input class="jp-input" type="email" name="email" autocomplete="email" placeholder="you@example.com" required>
            </label>
            <label class="jp-field">
              <span class="jp-field-label">Password</span>
              <span class="jp-input-wrap">
                <input class="jp-input" type="password" name="password" autocomplete="current-password" placeholder="••••••••" minlength="6" required>
                <button class="jp-eye" type="button" aria-label="Show password" data-jp-eye>${ICONS.eye}</button>
              </span>
            </label>
            <p class="jp-message" role="status" data-jp-message></p>
            <button class="jp-submit" type="submit">Sign in</button>
            <button class="jp-link" type="button" data-jp-forgot>Forgot your password?</button>
          </form>
        </div>
        <div class="jp-panel" id="jp-panel-register" role="tabpanel" aria-labelledby="jp-tab-register" data-jp-panel="register" hidden>
          <form data-jp-form="register">
            <label class="jp-field">
              <span class="jp-field-label">Full name</span>
              <input class="jp-input" type="text" name="name" autocomplete="name" placeholder="Your name" minlength="2" required>
            </label>
            <label class="jp-field">
              <span class="jp-field-label">Email</span>
              <input class="jp-input" type="email" name="email" autocomplete="email" placeholder="you@example.com" required>
            </label>
            <label class="jp-field">
              <span class="jp-field-label">Password</span>
              <span class="jp-input-wrap">
                <input class="jp-input" type="password" name="password" autocomplete="new-password" placeholder="At least 6 characters" minlength="6" required>
                <button class="jp-eye" type="button" aria-label="Show password" data-jp-eye>${ICONS.eye}</button>
              </span>
            </label>
            <p class="jp-message" role="status" data-jp-message></p>
            <button class="jp-submit" type="submit">Create account</button>
            <p class="jp-register-note">Your account is stored only in this browser preview.</p>
          </form>
        </div>
      </div>
    </div>
  `;

  const searchOverlay = document.createElement("div");
  searchOverlay.className = "jp-overlay jp-search-overlay";
  searchOverlay.setAttribute("data-jp-overlay", "search");
  searchOverlay.hidden = true;
  searchOverlay.innerHTML = `
    <div class="jp-modal jp-search-modal" role="dialog" aria-modal="true" aria-labelledby="jp-search-title">
      <form class="jp-search-head" data-jp-search-form>
        ${ICONS.search}
        <input class="jp-search-input" id="jp-search-title" type="search" placeholder="Search sunglasses, eyeglasses, brands..." autocomplete="off" aria-label="Search products and brands">
        <button class="jp-close" type="button" data-jp-close aria-label="Close search">${ICONS.close}</button>
      </form>
      <div class="jp-search-body">
        <p class="jp-search-kicker" data-jp-search-kicker>Popular searches</p>
        <div class="jp-search-results" data-jp-search-results></div>
      </div>
      <div class="jp-search-foot">Enter to open top result &middot; Esc to close</div>
    </div>
  `;

  const menuArticles = Array.from(
    document.querySelectorAll("header nav a"),
  ).map(
    (link) =>
      `<a class="jp-menu-link" href="${escapeHtml(link.getAttribute("href"))}">${escapeHtml(link.textContent.trim())}</a>`,
  );

  const menuOverlay = document.createElement("div");
  menuOverlay.className = "jp-overlay jp-menu-overlay";
  menuOverlay.setAttribute("data-jp-overlay", "menu");
  menuOverlay.hidden = true;
  menuOverlay.innerHTML = `
    <div class="jp-menu-panel" role="dialog" aria-modal="true" aria-labelledby="jp-menu-title">
      <div class="jp-menu-head">
        <span class="jp-menu-brand" id="jp-menu-title">JP</span>
        <button class="jp-close" type="button" data-jp-close aria-label="Close menu">${ICONS.close}</button>
      </div>
      <nav class="jp-menu-nav" aria-label="Mobile navigation">
        ${menuArticles.join("")}
      </nav>
      <div class="jp-menu-foot">
        <button class="jp-menu-account" type="button" data-jp-menu-account>Account</button>
        <a class="jp-menu-account" href="/cart">Shopping bag</a>
      </div>
    </div>
  `;

  document.body.appendChild(accountOverlay);
  document.body.appendChild(searchOverlay);
  document.body.appendChild(menuOverlay);

  const accountButton = document.querySelector('button[aria-label="Login"]');
  const searchButton = document.querySelector('button[aria-label="Search"]');
  const menuButton = document.querySelector('button[aria-label="Open menu"]');
  const searchInput = searchOverlay.querySelector(".jp-search-input");
  const searchResults = searchOverlay.querySelector(
    "[data-jp-search-results]",
  );
  const searchKicker = searchOverlay.querySelector(
    "[data-jp-search-kicker]",
  );

  let indexPromise = null;
  let searchIndex = null;
  let visibleResults = [];
  let activeOverlay = null;
  let previousFocus = null;
  let searchTimer = null;

  const lockPage = () => {
    document.documentElement.classList.add("jp-lock");
    document.body.classList.add("jp-lock");
  };

  const unlockPage = () => {
    if (accountOverlay.hidden && searchOverlay.hidden && menuOverlay.hidden) {
      document.documentElement.classList.remove("jp-lock");
      document.body.classList.remove("jp-lock");
    }
  };

  const openOverlay = (overlay) => {
    previousFocus = document.activeElement;
    activeOverlay = overlay;
    overlay.hidden = false;
    lockPage();
  };

  const closeOverlay = (overlay) => {
    overlay.hidden = true;
    if (overlay === searchOverlay && searchButton) {
      searchButton.setAttribute("aria-expanded", "false");
    }
    if (overlay === menuOverlay && menuButton) {
      menuButton.setAttribute("aria-expanded", "false");
    }
    if (activeOverlay === overlay) activeOverlay = null;
    unlockPage();
    if (previousFocus instanceof HTMLElement) {
      previousFocus.focus({ preventScroll: true });
      previousFocus = null;
    }
  };

  const setTab = (name) => {
    accountOverlay.querySelectorAll("[data-jp-tab]").forEach((tab) => {
      const active = tab.dataset.jpTab === name;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    accountOverlay.querySelectorAll("[data-jp-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.jpPanel !== name;
    });
  };

  const setMessage = (formName, message, tone = "") => {
    const messageElement = accountOverlay.querySelector(
      `[data-jp-form="${formName}"] [data-jp-message]`,
    );
    if (!messageElement) return;
    messageElement.textContent = message;
    messageElement.classList.remove("is-success", "is-error");
    if (tone) messageElement.classList.add(`is-${tone}`);
  };

  const updateAccountButton = () => {
    if (!accountButton) return;
    const session = readSession();
    accountButton.setAttribute(
      "aria-label",
      session?.name ? `Account: ${session.name}` : "Login",
    );
  };

  const openAccount = () => {
    if (!searchOverlay.hidden) closeOverlay(searchOverlay);
    if (!menuOverlay.hidden) closeOverlay(menuOverlay);
    setTab("signin");
    openOverlay(accountOverlay);
    setMessage("signin", "");
    setMessage("register", "");
    const session = readSession();
    if (session?.email) {
      const emailInput = accountOverlay.querySelector(
        '[data-jp-form="signin"] input[name="email"]',
      );
      if (emailInput && !emailInput.value) emailInput.value = session.email;
    }
    window.setTimeout(() => {
      accountOverlay
        .querySelector(
          '[data-jp-panel="signin"]:not([hidden]) input, [data-jp-panel="register"]:not([hidden]) input',
        )
        ?.focus({ preventScroll: true });
    }, 40);
  };

  const openSearch = () => {
    if (!accountOverlay.hidden) closeOverlay(accountOverlay);
    if (!menuOverlay.hidden) closeOverlay(menuOverlay);
    openOverlay(searchOverlay);
    window.setTimeout(() => searchInput.focus({ preventScroll: true }), 40);
    loadIndex().then(() => {
      if (!searchOverlay.hidden) runSearch(searchInput.value);
    });
  };

  const openMenu = () => {
    if (!accountOverlay.hidden) closeOverlay(accountOverlay);
    if (!searchOverlay.hidden) closeOverlay(searchOverlay);
    openOverlay(menuOverlay);
    window.setTimeout(() => {
      menuOverlay
        .querySelector('[data-jp-close]')
        ?.focus({ preventScroll: true });
    }, 40);
  };

  const formatMoney = (value) => value || "";

  const resultHtml = (item) =>
    `<a class="jp-search-result" href="${escapeHtml(item.url)}">
      <img class="jp-search-thumb" src="${escapeHtml(item.image || "/mirror-assets/placeholder.svg")}" alt="" loading="eager" decoding="async">
      <span class="jp-search-copy">
        <span class="jp-search-name">${escapeHtml(item.name)}</span>
        <span class="jp-search-meta">${escapeHtml(item.brand)}${item.brand && item.type ? " &middot; " : ""}${escapeHtml(item.type)}</span>
      </span>
      <span class="jp-search-price">${escapeHtml(formatMoney(item.price))}</span>
    </a>`;

  const popularHtml = () => `
    <div class="jp-chips">
      ${["Sunglasses", "Eyeglasses", "Cartier", "Maybach"]
        .map(
          (label) =>
            `<button class="jp-chip" type="button" data-jp-chip="${escapeHtml(label)}">${escapeHtml(label)}</button>`,
        )
        .join("")}
    </div>
  `;

  const loadIndex = () => {
    if (!indexPromise) {
      indexPromise = fetch("/search-index.json")
        .then((response) => {
          if (!response.ok) throw new Error("Search index unavailable");
          return response.json();
        })
        .then((data) => {
          searchIndex = data;
          return data;
        })
        .catch(() => {
          searchIndex = { products: [], collections: [] };
          return searchIndex;
        });
    }
    return indexPromise;
  };

  const runSearch = (query) => {
    const value = query.trim();
    if (!value) {
      visibleResults = [];
      searchKicker.textContent = "Popular searches";
      searchResults.innerHTML = popularHtml();
      return;
    }

    if (!searchIndex) {
      searchKicker.textContent = "Search";
      searchResults.innerHTML =
        '<p class="jp-search-empty">Loading the local catalog...</p>';
      return;
    }

    const normalizedQuery = normalize(value);
    const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
    const items = [
      ...(searchIndex.products || []),
      ...(searchIndex.collections || []),
    ];
    const scored = [];

    for (const item of items) {
      const name = normalize(item.name);
      const haystack = normalize(item.search);
      let score = 0;

      if (name === normalizedQuery) score += 100;
      else if (name.startsWith(normalizedQuery)) score += 65;
      else if (name.includes(normalizedQuery)) score += 40;

      for (const token of tokens) {
        if (!haystack.includes(token)) {
          score = -1;
          break;
        }
        score += haystack.startsWith(token) ? 12 : 6;
      }

      if (score > 0) scored.push({ item, score });
    }

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.name.localeCompare(b.item.name);
    });

    visibleResults = scored.slice(0, 8).map((entry) => entry.item);
    searchKicker.textContent = visibleResults.length
      ? `${visibleResults.length} result${visibleResults.length === 1 ? "" : "s"}`
      : "Search";

    if (!visibleResults.length) {
      searchResults.innerHTML = `<p class="jp-search-empty">No matches for &ldquo;${escapeHtml(value)}&rdquo;. Try a brand, model, or frame type.</p>`;
      return;
    }

    searchResults.innerHTML = visibleResults.map(resultHtml).join("");
  };

  const submitAccountForm = (form) => {
    const formName = form.dataset.jpForm;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const name =
      String(data.get("name") || "").trim() ||
      email.split("@")[0] ||
      "Account";

    if (formName === "register") {
      const accounts = readAccounts();
      const existing = accounts.find((account) => account.email === email);
      if (existing) {
        existing.name = name;
      } else {
        accounts.push({ name, email });
      }
      writeAccounts(accounts);
      writeSession({ name, email });
      updateAccountButton();
      setMessage("register", `Account created for ${email}.`, "success");
      window.setTimeout(() => {
        if (!accountOverlay.hidden) closeOverlay(accountOverlay);
      }, 1100);
      return;
    }

    const account = readAccounts().find((entry) => entry.email === email);
    const sessionName = account?.name || name;
    writeSession({ name: sessionName, email });
    updateAccountButton();
    setMessage("signin", `Signed in locally as ${sessionName}.`, "success");
    window.setTimeout(() => {
      if (!accountOverlay.hidden) closeOverlay(accountOverlay);
    }, 1100);
  };

  moveNavigation();

  if (accountButton) {
    accountButton.classList.add("jp-account-button");
    accountButton.addEventListener("click", openAccount);
  }

  if (searchButton) {
    searchButton.setAttribute("aria-haspopup", "dialog");
    searchButton.setAttribute("aria-expanded", "false");
    searchButton.addEventListener("click", () => {
      searchButton.setAttribute("aria-expanded", "true");
      openSearch();
    });
  }

  if (menuButton) {
    menuButton.setAttribute("aria-haspopup", "dialog");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "true");
      openMenu();
    });
  }

  updateAccountButton();

  accountOverlay
    .querySelectorAll("[data-jp-tab]")
    .forEach((tab) =>
      tab.addEventListener("click", () => setTab(tab.dataset.jpTab)),
    );

  accountOverlay.querySelectorAll("[data-jp-close]").forEach((button) => {
    button.addEventListener("click", () => closeOverlay(accountOverlay));
  });

  accountOverlay.querySelectorAll("[data-jp-eye]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = button
        .closest(".jp-input-wrap")
        ?.querySelector('input[type="password"], input[type="text"]');
      if (!input) return;
      const showing = input.type === "text";
      input.type = showing ? "password" : "text";
      button.setAttribute("aria-label", showing ? "Show password" : "Hide password");
      button.innerHTML = showing ? ICONS.eye : ICONS.eyeOff;
    });
  });

  accountOverlay
    .querySelectorAll("[data-jp-form]")
    .forEach((form) =>
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        submitAccountForm(form);
      }),
    );

  accountOverlay
    .querySelector("[data-jp-forgot]")
    ?.addEventListener("click", () => {
      setMessage(
        "signin",
        "Password recovery is not connected in this local preview.",
        "error",
      );
    });

  searchOverlay.querySelectorAll("[data-jp-close]").forEach((button) => {
    button.addEventListener("click", () => closeOverlay(searchOverlay));
  });

  menuOverlay.querySelectorAll("[data-jp-close]").forEach((button) => {
    button.addEventListener("click", () => closeOverlay(menuOverlay));
  });

  menuOverlay.querySelectorAll(".jp-menu-link").forEach((link) => {
    link.addEventListener("click", () => closeOverlay(menuOverlay));
  });

  menuOverlay
    .querySelector("[data-jp-menu-account]")
    ?.addEventListener("click", openAccount);

  searchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => runSearch(searchInput.value), 80);
  });

  searchOverlay
    .querySelector("[data-jp-search-form]")
    .addEventListener("submit", (event) => {
      event.preventDefault();
      if (visibleResults.length) {
        window.location.href = visibleResults[0].url;
      } else if (searchInput.value.trim()) {
        runSearch(searchInput.value);
      }
    });

  searchResults.addEventListener("click", (event) => {
    const chip = event.target.closest("[data-jp-chip]");
    if (!chip) return;
    searchInput.value = chip.dataset.jpChip || "";
    runSearch(searchInput.value);
    searchInput.focus({ preventScroll: true });
  });

  [accountOverlay, searchOverlay, menuOverlay].forEach((overlay) => {
    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) closeOverlay(overlay);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeOverlay) {
      if (activeOverlay === searchOverlay && searchButton) {
        searchButton.setAttribute("aria-expanded", "false");
      }
      closeOverlay(activeOverlay);
      return;
    }

    if (event.key !== "Tab" || !activeOverlay) return;
    const focusable = Array.from(
      activeOverlay.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  const showToast = (message) => {
    let toast = document.querySelector(".jp-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "jp-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(Number(toast.dataset.timeout || 0));
    toast.dataset.timeout = String(
      window.setTimeout(() => {
        toast.hidden = true;
      }, 2600),
    );
  };

  const readCart = () => {
    try {
      const cart = JSON.parse(localStorage.getItem("jp_local_cart_v1") || "[]");
      return Array.isArray(cart) ? cart : [];
    } catch {
      return [];
    }
  };

  const writeCart = (cart) => {
    try {
      localStorage.setItem("jp_local_cart_v1", JSON.stringify(cart));
    } catch {
      return;
    }
  };

  const updateCartBadge = () => {
    const count = readCart().reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('a[aria-label="Cart"]').forEach((link) => {
      let badge = link.querySelector(".jp-cart-count");
      if (count === 0) {
        badge?.remove();
        return;
      }
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "jp-cart-count";
        link.appendChild(badge);
      }
      badge.textContent = String(count);
    });
  };

  const setupProductActions = () => {
    document.querySelectorAll('button[aria-label^="Add "][aria-label$=" to bag"]').forEach((button) => {
      if (button.dataset.jpBound) return;
      button.dataset.jpBound = "true";
      button.type = "button";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const name = button.getAttribute("aria-label")?.replace(/^Add | to bag$/g, "") || "Item";
        const link = button.closest("a[href]");
        const cart = readCart();
        const existing = cart.find((item) => item.name === name && item.url === link?.getAttribute("href"));
        if (existing) existing.quantity += 1;
        else cart.push({ name, url: link?.getAttribute("href") || "/shop", quantity: 1 });
        writeCart(cart);
        updateCartBadge();
        showToast(`${name} added to your bag`);
      });
    });
    updateCartBadge();
  };

  const setupCarousels = () => {
    document.querySelectorAll('[role="region"][aria-roledescription="carousel"]').forEach((region) => {
      if (region.dataset.jpBound) return;
      const viewport = region.querySelector(":scope > .overflow-hidden");
      const track = viewport?.firstElementChild;
      const slides = track ? Array.from(track.children) : [];
      if (!viewport || !track || !slides.length) return;
      region.dataset.jpBound = "true";
      region.tabIndex = 0;
      let offset = 0;
      let maxOffset = 0;
      let slideWidth = 0;
      let dragging = false;
      let pointerId = null;
      let startX = 0;
      let startY = 0;
      let startOffset = 0;
      let suppressClick = false;

      const measure = () => {
        slideWidth = slides[0].getBoundingClientRect().width || viewport.clientWidth;
        maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);
        offset = Math.min(offset, maxOffset);
      };
      const apply = (animate) => {
        track.style.transition = animate ? "" : "none";
        track.style.transform = `translate3d(${-offset}px, 0, 0)`;
        if (!animate) requestAnimationFrame(() => { track.style.transition = ""; });
        region.querySelectorAll('button').forEach((button) => {
          const label = `${button.textContent} ${button.getAttribute("aria-label") || ""}`.toLowerCase();
          if (label.includes("previous")) button.disabled = offset <= 1;
          if (label.includes("next")) button.disabled = offset >= maxOffset - 1;
        });
      };
      const move = (direction) => {
        measure();
        const visible = Math.max(1, Math.round(viewport.clientWidth / slideWidth));
        offset = Math.max(0, Math.min(maxOffset, offset + direction * slideWidth * visible));
        apply(true);
      };
      const finishPointer = () => {
        if (pointerId !== null) {
          try { viewport.releasePointerCapture(pointerId); } catch {}
        }
        pointerId = null;
        if (dragging) {
          const snap = Math.round(offset / slideWidth) * slideWidth;
          offset = Math.max(0, Math.min(maxOffset, snap));
          apply(true);
          suppressClick = true;
          window.setTimeout(() => { suppressClick = false; }, 0);
        }
        dragging = false;
        region.classList.remove("jp-carousel-dragging");
      };

      region.querySelectorAll("button").forEach((button) => {
        const label = `${button.textContent} ${button.getAttribute("aria-label") || ""}`.toLowerCase();
        button.type = "button";
        if (label.includes("previous")) button.addEventListener("click", () => move(-1));
        if (label.includes("next")) button.addEventListener("click", () => move(1));
      });
      region.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
      });
      viewport.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointerId = event.pointerId;
        startX = event.clientX;
        startY = event.clientY;
        startOffset = offset;
        dragging = false;
        viewport.setPointerCapture?.(pointerId);
      });
      viewport.addEventListener("pointermove", (event) => {
        if (event.pointerId !== pointerId) return;
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        if (!dragging && Math.abs(dx) < 8) return;
        if (!dragging && Math.abs(dy) > Math.abs(dx)) { finishPointer(); return; }
        dragging = true;
        region.classList.add("jp-carousel-dragging");
        event.preventDefault();
        offset = Math.max(0, Math.min(maxOffset, startOffset - dx));
        apply(false);
      });
      viewport.addEventListener("pointerup", finishPointer);
      viewport.addEventListener("pointercancel", finishPointer);
      viewport.addEventListener("lostpointercapture", finishPointer);
      viewport.addEventListener("click", (event) => {
        if (suppressClick) { event.preventDefault(); event.stopPropagation(); }
      }, true);
      window.addEventListener("resize", () => { measure(); apply(false); }, { passive: true });
      measure();
      apply(false);
    });
  };

  const setupHeroControls = () => {
    const routes = { Cartier: "/collection/14", Dita: "/collection/4", Maybach: "/collection/10" };
    document.querySelectorAll('button[aria-label^="Go to "]').forEach((button) => {
      if (button.dataset.jpBound) return;
      button.dataset.jpBound = "true";
      button.type = "button";
      button.addEventListener("click", () => {
        const brand = button.getAttribute("aria-label")?.replace("Go to ", "");
        if (brand && routes[brand]) window.location.href = routes[brand];
      });
    });
  };

  const setupProductGallery = () => {
    document.querySelectorAll('button[aria-label^="Photo "]').forEach((button) => {
      if (button.dataset.jpBound) return;
      button.dataset.jpBound = "true";
      button.type = "button";
      button.addEventListener("click", () => {
        const source = button.querySelector("img")?.getAttribute("src");
        const candidates = Array.from(document.images).filter((image) => image.getAttribute("src") === source && image !== button.querySelector("img"));
        const target = candidates.find((image) => image.className.includes("p-10") || image.className.includes("p-6"));
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        button.parentElement?.querySelectorAll('button[aria-label^="Photo "]').forEach((item) => item.classList.remove("ring-1", "ring-black"));
        button.classList.add("ring-1", "ring-black");
      });
    });
  };

  const setupLensCompare = () => {
    const handle = document.querySelector('button[aria-label="Drag to compare lenses"]');
    const surface = handle?.closest("div.relative");
    if (!handle || !surface || surface.dataset.jpBound) return;
    surface.dataset.jpBound = "true";
    surface.style.touchAction = "none";
    const overlay = surface.querySelector("img[style]");
    const divider = handle.parentElement;
    if (!overlay || !divider) return;
    const setValue = (clientX) => {
      const rect = surface.getBoundingClientRect();
      const value = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
      overlay.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
      divider.style.left = `${value}%`;
    };
    let active = false;
    surface.addEventListener("pointerdown", (event) => { active = true; surface.setPointerCapture?.(event.pointerId); setValue(event.clientX); });
    surface.addEventListener("pointermove", (event) => { if (active) { event.preventDefault(); setValue(event.clientX); } });
    ["pointerup", "pointercancel", "lostpointercapture"].forEach((name) => surface.addEventListener(name, () => { active = false; }));
    handle.addEventListener("keydown", (event) => {
      const current = parseFloat(divider.style.left || "50");
      if (event.key === "ArrowLeft") { event.preventDefault(); setValue(surface.getBoundingClientRect().left + surface.getBoundingClientRect().width * ((current - 4) / 100)); }
      if (event.key === "ArrowRight") { event.preventDefault(); setValue(surface.getBoundingClientRect().left + surface.getBoundingClientRect().width * ((current + 4) / 100)); }
    });
  };

  const setupGridControls = () => {
    const grid = document.querySelector("main > .grid");
    if (!grid || grid.dataset.jpBound) return;
    grid.dataset.jpBound = "true";
    const setMode = (mode) => {
      grid.classList.toggle("jp-grid-five", mode === "five");
      grid.classList.toggle("jp-grid-list", mode === "list");
      grid.querySelectorAll("a").forEach((link) => link.classList.toggle("jp-list-card", mode === "list"));
    };
    document.querySelector('button[aria-label="Three per row"]')?.addEventListener("click", () => setMode("three"));
    document.querySelector('button[aria-label="Five per row"]')?.addEventListener("click", () => setMode("five"));
    document.querySelector('button[aria-label="List"]')?.addEventListener("click", () => setMode("list"));
    const filterButton = Array.from(document.querySelectorAll("button")).find((button) => button.textContent.trim().toLowerCase() === "filter");
    if (!filterButton) return;
    const toolbar = filterButton.parentElement?.parentElement;
    if (!toolbar) return;
    toolbar.style.position = "relative";
    const panel = document.createElement("div");
    panel.className = "jp-filter-panel";
    panel.hidden = true;
    panel.innerHTML = '<input type="search" placeholder="Filter visible products" aria-label="Filter visible products">';
    toolbar.appendChild(panel);
    const input = panel.querySelector("input");
    filterButton.type = "button";
    filterButton.setAttribute("aria-expanded", "false");
    filterButton.addEventListener("click", () => { panel.hidden = !panel.hidden; filterButton.setAttribute("aria-expanded", String(!panel.hidden)); if (!panel.hidden) input.focus(); });
    input.addEventListener("input", () => { const query = normalize(input.value); grid.querySelectorAll(":scope > a").forEach((card) => { card.hidden = query && !normalize(card.textContent).includes(query); }); });
  };

  const setupComboboxes = () => {
    document.querySelectorAll('button[role="combobox"]').forEach((button) => {
      if (button.dataset.jpBound) return;
      const select = button.parentElement?.querySelector("select");
      if (!select) return;
      button.dataset.jpBound = "true";
      button.type = "button";
      const parent = button.parentElement;
      parent.style.position = "relative";
      const options = document.createElement("div");
      options.className = "jp-combobox-options";
      options.hidden = true;
      Array.from(select.options).forEach((option) => {
        const item = document.createElement("button");
        item.type = "button";
        item.textContent = option.textContent;
        item.addEventListener("click", () => { select.value = option.value; button.querySelector("span").textContent = option.textContent; options.hidden = true; button.setAttribute("aria-expanded", "false"); });
        options.appendChild(item);
      });
      parent.appendChild(options);
      button.addEventListener("click", () => { options.hidden = !options.hidden; button.setAttribute("aria-expanded", String(!options.hidden)); });
    });
  };

  const setupFaq = () => {
    document.querySelectorAll("button").forEach((button) => {
      if (button.dataset.jpBound || !button.textContent.trim() || button.getAttribute("aria-label")) return;
      const answer = button.nextElementSibling;
      if (!answer || !answer.textContent.trim()) return;
      button.dataset.jpBound = "true";
      button.type = "button";
      answer.hidden = true;
      button.setAttribute("aria-expanded", "false");
      button.addEventListener("click", () => { answer.hidden = !answer.hidden; button.setAttribute("aria-expanded", String(!answer.hidden)); });
    });
  };

  const setupForms = () => {
    document.querySelectorAll("form").forEach((form) => {
      if (form.dataset.jpForm || form.dataset.jpSearchForm || form.dataset.jpBound) return;
      form.dataset.jpBound = "true";
      form.addEventListener("submit", (event) => {
        if (form.querySelector("input[name=first_name], textarea[name=message]")) {
          event.preventDefault();
          showToast("Thanks — your message was recorded in this preview.");
          form.reset();
          return;
        }
        if (form.querySelector('input[type="email"]')) {
          event.preventDefault();
          showToast("You are on the list. Welcome.");
          form.reset();
        }
      });
    });
  };

  const setupCallButton = () => {
    const button = Array.from(document.querySelectorAll("button")).find((item) => item.querySelector('svg path[d^="M22 16.92"]'));
    if (!button || button.dataset.jpBound) return;
    button.dataset.jpBound = "true";
    button.type = "button";
    button.setAttribute("aria-label", "Call JP");
    button.addEventListener("click", () => { window.location.href = "tel:+13475445139"; });
  };

  setupProductActions();
  setupCarousels();
  setupHeroControls();
  setupProductGallery();
  setupLensCompare();
  setupGridControls();
  setupComboboxes();
  setupFaq();
  setupForms();
  setupCallButton();

  document.documentElement.classList.add("jp-ui-ready");
})();

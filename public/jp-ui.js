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

  const categoryText = (value) =>
    String(value ?? "").trim().replace(/^Eyeglasses$/i, "Optical");

  const transitionsLabel = "Transitions (Photochromic)";

  const transitionsHref = (href) => {
    const [pathname, query = ""] = String(href || "/shop").split("?");
    const params = new URLSearchParams(query);
    params.set("lens", "Transitions");
    return `${pathname}?${params.toString()}`;
  };

  const productHasTransitions = (product) =>
    Array.isArray(product?.subcategoryIds)
      ? product.subcategoryIds.includes("transitions")
      : product?.transitions === true;

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
        <input class="jp-search-input" id="jp-search-title" type="search" placeholder="Search sunglasses, optical, brands..." autocomplete="off" aria-label="Search products and brands">
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
  ).flatMap((link) => {
    const href = link.getAttribute("href") || "/";
    const label = categoryText(link.textContent);
    if (href === "/shop" || href.startsWith("/lenses/")) return [];
    const item = `<a class="jp-menu-link" href="${escapeHtml(href)}">${escapeHtml(label)}</a>`;
    if (!/^(Sunglasses|Optical)$/i.test(label)) return [item];
    return [
      item,
      `<a class="jp-menu-link jp-menu-sub" href="${escapeHtml(transitionsHref(href))}">${transitionsLabel}</a>`,
    ];
  });

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
      ${["Sunglasses", "Optical", transitionsLabel, "Cartier"]
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
    const count = readCart().reduce((total, item) => total + Number(item.quantity || 0), 0);
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
    const productButtons = Array.from(document.querySelectorAll('button[aria-label^="Add "][aria-label$=" to bag"]'));
    if (window.location.pathname.startsWith("/product/")) {
      productButtons.push(...Array.from(document.querySelectorAll("button")).filter((button) => button.textContent.trim().toLowerCase() === "add to cart"));
    }
    productButtons.forEach((button) => {
      if (button.dataset.jpBound) return;
      button.dataset.jpBound = "true";
      button.type = "button";
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        const isDetailButton = button.textContent.trim().toLowerCase() === "add to cart";
        const name = isDetailButton
          ? document.querySelector("main h1")?.textContent.trim() || "Item"
          : button.getAttribute("aria-label")?.replace(/^Add | to bag$/g, "") || "Item";
        const link = button.closest("a[href]");
        const url = link?.getAttribute("href") || `${window.location.pathname}${window.location.search}` || "/shop";
        const image = link?.querySelector("img")?.getAttribute("src") || document.querySelector("main img[alt]")?.getAttribute("src") || "";
        const price = link?.querySelector("p:last-child span")?.textContent.trim() || document.querySelector('main span[class*="text-[19px]"]')?.textContent.trim() || "";
        const cart = readCart();
        const existing = cart.find((item) => item.name === name && item.url === url);
        if (existing) existing.quantity += 1;
        else cart.push({
          name,
          url,
          quantity: 1,
          image,
          price,
        });
        writeCart(cart);
        updateCartBadge();
        showToast(`${name} added to your bag`);
      });
    });
    updateCartBadge();
  };

  const parseMoney = (value) => {
    const amount = Number(String(value || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(amount) ? amount : 0;
  };

  const money = (value) =>
    `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const setupCartPage = () => {
    if (window.location.pathname !== "/cart") return;
    const main = document.querySelector("main");
    const hero = document.querySelector("body > section") || document.querySelector("section");
    if (!main) return;
    main.classList.add("jp-cart-page");
    hero?.classList.add("jp-cart-hero");
    const heading = hero?.querySelector("h1");
    if (heading) heading.textContent = "Shopping bag";
    if (main.dataset.jpCartBound) return;
    main.dataset.jpCartBound = "true";

    const render = (catalog = []) => {
      const cart = readCart().map((item) => {
        const product = catalog.find((candidate) => candidate.url === item.url || new URL(candidate.url, window.location.origin).pathname === new URL(item.url, window.location.origin).pathname);
        return {
          ...item,
          name: item.name || product?.name || "Product",
          image: item.image || product?.image || "/mirror-assets/placeholder.svg",
          price: item.price || product?.price || "$0.00",
          quantity: Math.max(1, Number(item.quantity) || 1),
        };
      });
      writeCart(cart);
      updateCartBadge();
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      const subtotal = cart.reduce((total, item) => total + parseMoney(item.price) * item.quantity, 0);
      const countLabel = `${count} ${count === 1 ? "item" : "items"}`;
      let heroCount = hero?.querySelector("[data-jp-cart-count]");
      if (!heroCount && heading) {
        heroCount = document.createElement("p");
        heroCount.className = "jp-cart-hero-count";
        heroCount.dataset.jpCartCount = "true";
        hero.appendChild(heroCount);
      }
      if (heroCount) heroCount.textContent = countLabel;

      if (!cart.length) {
        main.innerHTML = `<div class="jp-cart-empty"><p>Your bag is empty</p><a href="/shop">Continue shopping</a></div>`;
        return;
      }

      main.innerHTML = `
        <div class="jp-cart-layout">
          <section class="jp-cart-items" aria-label="Shopping bag items">
            ${cart.map((item, index) => `<article class="jp-cart-item" data-jp-cart-index="${index}">
              <a class="jp-cart-image" href="${escapeHtml(item.url)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}"></a>
              <div class="jp-cart-info">
                <a class="jp-cart-name" href="${escapeHtml(item.url)}">${escapeHtml(item.name)}</a>
                <p class="jp-cart-meta">COLOR / STANDARD</p>
                <div class="jp-cart-controls">
                  <div class="jp-cart-quantity" aria-label="Quantity for ${escapeHtml(item.name)}">
                    <button type="button" data-jp-cart-decrease aria-label="Decrease quantity">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" data-jp-cart-increase aria-label="Increase quantity">+</button>
                  </div>
                  <button class="jp-cart-remove" type="button" data-jp-cart-remove>Remove</button>
                </div>
              </div>
              <p class="jp-cart-price">${escapeHtml(item.price)}</p>
            </article>`).join("")}
            <div class="jp-cart-actions"><button type="button" data-jp-cart-clear>Clear bag</button><a href="/lenses/19">Add prescription</a><a href="/shop">Continue shopping</a></div>
          </section>
          <aside class="jp-cart-summary" aria-label="Order summary">
            <h2>Order summary</h2>
            <div class="jp-cart-summary-row"><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
            <div class="jp-cart-summary-row jp-cart-shipping"><span>Shipping<small>Standard shipping (3-5 business days)</small></span><strong>$0.00</strong></div>
            <div class="jp-cart-total"><span>Total</span><strong>${money(subtotal)}</strong></div>
            <button class="jp-cart-checkout" type="button" data-jp-cart-checkout>Proceed to checkout</button>
            <p class="jp-cart-tax">Tax is calculated after payment</p>
          </aside>
        </div>`;
    };

    main.addEventListener("click", (event) => {
      const target = event.target.closest("[data-jp-cart-increase], [data-jp-cart-decrease], [data-jp-cart-remove], [data-jp-cart-clear], [data-jp-cart-checkout]");
      if (!target) return;
      event.preventDefault();
      const index = Number(target.closest("[data-jp-cart-index]")?.dataset.jpCartIndex);
      const cart = readCart();
      if (target.hasAttribute("data-jp-cart-increase") && cart[index]) cart[index].quantity = Number(cart[index].quantity || 0) + 1;
      if (target.hasAttribute("data-jp-cart-decrease") && cart[index]) cart[index].quantity = Number(cart[index].quantity || 0) - 1;
      if (target.hasAttribute("data-jp-cart-remove")) cart.splice(index, 1);
      if (target.hasAttribute("data-jp-cart-clear")) cart.length = 0;
      if (target.hasAttribute("data-jp-cart-checkout")) {
        showToast("Checkout is not connected in this preview.");
        return;
      }
      writeCart(cart.filter((item) => Number(item.quantity || 0) > 0));
      loadIndex().then((data) => render(data.products || []));
    });

    loadIndex().then((data) => render(data.products || [])).catch(() => render());
  };

  const setupCarousels = () => {
    document.querySelectorAll('[role="region"][aria-roledescription="carousel"]').forEach((region) => {
      if (region.dataset.jpBound) return;
      const viewport = region.querySelector(":scope > .overflow-hidden");
      const track = viewport?.firstElementChild;
      let slides = track ? Array.from(track.children) : [];
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
        slides = Array.from(track.children);
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
      region.addEventListener("jp-carousel-reset", () => { offset = 0; measure(); apply(false); });
      measure();
      apply(false);
    });
  };

  const setupBestSellerTabs = () => {
    const section = Array.from(document.querySelectorAll("section")).find(
      (candidate) => candidate.querySelector("p")?.textContent.trim().toLowerCase() === "our best sellers",
    );
    const buttons = section ? Array.from(section.querySelectorAll("button")).filter(
      (button) => ["sunglasses", "optical"].includes(button.textContent.trim().toLowerCase()),
    ) : [];
    const region = section?.querySelector('[role="region"][aria-roledescription="carousel"]');
    const track = region?.querySelector(":scope > .overflow-hidden > .flex");
    const allProducts = section?.querySelector('a[href*="type_frame=Sunglasses"]');
    const sunglassesButton = buttons.find((button) => button.textContent.trim().toLowerCase() === "sunglasses");
    const opticalButton = buttons.find((button) => button.textContent.trim().toLowerCase() === "optical");
    if (!section || buttons.length !== 2 || !region || !track || !allProducts || !sunglassesButton || !opticalButton) return;

    const sunglassesSlides = Array.from(track.children);

    const setActive = (activeButton) => {
      buttons.forEach((button) => {
        const active = button === activeButton;
        button.classList.toggle("text-black", active);
        button.classList.toggle("text-neutral-400", !active);
        button.setAttribute("aria-pressed", String(active));
        button.querySelector("span")?.classList.toggle("scale-x-100", active);
        button.querySelector("span")?.classList.toggle("scale-x-0", !active);
      });
    };

    const showCategory = (categoryButton, slides, label, href) => {
      track.replaceChildren(...slides);
      allProducts.href = href;
      allProducts.textContent = label;
      region.dispatchEvent(new Event("jp-carousel-reset"));
      setupProductActions();
      setActive(categoryButton);
    };

    buttons.forEach((button) => {
      button.type = "button";
      button.dataset.jpBound = "true";
      button.setAttribute("aria-pressed", String(button === buttons[0]));
    });
    sunglassesButton.addEventListener("click", () => {
      showCategory(
        sunglassesButton,
        sunglassesSlides,
        "All sunglasses",
        "/shop?type_frame=Sunglasses&page=1",
      );
    });
    opticalButton.addEventListener("click", () => {
      showCategory(
        opticalButton,
        sunglassesSlides,
        "All optical",
        "/shop?type_frame=Optical&page=1",
      );
    });
  };

  const setupEditorialCarousels = () => {
    const looks = [
      {
        brand: "Cartier",
        name: "Cartier CT0543S",
        price: "$2,245.00",
        image: "/media/v0/b/site-bucket/o/banner_photos/home_cartier_ct0543s_003_w1200.webp",
        productImage: "/mirror-assets/e6d9444482466b57.png",
        href: "/product/4454?variant_id=20452",
        alt: "Cartier CT0543S",
        aspect: "1200 / 1600",
      },
      {
        brand: "Dita",
        name: "Dita Hyperlux-3000",
        price: "$1,205.00",
        image: "/mirror-assets/140a5b0f54b49566.webp",
        productImage: "/mirror-assets/15ab2d66f0c638c1.jpg",
        href: "/product/6009?variant_id=24432",
        alt: "Dita Hyperlux-3000",
        aspect: "1200 / 1501",
      },
    ];
    const reels = [
      {
        brand: "Cartier",
        name: "Cartier CT0092O",
        price: "$1,345.00",
        video: "/mirror-assets/419a3f9ee6acc6c3.mp4",
        cover: "/mirror-assets/8dd76334e801449c.webp",
        productImage: "/mirror-assets/8cdb21822a262de3.png",
        href: "/product/171?variant_id=6035",
        instagram: "https://www.instagram.com/reel/De-n6B6RAGo/",
        alt: "Cartier CT0092O in gold with custom tan lenses",
      },
      {
        brand: "Cartier",
        name: "Cartier CT0344O",
        price: "$1,345.00",
        video: "/mirror-assets/d806be0e530cddc1.mp4",
        cover: "/mirror-assets/b06d709ea1e0c591.webp",
        productImage: "/mirror-assets/76c6d021109e9fc3.png",
        href: "/product/195?variant_id=4236",
        instagram: "https://www.instagram.com/reel/DfCbXWvRp59/",
        alt: "Cartier CT0344O with warm tint and faceted edges",
      },
    ];
    const volumeOff =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path><line x1="22" x2="16" y1="9" y2="15"></line><line x1="16" x2="22" y1="9" y2="15"></line></svg>';
    const volumeOn =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>';

    const findSection = (heading) =>
      Array.from(document.querySelectorAll("section")).find(
        (candidate) =>
          candidate.querySelector("h2")?.textContent.trim().toLowerCase() === heading.toLowerCase(),
      );

    const setActiveDot = (dots, index) => {
      dots.forEach((dot, dotIndex) => {
        const active = dotIndex === index;
        dot.classList.toggle("w-6", active);
        dot.classList.toggle("bg-black", active);
        dot.classList.toggle("w-1.5", !active);
        dot.classList.toggle("bg-black/25", !active);
        dot.setAttribute("aria-current", String(active));
      });
    };

    const bindControls = (section, prev, next, dots, render, getIndex) => {
      prev.type = "button";
      next.type = "button";
      prev.addEventListener("click", () => render(getIndex() - 1));
      next.addEventListener("click", () => render(getIndex() + 1));
      dots.forEach((dot, dotIndex) => {
        dot.type = "button";
        dot.addEventListener("click", () => render(dotIndex));
      });
      setActiveDot(dots, getIndex());
    };

    const setupLooks = () => {
      const section = findSection("Our looks");
      if (!section || section.dataset.jpLooksBound) return;
      const model = section.querySelector("img.absolute.inset-0");
      const media = model?.parentElement;
      const stage = media?.parentElement;
      const panel = stage?.children[1]?.querySelector(":scope > div");
      const paragraphs = panel ? Array.from(panel.querySelectorAll(":scope > p")) : [];
      const brand = paragraphs[0];
      const name = paragraphs[1];
      const price = paragraphs[2]?.querySelector("span") || paragraphs[2];
      const productImage = panel?.querySelector("img");
      const productLink = panel?.querySelector('a[href^="/product/"]');
      const prev = section.querySelector('button[aria-label="Previous look"]');
      const next = section.querySelector('button[aria-label="Next look"]');
      const dots = Array.from(section.querySelectorAll('button[aria-label^="Look "]'));
      if (
        !model ||
        !media ||
        !panel ||
        !brand ||
        !name ||
        !price ||
        !productImage ||
        !productLink ||
        !prev ||
        !next ||
        dots.length !== looks.length
      ) {
        return;
      }
      section.dataset.jpLooksBound = "true";
      let index = 0;
      const render = (nextIndex) => {
        index = (nextIndex + looks.length) % looks.length;
        const look = looks[index];
        model.src = look.image;
        model.alt = look.alt;
        media.style.aspectRatio = look.aspect;
        brand.textContent = look.brand;
        name.textContent = look.name;
        price.textContent = look.price;
        productImage.src = look.productImage;
        productImage.alt = look.name;
        productLink.href = look.href;
        setActiveDot(dots, index);
      };
      bindControls(section, prev, next, dots, render, () => index);
    };

    const setupReels = () => {
      const section = findSection("As seen on Instagram");
      if (!section || section.dataset.jpReelsBound) return;
      const video = section.querySelector("video");
      const media = video?.parentElement;
      const stage = media?.parentElement;
      const panel = stage?.children[1]?.querySelector(":scope > div");
      const paragraphs = panel ? Array.from(panel.querySelectorAll(":scope > p")) : [];
      const brand = paragraphs[0];
      const name = paragraphs[1];
      const price = paragraphs[2]?.querySelector("span") || paragraphs[2];
      const productImage = panel?.querySelector("img");
      const productLink = panel?.querySelector('a[href^="/product/"]');
      const instagramLink = Array.from(panel?.querySelectorAll("a") || []).find((link) =>
        /instagram/i.test(link.textContent),
      );
      const muteButton = section.querySelector('button[aria-label="Unmute"], button[aria-label="Mute"]');
      const prev = section.querySelector('button[aria-label="Previous look"]');
      const next = section.querySelector('button[aria-label="Next look"]');
      const dots = Array.from(section.querySelectorAll('button[aria-label^="Reel "]'));
      if (
        !video ||
        !media ||
        !panel ||
        !brand ||
        !name ||
        !price ||
        !productImage ||
        !productLink ||
        !instagramLink ||
        !prev ||
        !next ||
        dots.length !== reels.length
      ) {
        return;
      }
      section.dataset.jpReelsBound = "true";
      let index = 0;
      let inView = false;
      video.muted = true;
      const syncMute = () => {
        if (!muteButton) return;
        muteButton.setAttribute("aria-label", video.muted ? "Unmute" : "Mute");
        muteButton.innerHTML = video.muted ? volumeOff : volumeOn;
      };
      const render = (nextIndex) => {
        index = (nextIndex + reels.length) % reels.length;
        const reel = reels[index];
        video.src = reel.video;
        video.poster = reel.cover;
        video.setAttribute("aria-label", reel.alt);
        video.load();
        if (inView) video.play().catch(() => {});
        brand.textContent = reel.brand;
        name.textContent = reel.name;
        price.textContent = reel.price;
        productImage.src = reel.productImage;
        productImage.alt = reel.name;
        productLink.href = reel.href;
        instagramLink.href = reel.instagram;
        syncMute();
        setActiveDot(dots, index);
      };
      if (muteButton) {
        muteButton.type = "button";
        muteButton.addEventListener("click", () => {
          video.muted = !video.muted;
          if (!video.muted) video.play().catch(() => {});
          syncMute();
        });
      }
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(
          (entries) => {
            inView = entries[0].isIntersecting;
            if (inView) video.play().catch(() => {});
            else video.pause();
          },
          { threshold: 0.3 },
        ).observe(section);
      } else {
        inView = true;
      }
      bindControls(section, prev, next, dots, render, () => index);
      render(0);
    };

    setupLooks();
    setupReels();
  };

  const setupHeroControls = () => {
    const buttons = Array.from(document.querySelectorAll('button[aria-label^="Go to "]'));
    const hero = buttons[0]?.closest("section");
    const title = hero?.querySelector("h1");
    const content = title?.parentElement;
    const subtitle = content?.querySelector("p");
    const cta = content?.querySelector("a");
    const initialMedia = hero?.querySelector("video, picture");
    const mediaLayer = initialMedia?.parentElement;
    if (!hero || !title || !content || !subtitle || !cta || !mediaLayer || buttons.length < 3) return;
    if (hero.dataset.jpHeroBound) return;
    hero.dataset.jpHeroBound = "true";

    const localCartierDesktop = "/media/v0/b/site-bucket/o/banner_photos/home_cartier_precious_sunglasses_desktop.webp";
    const localCartierMobile = "/media/v0/b/site-bucket/o/banner_photos/home_cartier_precious_sunglasses_mobile.webp";
    const localDitaFallback = "/media/v0/b/site-bucket/o/banner_photos/brandshowcase_akoni.webp";
    const slides = [
      {
        name: "Cartier",
        subtitle: "Precious sunglasses",
        cta: "Shop Cartier",
        href: "/collection/14",
        desktop: localCartierDesktop,
        mobile: localCartierMobile,
        duration: 8000,
      },
      {
        name: "Dita",
        subtitle: "Explore best-sellers",
        cta: "Shop Dita",
        href: "/collection/4",
        desktop: localDitaFallback,
        mobile: localDitaFallback,
        duration: 8000,
      },
      {
        name: "Maybach",
        subtitle: "Crafted without compromise",
        cta: "Shop Maybach",
        href: "/collection/10",
        video: "/mirror-assets/5f6caed4c6b06e08.mp4",
        duration: 20000,
      },
    ];
    const progress = buttons.map((button) => button.querySelector("span"));
    const scrim = Array.from(mediaLayer.children).find((child) => child.classList.contains("bg-gradient-to-b"));
    let currentIndex = Math.max(0, slides.findIndex((slide) => slide.name === title.textContent?.trim()));
    let autoplayTimer;
    let mediaSwapTimer;
    let interactionPaused = false;
    let transitionId = 0;

    const clearAutoplay = () => {
      if (autoplayTimer) window.clearTimeout(autoplayTimer);
      autoplayTimer = undefined;
    };

    const scheduleAutoplay = () => {
      clearAutoplay();
      if (interactionPaused || document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      autoplayTimer = window.setTimeout(() => {
        render((currentIndex + 1) % slides.length);
      }, slides[currentIndex].duration);
    };

    const createMedia = (slide) => {
      if (slide.video) {
        const video = document.createElement("video");
        video.src = slide.video;
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = "auto";
        video.className = "h-full w-full object-cover";
        video.setAttribute("aria-label", `${slide.name} campaign video`);
        video.play().catch(() => {});
        return video;
      }

      const picture = document.createElement("picture");
      picture.className = "absolute inset-0 h-full w-full";
      const source = document.createElement("source");
      source.media = "(max-width: 767px)";
      source.srcset = slide.mobile;
      const image = document.createElement("img");
      image.src = slide.desktop;
      image.alt = `${slide.name} eyewear campaign`;
      image.loading = "eager";
      image.decoding = "async";
      image.className = "h-full w-full object-cover";
      image.addEventListener("error", () => {
        if (image.dataset.jpFallback) return;
        image.dataset.jpFallback = "true";
        source.srcset = localCartierMobile;
        image.src = slide.name === "Cartier" ? localCartierDesktop : localDitaFallback;
      });
      picture.append(source, image);
      return picture;
    };

    const updateProgress = (index) => {
      progress.forEach((bar, barIndex) => {
        if (!bar) return;
        bar.style.transition = "none";
        bar.style.width = "0%";
        buttons[barIndex].setAttribute("aria-current", barIndex === index ? "true" : "false");
      });
      window.requestAnimationFrame(() => {
        const bar = progress[index];
        if (!bar) return;
        bar.style.transition = `width ${slides[index].duration}ms linear`;
        bar.style.width = "100%";
      });
    };

    function render(index) {
      const slide = slides[index];
      currentIndex = index;
      title.textContent = slide.name;
      subtitle.textContent = slide.subtitle;
      cta.textContent = slide.cta;
      cta.href = slide.href;
      updateProgress(index);

      const nextTransitionId = ++transitionId;
      if (mediaSwapTimer) window.clearTimeout(mediaSwapTimer);
      mediaLayer.style.transition = "opacity 650ms ease";
      mediaLayer.style.opacity = "0";
      mediaSwapTimer = window.setTimeout(() => {
        if (nextTransitionId !== transitionId) return;
        const nextMedia = createMedia(slide);
        if (scrim) {
          mediaLayer.replaceChildren(nextMedia, scrim.cloneNode(true));
        } else {
          mediaLayer.replaceChildren(nextMedia);
        }
        window.requestAnimationFrame(() => { mediaLayer.style.opacity = "1"; });
      }, 300);
      scheduleAutoplay();
    }

    buttons.forEach((button, index) => {
      button.dataset.jpBound = "true";
      button.type = "button";
      button.addEventListener("click", () => {
        interactionPaused = false;
        render(index);
      });
    });
    hero.addEventListener("mouseenter", () => { interactionPaused = true; clearAutoplay(); });
    hero.addEventListener("mouseleave", () => { interactionPaused = false; scheduleAutoplay(); });
    hero.addEventListener("focusin", () => { interactionPaused = true; clearAutoplay(); });
    hero.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!hero.contains(document.activeElement)) {
          interactionPaused = false;
          scheduleAutoplay();
        }
      }, 0);
    });
    document.addEventListener("visibilitychange", scheduleAutoplay);
    updateProgress(currentIndex);
    scheduleAutoplay();
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

  const setupCategoryLabels = () => {
    document.querySelectorAll('a[href*="type_frame=Optical"]').forEach((link) => {
      link.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() === "Eyeglasses") {
          node.textContent = node.textContent.replace("Eyeglasses", "Optical");
        }
      });
    });
    document.querySelectorAll("h1, h2").forEach((heading) => {
      if (heading.textContent.trim() === "Eyeglasses") heading.textContent = "Optical";
    });
    const searchInput = document.querySelector("#jp-search-title");
    if (searchInput) {
      searchInput.placeholder = searchInput.placeholder.replace(/eyeglasses/i, "optical");
    }
    if (/eyeglasses/i.test(document.title)) {
      document.title = document.title.replace(/eyeglasses/gi, "Optical");
    }
  };

  const setupCategoryMenus = () => {
    document
      .querySelectorAll('header nav a[href="/shop"], header nav a[href^="/lenses/"]')
      .forEach((link) => link.remove());
    document.querySelectorAll('header nav a[href*="type_frame="]').forEach((link) => {
      if (link.dataset.jpCategoryMenu) return;
      const label = categoryText(link.textContent);
      if (!/^(Sunglasses|Optical)$/i.test(label)) return;
      const category = /^Sunglasses$/i.test(label) ? "Sunglasses" : "Optical";
      const href = link.getAttribute("href") || `/shop?type_frame=${category}`;
      const wrapper = document.createElement("div");
      wrapper.className = "jp-nav-item";
      link.parentElement.insertBefore(wrapper, link);
      wrapper.appendChild(link);
      const menu = document.createElement("div");
      menu.className = "jp-nav-menu";
      menu.innerHTML = `<a href="${escapeHtml(href)}">All ${category.toLowerCase()}</a><a href="${escapeHtml(transitionsHref(href))}">${transitionsLabel}</a>`;
      wrapper.appendChild(menu);
      link.dataset.jpCategoryMenu = "true";
      link.setAttribute("aria-haspopup", "true");
      link.setAttribute("aria-expanded", "false");
      const sync = () => {
        link.setAttribute("aria-expanded", wrapper.matches(":hover, :focus-within") ? "true" : "false");
      };
      wrapper.addEventListener("mouseenter", sync);
      wrapper.addEventListener("mouseleave", sync);
      wrapper.addEventListener("focusin", sync);
      wrapper.addEventListener("focusout", (event) => {
        if (!wrapper.contains(event.relatedTarget)) sync();
      });
    });
  };

  const shopCategoryState = () => {
    const params = new URLSearchParams(window.location.search);
    const type = (params.get("type_frame") || "").toLowerCase();
    const lens = (params.get("lens") || "").toLowerCase();
    return {
      type: type === "sunglasses" ? "Sunglasses" : type === "optical" ? "Optical" : "",
      transitions: lens === "transitions",
    };
  };

  const renderShopSubnav = (activeType, transitions) => {
    const main = document.querySelector("main");
    const row = main?.previousElementSibling;
    if (!main || !row) return;
    const makeGroup = (category) => {
      const href = `/shop?type_frame=${category}`;
      const allActive = activeType === category && !transitions;
      const transitionsActive = activeType === category && transitions;
      return `<div class="jp-shop-subnav-group"><span class="jp-shop-subnav-label">${category}</span><a class="jp-shop-subnav-link${allActive ? " is-active" : ""}" href="${href}"${allActive ? ' aria-current="page"' : ""}>All</a><a class="jp-shop-subnav-link${transitionsActive ? " is-active" : ""}" href="${transitionsHref(href)}"${transitionsActive ? ' aria-current="page"' : ""}>${transitionsLabel}</a></div>`;
    };
    const groups = activeType
      ? makeGroup(activeType)
      : `${makeGroup("Sunglasses")}<span class="jp-shop-subnav-sep" aria-hidden="true"></span>${makeGroup("Optical")}`;
    let subnavRow = main.parentElement?.querySelector(":scope > .jp-shop-subnav-row");
    if (!subnavRow) {
      subnavRow = document.createElement("div");
      subnavRow.className = "jp-shop-subnav-row border-b border-neutral-200 bg-white px-5 py-3 font-nav";
      row.before(subnavRow);
    }
    subnavRow.innerHTML = `<div class="jp-shop-subnav">${groups}${transitions ? '<span class="jp-transitions-note">Photochromic lenses</span>' : ""}</div>`;
  };

  const productCardMarkup = (product) => {
    const name = escapeHtml(product.name);
    const image = escapeHtml(product.image || "/mirror-assets/placeholder.svg");
    const price = escapeHtml(product.price || "");
    return `<a class="group block bg-[#f0efed] font-nav" href="${escapeHtml(product.url)}">
      <div class="relative aspect-square overflow-hidden">
        <img src="${image}" sizes="(min-width: 640px) 33vw, 50vw" alt="${name}" loading="lazy" decoding="async" class="h-full w-full object-contain p-2 mix-blend-multiply sm:p-5">
        <button aria-label="Add ${name} to bag" class="absolute bottom-0 right-0 flex h-11 w-11 items-center justify-center bg-white text-black transition-all duration-400 ease-luxe hover:bg-black hover:text-white lg:translate-y-full lg:opacity-0 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4" aria-hidden="true"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg></button>
      </div>
      <div class="px-4 pb-7 pt-2">
        <p class="text-center uppercase leading-relaxed tracking-[0.12em] text-black text-[13px]">${name}</p>
        <p class="mt-2.5 text-center text-[13px]"><span class="text-neutral-500">${price}</span></p>
      </div>
    </a>`;
  };

  const setupShopCatalog = () => {
    if (window.location.pathname !== "/shop") return;
    const grid = document.querySelector("main > .grid");
    if (!grid || grid.dataset.jpCatalogBound) return;
    grid.dataset.jpCatalogBound = "true";
    const { type: activeType, transitions } = shopCategoryState();
    grid.classList.toggle("jp-transitions-grid", transitions);
    renderShopSubnav(activeType, transitions);
    loadIndex()
      .then((data) => {
        const allProducts = Array.isArray(data.products) ? data.products : [];
        const products = transitions ? allProducts.filter(productHasTransitions) : allProducts;
        if (!products.length) throw new Error("Catalog is empty");
        const count = Array.from(document.querySelectorAll(".sticky p")).find((item) =>
          /products?$/i.test(item.textContent.trim()),
        );
        if (count) count.textContent = `${products.length} products`;
        grid.innerHTML = products.map(productCardMarkup).join("");
        setupProductActions();
        grid.dispatchEvent(new Event("jp-catalog-rendered"));
      })
      .catch((error) => {
        console.error(error);
        showToast("The product catalog could not be loaded. Please refresh.");
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
    const filterButton = Array.from(document.querySelectorAll("button")).find((button) =>
      button.textContent.trim().toLowerCase().startsWith("filter"),
    );
    if (!filterButton) return;
    const toolbar = filterButton.parentElement?.parentElement;
    if (!toolbar) return;
    const panel = document.createElement("div");
    panel.className = "jp-filter-panel";
    panel.hidden = true;
    panel.innerHTML = '<input type="search" placeholder="Filter visible products" aria-label="Filter visible products">';
    toolbar.appendChild(panel);
    const input = panel.querySelector("input");
    const applyFilter = () => {
      const query = normalize(input.value);
      grid.querySelectorAll(":scope > a").forEach((card) => {
        card.hidden = Boolean(query) && !normalize(card.textContent).includes(query);
      });
    };
    filterButton.type = "button";
    filterButton.setAttribute("aria-expanded", "false");
    filterButton.addEventListener("click", () => { panel.hidden = !panel.hidden; filterButton.setAttribute("aria-expanded", String(!panel.hidden)); if (!panel.hidden) input.focus(); });
    input.addEventListener("input", applyFilter);
    grid.addEventListener("jp-catalog-rendered", applyFilter);
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
      if (!answer || answer.tagName !== "DIV" || !answer.querySelector(":scope > p") || !answer.textContent.trim()) return;
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
  setupCartPage();
  setupCarousels();
  setupBestSellerTabs();
  setupEditorialCarousels();
  setupHeroControls();
  setupProductGallery();
  setupLensCompare();
  setupCategoryLabels();
  setupCategoryMenus();
  setupShopCatalog();
  setupGridControls();
  setupComboboxes();
  setupFaq();
  setupForms();
  setupCallButton();

  document.documentElement.classList.add("jp-ui-ready");
})();

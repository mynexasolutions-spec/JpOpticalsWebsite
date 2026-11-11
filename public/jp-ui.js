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

  document.documentElement.classList.add("jp-ui-ready");
})();

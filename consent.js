(function () {
  var STORAGE_KEY = "cookie_consent_v1";

  function hasGtag() {
    return typeof window.gtag === "function";
  }

  function alreadySet() {
    return localStorage.getItem(STORAGE_KEY);
  }

  function setConsent(value) {
    localStorage.setItem(STORAGE_KEY, value);

    if (hasGtag()) {
      window.gtag("consent", "update", {
        analytics_storage: value === "accept" ? "granted" : "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
  }

  function injectCss() {
    if (document.getElementById("consent-css")) return;

    var link = document.createElement("link");
    link.id = "consent-css";
    link.rel = "stylesheet";
    link.href = "./consent.css";
    document.head.appendChild(link);
  }

  function buildBanner(isDemo) {
    var wrap = document.createElement("div");
    wrap.className = "consent-wrapper";

    wrap.innerHTML = `
      <div class="consent-card">
        <div class="consent-header">
          <strong>Privacy & Cookies</strong>
        </div>
        <div class="consent-body">
          <p>
            We use cookies to ensure basic functionality and to analyze traffic.
            ${isDemo ? "<br><em>Demo mode: analytics not detected.</em>" : ""}
          </p>
        </div>
        <div class="consent-actions">
          <button class="consent-btn consent-accept" data-value="accept">
            Accept
          </button>
          <button class="consent-btn consent-reject" data-value="reject">
            Reject
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(wrap);

    wrap.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-value]");
      if (!btn) return;

      setConsent(btn.dataset.value);
      wrap.remove();
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (alreadySet()) return;

    injectCss();
    buildBanner(!hasGtag());
  });
})();

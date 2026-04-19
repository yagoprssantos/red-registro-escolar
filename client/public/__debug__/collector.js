(function () {
  "use strict";

  if (window.__APP_DEBUG_COLLECTOR__) return;

  const endpoint = "/__debug__/logs";
  const buffer = {
    consoleLogs: [],
    networkRequests: [],
    sessionEvents: [],
  };

  const push = (key, value, max = 200) => {
    buffer[key].push(value);
    if (buffer[key].length > max) {
      buffer[key].splice(0, buffer[key].length - max);
    }
  };

  const originalError = console.error.bind(console);
  const originalWarn = console.warn.bind(console);

  console.error = function (...args) {
    push("consoleLogs", { level: "ERROR", args, ts: Date.now() });
    originalError(...args);
  };

  console.warn = function (...args) {
    push("consoleLogs", { level: "WARN", args, ts: Date.now() });
    originalWarn(...args);
  };

  window.addEventListener(
    "click",
    function (event) {
      const target = event.target;
      push("sessionEvents", {
        kind: "click",
        ts: Date.now(),
        tag: target && target.tagName ? target.tagName.toLowerCase() : null,
        id: target && target.id ? target.id : null,
      });
    },
    true
  );

  const flush = function () {
    const payload = {
      consoleLogs: buffer.consoleLogs.splice(0),
      networkRequests: buffer.networkRequests.splice(0),
      sessionEvents: buffer.sessionEvents.splice(0),
    };

    if (
      !payload.consoleLogs.length &&
      !payload.networkRequests.length &&
      !payload.sessionEvents.length
    ) {
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(function () {
      // Ignore collector transport errors to avoid impacting UX.
    });
  };

  setInterval(flush, 2000);
  window.addEventListener("beforeunload", flush);

  window.__APP_DEBUG_COLLECTOR__ = { flush };
})();

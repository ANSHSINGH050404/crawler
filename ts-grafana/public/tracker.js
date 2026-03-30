/**
 * Lightweight browser SDK — enqueue batched engagement events to the ingest API.
 * Usage:
 *   <script src="https://your-host/tracker.js" data-endpoint="https://your-host" data-api-key="optional"></script>
 */
(function () {
  var script = document.currentScript;
  var endpoint = (script && script.getAttribute("data-endpoint")) || "";
  if (!endpoint) endpoint = "";
  var apiKey = (script && script.getAttribute("data-api-key")) || "";
  var flushMs = Number((script && script.getAttribute("data-flush-ms")) || 3000);
  var maxBatch = Number((script && script.getAttribute("data-max-batch")) || 25);

  function sid() {
    var k = "__a_sid";
    try {
      var x = sessionStorage.getItem(k);
      if (x) return x;
      x = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2);
      sessionStorage.setItem(k, x);
      return x;
    } catch (_) {
      return "sess_" + String(Math.random()).slice(2);
    }
  }

  function aid() {
    var k = "__a_aid";
    try {
      var x = localStorage.getItem(k);
      if (x) return x;
      x = crypto.randomUUID ? crypto.randomUUID() : "anon_" + String(Math.random()).slice(2);
      localStorage.setItem(k, x);
      return x;
    } catch (_) {
      return "anon_" + String(Math.random()).slice(2);
    }
  }

  var queue = [];
  var timer = null;
  var sessionId = sid();
  var anonymousId = aid();

  function platform() {
    return /Mobile|Android|iPhone/i.test(navigator.userAgent) ? "mobile_web" : "desktop_web";
  }

  function send(payload) {
    var url = (endpoint || location.origin) + "/v1/events";
    var body = JSON.stringify(payload);
    var headers = { "Content-Type": "application/json" };
    if (apiKey) headers["X-API-Key"] = apiKey;
    if (!apiKey && navigator.sendBeacon) {
      var ok = navigator.sendBeacon(url, new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    fetch(url, { method: "POST", headers: headers, body: body, keepalive: true }).catch(function () {});
  }

  function schedule() {
    if (timer != null) return;
    timer = setTimeout(flush, flushMs);
  }

  function flush() {
    if (timer != null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!queue.length) return;
    var batch = queue.splice(0, maxBatch);
    send({ events: batch });
    if (queue.length) schedule();
  }

  function track(evt) {
    evt.session_id = sessionId;
    evt.anonymous_id = anonymousId;
    evt.client_ts_ms = Date.now();
    evt.platform = platform();
    queue.push(evt);
    if (queue.length >= maxBatch) flush();
    else schedule();
  }

  window.Analytics = {
    track: track,
    flush: flush,
    sessionId: function () {
      return sessionId;
    },
    videoProgress: function (contentId, positionSec, durationSec) {
      track({
        event_type: "video_progress",
        content_id: contentId,
        properties: { position_sec: positionSec, duration_sec: durationSec },
      });
    },
    videoStart: function (contentId, meta) {
      track({ event_type: "video_start", content_id: contentId, properties: meta || {} });
    },
    videoComplete: function (contentId, meta) {
      track({ event_type: "video_complete", content_id: contentId, properties: meta || {} });
    },
    page: function (path, title) {
      track({
        event_type: "page_view",
        properties: { path: path || location.pathname, title: title || document.title, referrer: document.referrer },
      });
    },
    heartbeat: function (contentId) {
      track({
        event_type: "heartbeat",
        content_id: contentId,
        properties: { visible: document.visibilityState === "visible" },
      });
    },
  };

  window.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") flush();
  });
  window.addEventListener("pagehide", flush);

  window.Analytics.page();
})();

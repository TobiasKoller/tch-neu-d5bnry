/* TC Heimsheim – Interaktionen: Menü, Scroll-Hintergrund, Reveal, Counter, Filter, Formular */
document.documentElement.classList.remove("no-js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Overlay-Menü ---------- */
const toggle = document.querySelector("[data-menu-toggle]");
if (toggle) {
  const setOpen = (open) => {
    document.documentElement.classList.toggle("is-menu-open", open);
    document.body.classList.toggle("no-scroll", open);
    toggle.setAttribute("aria-expanded", String(open));
    const menu = document.querySelector("[data-menu]");
    if (!open) return toggle.focus({ preventScroll: true });
    if (menu) menu.scrollTop = 0; // sonst startet ein erneut geöffnetes Menü halbhoch gerollt
    menu?.querySelector("a")?.focus({ preventScroll: true });
  };
  toggle.addEventListener("click", () => setOpen(!document.documentElement.classList.contains("is-menu-open")));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
  document.querySelectorAll("[data-menu-link]").forEach((a) => a.addEventListener("click", () => setOpen(false)));
}

/* ---------- Scroll-Fortschritt treibt Hintergrund + Header ---------- */
const header = document.querySelector("[data-header]");
let queued = false;
const onScroll = () => {
  const doc = document.documentElement;
  const max = doc.scrollHeight - window.innerHeight;
  doc.style.setProperty("--p", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
  doc.style.setProperty("--sy", window.scrollY.toFixed(1));
  header?.classList.toggle("is-stuck", window.scrollY > 24);
  queued = false;
};
addEventListener(
  "scroll",
  () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(onScroll);
    }
  },
  { passive: true },
);
onScroll();

/* ---------- Reveal beim Scrollen + Kennzahlen ---------- */
const counters = new WeakSet();
const countUp = (el) => {
  if (reduceMotion || counters.has(el)) return;
  counters.add(el);
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || "";
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / 1100, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))) + suffix;
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
};

const revealAll = () => document.querySelectorAll("[data-reveal]").forEach((el) => el.classList.add("is-in"));
if (!("IntersectionObserver" in window)) revealAll();

const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      entry.target.querySelectorAll("[data-count]").forEach(countUp);
      if (entry.target.matches("[data-count]")) countUp(entry.target);
      io.unobserve(entry.target);
    }
  },
  { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
);
document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));

/* ---------- Kategorienfilter (Mannschaften / Aktuelles) ---------- */
document.querySelectorAll("[data-filter]").forEach((group) => {
  const items = [...document.querySelectorAll(group.dataset.filter)];
  group.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    group.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    const want = chip.dataset.filterValue;
    items.forEach((item) => {
      const match = want === "alle" || (item.dataset.category || "").includes(want);
      item.classList.toggle("is-hidden", !match);
    });
  });
});

/* ---------- Kontaktformular: ohne Backend -> E-Mail-Programm ---------- */
document.querySelectorAll("[data-mailform]").forEach((form) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const subject = `${data.anliegen || "Anfrage"} – Website TC Heimsheim`;
    const body = `Name: ${data.name}\nE-Mail: ${data.email}\n\n${data.nachricht}`;
    window.location.href = `mailto:${form.dataset.mailform}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const status = form.querySelector(".form__status");
    if (status) status.textContent = "Dein E-Mail-Programm öffnet sich mit der fertigen Nachricht.";
  });
});

/* ---------- Laufendes Jahr im Footer ---------- */
document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

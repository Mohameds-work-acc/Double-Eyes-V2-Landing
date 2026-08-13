const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = matchMedia("(pointer: coarse)").matches;
const motionGallery = document.querySelector("#motionGallery");
const motionData = window.motionGalleryData || [];

if (motionGallery && motionData.length) {
  ["spotlight", "identity", "campaign", "editorial", "finale"].forEach(
    (bandName) => {
      const bandItems = motionData.filter((item) => item.band === bandName);
      if (!bandItems.length) return;
      const band = document.createElement("div");
      band.className = `motion-band motion-band--${bandName}`;
      bandItems.forEach((item) => {
        const tile = document.createElement("button");
        const absoluteIndex = motionData.indexOf(item);
        tile.type = "button";
          tile.className = `motion-tile motion-tile--${item.layout}`;
        tile.dataset.cursor = "VIEW";
        tile.dataset.motionIndex = absoluteIndex;
        tile.style.setProperty("--motion-order", absoluteIndex);
        tile.setAttribute("aria-label", `View ${item.title}, ${item.category}`);
          tile.innerHTML = `<span class="motion-image"><img src="${item.src}" width="${item.width}" height="${item.height}" loading="lazy" decoding="async" alt="${item.alt}" style="object-position:${item.position}"></span><span class="motion-tile-meta"><b>${item.title}</b><span>${item.category}</span></span><span class="motion-tile-index">${String(absoluteIndex + 1).padStart(2, "0")}</span>`;
          band.appendChild(tile);
      });
      motionGallery.appendChild(band);
    },
  );
}
// Visual-QA mode prevents smooth scrolling from confusing stitched full-page captures.
if (new URLSearchParams(location.search).has("visual-qa"))
  document.documentElement.style.scrollBehavior = "auto";

addEventListener("load", () =>
  setTimeout(
    () => document.querySelector(".loader").classList.add("done"),
    reduced ? 0 : 1100,
  ),
);

const revealObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    }),
  { threshold: 0.15 },
);
document
  .querySelectorAll(".reveal")
  .forEach((el) => revealObserver.observe(el));

const guides = document.querySelector(".guides");
if (guides) {
  const guideRevealItems = [...guides.querySelectorAll("[data-guide-reveal]")];
  const guideValues = [...guides.querySelectorAll("[data-guide-value]")];
  const guideExit = guides.querySelector("[data-guide-exit]");

  if (!reduced) guides.classList.add("motion-ready");

  const guideRevealObserver = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          guideRevealObserver.unobserve(entry.target);
        }
      }),
    { threshold: 0.2 },
  );
  guideRevealItems.forEach((item) => guideRevealObserver.observe(item));

  const setActiveGuideValue = (activeValue) => {
    guideValues.forEach((value) =>
      value.classList.toggle("is-active", value === activeValue),
    );
    guides.style.setProperty(
      "--guides-active-position",
      `${(Math.max(0, guideValues.indexOf(activeValue)) + 0.5) * 33.333}%`,
    );
  };

  const guideValueObserver = new IntersectionObserver(
    (entries) => {
      const focused = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (focused) setActiveGuideValue(focused.target);
    },
    { rootMargin: "-30% 0px -38%", threshold: [0.15, 0.35, 0.6] },
  );

  guideValues.forEach((value) => {
    guideValueObserver.observe(value);
    value.addEventListener("mouseenter", () => setActiveGuideValue(value));
    value.addEventListener("focus", () => setActiveGuideValue(value));
  });

  if (guideExit) {
    const guideExitObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) guideExit.classList.add("is-visible");
      },
      { threshold: 0.25 },
    );
    guideExitObserver.observe(guideExit);
  }

  const updateGuidesProgress = () => {
    const rect = guides.getBoundingClientRect();
    const travel = Math.max(1, rect.height - innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    guides.style.setProperty("--guides-progress", progress.toFixed(3));
    guideRevealItems.forEach((item) => {
      const itemRect = item.getBoundingClientRect();
      if (itemRect.top < innerHeight * 0.88 && itemRect.bottom > 0)
        item.classList.add("is-visible");
    });
  };

  addEventListener("scroll", updateGuidesProgress, { passive: true });
  addEventListener("resize", updateGuidesProgress);
  addEventListener("load", updateGuidesProgress, { once: true });
  updateGuidesProgress();

  if (!touch && !reduced) {
    let guidePointerFrame = 0;
    let guidePointerX = 0;
    let guidePointerY = 0;
    const paintGuidePointer = () => {
      guides.style.setProperty("--guides-pointer-x", guidePointerX.toFixed(3));
      guides.style.setProperty("--guides-pointer-y", guidePointerY.toFixed(3));
      guidePointerFrame = 0;
    };
    guides.addEventListener("pointermove", (event) => {
      guidePointerX = (event.clientX / innerWidth - 0.5) * 2;
      guidePointerY = (event.clientY / innerHeight - 0.5) * 2;
      if (!guidePointerFrame)
        guidePointerFrame = requestAnimationFrame(paintGuidePointer);
    });
    guides.addEventListener("pointerleave", () => {
      guidePointerX = 0;
      guidePointerY = 0;
      if (!guidePointerFrame)
        guidePointerFrame = requestAnimationFrame(paintGuidePointer);
    });
  }
}

const diagnostic = document.querySelector(".diagnostic");
if (diagnostic) {
  const diagnosticClusters = [
    ...diagnostic.querySelectorAll("[data-diagnostic-cluster]"),
  ];
  const diagnosticNodes = [
    ...diagnostic.querySelectorAll("[data-diagnostic-node]"),
  ];
  const diagnosticStates = [
    { angle: -135, x: -12, y: -8 },
    { angle: -45, x: 12, y: -8 },
    { angle: 135, x: -12, y: 8 },
    { angle: 45, x: 12, y: 8 },
  ];
  const diagnosticStageThresholds = [0.22, 0.45, 0.68];
  let diagnosticScrollIndex = 0;
  let diagnosticHoverIndex = null;
  let diagnosticScrollTicking = false;

  const setActiveDiagnostic = (index, moveFocus = false) => {
    const nextIndex = (index + diagnosticNodes.length) % diagnosticNodes.length;
    const state = diagnosticStates[nextIndex];
    diagnostic.dataset.diagnosticActive = nextIndex;
    diagnostic.style.setProperty("--diagnostic-angle", `${state.angle}deg`);
    diagnostic.style.setProperty("--diagnostic-core-x", `${state.x}px`);
    diagnostic.style.setProperty("--diagnostic-core-y", `${state.y}px`);
    diagnosticClusters.forEach((cluster, clusterIndex) =>
      cluster.classList.toggle("is-active", clusterIndex === nextIndex),
    );
    diagnosticNodes.forEach((node, nodeIndex) =>
      node.setAttribute("aria-expanded", String(nodeIndex === nextIndex)),
    );
    if (moveFocus) diagnosticNodes[nextIndex].focus();
  };

  diagnostic.classList.add("is-enhanced");
  setActiveDiagnostic(0);

  const diagnosticObserver = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      diagnostic.classList.add("is-visible");
      diagnosticObserver.disconnect();
    },
    { threshold: 0.14 },
  );
  diagnosticObserver.observe(diagnostic);

  const updateDiagnosticFromScroll = () => {
    if (reduced) return;
    const rect = diagnostic.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= innerHeight) return;

    let nextIndex = 0;
    if (innerWidth <= 760) {
      const readingLine = innerHeight * 0.48;
      nextIndex = diagnosticNodes.reduce(
        (closest, node, index) => {
          const nodeRect = node.getBoundingClientRect();
          const distance = Math.abs(
            nodeRect.top + nodeRect.height * 0.5 - readingLine,
          );
          return distance < closest.distance ? { index, distance } : closest;
        },
        { index: 0, distance: Infinity },
      ).index;
    } else if (innerWidth > 900) {
      const travel = Math.max(1, rect.height - innerHeight);
      const progress = Math.max(0, Math.min(0.999, -rect.top / travel));
      nextIndex = diagnosticStageThresholds.findIndex(
        (threshold) => progress < threshold,
      );
      if (nextIndex === -1) nextIndex = diagnosticNodes.length - 1;
    } else {
      const leadIn = innerHeight * 0.1;
      const travel = Math.max(1, rect.height - innerHeight * 0.4);
      const progress = Math.max(
        0,
        Math.min(0.999, (-rect.top + leadIn) / travel),
      );
      nextIndex = Math.floor(progress * diagnosticNodes.length);
    }

    diagnosticScrollIndex = nextIndex;
    diagnosticHoverIndex = null;
    setActiveDiagnostic(diagnosticScrollIndex);
  };

  const requestDiagnosticScrollUpdate = () => {
    if (diagnosticScrollTicking) return;
    diagnosticScrollTicking = true;
    requestAnimationFrame(() => {
      updateDiagnosticFromScroll();
      diagnosticScrollTicking = false;
    });
  };

  diagnosticNodes.forEach((node, index) => {
    node.addEventListener("click", () => setActiveDiagnostic(index));
    node.addEventListener("focus", () => setActiveDiagnostic(index));
    if (!touch) {
      node.addEventListener("mouseenter", () => {
        diagnosticHoverIndex = index;
        setActiveDiagnostic(index);
      });
      node.addEventListener("mouseleave", () => {
        if (diagnosticHoverIndex !== index) return;
        diagnosticHoverIndex = null;
        setActiveDiagnostic(diagnosticScrollIndex);
      });
    }
    node.addEventListener("keydown", (event) => {
      const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
      const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
      if (!forward && !backward && event.key !== "Home" && event.key !== "End")
        return;
      event.preventDefault();
      if (event.key === "Home") setActiveDiagnostic(0, true);
      else if (event.key === "End")
        setActiveDiagnostic(diagnosticNodes.length - 1, true);
      else setActiveDiagnostic(index + (forward ? 1 : -1), true);
    });
  });

  addEventListener("scroll", requestDiagnosticScrollUpdate, { passive: true });
  addEventListener("resize", requestDiagnosticScrollUpdate);
  addEventListener("load", requestDiagnosticScrollUpdate, { once: true });
  requestDiagnosticScrollUpdate();
}

if (!touch) {
  const cursor = document.querySelector(".cursor");
  let x = innerWidth / 2,
    y = innerHeight / 2,
    cx = x,
    cy = y;
  addEventListener("mousemove", (e) => {
    x = e.clientX;
    y = e.clientY;
    document.documentElement.style.setProperty("--mx", `${x}px`);
  });
  const draw = () => {
    cx += (x - cx) * 0.25;
    cy += (y - cy) * 0.25;
    cursor.style.transform = `translate3d(${cx}px,${cy}px,0)`;
    requestAnimationFrame(draw);
  };
  draw();
  document.querySelectorAll("a,button,[data-cursor]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.classList.add("big");
      cursor.classList.toggle("write", el.dataset.cursor === "WRITE");
      cursor.firstElementChild.textContent = el.dataset.cursor || "GO";
    });
    el.addEventListener("mouseleave", () => {
      cursor.classList.remove("big", "write");
    });
  });
  document.querySelectorAll(".interactive-eye").forEach((eye) =>
    addEventListener("mousemove", (e) => {
      const dot = eye.querySelector("i");
      if (!dot) return;
      const r = eye.getBoundingClientRect(),
        dx = Math.max(
          -1,
          Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)),
        );
      dot.style.left = `${50 + dx * 30}%`;
    }),
  );
}

const motionTiles = [...document.querySelectorAll(".motion-tile")];
const motionSection = document.querySelector(".motion");
const motionViewer = document.querySelector(".motion-viewer");
const motionViewerImage = motionViewer?.querySelector(".motion-viewer-stage img");
const motionViewerClose = motionViewer?.querySelector(".motion-viewer-close");
const motionViewerPrev = motionViewer?.querySelector(".motion-viewer-prev");
const motionViewerNext = motionViewer?.querySelector(".motion-viewer-next");
const motionViewerTitle = motionViewer?.querySelector(".motion-viewer-meta b");
const motionViewerCategory = motionViewer?.querySelector(
  ".motion-viewer-meta span",
);
const motionViewerCount = motionViewer?.querySelector(".motion-viewer-count");
let motionViewerIndex = 0;

if (motionSection) {
  const motionEntranceObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        motionSection.classList.add("is-visible");
        motionEntranceObserver.disconnect();
      }
    },
    { threshold: 0.08 },
  );
  motionEntranceObserver.observe(motionSection);
}

function renderMotionViewer(index) {
  if (!motionViewerImage || !motionData.length) return;
  motionViewerIndex = (index + motionData.length) % motionData.length;
  const item = motionData[motionViewerIndex];
  motionViewerImage.src = item.full || item.src;
  motionViewerImage.alt = item.alt;
  motionViewerTitle.textContent = item.title;
  motionViewerCategory.textContent = item.category;
  motionViewerCount.textContent = `${String(motionViewerIndex + 1).padStart(2, "0")} / ${String(motionData.length).padStart(2, "0")}`;
}

function openMotionViewer(index) {
  if (!motionViewer || !motionViewerImage) return;
  renderMotionViewer(index);
  motionViewer.showModal();
}

motionTiles.forEach((tile) =>
  tile.addEventListener("click", () =>
    openMotionViewer(Number(tile.dataset.motionIndex)),
  ),
);

function closeMotionViewer() {
  if (!motionViewer?.open) return;
  motionViewer.close();
  motionViewerImage.removeAttribute("src");
}
motionViewerClose?.addEventListener("click", closeMotionViewer);
motionViewerPrev?.addEventListener("click", () =>
  renderMotionViewer(motionViewerIndex - 1),
);
motionViewerNext?.addEventListener("click", () =>
  renderMotionViewer(motionViewerIndex + 1),
);
motionViewer?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeMotionViewer();
});
motionViewer?.addEventListener("click", (event) => {
  if (event.target === motionViewer) closeMotionViewer();
});
addEventListener("keydown", (event) => {
  if (!motionViewer?.open) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeMotionViewer();
  } else if (event.key === "ArrowLeft") renderMotionViewer(motionViewerIndex - 1);
  else if (event.key === "ArrowRight") renderMotionViewer(motionViewerIndex + 1);
});

if (!reduced) {
  let motionParallaxTicking = false;
  addEventListener(
    "scroll",
    () => {
      if (motionParallaxTicking || innerWidth <= 800) return;
      motionParallaxTicking = true;
      requestAnimationFrame(() => {
        const section = document.querySelector(".motion");
        if (section) {
          const rect = section.getBoundingClientRect();
          const progress = Math.max(
            -1,
            Math.min(
              1,
              (innerHeight / 2 - (rect.top + rect.height / 2)) / innerHeight,
            ),
          );
          document
            .querySelectorAll(".motion-band")
            .forEach(
              (band, index) =>
                (band.style.transform = `translate3d(${progress * (index % 2 ? -14 : 14)}px,0,0)`),
            );
        }
        motionParallaxTicking = false;
      });
    },
    { passive: true },
  );
}

const nav = document.querySelector(".nav");
let lastY = 0;
addEventListener(
  "scroll",
  () => {
    const y = scrollY;
    nav.style.transform = y > lastY && y > 180 ? "translateY(-100px)" : "";
    lastY = y;
  },
  { passive: true },
);

const universe = document.querySelector(".universe");
const universeStage = document.querySelector(".universe-stage");
const orbitGuide = document.querySelector(".orbit-guide");
const nodes = [...document.querySelectorAll(".service-node")];
const serviceInfo = document.querySelector(".service-info");
const serviceLabel = document.querySelector(".service-active-label");
const serviceCopy = document.querySelector(".service-copy");
const corePupils = [...document.querySelectorAll(".full-field-pupil")];
let activeService = 0;
let serviceTimer;

function layoutServiceOrbit() {
  if (innerWidth <= 800 || !orbitGuide) return;
  const stageRect = universeStage.getBoundingClientRect();
  const guideRect = orbitGuide.getBoundingClientRect();
  const centerX = guideRect.left - stageRect.left + guideRect.width / 2;
  const centerY = guideRect.top - stageRect.top + guideRect.height / 2;
  const safeInset = 28;
  const widestNodeHalf = Math.max(...nodes.map((node) => node.offsetWidth * 0.56));
  const radiusX = Math.min(
    guideRect.width / 2,
    stageRect.width / 2 - widestNodeHalf - safeInset,
  );
  const radiusY = guideRect.height / 2;
  nodes.forEach((node, index) => {
    const angle = -90 + (index * 360) / nodes.length;
    node.dataset.angle = String(angle);
    const radians = (angle * Math.PI) / 180;
    node.style.setProperty(
      "--node-x",
      `${centerX + Math.cos(radians) * radiusX}px`,
    );
    node.style.setProperty(
      "--node-y",
      `${centerY + Math.sin(radians) * radiusY}px`,
    );
  });
  updateServiceDirection(activeService);
}

function updateServiceDirection(index) {
  const angle = (Number(nodes[index].dataset.angle) * Math.PI) / 180;
  corePupils.forEach((pupil) => {
    pupil.style.setProperty("--look-x", `${Math.cos(angle) * 10}px`);
    pupil.style.setProperty("--look-y", `${Math.sin(angle) * 6}px`);
  });
  if (innerWidth <= 800) return;
  const stageRect = universeStage.getBoundingClientRect();
  const nodeRect = nodes[index].getBoundingClientRect();
  const coreRect = document
    .querySelector(".full-field-identity")
    .getBoundingClientRect();
  const x1 = coreRect.left + coreRect.width / 2 - stageRect.left;
  const y1 = coreRect.top + coreRect.height / 2 - stageRect.top;
  const x2 = nodeRect.left + nodeRect.width / 2 - stageRect.left;
  const y2 = nodeRect.top + 5 - stageRect.top;
  universeStage.style.setProperty("--ray-x", `${x1}px`);
  universeStage.style.setProperty("--ray-y", `${y1}px`);
  universeStage.style.setProperty(
    "--ray-length",
    `${Math.hypot(x2 - x1, y2 - y1)}px`,
  );
  universeStage.style.setProperty(
    "--ray-angle",
    `${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI}deg`,
  );
}

function setActiveService(index, animate = true) {
  if (index === activeService && animate) return;
  activeService = index;
  nodes.forEach((node, i) => node.classList.toggle("active", i === index));
  universeStage.dataset.activeIndex = index;
  updateServiceDirection(index);
  clearTimeout(serviceTimer);
  if (!animate || reduced) {
    serviceLabel.textContent = `${nodes[index].querySelector("span").textContent} / ${nodes[index].dataset.title}`;
    serviceCopy.textContent = nodes[index].dataset.copy;
    return;
  }
  serviceInfo.classList.add("is-leaving");
  serviceTimer = setTimeout(() => {
    serviceLabel.textContent = `${nodes[index].querySelector("span").textContent} / ${nodes[index].dataset.title}`;
    serviceCopy.textContent = nodes[index].dataset.copy;
    serviceInfo.classList.remove("is-leaving");
  }, 180);
}

nodes.forEach((node, index) =>
  node.addEventListener("click", () => setActiveService(index)),
);
addEventListener("resize", layoutServiceOrbit);
let universeTicking = false;
addEventListener(
  "scroll",
  () => {
    if (universeTicking || innerWidth <= 800 || reduced) return;
    universeTicking = true;
    requestAnimationFrame(() => {
      const rect = universe.getBoundingClientRect();
      const travel = Math.max(1, rect.height - innerHeight);
      const progress = Math.max(0, Math.min(0.999, -rect.top / travel));
      setActiveService(
        Math.min(nodes.length - 1, Math.floor(progress * nodes.length)),
      );
      universeTicking = false;
    });
  },
  { passive: true },
);
setActiveService(0, false);
requestAnimationFrame(layoutServiceOrbit);

const patternBreak = document.querySelector(".pattern-break");
const patternRevealObserver = new IntersectionObserver(
  ([entry]) => patternBreak?.classList.toggle("is-visible", entry.isIntersecting),
  { threshold: 0.18 },
);
if (patternBreak) patternRevealObserver.observe(patternBreak);

const contact = document.querySelector(".contact");
const contactLink = document.querySelector(".contact-link");
const contactForm = document.querySelector(".contact-form");
const contactFormClose = document.querySelector(".contact-form-close");
const contactFormStatus = document.querySelector(".contact-form-status");
const toggleContactForm = (open) => {
  if (!contact || !contactLink) return;
  contact.classList.toggle("is-form-open", open);
  contactLink.setAttribute("aria-expanded", String(open));
  if (open)
    requestAnimationFrame(() => contactForm?.querySelector("input")?.focus());
  else contactLink.focus();
};
contactLink?.addEventListener("click", () => toggleContactForm(true));
contactFormClose?.addEventListener("click", () => toggleContactForm(false));
addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contact?.classList.contains("is-form-open"))
    toggleContactForm(false);
});
contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!contactForm.checkValidity()) {
    contactForm.reportValidity();
    return;
  }
  contactFormStatus.textContent = "Form ready. Connect this form to your approved lead endpoint to send enquiries.";
});

const menu = document.querySelector(".menu");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") === "true";
  menu.setAttribute("aria-expanded", String(!open));
  document.querySelector(".nav nav").classList.toggle("mobile-open", !open);
});

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch = matchMedia("(pointer: coarse)").matches;
const motionGallery = document.querySelector("#motionGallery");
const motionData = window.motionGalleryData || [];

if (motionGallery && motionData.length) {
  ["portraits", "landscapes", "lower"].forEach((rowName) => {
    const row = document.createElement("div");
    row.className = `motion-row motion-row--${rowName}`;
    motionData
      .filter((item) => item.row === rowName)
      .forEach((item, index) => {
        const tile = document.createElement("button");
        const absoluteIndex = motionData.indexOf(item);
        tile.type = "button";
        tile.className = `motion-tile ratio-${item.ratio}${absoluteIndex === 8 ? " signature" : ""}`;
        tile.dataset.cursor = "VIEW";
        tile.dataset.motionIndex = absoluteIndex;
        tile.style.setProperty("--motion-order", absoluteIndex);
        tile.setAttribute("aria-label", `View ${item.title}, ${item.category}`);
        tile.innerHTML = `<video muted loop playsinline preload="metadata" poster="${item.poster}" data-src="${item.src}" aria-hidden="true"></video><span class="motion-tile-meta"><b>${item.title}</b><span>${item.category}</span></span>`;
        row.appendChild(tile);
      });
    motionGallery.appendChild(row);
  });
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
const motionVideos = motionTiles.map((tile) => tile.querySelector("video"));
const motionViewer = document.querySelector(".motion-viewer");
const motionViewerVideo = motionViewer?.querySelector("video");
const motionViewerClose = motionViewer?.querySelector(".motion-viewer-close");
const motionViewerTitle = motionViewer?.querySelector(".motion-viewer-meta b");
const motionViewerCategory = motionViewer?.querySelector(
  ".motion-viewer-meta span",
);
let visibleMotionVideos = [];

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

function loadMotionVideo(video) {
  if (!video?.src && video?.dataset.src) {
    video.src = video.dataset.src;
    video.load();
  }
}

function updateMotionPlayback() {
  if (reduced || !visibleMotionVideos.length) {
    motionVideos.forEach((video) => video.pause());
    return;
  }
  const center = innerHeight / 2;
  const ranked = visibleMotionVideos
    .map((video) => {
      const rect = video.getBoundingClientRect();
      return { video, distance: Math.abs(rect.top + rect.height / 2 - center) };
    })
    .sort((a, b) => a.distance - b.distance);
  const active = new Set(
    ranked
      .slice(0, touch || innerWidth <= 800 ? 1 : 6)
      .map((item) => item.video),
  );
  motionVideos.forEach((video) =>
    active.has(video) ? video.play().catch(() => {}) : video.pause(),
  );
}

if (motionVideos.length) {
  const motionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) loadMotionVideo(video);
        visibleMotionVideos = motionVideos.filter((item) => {
          const rect = item.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < innerHeight;
        });
      });
      updateMotionPlayback();
    },
    { rootMargin: "180px 0px", threshold: [0, 0.18, 0.5] },
  );
  motionVideos.forEach((video) => motionObserver.observe(video));
  addEventListener("scroll", updateMotionPlayback, { passive: true });
}

motionTiles.forEach((tile) =>
  tile.addEventListener("click", () => {
    if (!motionViewer || !motionViewerVideo) return;
    const item = motionData[Number(tile.dataset.motionIndex)];
    motionVideos.forEach((video) => video.pause());
    motionViewerVideo.src = item.src;
    motionViewerVideo.poster = item.poster;
    motionViewerTitle.textContent = item.title;
    motionViewerCategory.textContent = item.category;
    motionViewer.showModal();
    motionViewerVideo.play().catch(() => {});
  }),
);

function closeMotionViewer() {
  if (!motionViewer?.open) return;
  motionViewerVideo.pause();
  motionViewer.close();
  motionViewerVideo.removeAttribute("src");
  motionViewerVideo.load();
  updateMotionPlayback();
}
motionViewerClose?.addEventListener("click", closeMotionViewer);
motionViewer?.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeMotionViewer();
});
motionViewer?.addEventListener("click", (event) => {
  if (event.target === motionViewer) closeMotionViewer();
});
addEventListener("keydown", (event) => {
  if (event.key === "Escape" && motionViewer?.open) {
    event.preventDefault();
    closeMotionViewer();
  }
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
            .querySelectorAll(".motion-row")
            .forEach(
              (row, index) =>
                (row.style.transform = `translate3d(${progress * (index % 2 ? -18 : 18)}px,0,0)`),
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
  const radiusX = guideRect.width / 2;
  const radiusY = guideRect.height / 2;
  nodes.forEach((node) => {
    const radians = (Number(node.dataset.angle) * Math.PI) / 180;
    const safeInset = 24;
    // Keep wide-orbit labels inside the Full Field canvas, including active scale.
    const halfNodeWidth = node.offsetWidth * 0.56;
    const rawX = centerX + Math.cos(radians) * radiusX;
    const x = Math.max(
      halfNodeWidth + safeInset,
      Math.min(stageRect.width - halfNodeWidth - safeInset, rawX),
    );
    node.style.setProperty(
      "--node-x",
      `${x}px`,
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

const method = document.querySelector(".method");
const methodScenes = [...document.querySelectorAll("[data-method-scene]")];
const methodProgress = document.querySelector(".method-progress-current");
function updateMethodJourney() {
  if (!method || innerWidth <= 800 || reduced) return;
  const rect = method.getBoundingClientRect();
  const travel = Math.max(1, rect.height - innerHeight);
  const progress = Math.max(0, Math.min(1, -rect.top / travel));
  let active = 0;
  methodScenes.forEach((scene, index) => {
    const center = index / (methodScenes.length - 1);
    const drift = Math.max(-1, Math.min(1, (progress - center) * 4));
    const visibility = Math.pow(Math.max(0, 1 - Math.abs(drift)), 2.4);
    scene.style.setProperty("--scene-visibility", visibility.toFixed(3));
    scene.style.setProperty("--scene-drift", drift.toFixed(3));
    if (visibility > 0.52) active = index;
  });
  method.dataset.activeStage = active;
  if (methodProgress)
    methodProgress.textContent = String(active + 1).padStart(2, "0");
}
addEventListener("scroll", updateMethodJourney, { passive: true });
addEventListener("resize", updateMethodJourney);
updateMethodJourney();

const patternBreak = document.querySelector(".pattern-break");
const patternRevealObserver = new IntersectionObserver(
  ([entry]) => patternBreak?.classList.toggle("is-visible", entry.isIntersecting),
  { threshold: 0.18 },
);
if (patternBreak) patternRevealObserver.observe(patternBreak);

const patternEase = (start, end, value) => {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

function updatePatternTakeover() {
  if (!patternBreak || reduced) return;
  const rect = patternBreak.getBoundingClientRect();
  const travel = Math.max(1, rect.height - innerHeight);
  const progress = Math.max(0, Math.min(1, -rect.top / travel));
  const takeover = patternEase(0.16, 0.66, progress);
  const deep = patternEase(0.24, 0.54, progress);
  const release = patternEase(0.84, 1, progress);
  const bandInsetY = 37 * (1 - takeover);
  const shift = -2 + progress * (innerWidth <= 800 ? 5 : 7);

  patternBreak.style.setProperty("--takeover", takeover.toFixed(3));
  patternBreak.style.setProperty("--deep", deep.toFixed(3));
  patternBreak.style.setProperty("--release", release.toFixed(3));
  patternBreak.style.setProperty("--band-inset-y", `${bandInsetY.toFixed(2)}%`);
  patternBreak.style.setProperty("--pattern-shift", `${shift.toFixed(2)}vw`);
}

addEventListener("scroll", updatePatternTakeover, { passive: true });
addEventListener("resize", updatePatternTakeover);
updatePatternTakeover();

const contact = document.querySelector(".contact");
const contactEye = document.querySelector(".contact-eye");
const contactPupil = contactEye?.querySelector("i");
if (contact && contactEye && contactPupil && !touch && !reduced) {
  let targetX = 0,
    targetY = 0,
    lookX = 0,
    lookY = 0,
    contactTicking = false;
  const drawContactLook = () => {
    lookX += (targetX - lookX) * 0.14;
    lookY += (targetY - lookY) * 0.14;
    contactPupil.style.left = "50%";
    contactPupil.style.top = "50%";
    contactPupil.style.transform = `translate(-50%,-50%) translate(${lookX.toFixed(2)}px,${lookY.toFixed(2)}px)`;
    if (Math.abs(targetX - lookX) + Math.abs(targetY - lookY) > 0.08)
      requestAnimationFrame(drawContactLook);
    else contactTicking = false;
  };
  const setContactLook = (x, y) => {
    const r = contactEye.getBoundingClientRect();
    targetX =
      Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / (r.width / 2))) *
      13;
    targetY =
      Math.max(-1, Math.min(1, (y - (r.top + r.height / 2)) / (r.height / 2))) *
      7;
    if (!contactTicking) {
      contactTicking = true;
      requestAnimationFrame(drawContactLook);
    }
  };
  contact.addEventListener(
    "pointermove",
    (event) => setContactLook(event.clientX, event.clientY),
    { passive: true },
  );
  contact.addEventListener("pointerleave", () => {
    targetX = 0;
    targetY = 0;
    if (!contactTicking) {
      contactTicking = true;
      requestAnimationFrame(drawContactLook);
    }
  });
}

document.querySelectorAll(".cap-list details").forEach((detail) =>
  detail.addEventListener("toggle", () => {
    if (detail.open)
      document.querySelectorAll(".cap-list details").forEach((other) => {
        if (other !== detail) other.open = false;
      });
  }),
);

const menu = document.querySelector(".menu");
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") === "true";
  menu.setAttribute("aria-expanded", String(!open));
  document.querySelector(".nav nav").classList.toggle("mobile-open", !open);
});

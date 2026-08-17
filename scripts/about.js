const aboutReducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const aboutTouch = matchMedia("(pointer: coarse)").matches;
const aboutBody = document.body;
const aboutLoader = document.querySelector(".loader");

addEventListener("load", () => {
  setTimeout(() => {
    aboutLoader?.classList.add("done");
    aboutBody.classList.add("is-loaded");
  }, aboutReducedMotion ? 0 : 650);
});

const aboutRevealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      aboutRevealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -7%" },
);
document.querySelectorAll(".about-reveal").forEach((item) => aboutRevealObserver.observe(item));

const aboutMenu = document.querySelector(".menu");
const aboutNav = document.querySelector(".about-nav nav");
aboutMenu?.addEventListener("click", () => {
  const isOpen = aboutMenu.getAttribute("aria-expanded") === "true";
  aboutMenu.setAttribute("aria-expanded", String(!isOpen));
  aboutNav?.classList.toggle("mobile-open", !isOpen);
});
aboutNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    aboutMenu?.setAttribute("aria-expanded", "false");
    aboutNav.classList.remove("mobile-open");
  });
});

if (!aboutTouch) {
  const cursor = document.querySelector(".cursor");
  let targetX = innerWidth / 2;
  let targetY = innerHeight / 2;
  let cursorX = targetX;
  let cursorY = targetY;

  addEventListener("mousemove", (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  });

  const drawCursor = () => {
    cursorX += (targetX - cursorX) * 0.24;
    cursorY += (targetY - cursorY) * 0.24;
    if (cursor) cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
    requestAnimationFrame(drawCursor);
  };
  drawCursor();

  document.querySelectorAll("a, button, [data-cursor]").forEach((item) => {
    item.addEventListener("mouseenter", () => {
      cursor?.classList.add("big");
      cursor?.classList.toggle("write", item.dataset.cursor === "WRITE");
      if (cursor?.firstElementChild) cursor.firstElementChild.textContent = item.dataset.cursor || "GO";
    });
    item.addEventListener("mouseleave", () => cursor?.classList.remove("big", "write"));
  });

  const heroIdentity = document.querySelector(".about-hero-identity");
  addEventListener("mousemove", (event) => {
    if (!heroIdentity || aboutReducedMotion) return;
    const x = (event.clientX / innerWidth - 0.5) * 10;
    const y = (event.clientY / innerHeight - 0.5) * 7;
    heroIdentity.style.translate = `${x}px ${y}px`;
  });
}

const pointOfView = document.querySelector(".about-view");
const pointOfViewScene = document.querySelector(".about-view-scene");
let pointOfViewTicking = false;

const updatePointOfView = () => {
  pointOfViewTicking = false;
  if (!pointOfView || !pointOfViewScene || aboutReducedMotion || innerWidth <= 800) return;
  const rect = pointOfView.getBoundingClientRect();
  const travel = Math.max(1, rect.height - innerHeight);
  const progress = Math.max(0, Math.min(1, -rect.top / travel));
  const aligned = 1 - Math.pow(1 - progress, 2.4);
  const introExit = Math.max(0, Math.min(1, (progress - 0.28) / 0.3));
  const resolution = Math.max(0, Math.min(1, (progress - 0.52) / 0.3));

  pointOfViewScene.style.setProperty("--pov-progress", progress.toFixed(3));
  pointOfViewScene.style.setProperty("--pov-spread", `${(27 * (1 - aligned)).toFixed(2)}vw`);
  pointOfViewScene.style.setProperty("--pov-lift", `${(12 * (1 - aligned)).toFixed(2)}vh`);
  pointOfViewScene.style.setProperty("--pov-angle", `${(7 * (1 - aligned)).toFixed(2)}deg`);
  pointOfViewScene.style.setProperty("--pov-angle-left", `${(-7 * (1 - aligned)).toFixed(2)}deg`);
  pointOfViewScene.style.setProperty("--pov-image-shift", `${(progress * 8).toFixed(2)}%`);
  pointOfViewScene.style.setProperty("--pov-pupil-x", `${(23 * (1 - aligned)).toFixed(2)}vw`);
  pointOfViewScene.style.setProperty("--pov-pupil-y", `${(-9 * (1 - aligned)).toFixed(2)}vh`);
  pointOfViewScene.style.setProperty("--pov-intro-opacity", (1 - introExit).toFixed(3));
  pointOfViewScene.style.setProperty("--pov-intro-y", `${(-32 * introExit).toFixed(1)}px`);
  pointOfViewScene.style.setProperty("--pov-resolution-opacity", resolution.toFixed(3));
  pointOfViewScene.style.setProperty("--pov-resolution-y", `${(30 * (1 - resolution)).toFixed(1)}px`);
};

const requestPointOfViewUpdate = () => {
  if (pointOfViewTicking) return;
  pointOfViewTicking = true;
  requestAnimationFrame(updatePointOfView);
};

const socialSection = document.querySelector(".about-social");
const socialSystem = document.querySelector(".social-system");
const socialRows = [...document.querySelectorAll(".social-row")];
let socialScrollIndex = 0;
let socialHoverIndex = null;
let socialTicking = false;

const setSocialState = (index) => {
  if (!socialRows.length || !socialSystem) return;
  const safeIndex = Math.max(0, Math.min(socialRows.length - 1, index));
  socialRows.forEach((row, rowIndex) => row.classList.toggle("is-active", rowIndex === safeIndex));
  const activeRow = socialRows[safeIndex];
  const systemRect = socialSystem.getBoundingClientRect();
  const activeRect = activeRow.getBoundingClientRect();
  socialSystem.style.setProperty("--social-pupil-y", `${activeRect.top - systemRect.top + activeRect.height / 2}px`);
};

const updateSocialState = () => {
  socialTicking = false;
  if (!socialSection || !socialRows.length) return;
  const focusLine = innerHeight * 0.34;
  let nearestIndex = 0;
  let nearestDistance = Infinity;
  socialRows.forEach((row, index) => {
    const rect = row.getBoundingClientRect();
    const distance = Math.abs(rect.top + rect.height / 2 - focusLine);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  socialScrollIndex = nearestIndex;
  setSocialState(socialHoverIndex ?? socialScrollIndex);
};

const requestSocialUpdate = () => {
  if (socialTicking) return;
  socialTicking = true;
  requestAnimationFrame(updateSocialState);
};

socialRows.forEach((row, index) => {
  row.addEventListener("mouseenter", () => {
    socialHoverIndex = index;
    setSocialState(index);
  });
  row.addEventListener("mouseleave", () => {
    socialHoverIndex = null;
    setSocialState(socialScrollIndex);
  });
  row.addEventListener("focus", () => {
    socialHoverIndex = index;
    setSocialState(index);
  });
  row.addEventListener("blur", () => {
    socialHoverIndex = null;
    setSocialState(socialScrollIndex);
  });
});

const convergence = document.querySelector(".about-convergence");
const convergenceScene = document.querySelector(".about-convergence-scene");
let convergenceTicking = false;

const updateConvergence = () => {
  convergenceTicking = false;
  if (!convergence || !convergenceScene || aboutReducedMotion || innerWidth <= 800) return;
  const rect = convergence.getBoundingClientRect();
  const travel = Math.max(1, rect.height - innerHeight);
  const progress = Math.max(0, Math.min(1, -rect.top / travel));
  const spread = 32 - progress * 23.5;
  const markProgress = Math.max(0, Math.min(1, (progress - 0.48) / 0.3));
  const pupilOpacity = 1 - Math.max(0, Math.min(1, (progress - 0.64) / 0.18));

  convergenceScene.style.setProperty("--convergence-progress", progress.toFixed(3));
  convergenceScene.style.setProperty("--pupil-spread", `${spread.toFixed(2)}vw`);
  convergenceScene.style.setProperty("--pupil-opacity", pupilOpacity.toFixed(3));
  convergenceScene.style.setProperty("--mark-opacity", (markProgress * 0.92).toFixed(3));
  convergenceScene.style.setProperty("--mark-scale", (0.9 + markProgress * 0.1).toFixed(3));
  convergenceScene.style.setProperty("--axis-scale", (0.2 + progress * 0.8).toFixed(3));
};

const requestConvergenceUpdate = () => {
  if (convergenceTicking) return;
  convergenceTicking = true;
  requestAnimationFrame(updateConvergence);
};
addEventListener("scroll", requestConvergenceUpdate, { passive: true });
addEventListener("scroll", requestPointOfViewUpdate, { passive: true });
addEventListener("scroll", requestSocialUpdate, { passive: true });
addEventListener("resize", () => {
  requestConvergenceUpdate();
  requestPointOfViewUpdate();
  requestSocialUpdate();
});
requestConvergenceUpdate();
requestPointOfViewUpdate();
requestSocialUpdate();

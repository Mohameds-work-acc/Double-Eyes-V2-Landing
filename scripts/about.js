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

const socialPlatforms = [
  {
    id: "instagram",
    label: "Instagram",
    url: "https://www.instagram.com/double_eyes.sa?igsh=ODNibjdmaHd1dmE3&utm_source=qr",
    pupil: [50, 50],
    art: '<svg viewBox="0 0 320 320" role="presentation"><rect class="social-draw" x="48" y="48" width="224" height="224" rx="62" pathLength="1" /><circle class="social-draw social-lens" cx="160" cy="160" r="62" pathLength="1" /><circle class="social-fill" cx="238" cy="82" r="13" /></svg>',
  },
  {
    id: "tiktok",
    label: "TikTok",
    url: "https://www.tiktok.com/@double.eyes.sa?_r=1&_t=ZS-98jkGDGz1hk",
    pupil: [68, 28],
    art: '<svg viewBox="0 0 320 320" role="presentation"><path class="social-draw social-heavy" pathLength="1" d="M182 52v157c0 43-34 77-77 77s-77-34-77-77 34-77 77-77c8 0 16 1 23 4v54a29 29 0 1 0 0 19V52h54c7 39 36 67 76 73v55c-29-2-55-13-76-31" /><path class="social-echo" d="M202 74c10 16 27 27 49 31" /></svg>',
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    url: "https://www.linkedin.com/company/double-eyes/",
    pupil: [28, 22],
    art: '<svg viewBox="0 0 320 320" role="presentation"><rect class="social-block social-block--one" x="48" y="112" width="58" height="160" rx="5" /><path class="social-block social-block--two" d="M136 112h55v22c15-20 36-29 62-29 48 0 67 30 67 84v83h-59v-76c0-24-8-40-31-40-24 0-36 17-36 47v69h-58z" /><rect class="social-fill social-linkedin-dot" x="48" y="48" width="58" height="58" rx="29" /></svg>',
  },
  {
    id: "snapchat",
    label: "Snapchat",
    url: "https://snapchat.com/t/wtlz7FMR",
    pupil: [76, 42],
    art: '<svg viewBox="0 0 320 320" role="presentation"><path class="social-draw social-ghost" pathLength="1" d="M160 42c-52 0-83 39-83 91 0 18 3 34-5 49-7 12-23 18-42 23 8 21 29 25 47 27 8 2 10 14 16 23 12 17 35 18 67 18s55-1 67-18c6-9 8-21 16-23 18-2 39-6 47-27-19-5-35-11-42-23-8-15-5-31-5-49 0-52-31-91-83-91z" /></svg>',
  },
  {
    id: "threads",
    label: "Threads",
    url: "https://www.threads.com/@double_eyes.sa?invite=0",
    pupil: [68, 48],
    art: '<svg viewBox="0 0 320 320" role="presentation"><path class="social-draw social-threads" pathLength="1" d="M160 35c-72 0-118 48-118 126 0 77 44 124 116 124 62 0 106-31 106-81 0-40-27-68-69-71-35-3-64 15-64 44 0 24 18 39 43 39 37 0 63-33 58-76-6-51-38-78-84-78-48 0-78 35-78 93 0 61 32 96 89 96 31 0 56-11 74-32" /></svg>',
  },
  {
    id: "x",
    label: "X",
    url: "https://x.com/double_eyes0?s=11",
    pupil: [50, 50],
    art: '<svg viewBox="0 0 320 320" role="presentation"><path class="social-draw social-x-stroke social-x-stroke--one" pathLength="1" d="M54 45l212 230" /><path class="social-draw social-x-stroke social-x-stroke--two" pathLength="1" d="M263 45L57 275" /></svg>',
  },
];

const socialArtworkHost = document.querySelector(".social-artworks");
const socialListHost = document.querySelector(".social-list");

if (socialArtworkHost && socialListHost) {
  socialArtworkHost.innerHTML = socialPlatforms
    .map((platform, index) => '<div class="social-art' + (index === 0 ? ' is-active' : '') + '" data-social-art="' + platform.id + '">' + platform.art + '</div>')
    .join("");

  socialListHost.innerHTML = socialPlatforms
    .map((platform, index) => '<a class="social-row' + (index === 0 ? ' is-active' : '') + '" data-social-index="' + index + '" data-cursor="FOLLOW ↗" href="' + platform.url + '" target="_blank" rel="noopener noreferrer" aria-label="Follow Double Eyes on ' + platform.label + ' (opens in a new tab)"' + (index === 0 ? ' aria-current="true"' : '') + '><span>' + String(index + 1).padStart(2, "0") + '</span><strong>' + platform.label + '</strong><svg class="social-arrow" viewBox="0 0 34 34" aria-hidden="true"><path d="M7 27L27 7M12 7h15v15" /></svg></a>')
    .join("");
}

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

const socialSection = document.querySelector(".about-social");
const socialStage = document.querySelector(".social-stage");
const socialRows = [...document.querySelectorAll(".social-row")];
const socialArtworks = [...document.querySelectorAll(".social-art")];
const socialStageNumber = document.querySelector(".social-stage-number");
const socialStageName = document.querySelector(".social-stage-name");
let socialScrollIndex = 0;
let socialHoverIndex = null;
let socialTicking = false;

const setSocialState = (index) => {
  if (!socialRows.length || !socialStage) return;
  const safeIndex = Math.max(0, Math.min(socialRows.length - 1, index));
  const platform = socialPlatforms[safeIndex];

  socialRows.forEach((row, rowIndex) => {
    const active = rowIndex === safeIndex;
    row.classList.toggle("is-active", active);
    if (active) row.setAttribute("aria-current", "true");
    else row.removeAttribute("aria-current");
  });
  socialArtworks.forEach((art, artIndex) => art.classList.toggle("is-active", artIndex === safeIndex));
  socialStage.dataset.activePlatform = platform.id;
  socialStage.style.setProperty("--social-pupil-x", platform.pupil[0] + "%");
  socialStage.style.setProperty("--social-pupil-y", platform.pupil[1] + "%");
  if (socialStageNumber) socialStageNumber.textContent = String(safeIndex + 1).padStart(2, "0") + " / 06";
  if (socialStageName) socialStageName.textContent = platform.label;
};

const updateSocialState = () => {
  socialTicking = false;
  if (!socialSection || !socialRows.length) return;
  const sectionRect = socialSection.getBoundingClientRect();

  if (innerWidth > 800 && !aboutReducedMotion) {
    const travel = Math.max(1, sectionRect.height - innerHeight);
    const progress = Math.max(0, Math.min(1, -sectionRect.top / travel));
    const thresholds = [0.15, 0.31, 0.47, 0.63, 0.79];
    socialScrollIndex = thresholds.filter((threshold) => progress >= threshold).length;
  } else {
    const focusLine = innerHeight * 0.68;
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
  }

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

const locationSection = document.querySelector(".about-contact");
let locationTicking = false;

if (locationSection) {
  if (aboutReducedMotion) {
    locationSection.classList.add("is-location-visible");
  } else {
    const locationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-location-visible");
          locationObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.16 },
    );
    locationObserver.observe(locationSection);
  }
}

const updateLocationState = () => {
  locationTicking = false;
  if (!locationSection || aboutReducedMotion || innerWidth <= 800) return;
  const rect = locationSection.getBoundingClientRect();
  const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / (innerHeight + rect.height)));
  locationSection.style.setProperty("--location-drift", progress.toFixed(3));
};

const requestLocationUpdate = () => {
  if (locationTicking) return;
  locationTicking = true;
  requestAnimationFrame(updateLocationState);
};

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
addEventListener("scroll", requestSocialUpdate, { passive: true });
addEventListener("scroll", requestLocationUpdate, { passive: true });
addEventListener("resize", () => {
  requestConvergenceUpdate();
  requestSocialUpdate();
  requestLocationUpdate();
});
requestConvergenceUpdate();
requestSocialUpdate();
requestLocationUpdate();


const viewer = document.querySelector('.image-viewer');
const categoryCloseControl = document.querySelector('.category-close-control');
const architectureDisclosure = document.getElementById('architecture-disclosure');
const categoryViewsForNavigation = [...document.querySelectorAll('.category-view')];
let activeMainCategory = null;

function closeMainCategories() {
  if (architectureDisclosure) architectureDisclosure.open = false;

  for (const view of categoryViewsForNavigation) {
    if (view) view.setAttribute('hidden', 'until-found');
  }

  for (const button of document.querySelectorAll('.category-tag')) {
    button.setAttribute('aria-expanded', 'false');
  }

  activeMainCategory = null;
  categoryCloseControl?.classList.remove('is-visible');

  if (categoryCloseControl) categoryCloseControl.hidden = true;
}

function openMainCategory(category) {
  history.pushState({ ...(history.state || {}), portfolioNavigation: 'category', category }, '', window.location.href);
  closeMainCategories();
  activeMainCategory = category;

  if (category === 'architecture' && architectureDisclosure) {
    architectureDisclosure.open = true;
  } else {
    const view = document.getElementById(category);

    if (view) {
      view.removeAttribute('hidden');
      const button = document.querySelector(`[aria-controls="${category}"]`);
      button?.setAttribute('aria-expanded', 'true');
    }
  }

  if (categoryCloseControl) categoryCloseControl.hidden = false;
  syncCategoryCloseControl();
}

function syncCategoryCloseControl() {
  if (!activeMainCategory || !categoryCloseControl) return;

  if (window.scrollY > 0) {
    categoryCloseControl.hidden = false;
    requestAnimationFrame(() => categoryCloseControl.classList.add('is-visible'));
  } else {
    categoryCloseControl.classList.remove('is-visible');
  }
}

document.addEventListener('click', (event) => {
  const launchCard = event.target.closest('.launch-card');

  if (launchCard) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const category = launchCard.classList.contains('launch-card-architecture')
      ? 'architecture'
      : launchCard.classList.contains('launch-card-interior')
        ? 'interior-design-view'
        : 'art-section-view';

    openMainCategory(category);

    document.getElementById(
      category === 'architecture' ? 'architecture-disclosure' : category
    )?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    return;
  }

  const categoryButton = event.target.closest('.category-tag');

  if (categoryButton) {
    const category = categoryButton.getAttribute('aria-controls');
    if (!category) return;

    requestAnimationFrame(() => {
      if (categoryButton.getAttribute('aria-expanded') === 'true') {
        openMainCategory(category);
      } else if (activeMainCategory === category) {
        closeMainCategories();
      }
    });
  }
}, true);

architectureDisclosure?.addEventListener('toggle', () => {
  if (architectureDisclosure.open) {
    activeMainCategory = 'architecture';

    for (const view of categoryViewsForNavigation) {
      if (view) view.setAttribute('hidden', 'until-found');
    }

    for (const button of document.querySelectorAll('.category-tag')) {
      button.setAttribute('aria-expanded', 'false');
    }

    if (categoryCloseControl) categoryCloseControl.hidden = false;
  } else if (activeMainCategory === 'architecture') {
    closeMainCategories();
  }
});

categoryCloseControl?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.querySelector('.architecture-close-view')?.addEventListener(
  'click',
  closeMainCategories
);

window.addEventListener('scroll', syncCategoryCloseControl, { passive: true });

window.addEventListener('keydown', (event) => {
  // Let the image viewer handle Escape when it is open.
  if (event.key === 'Escape' && viewer?.open) return;

  if (event.key === 'Escape' && activeMainCategory) {
    closeMainCategories();
  }
});

window.addEventListener('popstate', () => {
  // The phone/browser Back action follows the portfolio's visible navigation.
  if (viewer?.open) {
    viewer.close();
    return;
  }
  const selectedProject = architectureProjectSections.find((section) => !section.hidden);
  if (selectedProject) {
    showArchitectureProjectPicker();
    architectureProjectPicker?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }
  if (activeMainCategory) {
    closeMainCategories();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

// =====================================================
// IMAGE VIEWER — IMAGE-ONLY ZOOM AND PAN
// =====================================================

const viewerImage = document.querySelector('.viewer-image');
const viewerCaption = document.querySelector('.viewer-caption');
const closeButton = document.querySelector('.viewer-close');

let imageZoom = 1;
let imagePanX = 0;
let imagePanY = 0;
let isDraggingImage = false;
let dragStartX = 0;
let dragStartY = 0;
let dragOriginX = 0;
let dragOriginY = 0;

function updateViewerImage() {
  if (!viewerImage) return;

  viewerImage.style.transform =
    `translate3d(${imagePanX}px, ${imagePanY}px, 0) scale(${imageZoom})`;

  viewerImage.style.cursor = imageZoom > 1 ? 'grab' : 'zoom-in';
}

function resetViewerImage() {
  imageZoom = 1;
  imagePanX = 0;
  imagePanY = 0;
  isDraggingImage = false;

  updateViewerImage();
}

function changeImageZoom(amount) {
  const previousZoom = imageZoom;

  imageZoom = Math.min(6, Math.max(1, imageZoom + amount));

  if (imageZoom === 1) {
    imagePanX = 0;
    imagePanY = 0;
  } else if (imageZoom !== previousZoom) {
    // Keep the image centred when zooming.
    imagePanX = imagePanX * (imageZoom / previousZoom);
    imagePanY = imagePanY * (imageZoom / previousZoom);
  }

  updateViewerImage();
}

// Open gallery photos and blueprint drawings in the separate viewer.
for (const trigger of document.querySelectorAll(
  '.sheet-trigger, .project-image-trigger'
)) {
  trigger.addEventListener('click', (event) => {
    if (!viewer || typeof viewer.showModal !== 'function') return;

    const image = trigger.querySelector('img');
    if (!image) return;

    event.preventDefault();

    viewerImage.src =
      trigger.dataset.image || image.currentSrc || image.src;

    viewerImage.alt = image.alt || '';

    if (viewerCaption) {
      viewerCaption.textContent = trigger.dataset.caption || '';
    }

    resetViewerImage();
    viewer.showModal();
  });
}

// Mouse wheel zooms the image, not the webpage.
viewer?.addEventListener('wheel', (event) => {
  if (!viewer.open) return;

  event.preventDefault();
  event.stopPropagation();

  changeImageZoom(event.deltaY < 0 ? 0.2 : -0.2);
}, { passive: false });

// Drag the enlarged image to inspect different areas.
viewerImage?.addEventListener('pointerdown', (event) => {
  if (imageZoom <= 1) return;

  event.preventDefault();

  isDraggingImage = true;

  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragOriginX = imagePanX;
  dragOriginY = imagePanY;

  viewerImage.setPointerCapture(event.pointerId);
  viewerImage.style.cursor = 'grabbing';
});

viewerImage?.addEventListener('pointermove', (event) => {
  if (!isDraggingImage) return;

  imagePanX = dragOriginX + event.clientX - dragStartX;
  imagePanY = dragOriginY + event.clientY - dragStartY;

  updateViewerImage();
  viewerImage.style.cursor = 'grabbing';
});

function stopImageDragging() {
  isDraggingImage = false;
  updateViewerImage();
}

viewerImage?.addEventListener('pointerup', stopImageDragging);
viewerImage?.addEventListener('pointercancel', stopImageDragging);

// Double-click toggles between normal and enlarged view.
viewerImage?.addEventListener('dblclick', () => {
  if (imageZoom > 1) {
    resetViewerImage();
  } else {
    imageZoom = 2;
    updateViewerImage();
  }
});

// Keyboard controls while the image viewer is open.
viewer?.addEventListener('keydown', (event) => {
  if (event.key === '+' || event.key === '=') {
    event.preventDefault();
    changeImageZoom(0.2);
  }

  if (event.key === '-') {
    event.preventDefault();
    changeImageZoom(-0.2);
  }

  if (event.key === '0') {
    event.preventDefault();
    resetViewerImage();
  }
});

// Close the image viewer.
closeButton?.addEventListener('click', () => viewer?.close());

viewer?.addEventListener('click', (event) => {
  if (event.target === viewer) {
    viewer.close();
  }
});

viewer?.addEventListener('close', () => {
  if (viewerImage) viewerImage.src = '';
  resetViewerImage();
});

// =====================================================
// CATEGORY VIEW NAVIGATION
// =====================================================

const categoryButtons = document.querySelectorAll('.category-tag');
const categoryViews = document.querySelectorAll('.category-view');

function closeCategoryViews() {
  for (const view of categoryViews) {
    if (view) view.setAttribute('hidden', 'until-found');
  }

  for (const button of categoryButtons) {
    button.setAttribute('aria-expanded', 'false');
  }
}

for (const button of categoryButtons) {
  const viewId = button.getAttribute('aria-controls');
  if (!viewId) continue;

  const view = document.getElementById(viewId);
  if (!view) continue;

  button.addEventListener('click', () => {
    const isOpen = button.getAttribute('aria-expanded') === 'true';

    closeCategoryViews();

    if (!isOpen) {
      view.removeAttribute('hidden');
      button.setAttribute('aria-expanded', 'true');
    }
  });

  view.addEventListener('beforematch', () => {
    closeCategoryViews();
    view.removeAttribute('hidden');
    button.setAttribute('aria-expanded', 'true');
  });
}

for (const closeBtn of document.querySelectorAll('[data-close-category]')) {
  closeBtn.addEventListener('click', () => {
    const viewId = closeBtn.dataset.closeCategory;
    if (!viewId) return;

    const view = document.getElementById(viewId);
    if (!view) return;

    const button = document.querySelector(`[aria-controls="${view.id}"]`);

    view.setAttribute('hidden', 'until-found');
    button?.setAttribute('aria-expanded', 'false');

    (button || document.querySelector(
      `[data-main-category="${view.id}"]`
    ))?.focus();
  });
}

function syncMainCategoryVisibility() {
  const activeView = [...document.querySelectorAll('.category-view')]
    .find((view) => !view.hasAttribute('hidden'));

  const activeCategory = architectureDisclosure?.open
    ? 'architecture'
    : activeView?.id || null;

  if (activeCategory) {
    document.body.dataset.activeMainCategory = activeCategory;
  } else {
    delete document.body.dataset.activeMainCategory;
  }
}

const mainCategoryObserver = new MutationObserver(syncMainCategoryVisibility);

if (architectureDisclosure) {
  mainCategoryObserver.observe(architectureDisclosure, {
    attributes: true,
    attributeFilter: ['open']
  });
}

for (const view of categoryViews) {
  if (view) {
    mainCategoryObserver.observe(view, {
      attributes: true,
      attributeFilter: ['hidden']
    });
  }
}

syncMainCategoryVisibility();

// =====================================================
// ARCHITECTURE PROJECT PICKER
// =====================================================

const architectureProjectPicker = document.querySelector(
  '.architecture-project-picker'
);

const architectureProjectBack = document.querySelector(
  '.architecture-project-back'
);

const architectureProjectSections = [
  ...document.querySelectorAll('[data-architecture-project]')
];

function showArchitectureProject(projectId) {
  for (const section of architectureProjectSections) {
    if (section) {
      section.hidden = section.dataset.architectureProject !== projectId;
    }
  }

  if (architectureProjectPicker) architectureProjectPicker.hidden = true;
  if (architectureProjectBack) architectureProjectBack.hidden = false;
}

function showArchitectureProjectPicker() {
  for (const section of architectureProjectSections) {
    if (section) section.hidden = true;
  }

  if (architectureProjectPicker) architectureProjectPicker.hidden = false;
  if (architectureProjectBack) architectureProjectBack.hidden = true;
}

for (const button of document.querySelectorAll(
  '[data-open-architecture-project]'
)) {
  button.addEventListener('click', () => {
    const projId = button.dataset.openArchitectureProject;

    history.pushState({ ...(history.state || {}), portfolioNavigation: 'project', projectId: projId }, '', window.location.href);
    showArchitectureProject(projId);

    document.getElementById(projId === 'mombasa' ? 'overview' : projId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

architectureProjectBack?.addEventListener('click', () => {
  if (history.state?.portfolioNavigation === 'project') {
    history.back();
    return;
  }
  showArchitectureProjectPicker();
  architectureProjectPicker?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

showArchitectureProjectPicker();

// =====================================================
// COLLECTION FOLDERS
// =====================================================

for (const folder of document.querySelectorAll('.collection-folder')) {
  folder.addEventListener('toggle', () => {
    if (!folder.open) return;

    const parent = folder.parentElement;

    if (parent) {
      for (const sibling of parent.querySelectorAll(
        ':scope > .collection-folder'
      )) {
        if (sibling !== folder) sibling.open = false;
      }
    }
  });
}

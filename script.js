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
    document.getElementById(category === 'architecture' ? 'architecture-disclosure' : category)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

document.querySelector('.architecture-close-view')?.addEventListener('click', closeMainCategories);
window.addEventListener('scroll', syncCategoryCloseControl, { passive: true });
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && activeMainCategory) closeMainCategories();
});

const viewerImage = document.querySelector('.viewer-image');
const viewerCaption = document.querySelector('.viewer-caption');
const closeButton = document.querySelector('.viewer-close');

for (const trigger of document.querySelectorAll('.sheet-trigger, .project-image-trigger')) {
  trigger.addEventListener('click', () => {
    if (!viewer) return;
    const image = trigger.querySelector('img');
    if (viewerImage && image) {
      viewerImage.src = trigger.dataset.image || '';
      viewerImage.alt = image.alt || '';
    }
    if (viewerCaption) {
      viewerCaption.textContent = trigger.dataset.caption || '';
    }
    if (typeof viewer.showModal === 'function') {
      viewer.showModal();
    }
  });
}

closeButton?.addEventListener('click', () => viewer?.close());

viewer?.addEventListener('click', (event) => {
  if (event.target === viewer) {
    viewer.close();
  }
});

viewer?.addEventListener('close', () => {
  if (viewerImage) viewerImage.src = '';
});

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
    (button || document.querySelector(`[data-main-category="${view.id}"]`))?.focus();
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
  mainCategoryObserver.observe(architectureDisclosure, { attributes: true, attributeFilter: ['open'] });
}
for (const view of categoryViews) {
  if (view) {
    mainCategoryObserver.observe(view, { attributes: true, attributeFilter: ['hidden'] });
  }
}
syncMainCategoryVisibility();

const architectureProjectPicker = document.querySelector('.architecture-project-picker');
const architectureProjectBack = document.querySelector('.architecture-project-back');
const architectureProjectSections = [...document.querySelectorAll('[data-architecture-project]')];

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

for (const button of document.querySelectorAll('[data-open-architecture-project]')) {
  button.addEventListener('click', () => {
    const projId = button.dataset.openArchitectureProject;
    showArchitectureProject(projId);
    document.getElementById(projId === 'mombasa' ? 'overview' : projId)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

architectureProjectBack?.addEventListener('click', () => {
  showArchitectureProjectPicker();
  architectureProjectPicker?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

showArchitectureProjectPicker();

for (const folder of document.querySelectorAll('.collection-folder')) {
  folder.addEventListener('toggle', () => {
    if (!folder.open) return;
    const parent = folder.parentElement;
    if (parent) {
      for (const sibling of parent.querySelectorAll(':scope > .collection-folder')) {
        if (sibling !== folder) sibling.open = false;
      }
    }
  });
}
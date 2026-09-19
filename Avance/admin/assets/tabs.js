requireAuth();

// State
let allTabs = [];
let activeTabId = null;
let currentTabDetail = null;
let searchQuery = "";
let pendingConfirmCallback = null;

// DOM Elements
const errorEl = document.getElementById("global-error");
const sidebarListEl = document.getElementById("category-sidebar-list");
const tabsEmptyEl = document.getElementById("tabs-empty");
const metricCategoriesCountEl = document.getElementById("metric-categories-count");
const metricDocsCountEl = document.getElementById("metric-docs-count");

const categoryTitleEl = document.getElementById("current-category-title");
const categoryCountEl = document.getElementById("current-category-count");
const searchInputEl = document.getElementById("document-search-input");
const documentsContainerEl = document.getElementById("documents-container");
const documentsEmptyEl = document.getElementById("documents-empty");

const sectionOptionsEl = document.getElementById("section-options");
const editSectionOptionsEl = document.getElementById("edit-section-options");

// Modals
const modalCreateTab = document.getElementById("modal-create-tab");
const modalEditTab = document.getElementById("modal-edit-tab");
const modalCreateDoc = document.getElementById("modal-create-doc");
const modalEditDoc = document.getElementById("modal-edit-doc");
const modalConfirm = document.getElementById("modal-confirm");

const confirmModalTitle = document.getElementById("confirm-modal-title");
const confirmModalMessage = document.getElementById("confirm-modal-message");
const confirmActionBtn = document.getElementById("confirm-action-btn");
const confirmCancelBtn = document.getElementById("confirm-cancel-btn");

// Global Event Listeners
document.getElementById("logout-btn").addEventListener("click", logout);

// Close modal handlers (data-close-modal attribute)
document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", closeAllModals);
});

// Click outside modal card to close
[modalCreateTab, modalEditTab, modalCreateDoc, modalEditDoc, modalConfirm].forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeAllModals();
  });
});

// Escape key closes modals
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeAllModals();
});

function openModal(modalEl) {
  clearError();
  modalEl.hidden = false;
}

function closeAllModals() {
  [modalCreateTab, modalEditTab, modalCreateDoc, modalEditDoc, modalConfirm].forEach((m) => {
    m.hidden = true;
  });
  pendingConfirmCallback = null;
}

// Switch a document modal ("doc" or "edit-doc") between "Paste Link" and "Upload PDF" mode
function setDocMode(prefix, mode) {
  const toggle = document.getElementById(`${prefix}-mode-toggle`);
  const urlGroup = document.getElementById(`${prefix}-url-group`);
  const fileGroup = document.getElementById(`${prefix}-file-group`);
  const urlInput = document.getElementById(`${prefix}-url`);
  const fileInput = document.getElementById(`${prefix}-file`);

  toggle.querySelectorAll(".ad-toggle-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });

  const isUrlMode = mode === "url";
  urlGroup.hidden = !isUrlMode;
  fileGroup.hidden = isUrlMode;

  if (isUrlMode) {
    fileInput.value = "";
  }

  toggle.dataset.activeMode = mode;
}

document.querySelectorAll(".ad-toggle-group").forEach((group) => {
  group.querySelectorAll(".ad-toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const prefix = group.id.replace("-mode-toggle", "");
      setDocMode(prefix, btn.dataset.mode);
    });
  });
});

// Resolve the document URL for a "doc"/"edit-doc" modal: either the pasted URL,
// or upload the chosen PDF to Cloudinary first and use the returned URL.
async function resolveDocumentUrl(prefix, submitBtn) {
  const toggle = document.getElementById(`${prefix}-mode-toggle`);
  const mode = toggle.dataset.activeMode || "url";

  if (mode === "upload") {
    const fileInput = document.getElementById(`${prefix}-file`);
    const file = fileInput.files[0];
    if (!file) {
      throw new Error("Please choose a PDF file to upload.");
    }

    const formData = new FormData();
    formData.append("file", file);

    const originalLabel = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = "Uploading...";
    try {
      const result = await apiUpload("/admin/uploads/pdf", formData);
      return result.url;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  }

  const url = document.getElementById(`${prefix}-url`).value.trim();
  if (!url) {
    throw new Error("Please enter a PDF document URL.");
  }
  return url;
}

function showConfirmDialog({ title, message, confirmText = "Delete", onConfirm }) {
  confirmModalTitle.textContent = title || "Confirm Action";
  confirmModalMessage.textContent = message;
  confirmActionBtn.textContent = confirmText;
  pendingConfirmCallback = onConfirm;
  openModal(modalConfirm);
}

confirmActionBtn.addEventListener("click", async () => {
  if (pendingConfirmCallback) {
    const cb = pendingConfirmCallback;
    closeAllModals();
    await cb();
  } else {
    closeAllModals();
  }
});

confirmCancelBtn.addEventListener("click", closeAllModals);

function showError(message) {
  if (!message) return;
  errorEl.textContent = message;
  errorEl.hidden = false;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearError() {
  errorEl.hidden = true;
  errorEl.textContent = "";
}

function escapeHTML(str) {
  return String(str || "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// PDF Icon SVG template
const PDF_ICON_SVG = `
  <div class="ad-pdf-badge" title="PDF Document">
    <svg viewBox="0 0 24 24">
      <path d="M7 3C5.9 3 5 3.9 5 5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V9L13 3H7M7 5H12V10H17V19H7V5M9 13C8.4 13 8 13.4 8 14V17H9.5V15.5H10.5C11.1 15.5 11.5 15.1 11.5 14.5V14C11.5 13.4 11.1 13 10.5 13H9M13 13C12.4 13 12 13.4 12 14V17H13.5V16H14.5C15.1 16 15.5 15.6 15.5 15V14C15.5 13.4 15.1 13 14.5 13H13M9.5 14H10V14.5H9.5V14M13.5 14H14V15H13.5V14Z"/>
    </svg>
  </div>
`;

// Initial Page Load
async function initDashboard() {
  clearError();
  const urlParams = new URLSearchParams(window.location.search);
  const requestedId = urlParams.get("id");

  await loadAllTabs(requestedId);
}

// Load Tabs from API
async function loadAllTabs(targetSelectId = null) {
  try {
    allTabs = await apiFetch("/admin/tabs");

    // Calculate metrics
    metricCategoriesCountEl.textContent = allTabs.length;
    const totalDocs = allTabs.reduce((sum, tab) => sum + (Number(tab.documentCount) || 0), 0);
    metricDocsCountEl.textContent = totalDocs;

    if (allTabs.length === 0) {
      tabsEmptyEl.hidden = false;
      sidebarListEl.innerHTML = "";
      renderEmptyWorkspace();
      return;
    }

    tabsEmptyEl.hidden = true;

    // Pick active tab
    if (targetSelectId && allTabs.some((t) => t.id === targetSelectId)) {
      activeTabId = targetSelectId;
    } else if (!activeTabId || !allTabs.some((t) => t.id === activeTabId)) {
      activeTabId = allTabs[0].id;
    }

    renderSidebar();
    await loadTabDetail(activeTabId);
  } catch (err) {
    showError(err.message);
  }
}

// Render Left Category Sidebar (Identical to Image 2)
function renderSidebar() {
  sidebarListEl.innerHTML = "";

  allTabs.forEach((tab) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `ad-sidebar-item ${tab.id === activeTabId ? "active" : ""}`;
    btn.dataset.id = tab.id;
    btn.innerHTML = `
      <span class="ad-sidebar-item-label">${escapeHTML(tab.title)}</span>
      <span class="ad-sidebar-item-count">${tab.documentCount || 0}</span>
    `;

    btn.addEventListener("click", () => {
      if (activeTabId === tab.id) return;
      activeTabId = tab.id;
      // Update active class in sidebar
      document.querySelectorAll(".ad-sidebar-item").forEach((item) => {
        item.classList.toggle("active", item.dataset.id === tab.id);
      });
      // Update URL query string silently
      const url = new URL(window.location);
      url.searchParams.set("id", tab.id);
      window.history.replaceState({}, "", url);
      loadTabDetail(tab.id);
    });

    sidebarListEl.appendChild(btn);
  });
}

// Load Active Tab Details (Sections + Documents)
async function loadTabDetail(tabId) {
  clearError();
  categoryTitleEl.textContent = "Loading...";
  documentsContainerEl.innerHTML = "";
  documentsEmptyEl.hidden = true;

  try {
    currentTabDetail = await apiFetch(`/admin/tabs/${tabId}`);

    // Update Header
    categoryTitleEl.textContent = currentTabDetail.title;
    let totalCount = currentTabDetail.documents.length;
    currentTabDetail.sections.forEach((s) => (totalCount += s.documents.length));
    categoryCountEl.textContent = `${totalCount} ${totalCount === 1 ? "file" : "files"}`;

    // Update section dropdown options
    const sectionHeadings = currentTabDetail.sections.map((s) => s.heading);
    const optionsHtml = sectionHeadings
      .map((h) => `<option value="${escapeHTML(h)}"></option>`)
      .join("");
    sectionOptionsEl.innerHTML = optionsHtml;
    editSectionOptionsEl.innerHTML = optionsHtml;

    // Render documents with search filter
    renderDocuments();
  } catch (err) {
    showError(err.message);
  }
}

// Filter and Render Documents in the Right Panel
function renderDocuments() {
  if (!currentTabDetail) return;

  documentsContainerEl.innerHTML = "";
  const filter = searchQuery.trim().toLowerCase();

  let renderedDocsCount = 0;

  // 1. Grouped Sections
  currentTabDetail.sections.forEach((section) => {
    const matchingDocs = section.documents.filter((d) =>
      filter === "" ? true : (d.title && d.title.toLowerCase().includes(filter))
    );

    if (matchingDocs.length > 0) {
      const groupEl = document.createElement("div");
      groupEl.className = "ad-year-group";

      const headingEl = document.createElement("div");
      headingEl.className = "ad-year-heading";
      headingEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        ${escapeHTML(section.heading)} &bull; ${matchingDocs.length} ${matchingDocs.length === 1 ? "doc" : "docs"}
      `;

      groupEl.appendChild(headingEl);

      matchingDocs.forEach((doc) => {
        groupEl.appendChild(createDocumentRowElement(doc, section.heading));
        renderedDocsCount++;
      });

      documentsContainerEl.appendChild(groupEl);
    }
  });

  // 2. Ungrouped Documents
  const matchingUngrouped = currentTabDetail.documents.filter((d) =>
    filter === "" ? true : (d.title && d.title.toLowerCase().includes(filter))
  );

  if (matchingUngrouped.length > 0) {
    const groupEl = document.createElement("div");
    groupEl.className = "ad-year-group";

    if (currentTabDetail.sections.length > 0) {
      const headingEl = document.createElement("div");
      headingEl.className = "ad-year-heading";
      headingEl.textContent = "Other Documents";
      groupEl.appendChild(headingEl);
    }

    matchingUngrouped.forEach((doc) => {
      groupEl.appendChild(createDocumentRowElement(doc, ""));
      renderedDocsCount++;
    });

    documentsContainerEl.appendChild(groupEl);
  }

  // Handle empty search / empty tab state
  if (renderedDocsCount === 0) {
    documentsEmptyEl.hidden = false;
    if (filter !== "") {
      documentsEmptyEl.querySelector("h4").textContent = `No documents found matching "${searchQuery}"`;
      documentsEmptyEl.querySelector("p").textContent = "Try searching for a different keyword.";
    } else {
      documentsEmptyEl.querySelector("h4").textContent = "No documents in this category";
      documentsEmptyEl.querySelector("p").textContent = "Click 'Add Document' above to link a filing.";
    }
  } else {
    documentsEmptyEl.hidden = true;
  }
}

// Create a single document row element matching reference style
function createDocumentRowElement(doc, sectionHeading) {
  const row = document.createElement("div");
  row.className = "ad-doc-row";

  row.innerHTML = `
    <div class="ad-doc-left">
      ${PDF_ICON_SVG}
      <a href="${escapeHTML(doc.url)}" target="_blank" rel="noopener noreferrer" class="ad-doc-title" title="Open document">
        ${escapeHTML(doc.title)}
      </a>
      ${doc.order !== undefined && doc.order !== null ? `<span class="ad-doc-order-tag" title="Sort order">#${doc.order}</span>` : ""}
    </div>
    <div class="ad-doc-actions">
      <a href="${escapeHTML(doc.url)}" target="_blank" rel="noopener noreferrer" class="ad-action-icon-btn" title="Open PDF in new tab">
        <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      </a>
      <button type="button" class="ad-action-icon-btn" data-action="edit-doc" title="Edit document">
        <svg viewBox="0 0 24 24"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
      </button>
      <button type="button" class="ad-action-icon-btn danger" data-action="delete-doc" title="Delete document">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
      </button>
    </div>
  `;

  // Attach Edit Document event
  row.querySelector('[data-action="edit-doc"]').addEventListener("click", () => {
    document.getElementById("edit-doc-id").value = doc.id;
    document.getElementById("edit-doc-title").value = doc.title || "";
    document.getElementById("edit-doc-url").value = doc.url || "";
    document.getElementById("edit-doc-section").value = sectionHeading || "";
    document.getElementById("edit-doc-order").value = doc.order !== undefined && doc.order !== null ? doc.order : 0;
    setDocMode("edit-doc", "url");
    openModal(modalEditDoc);
  });

  // Attach Delete Document event
  row.querySelector('[data-action="delete-doc"]').addEventListener("click", () => {
    showConfirmDialog({
      title: "Delete Document",
      message: `Are you sure you want to delete "${doc.title}"? This cannot be undone.`,
      confirmText: "Delete Document",
      onConfirm: async () => {
        try {
          await apiFetch(`/admin/documents/${doc.id}`, { method: "DELETE" });
          await loadTabDetail(activeTabId);
          // Refresh tabs to update document counts in the sidebar
          const refreshed = await apiFetch("/admin/tabs");
          allTabs = refreshed;
          renderSidebar();
        } catch (err) {
          showError(err.message);
        }
      },
    });
  });

  return row;
}

function renderEmptyWorkspace() {
  categoryTitleEl.textContent = "No Categories Yet";
  categoryCountEl.textContent = "0 files";
  documentsContainerEl.innerHTML = "";
  documentsEmptyEl.hidden = false;
  documentsEmptyEl.querySelector("h4").textContent = "Create your first category tab";
  documentsEmptyEl.querySelector("p").textContent = "Click 'Add Tab' in the sidebar to get started.";
}

// Search Filter Listener
searchInputEl.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderDocuments();
});

// =========================================================================
// Category Tab Modals & Actions
// =========================================================================

// Open Add Category Modal
document.getElementById("open-create-tab-modal").addEventListener("click", () => {
  document.getElementById("create-tab-form").reset();
  openModal(modalCreateTab);
});

// Handle Create Category Form Submit
document.getElementById("create-tab-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const title = document.getElementById("new-tab-title").value.trim();
  const orderValue = document.getElementById("new-tab-order").value;

  const payload = { title };
  if (orderValue !== "") {
    payload.order = Number(orderValue);
  }

  try {
    const created = await apiFetch("/admin/tabs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    closeAllModals();
    await loadAllTabs(created ? created.id : null);
  } catch (err) {
    showError(err.message);
  }
});

// Open Rename/Edit Current Tab Modal
document.getElementById("rename-current-tab-btn").addEventListener("click", () => {
  if (!currentTabDetail) return;
  document.getElementById("edit-tab-id").value = currentTabDetail.id;
  document.getElementById("edit-tab-title").value = currentTabDetail.title || "";
  document.getElementById("edit-tab-order").value = currentTabDetail.order !== undefined ? currentTabDetail.order : 0;
  openModal(modalEditTab);
});

// Handle Edit Category Form Submit
document.getElementById("edit-tab-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const id = document.getElementById("edit-tab-id").value;
  const title = document.getElementById("edit-tab-title").value.trim();
  const orderValue = document.getElementById("edit-tab-order").value;

  const payload = { title };
  if (orderValue !== "") {
    payload.order = Number(orderValue);
  }

  try {
    await apiFetch(`/admin/tabs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    closeAllModals();
    await loadAllTabs(id);
  } catch (err) {
    showError(err.message);
  }
});

// Delete Current Category
document.getElementById("delete-current-tab-btn").addEventListener("click", () => {
  if (!currentTabDetail) return;
  showConfirmDialog({
    title: "Delete Category",
    message: `Delete category "${currentTabDetail.title}" and all of its associated documents and sections? This action cannot be undone.`,
    confirmText: "Delete Category",
    onConfirm: async () => {
      try {
        await apiFetch(`/admin/tabs/${currentTabDetail.id}`, { method: "DELETE" });
        activeTabId = null;
        await loadAllTabs();
      } catch (err) {
        showError(err.message);
      }
    },
  });
});

// =========================================================================
// Document Modals & Actions
// =========================================================================

// Open Add Document Modal
document.getElementById("open-add-doc-modal").addEventListener("click", () => {
  if (!activeTabId) {
    showError("Please select or create a category tab first.");
    return;
  }
  document.getElementById("create-doc-form").reset();
  setDocMode("doc", "url");
  openModal(modalCreateDoc);
});

// Handle Create Document Form Submit
document.getElementById("create-doc-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const title = document.getElementById("doc-title").value.trim();
  const section = document.getElementById("doc-section").value.trim();
  const orderValue = document.getElementById("doc-order").value;

  let url;
  try {
    url = await resolveDocumentUrl("doc", e.target.querySelector('button[type="submit"]'));
  } catch (err) {
    showError(err.message);
    return;
  }

  const payload = { tabId: activeTabId, title, url };
  if (section !== "") {
    payload.sectionHeading = section;
  }
  if (orderValue !== "") {
    payload.order = Number(orderValue);
  }

  try {
    await apiFetch("/admin/documents", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    closeAllModals();
    await loadTabDetail(activeTabId);
    // Refresh sidebar tab count
    const refreshed = await apiFetch("/admin/tabs");
    allTabs = refreshed;
    renderSidebar();
  } catch (err) {
    showError(err.message);
  }
});

// Handle Edit Document Form Submit
document.getElementById("edit-doc-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const id = document.getElementById("edit-doc-id").value;
  const title = document.getElementById("edit-doc-title").value.trim();
  const section = document.getElementById("edit-doc-section").value.trim();
  const orderValue = document.getElementById("edit-doc-order").value;

  let url;
  try {
    url = await resolveDocumentUrl("edit-doc", e.target.querySelector('button[type="submit"]'));
  } catch (err) {
    showError(err.message);
    return;
  }

  const payload = {
    title,
    url,
    sectionHeading: section === "" ? null : section,
    order: orderValue !== "" ? Number(orderValue) : 0,
  };

  try {
    await apiFetch(`/admin/documents/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    closeAllModals();
    await loadTabDetail(activeTabId);
  } catch (err) {
    showError(err.message);
  }
});

// Run
initDashboard();

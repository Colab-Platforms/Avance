requireAuth();

const params = new URLSearchParams(window.location.search);
const tabId = params.get("id");

const errorEl = document.getElementById("global-error");
const headingEl = document.getElementById("tab-title-heading");
const sectionOptionsEl = document.getElementById("section-options");
const documentsContainer = document.getElementById("documents-container");
const documentsEmptyEl = document.getElementById("documents-empty");

document.getElementById("logout-btn").addEventListener("click", logout);

if (!tabId) {
  window.location.href = "tabs.html";
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = false;
}

function clearError() {
  errorEl.hidden = true;
}

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

let currentTab = null;

async function loadTab() {
  clearError();
  try {
    currentTab = await apiFetch(`/admin/tabs/${tabId}`);
    renderTab(currentTab);
  } catch (err) {
    showError(err.message);
  }
}

function renderTab(tab) {
  headingEl.textContent = tab.title;
  document.title = `${tab.title} | Avance Investor CMS`;

  sectionOptionsEl.innerHTML = tab.sections
    .map((s) => `<option value="${escapeHTML(s.heading)}"></option>`)
    .join("");

  documentsContainer.innerHTML = "";
  let totalCount = tab.documents.length;
  tab.sections.forEach((s) => (totalCount += s.documents.length));
  documentsEmptyEl.hidden = totalCount > 0;

  tab.sections.forEach((section) => {
    const heading = document.createElement("div");
    heading.className = "ad-section-heading";
    heading.textContent = `${section.heading} (${section.documents.length})`;
    documentsContainer.appendChild(heading);
    documentsContainer.appendChild(buildDocsTable(section.documents, section.heading));
  });

  if (tab.documents.length > 0) {
    if (tab.sections.length > 0) {
      const heading = document.createElement("div");
      heading.className = "ad-section-heading";
      heading.textContent = "Ungrouped";
      documentsContainer.appendChild(heading);
    }
    documentsContainer.appendChild(buildDocsTable(tab.documents, ""));
  }
}

function buildDocsTable(docs, sectionHeading) {
  const table = document.createElement("table");
  table.className = "ad-table";
  table.innerHTML = `
    <thead>
      <tr><th>Title</th><th>URL</th><th>Order</th><th>Actions</th></tr>
    </thead>
    <tbody>
      ${docs.map((doc) => renderDocumentRow(doc, sectionHeading)).join("")}
    </tbody>
  `;
  return table;
}

function renderDocumentRow(doc, sectionHeading) {
  return `
    <tr>
      <td>${escapeHTML(doc.title)}</td>
      <td><a href="${escapeHTML(doc.url)}" target="_blank" rel="noopener noreferrer">Open</a></td>
      <td>${doc.order}</td>
      <td class="ad-actions">
        <button type="button" class="ad-btn small secondary" data-action="edit-doc"
          data-id="${doc.id}" data-title="${escapeHTML(doc.title)}" data-url="${escapeHTML(doc.url)}"
          data-section="${escapeHTML(sectionHeading || "")}" data-order="${doc.order}">Edit</button>
        <button type="button" class="ad-btn small danger" data-action="delete-doc" data-id="${doc.id}">Delete</button>
      </td>
    </tr>
  `;
}

documentsContainer.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  clearError();
  const id = btn.dataset.id;

  try {
    if (btn.dataset.action === "delete-doc") {
      const confirmed = window.confirm("Delete this document? This cannot be undone.");
      if (!confirmed) return;
      await apiFetch(`/admin/documents/${id}`, { method: "DELETE" });
      await loadTab();
    } else if (btn.dataset.action === "edit-doc") {
      const newTitle = window.prompt("Title:", btn.dataset.title);
      if (newTitle === null) return;

      const newUrl = window.prompt("PDF URL:", btn.dataset.url);
      if (newUrl === null) return;

      const newSection = window.prompt("Section (leave blank for none):", btn.dataset.section);
      if (newSection === null) return;

      const newOrder = window.prompt("Order:", btn.dataset.order);
      if (newOrder === null) return;

      const payload = {
        title: newTitle.trim(),
        url: newUrl.trim(),
        sectionHeading: newSection.trim() === "" ? null : newSection.trim(),
        order: Number(newOrder),
      };

      await apiFetch(`/admin/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      await loadTab();
    }
  } catch (err) {
    showError(err.message);
  }
});

document.getElementById("create-doc-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError();

  const title = document.getElementById("doc-title").value.trim();
  const url = document.getElementById("doc-url").value.trim();
  const section = document.getElementById("doc-section").value.trim();
  const orderValue = document.getElementById("doc-order").value;

  const payload = { tabId, title, url };
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
    document.getElementById("create-doc-form").reset();
    await loadTab();
  } catch (err) {
    showError(err.message);
  }
});

document.getElementById("rename-tab-btn").addEventListener("click", async () => {
  if (!currentTab) return;
  clearError();

  const newTitle = window.prompt("New title for this tab:", currentTab.title);
  if (!newTitle || newTitle.trim() === currentTab.title) return;

  try {
    await apiFetch(`/admin/tabs/${tabId}`, {
      method: "PATCH",
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    await loadTab();
  } catch (err) {
    showError(err.message);
  }
});

document.getElementById("delete-tab-btn").addEventListener("click", async () => {
  if (!currentTab) return;
  clearError();

  const confirmed = window.confirm(
    `Delete "${currentTab.title}" and all of its documents/sections? This cannot be undone.`
  );
  if (!confirmed) return;

  try {
    await apiFetch(`/admin/tabs/${tabId}`, { method: "DELETE" });
    window.location.href = "tabs.html";
  } catch (err) {
    showError(err.message);
  }
});

loadTab();

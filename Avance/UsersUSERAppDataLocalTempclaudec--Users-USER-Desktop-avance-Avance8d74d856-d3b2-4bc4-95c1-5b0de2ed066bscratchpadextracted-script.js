
		document.addEventListener('DOMContentLoaded', async function () {
			const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
				? 'http://localhost:4000/api/public'
				: '/api/public';

			let investorData = [];

		const sidebarEl = document.getElementById('investor-sidebar');
		const titleEl = document.getElementById('investor-content-title');
		const countEl = document.getElementById('investor-content-count');
		const listEl = document.getElementById('investor-content-list');
		const searchEl = document.getElementById('investor-search');

		let activeId = null;

		function escapeHTML(str) {
			return String(str).replace(/[&<>"']/g, (c) => ({
				'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
			}[c]));
		}

		// Normalizes both data shapes (flat `pdfs` and year-wise `sections`) into one groups array
		function getGroups(item) {
			if (item.sections && item.sections.length) return item.sections;
			if (item.pdfs && item.pdfs.length) return [{ heading: null, pdfs: item.pdfs }];
			return [];
		}

		function countDocs(item) {
			return getGroups(item).reduce((sum, group) => sum + group.pdfs.length, 0);
		}

		function renderSidebar() {
			sidebarEl.innerHTML = investorData.map((item) => `
				<button type="button" class="ir-sidebar-item${item.id === activeId ? ' active' : ''}" data-id="${item.id}">
					<span class="ir-sidebar-item_label">${escapeHTML(item.title.trim())}</span>
					<span class="ir-sidebar-item_count">${countDocs(item)}</span>
				</button>
			`).join('');
		}

		function renderContent() {
			const item = investorData.find((d) => d.id === activeId);
			if (!item) return;

			const groups = getGroups(item);
			const query = searchEl.value.trim().toLowerCase();

			titleEl.textContent = item.title.trim();
			const totalCount = countDocs(item);
			countEl.textContent = `${totalCount} file${totalCount === 1 ? '' : 's'}`;

			let html = '';
			let visibleTotal = 0;

			groups.forEach((group) => {
				const filtered = query
					? group.pdfs.filter((pdf) => pdf.title.toLowerCase().includes(query))
					: group.pdfs;
				if (!filtered.length) return;

				visibleTotal += filtered.length;
				html += '<div class="ir-year-group">';
				if (group.heading) {
					html += `<div class="ir-year-heading">${escapeHTML(group.heading)}</div>`;
				}
				html += '<ul class="ir-doc-list">';
				filtered.forEach((pdf) => {
					const name = escapeHTML(pdf.title);
					const url = escapeHTML(pdf.url);
					html += `
						<li class="ir-doc-row">
							<a class="ir-doc-name" href="${url}" target="_blank" rel="noopener noreferrer" title="${name}">
								<i class="fa-regular fa-file-pdf"></i>
								<span>${name}</span>
							</a>
							<a class="ir-doc-download" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="Download ${name}">
								<i class="fa-solid fa-arrow-down-to-line"></i>
							</a>
						</li>
					`;
				});
				html += '</ul></div>';
			});

			listEl.innerHTML = visibleTotal
				? html
				: `<div class="ir-empty-state">No documents match "${escapeHTML(searchEl.value.trim())}".</div>`;
		}

		sidebarEl.addEventListener('click', (e) => {
			const btn = e.target.closest('.ir-sidebar-item');
			if (!btn) return;
			activeId = btn.dataset.id;
			searchEl.value = '';
			renderSidebar();
			renderContent();
		});

		searchEl.addEventListener('input', renderContent);

		try {
			const res = await fetch(`${API_BASE}/tabs`);
			if (!res.ok) throw new Error('Request failed');
			investorData = await res.json();
		} catch (err) {
			listEl.innerHTML = '<div class="ir-empty-state">Unable to load investor documents right now. Please try again later.</div>';
			return;
		}

		if (investorData.length) {
			activeId = investorData[0].id;
		}

		renderSidebar();
		renderContent();
	});
	
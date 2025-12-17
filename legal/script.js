document.addEventListener('DOMContentLoaded', async () => {
    const state = {
        products: {},
        currentProduct: 'thinkpoint',
        currentSection: 'privacy'
    };

    const ui = {
        productSelect: document.getElementById('product-select'),
        navLinks: document.querySelectorAll('.nav-links a'),
        container: document.getElementById('legal-doc-container'),
        pageTitle: document.getElementById('page-title')
    };

    // 1. Load Manifest (with fallback for local/offline testing)
    const fallbackManifest = {
        "products": {
            "thinkpoint": {
                "name": "ThinkPoint (Global)",
                "sections": [
                    { "id": "privacy", "title": "Privacy Policy", "files": ["global_privacy.md"] },
                    { "id": "terms", "title": "Terms of Service", "files": ["global_terms.md"] }
                ]
            },
            "copoint": {
                "name": "Copoint",
                "sections": [
                    { "id": "privacy", "title": "Privacy Policy", "files": ["global_privacy.md", "copoint_special.md"] },
                    { "id": "terms", "title": "Terms of Service", "files": ["global_terms.md", "copoint_terms.md"] }
                ]
            }
        }
    };

    try {
        const response = await fetch('content/manifest.json');
        if (!response.ok) throw new Error("Manifest not found");
        const manifest = await response.json();
        state.products = manifest.products;
    } catch (e) {
        console.warn("Failed to load manifest via fetch (likely CORS or offline). Using fallback.", e);
        state.products = fallbackManifest.products;
    }

    // 2. Initialize Product Selector
    initProductSelector();

    // 3. Parse URL Params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('product') && state.products[urlParams.get('product')]) {
        state.currentProduct = urlParams.get('product');
        ui.productSelect.value = state.currentProduct;
    }

    if (urlParams.has('section')) {
        state.currentSection = urlParams.get('section');
        // Update active class on nav
        ui.navLinks.forEach(l => {
            l.classList.remove('active');
            if (l.getAttribute('data-section') === state.currentSection) {
                l.classList.add('active');
            }
        });
    }

    // 4. Initial Render
    await renderContent();

    // --- Event Listeners ---

    // Product Change
    ui.productSelect.addEventListener('change', (e) => {
        state.currentProduct = e.target.value;
        updateURL();
        renderContent();
    });

    // Mobile Menu Toggle
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.querySelector('.sidebar');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            sidebar.classList.toggle('menu-open');
            // Rotate icon or change path if desired, keep simple for now
        });
    }

    // Nav Click
    ui.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = e.target.getAttribute('data-section');
            if (!section) return; // Ignore non-section links

            // Close mobile menu on selection
            if (sidebar.classList.contains('menu-open')) {
                sidebar.classList.remove('menu-open');
            }

            // Remove active class from all
            ui.navLinks.forEach(l => l.classList.remove('active'));
            // Add to clicked
            e.target.classList.add('active');

            state.currentSection = section;
            updateURL();
            renderContent();
        });
    });

    // --- Core Functions ---

    function initProductSelector() {
        ui.productSelect.innerHTML = '';
        Object.keys(state.products).forEach(key => {
            const product = state.products[key];
            const option = document.createElement('option');
            option.value = key;
            option.textContent = product.name;
            ui.productSelect.appendChild(option);
        });
        ui.productSelect.value = state.currentProduct;
    }

    function updateURL() {
        const url = new URL(window.location);
        url.searchParams.set('product', state.currentProduct);
        url.searchParams.set('section', state.currentSection);
        window.history.pushState({}, '', url);
    }

    function generateTOC() {
        // Find all H2s in the rendered container
        const headers = ui.container.querySelectorAll('h2');
        if (headers.length === 0) return;

        // Create TOC Container if not exists (or clear it)
        let tocContainer = document.getElementById('toc-sidebar');
        if (!tocContainer) {
            tocContainer = document.createElement('div');
            tocContainer.id = 'toc-sidebar';
            tocContainer.className = 'toc-sidebar';
            // Insert after main content or append to layout
            // For this layout, let's append to .legal-layout and use order/css to position
            document.querySelector('.legal-layout').appendChild(tocContainer);
        }

        let tocHtml = `<h3>On this page</h3><ul>`;
        headers.forEach((header, index) => {
            // Ensure ID
            if (!header.id) header.id = `section-${index}`;
            tocHtml += `<li><a href="#${header.id}">${header.textContent}</a></li>`;
        });
        tocHtml += `</ul>`;

        tocContainer.innerHTML = tocHtml;

        // Add smooth scroll behavior to TOC links
        tocContainer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetEl = document.getElementById(targetId);
                if (targetEl) {
                    window.scrollTo({
                        top: targetEl.offsetTop - 100, // Offset for header/margin
                        behavior: 'smooth'
                    });
                }
            });
        });
    }


    async function renderContent() {
        ui.container.style.opacity = '0.5';

        if (!state.products[state.currentProduct]) {
            ui.container.innerHTML = `<p>Product data not loaded.</p>`;
            return;
        }

        const productData = state.products[state.currentProduct];
        const sectionData = productData.sections.find(s => s.id === state.currentSection);

        if (!sectionData) {
            ui.pageTitle.textContent = "Not Found";
            ui.container.innerHTML = `<p>This section is not available for ${productData.name}.</p>`;
            ui.container.style.opacity = '1';
            return;
        }

        ui.pageTitle.textContent = sectionData.title;

        // Fetch all files for this section
        try {
            const filePromises = sectionData.files.map(filename => fetch(`content/${filename}`).then(res => res.text()));
            const filesContent = await Promise.all(filePromises); // Array of markdown strings

            // Stitch content
            let completeMarkdown = "";
            filesContent.forEach((content, index) => {
                completeMarkdown += content + "\n\n---\n\n";
            });

            // Custom Renderer for Marked to handle Summary Boxes
            const renderer = new marked.Renderer();

            // Override blockquote to check for "Summary:" prefix
            renderer.blockquote = function (token) {
                // marked v4+ passes a token object or string depending; 
                // but standard renderer.blockquote(quote) receives the compiled HTML string of the quote in older versions 
                // or token.text in newer. Let's assume standard behavior or parse the raw string.

                // For simplicity with the CDN version used:
                let text = token.text || token;

                // Check if it starts with strong tag "Summary" or just text
                // Adjust regex based on how marked parses `> **Summary:**`
                // Usually rendered as <p><strong>Summary:</strong> ...</p> inside the quote

                if (text.includes("Summary:")) {
                    // Strip the "Summary:" part for display
                    const cleanText = text.replace(/<[^>]*>?/gm, "") // Remove HTML tags
                        .replace(/^Summary:\s*/i, "")
                        .replace(/^Key Takeaway:\s*/i, "");

                    return `
                        <div class="summary-box">
                            <div class="summary-title">Summary</div>
                            <p class="summary-text">${cleanText}</p>
                        </div>
                    `;
                }
                return `<blockquote>${text}</blockquote>`;
            };

            marked.use({ renderer });

            // Convert to HTML
            let htmlContent = marked.parse(completeMarkdown);

            ui.container.innerHTML = htmlContent;

            // Generate Table of Contents from new content
            generateTOC();

        } catch (e) {
            console.error("Error fetching content", e);
            ui.container.innerHTML = "<p>Error loading content files.</p>";
        }

        ui.container.style.opacity = '1';
    }

    // Handle Archive Section specifically
    function renderArchive() {
        ui.pageTitle.textContent = "Version Archive";
        ui.container.innerHTML = `
            <div class="archive-list">
                <div class="archive-item">
                    <h3>May 1, 2024 (Current)</h3>
                    <p>Major update for Copoint compliance.</p>
                    <button disabled>Viewing</button>
                </div>
                <div class="archive-item" style="opacity: 0.6">
                    <h3>January 1, 2023</h3>
                    <p>Initial release of ThinkPoint Terms.</p>
                    <button onclick="alert('Restore logic would go here')">View</button>
                    <button onclick="alert('Diff logic would go here')">Compare</button>
                </div>
            </div>
            <style>
                .archive-item {
                    border: 1px solid var(--border-color);
                    padding: 24px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
                .archive-item h3 { margin-top: 0 !important; font-size: 18px !important; }
                .archive-item button {
                    margin-top: 12px;
                    padding: 8px 16px;
                    margin-right: 8px;
                    cursor: pointer;
                    background: transparent;
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                }
                .archive-item button:hover { background: #f1f3f4; }
            </style>
        `;
    }

    // Modified render logic to catch 'archive'
    const originalRender = renderContent;
    renderContent = async function () {
        if (state.currentSection === 'archive') {
            renderArchive();
            return;
        }
        await originalRender();
    }

});

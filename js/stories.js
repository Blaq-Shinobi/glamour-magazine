/* =====================================================================
   GLAMOUR — shared story data + rendering
   Every page (index, the 10 category pages, article.html) includes this
   file (after supabase-js and js/supabase-config.js). It reads/writes
   the `stories` table in Supabase and renders the right content for
   whichever page it's running on. All visitors read the same live data.
   ===================================================================== */

/* ---------- data loading ---------- */

function rowToStory(row) {
    return {
        id: row.id,
        category: row.category,
        categorySlug: row.category_slug,
        title: row.title,
        excerpt: row.excerpt,
        author: row.author,
        authorBio: row.author_bio,
        authorImage: row.author_image,
        image: row.image,
        imageCaption: row.image_caption,
        date: row.story_date,
        tags: row.tags || [],
        featured: row.featured,
        homepageLatest: row.homepage_latest,
        pullQuote: row.pull_quote,
        body: row.body || [],
    };
}

function storyToRow(story) {
    return {
        id: story.id,
        category: story.category,
        category_slug: story.categorySlug,
        title: story.title,
        excerpt: story.excerpt,
        author: story.author,
        author_bio: story.authorBio,
        author_image: story.authorImage,
        image: story.image,
        image_caption: story.imageCaption,
        story_date: story.date,
        tags: story.tags,
        featured: story.featured,
        homepage_latest: story.homepageLatest,
        pull_quote: story.pullQuote,
        body: story.body,
    };
}

function slugify(text) {
    return String(text)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 60) || 'story';
}

async function loadStories() {
    if (!supabaseClient) {
        throw new Error('Supabase is not configured yet — fill in js/supabase-config.js with your project URL and anon key.');
    }
    const { data, error } = await supabaseClient.from('stories').select('*');
    if (error) throw error;
    return data.map(rowToStory);
}

function showLoadError(err) {
    console.error(err);
    const main = document.querySelector('main');
    if (!main) return;
    const banner = document.createElement('div');
    banner.className = 'max-w-3xl mx-auto mb-8 p-4 rounded-sm bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm';
    banner.textContent = 'Could not load stories: ' + (err && err.message ? err.message : err);
    main.prepend(banner);
}

/* ---------- small helpers ---------- */

function escapeHtml(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function sortByDateDesc(stories) {
    return [...stories].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/* ---------- card templates (markup matches the site's existing classes) ---------- */

function gridCardHTML(story, hidden) {
    const hiddenClass = hidden ? ' hidden-article hidden' : '';
    return `<article class="group cursor-pointer${hiddenClass}"><a href="article.html?id=${encodeURIComponent(story.id)}" class="block"><div class="overflow-hidden mb-3 bg-gray-100 dark:bg-gray-900"><img src="${escapeHtml(story.image)}" class="w-full h-64 object-contain transform group-hover:scale-105 transition duration-500"></div><span class="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">${escapeHtml(story.category)}</span><h3 class="serif text-xl font-semibold mt-1 mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition dark:text-white">${escapeHtml(story.title)}</h3><p class="text-sm text-gray-500 dark:text-gray-500">By ${escapeHtml(story.author)}</p></a></article>`;
}

function heroCardHTML(story) {
    return `<div class="lg:col-span-8 group cursor-pointer"><a href="article.html?id=${encodeURIComponent(story.id)}" class="block"><div class="relative overflow-hidden mb-4 bg-gray-100 dark:bg-gray-900"><img src="${escapeHtml(story.image)}" alt="${escapeHtml(story.title)}" class="w-full h-[500px] object-contain transform group-hover:scale-105 transition duration-500"><span class="absolute top-4 left-4 bg-white text-black text-xs font-bold px-3 py-1 uppercase tracking-wider dark:bg-gray-900 dark:text-white">${escapeHtml(story.category)}</span></div><h2 class="serif text-3xl md:text-5xl font-bold leading-tight mb-3 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition dark:text-white">${escapeHtml(story.title)}</h2><p class="text-gray-600 dark:text-gray-400 text-lg mb-2 line-clamp-2">${escapeHtml(story.excerpt)}</p><p class="text-sm font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wide">By ${escapeHtml(story.author)}</p></a></div>`;
}

function sideCardHTML(story, withBorder) {
    const borderClass = withBorder ? ' border-b border-gray-200 dark:border-gray-800 pb-6' : '';
    return `<article class="group cursor-pointer${borderClass}"><a href="article.html?id=${encodeURIComponent(story.id)}" class="block"><span class="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider">${escapeHtml(story.category)}</span><h3 class="serif text-2xl font-semibold mt-1 mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition dark:text-white">${escapeHtml(story.title)}</h3><p class="text-sm text-gray-500 dark:text-gray-500">By ${escapeHtml(story.author)}</p></a></article>`;
}

/* ---------- page renderers ---------- */

async function renderHomepage() {
    const all = await loadStories();
    const featured = sortByDateDesc(all.filter(s => s.featured));
    const latest = sortByDateDesc(all.filter(s => s.homepageLatest));
    const allSorted = sortByDateDesc(all);

    const heroContainer = document.getElementById('hero-story');
    const sideContainer = document.getElementById('side-stories');
    const latestContainer = document.getElementById('latest-grid');
    const viewAllBtn = document.getElementById('view-all-latest-btn');

    if (heroContainer) {
        heroContainer.innerHTML = featured[0] ? heroCardHTML(featured[0]) : '';
    }
    if (sideContainer) {
        const sides = featured.slice(1, 4);
        sideContainer.innerHTML = sides.map((s, i) => sideCardHTML(s, i < sides.length - 1)).join('');
    }
    if (latestContainer) {
        const items = latest.length ? latest.slice(0, 3) : allSorted.slice(0, 3);
        latestContainer.innerHTML = items.map(s => gridCardHTML(s, false)).join('');
    }
    if (viewAllBtn && latestContainer) {
        if (allSorted.length <= 3) {
            viewAllBtn.classList.add('hidden');
        } else {
            viewAllBtn.addEventListener('click', (e) => {
                e.preventDefault();
                latestContainer.innerHTML = allSorted.map(s => gridCardHTML(s, false)).join('');
                viewAllBtn.classList.add('hidden');
            });
        }
    }

    const galleryContainer = document.getElementById('cover-gallery');
    if (galleryContainer) {
        const covers = await loadCovers();
        galleryContainer.innerHTML = covers.length
            ? covers.map(coverCardHTML).join('')
            : `<p class="col-span-full text-center text-gray-400 dark:text-gray-500 py-8 text-sm">No covers yet — add some from the admin dashboard.</p>`;
    }
}

async function renderCategoryPage(slug) {
    const all = await loadStories();
    const stories = sortByDateDesc(all.filter(s => s.categorySlug === slug));
    const grid = document.getElementById('story-grid');
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (!grid) return;

    if (stories.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-gray-500 dark:text-gray-400 py-12">No stories in this category yet.</p>`;
        if (loadMoreBtn) loadMoreBtn.classList.add('hidden');
        return;
    }

    grid.innerHTML = stories.map((s, i) => gridCardHTML(s, i >= 3)).join('');
    if (loadMoreBtn && stories.length <= 3) loadMoreBtn.classList.add('hidden');
}

async function renderArticlePage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const all = await loadStories();
    const story = id ? all.find(s => s.id === id) : sortByDateDesc(all)[0];

    if (!story) {
        const main = document.querySelector('main');
        if (main) main.innerHTML = `<div class="text-center py-24"><h1 class="serif text-3xl font-bold mb-4 dark:text-white">Story not found</h1><a href="index.html" class="text-pink-600 dark:text-pink-400 hover:underline">Back to home</a></div>`;
        return;
    }

    const authors = await loadAuthors();
    const authorRecord = authors.find(a => a.name === story.author);
    const authorBio = authorRecord ? authorRecord.bio : story.authorBio;
    const authorImage = authorRecord ? authorRecord.image : story.authorImage;

    document.title = `${story.title} | GLAMOUR`;

    const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    const setAttr = (id, attr, value) => { const el = document.getElementById(id); if (el) el.setAttribute(attr, value); };

    const breadcrumbCat = document.getElementById('breadcrumb-category');
    if (breadcrumbCat) {
        breadcrumbCat.textContent = story.category;
        breadcrumbCat.setAttribute('href', `${story.categorySlug}.html`);
    }
    set('breadcrumb-title', story.title);
    set('article-eyebrow', `${story.category} Feature`);
    set('article-title', story.title);
    set('article-excerpt', story.excerpt);

    const authorLink = document.getElementById('article-author-link');
    if (authorLink) {
        authorLink.textContent = `By ${story.author}`;
        authorLink.href = `author.html?name=${encodeURIComponent(story.author)}`;
    }
    if (authorImage) setAttr('article-author-avatar', 'src', authorImage);
    set('article-date', formatDate(story.date));

    if (story.image) {
        setAttr('article-hero-img', 'src', story.image);
        setAttr('article-hero-img', 'alt', story.title);
    }
    const caption = document.getElementById('article-caption');
    if (caption) {
        if (story.imageCaption) { caption.textContent = story.imageCaption; caption.classList.remove('hidden'); }
        else { caption.classList.add('hidden'); }
    }

    const contentEl = document.getElementById('article-content');
    if (contentEl) {
        const paras = (story.body && story.body.length) ? story.body : [''];
        const imageLineRe = /^!\[([^\]]*)\]\((\S+)\)$/;
        let html = '';
        let textParaCount = 0;
        paras.forEach((para, i) => {
            const imgMatch = para.trim().match(imageLineRe);
            if (imgMatch) {
                const caption = imgMatch[1];
                const url = imgMatch[2];
                html += `<figure class="my-8"><img src="${escapeHtml(url)}" alt="${escapeHtml(caption)}" class="w-full h-auto rounded-sm">${caption ? `<figcaption class="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center italic">${escapeHtml(caption)}</figcaption>` : ''}</figure>`;
            } else {
                const cls = textParaCount === 0
                    ? 'drop-cap text-lg leading-relaxed mb-6'
                    : 'text-lg leading-relaxed mb-6';
                html += `<p class="${cls}">${escapeHtml(para)}</p>`;
                textParaCount++;
            }
            if (i === 1 && story.pullQuote) {
                html += `<blockquote class="pull-quote">"${escapeHtml(story.pullQuote)}"</blockquote>`;
            }
        });
        if (paras.length < 2 && story.pullQuote) {
            html += `<blockquote class="pull-quote">"${escapeHtml(story.pullQuote)}"</blockquote>`;
        }
        contentEl.innerHTML = html;

        const readTimeSpan = document.getElementById('read-time');
        if (readTimeSpan) {
            const wordCount = contentEl.innerText.trim().split(/\s+/).filter(Boolean).length;
            readTimeSpan.innerText = Math.max(1, Math.ceil(wordCount / 200)) + ' min read';
        }
    }

    const tagsEl = document.getElementById('article-tags');
    if (tagsEl) {
        tagsEl.innerHTML = (story.tags || []).map(t =>
            `<span class="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-semibold rounded-full text-gray-700 dark:text-gray-300">#${escapeHtml(t)}</span>`
        ).join('');
    }

    set('author-box-name', `About ${story.author}`);
    const bioEl = document.getElementById('author-box-bio');
    if (bioEl) bioEl.textContent = authorBio || '';
    if (authorImage) {
        setAttr('author-box-img', 'src', authorImage);
        setAttr('author-box-img', 'alt', story.author);
    }
    const authorBoxLink = document.getElementById('author-box-link');
    if (authorBoxLink) authorBoxLink.href = `author.html?name=${encodeURIComponent(story.author)}`;

    const keepReadingGrid = document.getElementById('keep-reading-grid');
    if (keepReadingGrid) {
        const sameCategory = all.filter(s => s.id !== story.id && s.categorySlug === story.categorySlug);
        const others = all.filter(s => s.id !== story.id && s.categorySlug !== story.categorySlug);
        const related = sortByDateDesc(sameCategory).concat(sortByDateDesc(others)).slice(0, 3);
        keepReadingGrid.innerHTML = related.map(s => gridCardHTML(s, false)).join('');
    }
}

/* ---------- header auth nav (Log In / Log Out) ---------- */

function initAuthNav() {
    const loginLink = document.getElementById('auth-login-link');
    const loggedInSlot = document.getElementById('auth-loggedin-slot');
    const emailEl = document.getElementById('auth-user-email');
    const logoutBtn = document.getElementById('auth-logout-btn');
    const manageLink = document.getElementById('manage-magazine-link');
    if (!loginLink || !loggedInSlot || !supabaseClient) return;

    async function render(session) {
        if (session) {
            loginLink.classList.add('hidden');
            loggedInSlot.classList.remove('hidden');
            loggedInSlot.classList.add('flex');
            if (emailEl) emailEl.textContent = session.user.email;

            if (manageLink) {
                const { data, error } = await supabaseClient
                    .from('admins')
                    .select('user_id')
                    .eq('user_id', session.user.id)
                    .maybeSingle();
                manageLink.classList.toggle('hidden', !(!error && data));
            }
        } else {
            loginLink.classList.remove('hidden');
            loggedInSlot.classList.add('hidden');
            loggedInSlot.classList.remove('flex');
            if (manageLink) manageLink.classList.add('hidden');
        }
    }

    supabaseClient.auth.getSession().then(({ data: { session } }) => render(session));
    supabaseClient.auth.onAuthStateChange((_event, session) => render(session));

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await supabaseClient.auth.signOut();
            window.location.href = 'index.html';
        });
    }
}

async function loadAuthors() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('authors').select('*');
    if (error) { console.error(error); return []; }
    return data;
}

async function loadCovers() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('covers').select('*').order('issue_date', { ascending: false });
    if (error) { console.error(error); return []; }
    return data;
}

/* ---------- About page: content + team ---------- */

async function loadAboutContent() {
    if (!supabaseClient) return null;
    const { data, error } = await supabaseClient.from('about_content').select('*').eq('id', 'about').maybeSingle();
    if (error) { console.error(error); return null; }
    return data;
}

async function loadTeam() {
    if (!supabaseClient) return [];
    const { data, error } = await supabaseClient.from('team_members').select('*').order('sort_order', { ascending: true });
    if (error) { console.error(error); return []; }
    return data;
}

function teamCardHTML(member) {
    const img = member.image || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80';
    return `<div class="text-center">
        <img src="${escapeHtml(img)}" alt="${escapeHtml(member.name)}" class="w-28 h-28 rounded-full object-cover mx-auto mb-4 bg-gray-100 dark:bg-gray-800">
        <h3 class="serif text-lg font-bold text-black dark:text-white">${escapeHtml(member.name)}</h3>
        <p class="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-2">${escapeHtml(member.role || '')}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400">${escapeHtml(member.bio || '')}</p>
    </div>`;
}

async function renderAboutPage() {
    const [content, team] = await Promise.all([loadAboutContent(), loadTeam()]);

    if (content) {
        document.title = `${content.title} | GLAMOUR+ West Africa`;
        const titleEl = document.getElementById('about-title');
        const subtitleEl = document.getElementById('about-subtitle');
        const introEl = document.getElementById('about-intro');
        const contactHeadingEl = document.getElementById('about-contact-heading');
        const contactTextEl = document.getElementById('about-contact-text');
        if (titleEl) titleEl.textContent = content.title;
        if (subtitleEl) subtitleEl.textContent = content.subtitle;
        if (introEl) introEl.innerHTML = (content.intro || []).map(p => `<p>${escapeHtml(p)}</p>`).join('');
        if (contactHeadingEl) contactHeadingEl.textContent = content.contact_heading;
        if (contactTextEl) contactTextEl.textContent = content.contact_text;
    }

    const teamGrid = document.getElementById('team-grid');
    const teamSection = document.getElementById('team-section');
    if (teamGrid) {
        if (team.length) {
            teamGrid.innerHTML = team.map(teamCardHTML).join('');
        } else if (teamSection) {
            teamSection.classList.add('hidden');
        }
    }
}

function coverCardHTML(cover) {
    return `<button type="button" class="lightbox-trigger group block w-full text-left bg-gray-100 dark:bg-gray-900 overflow-hidden cursor-zoom-in" data-full="${escapeHtml(cover.image)}" data-caption="${escapeHtml(cover.title)}">
        <img src="${escapeHtml(cover.image)}" alt="${escapeHtml(cover.title)}" class="w-full h-auto object-contain transform group-hover:scale-105 transition duration-500">
    </button>`;
}

/* ---------- shared lightbox (works for images added dynamically, e.g. the cover gallery) ---------- */

function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const closeLightbox = document.getElementById('close-lightbox');
    if (!lightbox || !lightboxImg) return;

    function show(src) {
        lightboxImg.src = src;
        lightbox.classList.remove('hidden');
        setTimeout(() => { lightbox.classList.remove('opacity-0'); lightboxImg.classList.remove('scale-95'); lightboxImg.classList.add('scale-100'); }, 10);
    }
    function hide() {
        lightbox.classList.add('opacity-0');
        lightboxImg.classList.remove('scale-100');
        lightboxImg.classList.add('scale-95');
        setTimeout(() => { lightbox.classList.add('hidden'); }, 300);
    }

    // Event delegation so this also works for elements added after page load.
    document.body.addEventListener('click', (e) => {
        const trigger = e.target.closest('.lightbox-trigger');
        if (trigger) {
            const full = trigger.dataset.full || trigger.src;
            if (full) show(full);
        }
    });
    if (closeLightbox) closeLightbox.addEventListener('click', hide);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) hide(); });
}

async function renderAuthorPage() {
    const params = new URLSearchParams(window.location.search);
    const authorName = params.get('name');
    const all = await loadStories();
    const authors = await loadAuthors();
    const authorStories = sortByDateDesc(all.filter(s => s.author === authorName));
    const authorRecord = authors.find(a => a.name === authorName);

    const nameEl = document.getElementById('author-page-name');
    const bioEl = document.getElementById('author-page-bio');
    const imgEl = document.getElementById('author-page-img');
    const countEl = document.getElementById('author-page-count');
    const gridEl = document.getElementById('author-story-grid');

    if (!authorName || (authorStories.length === 0 && !authorRecord)) {
        if (nameEl) nameEl.textContent = authorName || 'Author not found';
        if (countEl) countEl.textContent = '';
        if (bioEl) bioEl.textContent = 'No published stories found for this author yet.';
        if (gridEl) gridEl.innerHTML = '';
        return;
    }

    const latestStory = authorStories[0];
    const bio = authorRecord ? authorRecord.bio : (latestStory ? latestStory.authorBio : '');
    const image = authorRecord ? authorRecord.image : (latestStory ? latestStory.authorImage : '');

    document.title = `${authorName} | GLAMOUR+ West Africa`;
    if (nameEl) nameEl.textContent = authorName;
    if (bioEl) bioEl.textContent = bio || '';
    if (imgEl && image) imgEl.src = image;
    if (countEl) countEl.textContent = `${authorStories.length} ${authorStories.length === 1 ? 'story' : 'stories'}`;
    if (gridEl) gridEl.innerHTML = authorStories.map(s => gridCardHTML(s, false)).join('');
}

/* ---------- bootstrap: figure out which page we're on ---------- */

document.addEventListener('DOMContentLoaded', () => {
    initAuthNav();
    initLightbox();
    let renderPromise = null;
    if (document.getElementById('hero-story') || document.getElementById('latest-grid')) {
        renderPromise = renderHomepage();
    } else if (document.getElementById('story-grid')) {
        renderPromise = renderCategoryPage(document.getElementById('story-grid').dataset.category);
    } else if (document.getElementById('article-content')) {
        renderPromise = renderArticlePage();
    } else if (document.getElementById('author-page-name')) {
        renderPromise = renderAuthorPage();
    } else if (document.getElementById('about-title')) {
        renderPromise = renderAboutPage();
    }
    if (renderPromise) renderPromise.catch(showLoadError);
});

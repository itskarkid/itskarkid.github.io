// Escape untrusted text before it is placed in an HTML template.
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsArg = v => esc(JSON.stringify(String(v)));
    let bioMarkdownSource = '';

    let bioTexts = {
      short: '',
      medium: '',
      long: ''
    };

    const bioReadTimes = {
      short: '~15 sec read',
      medium: '~1 min read',
      long: '~3 min read'
    };

    let activeBioLength = 'short';

    // PARSE & RENDER BIO MARKDOWN
    function parseAndRenderBioMarkdown(md) {
      bioMarkdownSource = md;
      let cleanMd = md;

      // 1. Parse Frontmatter
      const fmMatch = md.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
      if (fmMatch) {
        cleanMd = md.slice(fmMatch[0].length);
        const fmLines = fmMatch[1].split('\n');
        const fm = {};
        fmLines.forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim().toLowerCase();
            const val = parts.slice(1).join(':').trim().replace(/^['"](.*)['"]$/, '$1');
            fm[key] = val;
          }
        });

        if (fm.name) document.getElementById('homeName').textContent = fm.name;
        if (fm.handle) document.getElementById('homeHandle').textContent = fm.handle;
        if (fm.role) document.getElementById('homeRole').textContent = fm.role;
        if (fm.headline) document.getElementById('homeHeadline').textContent = fm.headline;
        if (fm.email) {
          const lbl = document.getElementById('emailDisplayLabel');
          if (lbl) lbl.textContent = fm.email;
        }
        configureLocationTheme(fm);
      }

      // 2. Extract Sections by ##
      const sections = cleanMd.split(/(?=^##\s+)/gm);
      sections.forEach(sec => {
        const trimmed = sec.trim();
        if (!trimmed) return;
        const match = trimmed.match(/^##\s+(.+)$/m);
        if (!match) return;
        const heading = match[1].trim().toLowerCase();
        const content = trimmed.replace(/^##\s+.+$/m, '').trim();

        if (heading.includes('short')) {
          bioTexts.short = renderMarkdown(content);
        } else if (heading.includes('medium')) {
          bioTexts.medium = renderMarkdown(content);
        } else if (heading.includes('long')) {
          bioTexts.long = renderMarkdown(content);
        } else if (heading.includes('clusters')) {
          // Parse dynamic clusters from bio.md
          const clusterLines = content.split('\n').filter(l => l.trim().startsWith('*') || l.trim().startsWith('-'));
          if (clusterLines.length > 0) {
            const clusterGrid = document.getElementById('homeClustersGrid');
            if (clusterGrid) {
              clusterGrid.replaceChildren(...clusterLines.map(line => {
                const cleanLine = line.replace(/^[\*\-]\s+/, '').trim();
                const legacy = cleanLine.match(/^\[\[([^\]]+)\]\]\s*\|\s*([^|]+)\|\s*(.*)$/);
                const body = legacy ? legacy[3] : cleanLine;
                const label = body.match(/^\*\*(.*?)\*\*:?[ \t]*(.*)$/);
                const separator = body.indexOf(':');
                const title = label ? label[1].replace(/:$/, '') : (separator < 0 ? body : body.slice(0, separator)).trim();
                const desc = label ? label[2] : (separator < 0 ? '' : body.slice(separator + 1).trim());
                const card = document.createElement(legacy ? 'button' : 'div');
                card.className = 'cluster-card';
                if (legacy) {
                  card.type = 'button';
                  card.addEventListener('click', () => {
                    const target = resolveNoteLink(legacy[1]);
                    if (target) openNoteInGarden(target.id);
                  });
                  const tag = document.createElement('div');
                  tag.className = 'cluster-tag';
                  tag.textContent = legacy[2].trim();
                  card.append(tag);
                }
                const heading = document.createElement('div');
                heading.className = 'cluster-title';
                heading.textContent = title;
                const description = document.createElement('div');
                description.innerHTML = renderMarkdown(desc);
                const emblem = document.createElement('span');
                emblem.className = 'lrg-card-icon';
                emblem.innerHTML = lrgIcon(lrgTopicIcon(title));
                card.append(emblem, heading, description);
                return card;
              }));
            }
          }
        } else if (heading.includes('now snapshot')) {
          // Parse bullets into 3 items
          const lines = content.split('\n').filter(l => l.trim().startsWith('*') || l.trim().startsWith('-'));
          if (lines.length > 0) {
            const grid = document.getElementById('homeNowGrid');
            if (grid) {
              grid.innerHTML = lines.map(l => {
                const raw = l.replace(/^[\*\-]\s+/, '').trim();
                const boldMatch = raw.match(/^\*\*(.*?)\*\*:?\s*(.*)$/);
                const title = boldMatch ? boldMatch[1].replace(/:$/, '') : 'Focus';
                const desc = boldMatch ? boldMatch[2] : raw;
                return `
                  <div class="now-subitem">
                    <span class="lrg-card-icon">${lrgIcon(lrgTopicIcon(title))}</span>
                    <div class="now-subitem-title">${esc(title)}</div>
                    <p>${parseWikilinks(desc)}</p>
                  </div>
                `;
              }).join('');
            }
          }
        }
      });

      setBioLength(activeBioLength);
      setupHoverTooltips();
    }

    async function fetchBioMarkdown() {
      try {
        const res = await fetch('./bio.md');
        if (!res.ok) throw new Error(`bio.md: HTTP ${res.status}`);
        parseAndRenderBioMarkdown(await res.text());
      } catch (err) {
        console.error('Unable to load bio.md', err);
        document.getElementById('bioTextContainer').textContent = 'Bio unavailable.';
      }
    }

    function setBioLength(len) {
      activeBioLength = len;
      document.querySelectorAll('.bio-length-btn').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(`bio-btn-${len}`);
      if (activeBtn) activeBtn.classList.add('active');

      const container = document.getElementById('bioTextContainer');
      if (container && bioTexts[len]) {
        container.innerHTML = bioTexts[len];
      }
      const timeLabel = document.getElementById('bioReadTime');
      if (timeLabel && bioReadTimes[len]) {
        timeLabel.textContent = bioReadTimes[len];
      }
      setupHoverTooltips();
    }

    // Clipboard Copy Helper for Email
    function copyEmailToClipboard(e) {
      if (e) e.preventDefault();
      const email = 'itskarkid@gmail.com';
      
      const tempInput = document.createElement('input');
      tempInput.style.position = 'absolute';
      tempInput.style.left = '-9999px';
      tempInput.value = email;
      document.body.appendChild(tempInput);
      tempInput.select();
      
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error('Copy fallback failed', err);
      }
      document.body.removeChild(tempInput);

      const toast = document.getElementById('copyToast');
      const toastMsg = document.getElementById('toastMessage');
      if (toast && toastMsg) {
        toastMsg.textContent = `Copied ${email} to clipboard!`;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        setTimeout(() => {
          toast.style.opacity = '0';
          toast.style.transform = 'translateX(-50%) translateY(20px)';
        }, 2200);
      }
    }

    const vault = {};

    async function fetchAllGardenNotes() {
      try {
        const response = await fetch('./notes_index.json');
        if (!response.ok) throw new Error(`Note index: HTTP ${response.status}`);
        const filenames = await response.json();
        if (!Array.isArray(filenames) || !filenames.every(filename => typeof filename === 'string')) {
          throw new Error('Note index must be an array of paths');
        }
        for (const filename of filenames) {
          try {
            const res = await fetch(`./notes/${filename}`);
            if (!res.ok) throw new Error(`${filename}: HTTP ${res.status}`);
            const raw = await res.text();
            const frontmatter = raw.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
            const parsedMetadata = frontmatter ? jsyaml.load(frontmatter[1], { schema: jsyaml.JSON_SCHEMA }) : {};
            const metadata = Object.fromEntries(Object.entries(parsedMetadata || {}).map(([key, value]) => [key.toLowerCase(), value]));
            if (metadata.publish === false || metadata.publish === 'false') continue;
            const content = (frontmatter ? raw.slice(frontmatter[0].length) : raw).trim();
            const id = filename.replace(/\.md$/i, '').toLowerCase();
            vault[id] = {
              id,
              title: metadata.title || filename.replace(/\.md$/i, ''),
              folder: metadata.folder || filename.split('/').slice(0, -1).join('/') || 'general',
              stage: metadata.stage || 'budding',
              confidence: metadata.confidence || 'Unspecified',
              lastTended: metadata.lasttended || metadata.updated || '',
              tags: Array.isArray(metadata.tags) ? metadata.tags : (metadata.tags ? [metadata.tags] : []),
              summary: metadata.summary || content.slice(0, 140),
              content
            };
          } catch (err) {
            console.error('Unable to load note', filename, err);
          }
        }
      } catch (err) {
        console.error('Unable to load note index', err);
      }
      activeNoteId = Object.keys(vault)[0] || null;
      renderSidebarNotes();
      gardenNotesReady = true;
      if (!activeNoteId) document.getElementById('noteTitle').textContent = 'No notes available';
      restorePageFromUrl();
    }

    // State
    let activeNoteId = null;
    let gardenNotesReady = false;
    const siteTitle = document.title;
    let currentStageFilter = 'all';
    let isRawMd = false;
    let isNowRawMd = false;

    let nowMarkdownSource = '';

    function writePageUrl(viewName) {
      const url = new URL(window.location.href);
      url.searchParams.delete('note');
      url.searchParams.delete('view');
      url.hash = '';
      if (viewName === 'garden' && activeNoteId) url.searchParams.set('note', activeNoteId);
      else if (viewName !== 'home') url.searchParams.set('view', viewName);
      if (url.href !== window.location.href) window.history.pushState(null, '', url.href);
    }

    function restorePageFromUrl() {
      if (!gardenNotesReady) return;
      const url = new URL(window.location.href);
      const noteId = url.searchParams.get('note');
      let viewName = url.searchParams.get('view');
      if (noteId) {
        if (Object.prototype.hasOwnProperty.call(vault, noteId)) {
          activeNoteId = noteId;
          viewName = 'garden';
        } else {
          url.searchParams.delete('note');
          url.searchParams.delete('view');
          window.history.replaceState(null, '', url.href);
          viewName = 'home';
        }
      }
      switchView(['garden', 'now'].includes(viewName) ? viewName : 'home', false);
    }

    window.addEventListener('popstate', restorePageFromUrl);


    // Consistent line icon system, shared by dynamic bio and /now cards.
    const lrgIcons = {
      network: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 5h10M6 7l5 10M18 7l-5 10"/>',
      eye: '<path d="M2 12c5-8 15-8 20 0-5 8-15 8-20 0Z"/><circle cx="12" cy="12" r="3"/>',
      cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/><rect x="10" y="10" width="4" height="4"/>',
      leaf: '<path d="M12 21v-8M12 16C5 16 3 11 4 6c5 0 8 4 8 10ZM12 13c0-6 3-9 8-9 0 6-2 9-8 9Z"/>',
      shield: '<path d="M12 2 20 5v6c0 5-4 8-8 11-4-3-8-6-8-11V5Z"/><path d="m9 12 2 2 4-4"/>',
      book: '<path d="M12 5C9 3 6 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1ZM12 5v15"/>'
    };
    function lrgIcon(kind) {
      return '<svg class="lrg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (lrgIcons[kind] || lrgIcons.leaf) + '</svg>';
    }
    function lrgTopicIcon(title) {
      const name = String(title).toLowerCase();
      if (/boundar|reading/.test(name)) return 'book';
      if (/bridge|architectur/.test(name)) return 'cpu';
      if (/laboratory|experiment|perception|vision|sensing/.test(name)) return 'eye';
      if (/autonomous|multi-agent|coordination|focus/.test(name)) return 'network';
      if (/trust|reliab|explain|privacy/.test(name)) return 'shield';
      if (/robot|building|scanning|engineering/.test(name)) return 'cpu';
      return 'leaf';
    }

    // NOW MARKDOWN CARD PARSER & RENDERER
    function parseAndRenderNowMarkdown(md) {
      nowMarkdownSource = md;
      const cardsContainer = document.getElementById('nowCardsContainer');
      const headerTitle = document.getElementById('nowHeaderTitle');
      const headerDesc = document.getElementById('nowHeaderDesc');
      const metaTag = document.getElementById('nowMetaTag');

      if (!cardsContainer) return;

      // 1. Parse Frontmatter if present
      let cleanMd = md;
      const frontmatterMatch = md.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---\s*[\r\n]+/);
      if (frontmatterMatch) {
        cleanMd = md.slice(frontmatterMatch[0].length);
        const fmLines = frontmatterMatch[1].split('\n');
        const fm = {};
        fmLines.forEach(line => {
          const parts = line.split(':');
          if (parts.length >= 2) {
            const key = parts[0].trim().toLowerCase();
            const val = parts.slice(1).join(':').trim();
            fm[key] = val;
          }
        });
        if (fm.title && headerTitle) headerTitle.textContent = fm.title;
        if (fm.subtitle && headerDesc) headerDesc.textContent = fm.subtitle;
        if (fm.updated && metaTag) metaTag.textContent = `/now · Updated ${fm.updated} · ${fm.location || 'Bristol Robotics Lab'}`;
      }

      // 2. Render compact source-derived summaries, expanding to unaltered full Markdown.
      // The full text is always rendered from now.md, never copied into the HTML template.
      const sections = cleanMd.split(/(?=^##\s+)/gm);
      const cards = [];
      sections.forEach((section) => {
        const trimmed = section.trim();
        const headingMatch = trimmed.match(/^##\s+(.+)$/m);
        if (!headingMatch) return;
        const cardTitle = headingMatch[1].trim();
        const bodyContent = trimmed.replace(/^##\s+.+$/m, '').trim();
        const items = bodyContent.split('\n').filter(line => /^\s*[-*]\s+/.test(line));
        // Extract the first two actual statements from this section; do not invent summaries.
        const summaryText = items.slice(0, 2).map(line => line
          .replace(/^\s*[-*]\s+/, '')
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/^([^:]{1,70}):\s*/, '')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .trim()).join(' · ');
        cards.push({ title:cardTitle, body:bodyContent, summary:summaryText });
      });
      const escapeNow = value => String(value).replace(/[&<>"']/g, char =>
        ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
      cardsContainer.replaceChildren(...cards.map((card, index) => {
        const section = document.createElement('section');
        section.className = 'now-card lrg-compact-card' + (index === 0 ? ' is-featured' : '') + (index === cards.length - 1 ? ' is-last' : '');
        const heading = document.createElement('div');
        heading.className = 'lrg-compact-heading';
        heading.innerHTML = `<span class="lrg-card-icon">${lrgIcon(lrgTopicIcon(card.title))}</span>`;
        const title = document.createElement('h3');
        title.textContent = card.title;
        heading.append(title);
        const summary = document.createElement('p');
        summary.className = 'lrg-compact-summary';
        summary.textContent = card.summary || 'Open the full section below.';
        const details = document.createElement('details');
        details.className = 'lrg-now-details';
        const toggle = document.createElement('summary');
        toggle.textContent = 'Read details';
        const body = document.createElement('div');
        body.className = 'prose lrg-workbench-prose';
        body.innerHTML = renderMarkdown(card.body);
        details.append(toggle, body);
        section.append(heading, summary, details);
        return section;
      }));
      setupHoverTooltips();
    }

    // Toggle raw / card view for Now page
    function toggleNowRawView() {
      isNowRawMd = !isNowRawMd;
      const rawBox = document.getElementById('nowRawBox');
      const cardsBox = document.getElementById('nowCardsContainer');
      const label = document.getElementById('nowRawToggleLabel');

      if (isNowRawMd) {
        rawBox.style.display = 'block';
        cardsBox.style.display = 'none';
        label.textContent = 'View Cards';
        rawBox.textContent = nowMarkdownSource;
      } else {
        rawBox.style.display = 'none';
        cardsBox.style.removeProperty('display');
        label.textContent = '</> Raw .md';
      }
    }

    async function fetchNowMarkdown() {
      try {
        const res = await fetch('./now.md');
        if (!res.ok) throw new Error(`now.md: HTTP ${res.status}`);
        parseAndRenderNowMarkdown(await res.text());
      } catch (err) {
        console.error('Unable to load now.md', err);
        document.getElementById('nowCardsContainer').textContent = 'Now unavailable.';
      }
    }

    // BARNABY: public-only, deterministic navigation assistant.
    // The published-note index is the sole source for note names and links.
    let barnabyPreviousFocus = null;
    function toggleTeddyChat() {
      const drawer = document.getElementById('teddyChatDrawer');
      const button = document.getElementById('teddyBtn');
      const opened = drawer.classList.toggle('open');
      drawer.setAttribute('aria-hidden', String(!opened));
      button.setAttribute('aria-expanded', String(opened));
      if (opened) {
        barnabyPreviousFocus = document.activeElement;
        dismissTeddyHint();
        document.getElementById('teddyInput').focus();
      } else {
        (barnabyPreviousFocus?.isConnected ? barnabyPreviousFocus : button).focus();
      }
    }

    function dismissTeddyHint(e) {
      if (e) e.stopPropagation();
      const hint = document.getElementById('teddyHint');
      if (hint) hint.style.display = 'none';
    }

    function askTeddyPrompt(question) {
      document.getElementById('teddyInput').value = question;
      sendTeddyMessage();
    }

    function barnabyBubble(role, text) {
      const bubble = document.createElement('div');
      bubble.className = `teddy-msg ${role}`;
      bubble.textContent = text;
      document.getElementById('teddyMessagesList').appendChild(bubble);
      return bubble;
    }

    function barnabyAction(parent, label, action) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'teddy-answer-action';
      button.textContent = label;
      button.addEventListener('click', () => {
        const drawer = document.getElementById('teddyChatDrawer');
        if (drawer.classList.contains('open')) toggleTeddyChat();
        action();
      });
      parent.appendChild(button);
    }

    function sendTeddyMessage() {
      const input = document.getElementById('teddyInput');
      const text = input.value.trim();
      if (!text) return;
      input.value = '';
      barnabyBubble('user', text);
      const lower = text.toLowerCase();
      const published = Object.values(vault).sort((a, b) => a.title.localeCompare(b.title));
      let answer = '';
      let actions = [];
      if (/private knowledge|my knowledge|sign in|login|log in|knowledge workspace/.test(lower)) {
        if (window.KnowledgeIntegration?.isConnected()) {
          answer = 'Your Google account is authorised. Open Knowledge to browse your folders and notes.';
          actions = [['Open Knowledge', () => switchView('knowledge')], ['Disconnect', () => window.KnowledgeIntegration.signOut()]];
        } else {
          answer = 'Knowledge lives in Google Drive. Google will ask for read-only Drive access; the Garden only browses your Knowledge folder and never publishes its files.';
          actions = [['Continue with Google', () => window.KnowledgeIntegration.login()]];
        }
      } else if (/seedling|budding|evergreen|growth|matur/.test(lower)) {
        answer = 'Seedling is an early idea, Budding is developing writing, and Evergreen is a more established note. These labels describe the maturity of published writing, not academic achievement.';
        actions = [['Browse notes', () => switchView('garden')]];
      } else if (/second thought|privacy|masking|personal information/.test(lower)) {
        const note = published.find(n => n.title.toLowerCase().includes('second thought'));
        answer = note ? `${note.title} explores human-controlled privacy and context-preserving masking in prompts to LLMs.` : 'I cannot find a published note on that topic in the current public index.';
        if (note) actions = [[`Read ${note.title}`, () => openNoteInGarden(note.id)]];
      } else if (/human singularity|singularity|creativity|discovery/.test(lower)) {
        const note = published.find(n => n.title.toLowerCase().includes('human singularity'));
        answer = note ? `${note.title} considers critical thinking and the value of discovery in a world increasingly shaped by AI.` : 'That note is not currently in the public Garden index.';
        if (note) actions = [[`Read ${note.title}`, () => openNoteInGarden(note.id)]];
      } else if (/notes|articles|garden|published|writing|read/.test(lower)) {
        answer = published.length ? `There ${published.length === 1 ? 'is' : 'are'} ${published.length} published ${published.length === 1 ? 'note' : 'notes'} in the Garden. Choose one below.` : 'The public Garden index has not loaded any notes yet.';
        actions = published.slice(0, 8).map(note => [note.title, () => openNoteInGarden(note.id)]);
        if (published.length > 8) actions.push(['Browse all published notes', () => switchView('garden')]);
      } else if (/now|current|doing|lab|experiment|project/.test(lower)) {
        answer = 'The Now page describes current MSc Robotics learning, laboratory experiments and developing research questions. It should not be read as a list of completed research results.';
        actions = [['Open /now', () => switchView('now')]];
      } else if (/robot|reinforcement|multi.agent|aoi|perception|research|bristol|learning/.test(lower)) {
        answer = 'Dheeraj is studying MSc Robotics at the University of Bristol. His developing interests include multi-agent autonomy, reinforcement learning, perception and the reliability of shared information.';
        actions = [['Current work', () => switchView('now')]];
      } else if (/about|bio|software|c\+\+|career|background|arden/.test(lower)) {
        answer = 'Dheeraj brings over a decade of C++ software engineering and computational geometry experience to his present robotics studies. The biography explains this transition.';
        actions = [['Read biography', () => switchView('home')]];
      } else {
        const titleMatch = published.find(n => lower.includes(n.title.toLowerCase()));
        if (titleMatch) {
          answer = `I found the public note “${titleMatch.title}”.`;
          actions = [[`Read ${titleMatch.title}`, () => openNoteInGarden(titleMatch.id)]];
        } else {
          answer = 'I am a scripted Garden guide, not a live AI assistant. I can help you find published notes or explore Dheeraj’s biography, robotics interests and current work.';
          actions = [['Browse published notes', () => switchView('garden')], ['Read /now', () => switchView('now')]];
        }
      }
      const bubble = barnabyBubble('companion', answer);
      if (actions.length) {
        const row = document.createElement('div');
        row.className = 'teddy-answer-actions';
        actions.forEach(([label, action]) => barnabyAction(row, label, action));
        bubble.appendChild(row);
      }
      const list = document.getElementById('teddyMessagesList');
      list.scrollTop = list.scrollHeight;
    }

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && document.getElementById('teddyChatDrawer').classList.contains('open')) {
        event.preventDefault();
        toggleTeddyChat();
      }
    });

    const themeLocation = {
      name: '',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hemisphere: 'northern'
    };

    function configureLocationTheme(metadata) {
      themeLocation.name = metadata.location || '';
      if (metadata.timezone) {
        try {
          new Intl.DateTimeFormat('en-GB', { timeZone: metadata.timezone });
          themeLocation.timeZone = metadata.timezone;
        } catch (err) {
          console.warn('Invalid bio timezone; keeping the current timezone.', err);
        }
      }
      if (metadata.hemisphere === 'northern' || metadata.hemisphere === 'southern') {
        themeLocation.hemisphere = metadata.hemisphere;
      }
      refreshLocationTheme();
    }

    function getLocationTime(date = new Date()) {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: themeLocation.timeZone,
        month: 'numeric',
        hour: 'numeric',
        hourCycle: 'h23'
      }).formatToParts(date);
      return {
        month: Number(parts.find(part => part.type === 'month').value) - 1,
        hour: Number(parts.find(part => part.type === 'hour').value)
      };
    }

    function getSeason(date = new Date()) {
      let month = getLocationTime(date).month;
      if (themeLocation.hemisphere === 'southern') month = (month + 6) % 12;
      if (month >= 2 && month <= 4) return 'spring';
      if (month >= 5 && month <= 7) return 'summer';
      if (month >= 8 && month <= 10) return 'autumn';
      return 'winter';
    }

    function getZoneState(date = new Date()) {
      const debug = new URLSearchParams(window.location.search).get('debug') === '1';
      const preview = document.getElementById('zonePreview').value;
      if (debug && ['Day', 'Night', 'Sleeping'].includes(preview)) return preview;
      const hour = getLocationTime(date).hour;
      if (hour >= 22 || hour < 6) return 'Sleeping';
      return hour < 18 ? 'Day' : 'Night';
    }

    let themeOverride = null;

    function getDefaultTheme(date = new Date()) {
      return getZoneState(date) === 'Day' ? 'light' : 'dark';
    }

    function toggleTheme() {
      const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      themeOverride = theme === getDefaultTheme() ? null : theme;
      refreshLocationTheme();
    }

    function updatePortraitState(date = new Date()) {
      const state = getZoneState(date);
      const sleeping = state === 'Sleeping';
      const portrait = document.getElementById('avatarSvgFallback');
      const frame = portrait.closest('.profile-avatar-frame');
      frame.setAttribute('data-theme', getDefaultTheme(date));
      frame.setAttribute('data-season', document.documentElement.getAttribute('data-season'));
      portrait.setAttribute('data-zone', state === 'Day' ? 'day' : 'night');
      portrait.setAttribute('data-sleeping', String(sleeping));
      portrait.setAttribute('aria-label', sleeping
        ? 'Dheeraj Karki is sleeping; window closed until 06:00 local time'
        : 'Seasonal cartoon portrait of Dheeraj Karki');
    }

    function applyDayNight(date = new Date()) {
      const theme = themeOverride ?? getDefaultTheme(date);
      const html = document.documentElement;
      html.setAttribute('data-theme', theme);
      html.classList.toggle('dark', theme === 'dark');
      const toggle = document.getElementById('themeToggle');
      toggle.setAttribute('aria-pressed', String(theme === 'light'));
      toggle.title = theme === 'light' ? 'Turn off the light' : 'Turn on the light';
      updateThemeLabel(date);
      updatePortraitState(date);
    }

    function applySeason() {
      const preview = document.getElementById('seasonPreview').value;
      const season = preview === 'auto' ? getSeason() : preview;
      document.documentElement.setAttribute('data-season', season);
      const names = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter', monsoon: 'Monsoon' };
      const icons = {
        spring: '<path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/>',
        summer: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
        autumn: '<path class="season-leaf" d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
        winter: '<line x1="2" x2="22" y1="12" y2="12"/><line x1="12" x2="12" y1="2" y2="22"/><path d="m20 16-4-4 4-4"/><path d="m4 8 4 4-4 4"/><path d="m16 4-4 4-4-4"/><path d="m8 20 4-4 4 4"/>',
        monsoon: '<path d="M5 12a7 7 0 0 1 14 0Z"/><path d="M12 12v6q0 3 3 1"/><path d="M5 17l-1 2M9 17l-1 2M19 17l-1 2"/>'
      };
      document.getElementById('seasonIcon').innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[season]}</svg>`;
      document.getElementById('companionSeason').textContent = names[season];
      document.getElementById('teddyBtn').title = `Chat with Barnaby (${names[season]})`;
      applyDayNight();
    }

    function refreshLocationTheme() {
      applySeason();
      drawGraph();
      if (document.getElementById('mobileDrawerGraphView').style.display === 'block') initMobileGraph();
    }

    function previewSeason() {
      refreshLocationTheme();
    }

    function updateThemeLabel(date = new Date()) {
      const state = getZoneState(date);
      const season = document.documentElement.getAttribute('data-season');
      document.getElementById('themeLabel').textContent = state;
      const status = document.getElementById('zoneStatus');
      const debugPreview = new URLSearchParams(window.location.search).get('debug') === '1'
        && document.getElementById('zonePreview').value !== 'auto';
      status.title = `${debugPreview ? 'Debug preview: ' : ''}${state}${themeLocation.name ? ' in ' + themeLocation.name : ''} (${themeLocation.timeZone}, ${season})`;
      status.setAttribute('aria-label', status.title);
    }

    function addSeasonalAccessories() {
      const artwork = `
        <ellipse cx="60" cy="106" rx="32" ry="18" fill="#9b7153"/>
        <circle cx="29" cy="36" r="17" fill="#a87957" stroke="#72503d" stroke-width="2"/>
        <circle cx="29" cy="36" r="10" fill="#d8aa8c"/>
        <circle cx="91" cy="36" r="17" fill="#a87957" stroke="#72503d" stroke-width="2"/>
        <circle cx="91" cy="36" r="10" fill="#d8aa8c"/>
        <ellipse cx="60" cy="65" rx="38" ry="33" fill="#bc9470" stroke="#72503d" stroke-width="2"/>
        <path d="M34 49Q42 36 55 38" stroke="#d8b896" stroke-width="4" stroke-linecap="round"/>
        <ellipse cx="60" cy="77" rx="17" ry="13" fill="#ecd0ac"/>
        <circle cx="46" cy="62" r="4.5" fill="#30251f"/>
        <circle cx="74" cy="62" r="4.5" fill="#30251f"/>
        <circle cx="44.5" cy="60.5" r="1.5" fill="#fff6e8"/>
        <circle cx="72.5" cy="60.5" r="1.5" fill="#fff6e8"/>
        <ellipse cx="36" cy="77" rx="6" ry="4" fill="#cc8e7c" opacity="0.65"/>
        <ellipse cx="84" cy="77" rx="6" ry="4" fill="#cc8e7c" opacity="0.65"/>
        <path d="M54 73Q60 69 66 73Q66 78 60 80Q54 78 54 73Z" fill="#443126"/>
        <path d="M60 80V84M52 84Q60 91 68 84" stroke="#443126" stroke-width="2.5" stroke-linecap="round"/>
        <g class="season-accessory spring">
          <path d="M32 95Q60 103 88 95L76 111L60 104L44 111Z" class="season-fabric" stroke="#547d62" stroke-width="2"/>
          <path d="M30 39Q58 22 89 38" stroke="#56795d" stroke-width="5" stroke-linecap="round"/>
          <path d="M35 31Q22 16 23 34Q27 42 35 37M80 30Q96 16 94 34Q89 42 82 37" fill="#72996f"/>
          <g fill="#edc9d8" stroke="#ad718e" stroke-width="1.5">
            <circle cx="45" cy="26" r="6"/><circle cx="38" cy="33" r="6"/>
            <circle cx="52" cy="33" r="6"/><circle cx="45" cy="39" r="6"/>
            <circle cx="78" cy="27" r="6"/><circle cx="71" cy="34" r="6"/>
            <circle cx="85" cy="34" r="6"/><circle cx="78" cy="40" r="6"/>
          </g>
          <circle cx="45" cy="33" r="4" fill="#d1a64d"/>
          <circle cx="78" cy="34" r="4" fill="#d1a64d"/>
        </g>
        <g class="season-accessory summer">
          <path d="M35 96L45 92Q60 101 75 92L85 96L89 119H31Z" class="season-fabric"/>
          <path d="M35 37L41 14Q60 7 79 14L85 37Z" fill="#d8bc79" stroke="#98753f" stroke-width="2"/>
          <path d="M37 29H83V38H37Z" class="season-fabric"/>
          <path d="M21 39Q60 29 99 39L95 47Q60 41 25 47Z" fill="#e4ca8d" stroke="#98753f" stroke-width="2"/>
          <path d="M31 58L37 57M83 57L89 58M55 61H65" stroke="#384f54" stroke-width="4"/>
          <rect x="34" y="55" width="23" height="16" rx="6" fill="#253c42" stroke="#e1b968" stroke-width="2.5"/>
          <rect x="63" y="55" width="23" height="16" rx="6" fill="#253c42" stroke="#e1b968" stroke-width="2.5"/>
          <path d="M39 59L43 66M68 59L72 66" stroke="#a4c5c7" stroke-width="2" stroke-linecap="round"/>
        </g>
        <g class="season-accessory autumn">
          <path d="M31 99Q60 88 89 99L94 120H26Z" fill="#63735b"/>
          <path d="M28 36Q22 17 51 15Q82 8 94 28L88 39Z" fill="#798568" stroke="#4e6049" stroke-width="2"/>
          <path d="M37 36Q60 30 84 35" stroke="#495944" stroke-width="7" stroke-linecap="round"/>
          <path d="M69 15L67 8" stroke="#4e6049" stroke-width="4" stroke-linecap="round"/>
          <path d="M81 25Q97 14 94 36Q83 41 81 25Z" fill="#c89354"/>
          <path d="M32 92Q60 103 88 92L88 103Q60 114 32 103Z" fill="#c48b50" stroke="#9b6a38" stroke-width="2"/>
          <path d="M42 103L37 119H51L57 105Z" fill="#c48b50" stroke="#9b6a38" stroke-width="2"/>
          <path d="M45 99L48 108M58 101L60 109M72 100L74 107M40 113H51" stroke="#e5c596" stroke-width="2"/>
        </g>
        <g class="season-accessory winter">
          <path d="M29 36Q31 11 60 12Q89 11 91 36Z" fill="#6194b6" stroke="#365e7c" stroke-width="2"/>
          <path d="M41 19L39 34M53 16L52 34M66 16L67 34M78 20L80 34" stroke="#a5c8dc" stroke-width="3" stroke-linecap="round"/>
          <circle cx="60" cy="11" r="8" fill="#e3eaf0" stroke="#a0b7ca" stroke-width="2"/>
          <rect x="26" y="32" width="68" height="12" rx="5" fill="#d4e2ec" stroke="#9ab7cc" stroke-width="2"/>
          <path d="M36 35V41M46 35V41M56 35V41M66 35V41M76 35V41M86 35V41" stroke="#a0bbce" stroke-width="2"/>
          <path d="M31 93Q60 104 89 93L89 105Q60 116 31 105Z" fill="#6194b6" stroke="#365e7c" stroke-width="2"/>
          <path d="M41 105L37 120H51L56 108Z" fill="#6194b6" stroke="#365e7c" stroke-width="2"/>
          <path d="M40 99L43 109M52 102L54 112M66 102L68 112M79 99L81 109M39 115H52" stroke="#d4e2ec" stroke-width="3"/>
        </g>`;
      document.querySelectorAll('#teddyBtn svg, .teddy-mini-avatar svg').forEach(avatar => {
        avatar.setAttribute('viewBox', '0 0 120 120');
        avatar.innerHTML = artwork;
      });
    }

    (function initTheme() {
      addSeasonalAccessories();
      document.getElementById('seasonPreview').value = 'auto';
      document.getElementById('zonePreview').value = 'auto';
      document.querySelector('.season-preview').hidden = new URLSearchParams(window.location.search).get('debug') !== '1';
      applySeason();
    })();

    window.addEventListener('focus', refreshLocationTheme);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshLocationTheme();
    });
    window.setInterval(refreshLocationTheme, 60000);

    // 3. VIEW SWITCHER
    function switchView(viewName, updateUrl = true) {
      if (viewName === 'knowledge' && !window.KnowledgeIntegration?.isConnected()) { window.KnowledgeIntegration?.login(); return; }
      document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));

      const target = document.getElementById(`view-${viewName}`);
      const btn = document.getElementById(`tab-${viewName}`);
      if (target) target.classList.add('active');
      if (btn) btn.classList.add('active');

      if (viewName === 'garden') {
        renderSidebarNotes();
        loadGardenNote(activeNoteId, false);
        setTimeout(initGraph, 60);
      } else if (viewName === 'knowledge') {
        window.KnowledgeIntegration?.updateStatus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (viewName === 'now') {
        fetchNowMarkdown();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // Toggle mobile garden bottom bar visibility
      const mobileBar = document.getElementById('mobileGardenBar');
      if (mobileBar) {
        mobileBar.style.display = (viewName === 'garden' && window.innerWidth <= 900) ? 'flex' : 'none';
      }
      document.title = viewName === 'garden' && vault[activeNoteId]
        ? `${vault[activeNoteId].title} | Dheeraj Karki`
        : viewName === 'now' ? `Now | Dheeraj Karki` : viewName === 'knowledge' ? `Knowledge | Dheeraj Karki` : siteTitle;
      if (updateUrl) writePageUrl(viewName);
    }

    // ================= MOBILE DRAWER LOGIC =================
    function openMobileDrawer(mode) {
      const drawer = document.getElementById('mobileDrawer');
      const title = document.getElementById('mobileDrawerTitle');
      const notesView = document.getElementById('mobileDrawerNotesView');
      const graphView = document.getElementById('mobileDrawerGraphView');

      drawer.classList.add('open');

      if (mode === 'index') {
        title.textContent = 'Browse Digital Garden Notes';
        notesView.style.display = 'block';
        graphView.style.display = 'none';
        renderMobileNotesList();
      } else {
        title.textContent = 'Knowledge Graph Map';
        notesView.style.display = 'none';
        graphView.style.display = 'block';
        setTimeout(initMobileGraph, 80);
      }
    }

    function closeMobileDrawer(e) {
      if (e && e.target !== e.currentTarget && e.target.tagName !== 'BUTTON') return;
      document.getElementById('mobileDrawer').classList.remove('open');
    }

    function renderMobileNotesList() {
      const container = document.getElementById('mobileNotesListContainer');
      const filtered = Object.values(vault).filter(n => currentStageFilter === 'all' || n.stage === currentStageFilter);

      container.innerHTML = filtered.length ? filtered.map(n => {
        const isActive = n.id === activeNoteId;
        return `
          <div onclick="closeMobileDrawer(); loadGardenNote(${jsArg(n.id)})" style="padding:10px 12px; border-radius:6px; margin-bottom:4px; cursor:pointer; font-size:13px; background:${isActive ? 'var(--card)' : 'var(--surface)'}; border-left:${isActive ? '3px solid var(--accent)' : '3px solid transparent'};">
            <div style="font-family:var(--font-serif); font-weight:${isActive ? '600' : '500'}; color:var(--text);">${esc(n.title)}</div>
            <div style="font-family:var(--font-mono); font-size:10px; color:var(--text-muted); margin-top:2px;">${esc(n.stage)} &middot; ${esc(n.folder)}</div>
          </div>
        `;
      }).join('') : '<p style="padding:10px; color:var(--text-muted);">No notes available.</p>';
    }

    function getGraphPalette() {
      const styles = getComputedStyle(document.documentElement);
      return {
        accent: styles.getPropertyValue('--accent').trim(),
        detail: styles.getPropertyValue('--season-detail').trim(),
        muted: styles.getPropertyValue('--text-muted').trim(),
        border: styles.getPropertyValue('--border-strong').trim(),
        seedling: styles.getPropertyValue('--graph-seedling').trim(),
        budding: styles.getPropertyValue('--graph-budding').trim(),
        evergreen: styles.getPropertyValue('--graph-evergreen').trim()
      };
    }

    function initMobileGraph() {
      const canvas = document.getElementById('mobileGraphCanvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * (window.devicePixelRatio || 1)));
      canvas.height = 260 * (window.devicePixelRatio || 1);

      const keys = Object.keys(vault);
      const w = canvas.width;
      const h = canvas.height;

      const mNodes = keys.map((key, i) => {
        const angle = (i / Math.max(1, keys.length)) * Math.PI * 2;
        return {
          id: key,
          x: w / 2 + Math.cos(angle) * (w * 0.35),
          y: h / 2 + Math.sin(angle) * (h * 0.28),
          stage: vault[key].stage
        };
      });

      const ctx = canvas.getContext('2d');
      const palette = getGraphPalette();
      const lineColor = palette.border;
      const activeLineColor = palette.accent;

      ctx.clearRect(0, 0, w, h);

      // Edges
      Object.keys(vault).forEach(sId => {
        const sNode = mNodes.find(n => n.id === sId);
        if (!sNode) return;
        getOutgoingNoteIds(vault[sId].content).forEach(tId => {
          const tNode = mNodes.find(n => n.id === tId);
          if (tNode) {
            const isConn = sId === activeNoteId || tId === activeNoteId;
            ctx.beginPath();
            ctx.moveTo(sNode.x, sNode.y);
            ctx.lineTo(tNode.x, tNode.y);
            ctx.strokeStyle = isConn ? activeLineColor : lineColor;
            ctx.lineWidth = isConn ? 1.5 : 1;
            ctx.stroke();
          }
        });
      });

      // Nodes
      mNodes.forEach(n => {
        const isCurrent = n.id === activeNoteId;
        ctx.beginPath();
        ctx.arc(n.x, n.y, isCurrent ? 8 * (window.devicePixelRatio || 1) : 5 * (window.devicePixelRatio || 1), 0, Math.PI * 2);
        ctx.fillStyle = palette[n.stage] || palette.border;
        ctx.fill();
        if (isCurrent) {
          ctx.lineWidth = 2.5 * (window.devicePixelRatio || 1);
          ctx.strokeStyle = palette.accent;
          ctx.stroke();
        }

        ctx.font = `${Math.round(10 * (window.devicePixelRatio || 1))}px "JetBrains Mono"`;
        ctx.fillStyle = isCurrent ? palette.accent : palette.muted;
        ctx.textAlign = 'center';
        const title = vault[n.id].title;
        const maxChars = 28;
        const label = title.length > maxChars ? title.slice(0, maxChars - 1) + '…' : title;
        ctx.fillText(label, n.x, n.y + 17 * (window.devicePixelRatio || 1));
      });

      canvas.onclick = (e) => {
        const cRect = canvas.getBoundingClientRect();
        const clickX = (e.clientX - cRect.left) * (window.devicePixelRatio || 1);
        const clickY = (e.clientY - cRect.top) * (window.devicePixelRatio || 1);

        for (const n of mNodes) {
          const dist = Math.hypot(n.x - clickX, n.y - clickY);
          if (dist < 20 * (window.devicePixelRatio || 1)) {
            closeMobileDrawer();
            loadGardenNote(n.id);
            break;
          }
        }
      };
    }

    function openNoteInGarden(id) {
      activeNoteId = id;
      switchView('garden');
    }

    // 4. PARSER & WIKILINKS
    function resolveNoteLink(link) {
      const key = link.split('|')[0].split('#')[0].trim().replace(/\.md$/i, '').toLowerCase();
      return vault[key] || Object.values(vault).find(note =>
        note.title.toLowerCase() === key || note.id.split('/').pop() === key || note.id === key.replace(/\s+/g, '-'));
    }

    function getOutgoingNoteIds(content) {
      const outgoing = new Set();
      marked.walkTokens(marked.lexer(content), token => {
        if (token.type !== 'obsidianLink' || token.embed) return;
        const target = resolveNoteLink(token.target);
        if (target) outgoing.add(target.id);
      });
      return [...outgoing];
    }

    function parseWikilinks(text) {
      return DOMPurify.sanitize(marked.parseInline(text));
    }

    const mathExtension = markedKatex({ throwOnError: false, trust: false });
    const blockMath = mathExtension.extensions.find(extension => extension.name === 'blockKatex');
    blockMath.start = source => {
      const match = /(?:^|\n)[ \t]{0,3}\$\$(?!\$)/.exec(source);
      return match ? match.index + (match[0].startsWith('\n') ? 1 : 0) : undefined;
    };
    blockMath.tokenizer = source => {
      const match = /^[ \t]{0,3}\$\$[ \t]*\r?\n([\s\S]+?)\r?\n[ \t]{0,3}\$\$[ \t]*(?:\r?\n|$)/.exec(source)
        || /^[ \t]{0,3}\$\$([^\r\n]+?)\$\$[ \t]*(?:\r?\n|$)/.exec(source);
      if (match) return { type: 'blockKatex', raw: match[0], text: match[1].trim(), displayMode: true };
    };
    marked.use(mathExtension);

    marked.use({
      extensions: [{
        name: 'obsidianLink',
        level: 'inline',
        start(source) { return source.search(/!?\[\[/); },
        tokenizer(source) {
          const match = /^(!?)\[\[([^\]\n]+)\]\]/.exec(source);
          if (match) return { type: 'obsidianLink', raw: match[0], embed: Boolean(match[1]), target: match[2] };
        },
        renderer(token) {
          const [path, alias] = token.target.split('|');
          if (token.embed) {
            const image = document.createElement('img');
            const assetPath = path.includes('/') ? path.replace(/^\/?/, '') : `__support/${path}`;
            image.src = assetPath.split('/').map(encodeURIComponent).join('/');
            image.alt = alias && !/^\d+(x\d+)?$/.test(alias) ? alias : path;
            if (alias && /^\d+(x\d+)?$/.test(alias)) image.width = Number(alias.split('x')[0]);
            return image.outerHTML;
          }
          const key = path.split('#')[0].trim().replace(/\.md$/i, '').toLowerCase();
          const target = resolveNoteLink(path);
          const link = document.createElement('a');
          link.className = 'wikilink';
          link.dataset.target = target ? target.id : key;
          link.href = '#';
          link.textContent = alias || (target ? target.title : path);
          return link.outerHTML;
        }
      }]
    });

    document.addEventListener('click', event => {
      const link = event.target.closest('a.wikilink[data-target]');
      if (!link) return;
      event.preventDefault();
      loadGardenNote(link.dataset.target);
    });

    GardenWidgets.install(marked);

    function renderMarkdown(md, options = {}) {
      const container = document.createElement('div');
      // Garden and Knowledge share this exact parsing/sanitisation pipeline.
      // Private mode blocks network-capable embedded elements without removing KaTeX geometry.
      const config = options.privateMode ? {
        USE_PROFILES:{html:true},
        FORBID_TAGS:['img','iframe','svg','video','audio','object','embed','form','input','button','style'],
        FORBID_ATTR:['srcset','src','formaction','target']
      } : undefined;
      container.innerHTML = DOMPurify.sanitize(marked.parse(md), config);
      container.querySelectorAll('blockquote').forEach(quote => {
        const firstParagraph = quote.firstElementChild;
        if (!firstParagraph || firstParagraph.tagName !== 'P') return;
        const marker = /^\[!([\w-]+)\]([+-])?(?:[ \t]+([^\n]*))?(?:\n|$)/.exec(firstParagraph.textContent);
        if (!marker) return;
        const callout = document.createElement(marker[2] ? 'details' : 'aside');
        callout.className = 'callout';
        callout.dataset.callout = marker[1].toLowerCase();
        if (marker[2] === '+') callout.open = true;
        const title = document.createElement(marker[2] ? 'summary' : 'div');
        title.className = 'callout-title';
        title.textContent = marker[3] || marker[1];
        const firstNode = firstParagraph.firstChild;
        if (firstNode && firstNode.nodeType === Node.TEXT_NODE) {
          firstNode.textContent = firstNode.textContent.slice(marker[0].length);
        }
        callout.append(title, ...quote.childNodes);
        quote.replaceWith(callout);
      });
      container.querySelectorAll('table').forEach(table => {
        if (table.closest('.garden-widget')) return;
        table.classList.add('markdown-table');
        table.querySelectorAll('thead th').forEach(cell => { cell.scope = 'col'; });
        const wrapper = document.createElement('div');
        wrapper.className = 'table-scroll';
        wrapper.tabIndex = 0;
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-label', table.caption?.textContent || 'Data table');
        table.before(wrapper);
        wrapper.append(table);
      });
      return container.innerHTML;
    }
    window.gardenRenderMarkdown = renderMarkdown;

    // Shared resizing for the Garden and Knowledge side panels.
    // Only layout widths persist in sessionStorage, never private note data.
    (() => {
      for (const pane of document.querySelectorAll('.resizable-garden')) {
        const id=pane.id;
        for (const side of ['left','right']) {
          const fallback=side==='left'?245:270;
          const key='garden-pane:'+id+':'+side;
          const limit=side==='left'?[160,420]:[200,460];
          const resizeTo=value=>{
            const max=Math.min(limit[1],Math.max(limit[0],pane.clientWidth-350));
            const size=Math.max(limit[0],Math.min(max,Math.round(value)));
            pane.style.setProperty('--rail-'+side,size+'px');
            const splitter=pane.querySelector('.garden-splitter-'+side);
            if(splitter)splitter.setAttribute('aria-valuenow',String(size));
            try{sessionStorage.setItem(key,String(size));}catch(_){}
          };
          let previous;try{previous=Number(sessionStorage.getItem(key));}catch(_){}
          if(previous>0)resizeTo(previous);
          const splitter=pane.querySelector('.garden-splitter-'+side);if(!splitter)continue;
          let dragging=false;
          splitter.addEventListener('pointerdown',e=>{
            if(e.button!==0)return; dragging=true;splitter.classList.add('is-dragging');splitter.setPointerCapture(e.pointerId);e.preventDefault();
          });
          splitter.addEventListener('pointermove',e=>{
            if(!dragging)return;
            const rect=pane.getBoundingClientRect();
            resizeTo(side==='left'?e.clientX-rect.left:rect.right-e.clientX);
          });
          const finish=()=>{dragging=false;splitter.classList.remove('is-dragging');};
          splitter.addEventListener('pointerup',finish);
          splitter.addEventListener('pointercancel',finish);
          splitter.addEventListener('keydown',e=>{
            if(!['ArrowLeft','ArrowRight'].includes(e.key))return;
            const current=Number(splitter.getAttribute('aria-valuenow'))||fallback;
            const change=(e.key==='ArrowRight'?1:-1)*12*(side==='left'?1:-1);
            resizeTo(current+change);e.preventDefault();
          });
        }
      }
    })();


    // 5. NOTE RENDERER
    function loadGardenNote(id, updateUrl = true) {
      if (!vault[id]) return;
      activeNoteId = id;
      const note = vault[id];

      document.getElementById('crumbFolder').textContent = note.folder;
      document.getElementById('crumbFile').textContent = `${note.id}.md`;
      document.getElementById('noteTitle').textContent = note.title;

      const stageLabels = { seedling: '🌱 Seedling', budding: '🌿 Budding', evergreen: '🌳 Evergreen' };
      document.getElementById('noteStageBadge').textContent = stageLabels[note.stage] || note.stage;
      document.getElementById('noteConfidenceBadge').textContent = `Certainty: ${note.confidence}`;
      document.getElementById('noteTendedBadge').textContent = `Tended ${note.lastTended}`;

      document.getElementById('noteTags').innerHTML = note.tags.map(t => 
        `<span style="font-family:var(--font-mono); font-size:10px; border:1px solid var(--border); padding:1px 5px; border-radius:3px; color:var(--text-muted);">#${esc(t)}</span>`
      ).join('');

      document.getElementById('noteBody').innerHTML = renderMarkdown(note.content);
      
      // Build raw markdown output cleanly without unescaped fence collisions
      const rawText = "---\n" +
        "title: " + note.title + "\n" +
        "folder: " + note.folder + "\n" +
        "stage: " + note.stage + "\n" +
        "lastTended: " + note.lastTended + "\n" +
        "tags: [" + note.tags.join(', ') + "]\n" +
        "publish: true\n" +
        "---\n\n" +
        note.content;

      document.getElementById('rawMdBox').textContent = rawText;

      // Backlinks
      const backlinks = Object.values(vault).filter(n => n.id !== id && getOutgoingNoteIds(n.content).includes(id));
      document.getElementById('backlinksBadge').textContent = backlinks.length;
      document.getElementById('backlinksContainer').innerHTML = backlinks.length ? backlinks.map(b => `
        <div onclick="loadGardenNote(${jsArg(b.id)})" style="background:var(--bg); border:1px solid var(--border); padding:8px; border-radius:4px; cursor:pointer;">
          <div style="font-size:12px; font-weight:600; font-family:var(--font-serif);">${esc(b.title)}</div>
          <div style="font-size:10px; color:var(--text-muted); font-family:var(--font-mono); margin-top:2px;">${esc(b.folder)} &middot; ${esc(b.stage)}</div>
        </div>
      `).join('') : '<div style="font-size:11px; color:var(--text-muted); font-style:italic;">No incoming backlinks.</div>';

      // Outgoing
      const outgoing = getOutgoingNoteIds(note.content);
      document.getElementById('outgoingBadge').textContent = outgoing.length;
      document.getElementById('outgoingContainer').innerHTML = outgoing.length ? outgoing.map(o => `
        <div onclick="loadGardenNote(${jsArg(o)})" style="font-size:11px; cursor:pointer; color:var(--accent); text-decoration:underline;">
          &rarr; ${esc(vault[o].title)}
        </div>
      `).join('') : '<div style="font-size:11px; color:var(--text-muted); font-style:italic;">No outgoing links.</div>';

      setupHoverTooltips();
      renderSidebarNotes();
      drawGraph();
      renderGraphNavigation();
      if (document.getElementById('mobileDrawerGraphView').style.display === 'block') initMobileGraph();
      if (document.getElementById('view-garden').classList.contains('active')) {
        document.title = `${note.title} | Dheeraj Karki`;
        if (updateUrl) writePageUrl('garden');
      }
    }

    // 6. SIDEBAR LIST
    // Shared Obsidian-like explorer used by public Garden and private Knowledge.
    // All labels are created as text nodes, never interpolated into HTML.
    function gardenExplorerRow({label, depth, folder=false, open=false, selected=false, meta='', onClick}) {
      const row=document.createElement('button');row.type='button';row.className='garden-explorer-row'+(folder?' is-folder':' is-note');
      row.style.setProperty('--depth',String(Math.min(depth,16)));row.setAttribute('aria-label',label);
      if(selected)row.setAttribute('aria-current','true');
      if(folder)row.setAttribute('aria-expanded',String(open));
      const twist=document.createElement('span');twist.className='garden-explorer-twist';twist.textContent=folder?(open?'▾':'▸'):' ';
      const icon=document.createElement('span');icon.className='garden-explorer-icon';icon.setAttribute('aria-hidden','true');icon.textContent=folder?(open?'▱':'▱'):'·';
      const body=document.createElement('span');body.className='garden-explorer-name';body.textContent=label;
      row.append(twist,icon,body);
      // Keep the tree quiet: note stage is available in the article header, not repeated in every row.
      row.addEventListener('click',onClick);return row;
    }
    const publicExplorerExpanded=new Set();
    const publicExplorerCollapsed=new Set();
    function renderSidebarNotes() {
      const query=(document.getElementById('sidebarSearch')?.value||'').trim().toLocaleLowerCase();
      const container=document.getElementById('sidebarNotesContainer');
      const filtered=Object.values(vault).filter(n=>(currentStageFilter==='all'||n.stage===currentStageFilter) &&
        (!query||n.title.toLocaleLowerCase().includes(query)||n.tags.some(t=>t.toLocaleLowerCase().includes(query))||n.folder.toLocaleLowerCase().includes(query)));
      document.getElementById('noteCountLabel').textContent=`${filtered.length} notes`;
      container.replaceChildren();
      for(const note of [...filtered].sort((x,y)=>x.title.localeCompare(y.title))){
        const item=document.createElement('button');item.type='button';item.className='garden-note-item'+(note.id===activeNoteId?' is-active':'');
        if(note.id===activeNoteId)item.setAttribute('aria-current','true');
        const title=document.createElement('span');title.className='garden-note-title';title.textContent=note.title;
        const meta=document.createElement('span');meta.className='garden-note-meta';meta.textContent=[note.stage,note.folder].filter(Boolean).join(' · ');
        item.append(title,meta);item.addEventListener('click',()=>loadGardenNote(note.id));container.append(item);
      }
      if(!filtered.length){const msg=document.createElement('p');msg.className='garden-note-empty';msg.textContent='No matching notes.';container.append(msg);}
    }

    function filterStage(st) {
      currentStageFilter = st;
      document.querySelectorAll('#f-seedling, #f-budding, #f-evergreen').forEach(b => b.style.borderColor = 'var(--border)');
      if (st !== 'all') {
        const active = document.getElementById(`f-${st}`);
        if (active) active.style.borderColor = 'var(--accent)';
      }
      renderSidebarNotes();
    }

    function toggleRawView() {
      isRawMd = !isRawMd;
      document.getElementById('rawMdBox').style.display = isRawMd ? 'block' : 'none';
      document.getElementById('noteBody').style.display = isRawMd ? 'none' : 'block';
      document.getElementById('rawToggleLabel').textContent = isRawMd ? 'Read Prose' : '</> Raw .md';
    }

    // 7. HOVER TOOLTIPS
    function setupHoverTooltips() {
      const pop = document.getElementById('hoverPopover');
      document.querySelectorAll('.wikilink').forEach(link => {
        link.addEventListener('mouseenter', () => {
          const target = vault[link.getAttribute('data-target')];
          if (!target) return;
          document.getElementById('popTitle').textContent = target.title;
          document.getElementById('popSummary').textContent = target.summary;
          document.getElementById('popStage').textContent = target.stage;

          const rect = link.getBoundingClientRect();
          pop.style.left = `${Math.min(window.innerWidth - 270, Math.max(10, rect.left))}px`;
          pop.style.top = `${rect.bottom + 6}px`;
          pop.classList.add('visible');
        });
        link.addEventListener('mouseleave', () => pop.classList.remove('visible'));
      });
    }


    function renderGraphNavigation() {
      const notes = Object.values(vault);
      const containers = ['expandedGraphNavigation', 'mobileGraphNavigation'];
      for (const id of containers) {
        const host = document.getElementById(id);
        if (!host) continue;
        host.replaceChildren();
        if (!notes.length) { host.textContent = 'No published notes available.'; continue; }
        for (const note of notes) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'graph-note-link';
          button.textContent = `${({seedling:'🌱',budding:'🌿',evergreen:'🌳'}[note.stage] || '•')} ${note.title}`;
          button.setAttribute('aria-current', note.id === activeNoteId ? 'true' : 'false');
          button.title = `Open ${note.title}`;
          button.addEventListener('click', () => {
            if (graphExpanded) closeGardenGraph();
            closeMobileDrawer();
            openNoteInGarden(note.id);
          });
          host.append(button);
        }
      }
    }

    // Interactive graph explorer. Nodes and edges are always built from the public vault.
    const graphCanvasHome = document.getElementById('graphCanvas').parentElement;
    let graphExpanded = false;
    let graphPreviousFocus = null;
    let graphNodes = [];
    const graphCamera = { scale: 1, x: 0, y: 0 };
    let graphFitScale = 1;
    const graphPointers = new Map();
    let graphGesture = null;
    let graphPointerMoved = false;
    const graphCanvas = document.getElementById('graphCanvas');
    function gardenIsMobile() { return window.matchMedia('(max-width: 900px)').matches; }
    function setGardenReadingFocus(enabled) {
      const garden = document.getElementById('view-garden');
      garden.classList.toggle('reading-focus', enabled);
      const button = document.getElementById('focusReadingBtn');
      button.setAttribute('aria-pressed', String(enabled));
      button.textContent = enabled ? 'Exit focus' : 'Focus reading';
      document.getElementById('restoreRailsBtn').hidden = !enabled;
      if (graphExpanded) closeGardenGraph();
      if (!gardenIsMobile()) requestAnimationFrame(initGraph);
    }
    document.addEventListener('keydown', (e) => {
      const g = document.getElementById('view-garden');
      if (e.key === 'Escape' && g.classList.contains('reading-focus') && !graphExpanded) setGardenReadingFocus(false);
    });
    function toggleGardenReadingFocus() { setGardenReadingFocus(!document.getElementById('view-garden').classList.contains('reading-focus')); }
    function restoreGardenRails() { setGardenReadingFocus(false); }
    function expandedSize() { return { w: graphCanvas.clientWidth || 1, h: graphCanvas.clientHeight || 1 }; }
    function graphToWorld(x, y) { return { x: (x - graphCamera.x) / graphCamera.scale, y: (y - graphCamera.y) / graphCamera.scale }; }
    function updateGraphZoomLabel() {
      const label = document.getElementById('gardenGraphZoomLabel');
      if (label) label.textContent = `${Math.round(graphCamera.scale / graphFitScale * 100)}%`;
    }
    function fitGardenGraph() {
      const { w, h } = expandedSize();
      if (!graphNodes.length || !graphExpanded) return;
      const xs = graphNodes.map(n => n.x), ys = graphNodes.map(n => n.y);
      const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
      const spanX = Math.max(140, maxX - minX + 160), spanY = Math.max(110, maxY - minY + 100);
      graphCamera.scale = Math.min(3, Math.max(.4, Math.min(w / spanX, h / spanY)));
      graphFitScale = graphCamera.scale;
      graphCamera.x = w / 2 - (minX + maxX) / 2 * graphCamera.scale;
      graphCamera.y = h / 2 - (minY + maxY) / 2 * graphCamera.scale;
      updateGraphZoomLabel(); drawGraph();
    }
    function resetGardenGraph() { fitGardenGraph(); }
    function zoomGardenGraph(multiplier, atX, atY) {
      if (!graphExpanded) return;
      const { w, h } = expandedSize();
      const px = atX ?? w / 2, py = atY ?? h / 2;
      const world = graphToWorld(px, py);
      graphCamera.scale = Math.min(graphFitScale * 4, Math.max(graphFitScale * .5, graphCamera.scale * multiplier));
      graphCamera.x = px - world.x * graphCamera.scale;
      graphCamera.y = py - world.y * graphCamera.scale;
      updateGraphZoomLabel(); drawGraph();
    }
    function expandGardenGraph() {
      if (graphExpanded) return;
      graphPreviousFocus = document.activeElement;
      const overlay = document.getElementById('gardenGraphOverlay');
      overlay.hidden = false;
      document.getElementById('gardenGraphExpandedHost').appendChild(graphCanvas);
      graphExpanded = true;
      document.body.classList.add('garden-graph-open');
      requestAnimationFrame(() => { initGraph(); fitGardenGraph(); document.getElementById('gardenGraphZoomIn').focus(); });
    }
    function closeGardenGraph() {
      if (!graphExpanded) return;
      graphPointers.clear(); graphGesture = null;
      graphCanvasHome.appendChild(graphCanvas);
      document.getElementById('gardenGraphOverlay').hidden = true;
      document.body.classList.remove('garden-graph-open');
      graphExpanded = false;
      requestAnimationFrame(initGraph);
      if (graphPreviousFocus && graphPreviousFocus.isConnected) graphPreviousFocus.focus();
    }
    document.getElementById('gardenGraphOverlay').addEventListener('click', function (e) { if (e.target === this) closeGardenGraph(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && graphExpanded) { e.preventDefault(); closeGardenGraph(); }
      if (!graphExpanded || e.key !== 'Tab') return;
      const controls = Array.from(document.querySelectorAll('#gardenGraphOverlay button:not([disabled])'));
      const i = controls.indexOf(document.activeElement);
      e.preventDefault(); controls[e.shiftKey ? (i <= 0 ? controls.length - 1 : i - 1) : (i < 0 || i === controls.length - 1 ? 0 : i + 1)].focus();
    });
    function initGraph() {
      if (!graphCanvas.parentElement) return;
      const dpr = window.devicePixelRatio || 1;
      const width = graphCanvas.clientWidth || graphCanvas.parentElement.clientWidth || 1;
      const height = graphExpanded ? graphCanvas.clientHeight || 350 : 220;
      graphCanvas.width = Math.max(1, Math.round(width * dpr));
      graphCanvas.height = Math.max(1, Math.round(height * dpr));
      const keys = Object.keys(vault);
      // Stable model coordinates across sidebar and expanded view; never invent an edge.
      graphNodes = keys.map((key, i) => {
        const a = i * Math.PI * (3 - Math.sqrt(5));
        const radius = keys.length <= 2 ? 115 : 55 * Math.sqrt(i);
        return { id:key, x:Math.cos(a)*radius, y:Math.sin(a)*radius, stage:vault[key].stage };
      });
      if (!graphExpanded) {
        graphCamera.scale = Math.min(1, width / 430);
        graphCamera.x = width / 2;
        graphCamera.y = height / 2;
      }
      drawGraph(); renderGraphNavigation();
    }
    function drawGraph() {
      if (!graphCanvas.width) return;
      const ctx = graphCanvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const w = graphCanvas.width / dpr, h = graphCanvas.height / dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const palette = getGraphPalette();
      // Faint dotted axes give panning/zooming an unobtrusive spatial reference.
      if (graphExpanded) {
        const step = 40 * graphCamera.scale;
        if (step >= 12) {
          ctx.fillStyle = palette.border;
          for (let x = ((graphCamera.x % step) + step) % step; x < w; x += step)
            for (let y = ((graphCamera.y % step) + step) % step; y < h; y += step)
              ctx.fillRect(x, y, 1.2, 1.2);
        }
      }
      ctx.save();
      ctx.translate(graphCamera.x, graphCamera.y);
      ctx.scale(graphCamera.scale, graphCamera.scale);
      const byId = new Map(graphNodes.map(n => [n.id, n]));
      Object.keys(vault).forEach(sId => {
        const source = byId.get(sId);
        if (!source) return;
        getOutgoingNoteIds(vault[sId].content).forEach(tId => {
          const target = byId.get(tId);
          if (!target) return;
          const connected = sId === activeNoteId || tId === activeNoteId;
          ctx.beginPath(); ctx.moveTo(source.x, source.y); ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = connected ? palette.accent : palette.border;
          ctx.lineWidth = (connected ? 2 : 1.3) / graphCamera.scale; ctx.stroke();
        });
      });
      graphNodes.forEach(n => {
        const current = n.id === activeNoteId;
        const radius = (current ? 9 : 6) / graphCamera.scale;
        ctx.beginPath(); ctx.arc(n.x, n.y, radius, 0, Math.PI*2);
        ctx.fillStyle = palette[n.stage] || palette.border; ctx.fill();
        if (current) { ctx.strokeStyle = palette.accent; ctx.lineWidth = 2.8 / graphCamera.scale; ctx.stroke(); }
        ctx.font = `${(graphExpanded ? 12 : 10) / graphCamera.scale}px "JetBrains Mono", monospace`;
        ctx.fillStyle = current ? palette.accent : palette.muted;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const title = vault[n.id].title;
        const maxChars = graphExpanded ? 55 : 20;
        ctx.fillText(title.length > maxChars ? title.slice(0,maxChars-1)+'…' : title, n.x, n.y+15/graphCamera.scale);
      });
      ctx.restore();
    }
    function graphRelativePoint(e) { const r=graphCanvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }
    graphCanvas.addEventListener('wheel', e => {
      if (!graphExpanded) return;
      e.preventDefault();
      const p=graphRelativePoint(e);
      zoomGardenGraph(Math.exp(-e.deltaY*0.0015),p.x,p.y);
    }, {passive:false});
    graphCanvas.addEventListener('pointerdown', e => {
      if (!graphExpanded) return;
      e.preventDefault(); graphCanvas.setPointerCapture(e.pointerId);
      graphPointers.set(e.pointerId,graphRelativePoint(e));
      graphPointerMoved=false;
      if(graphPointers.size===2){const [a,b]=[...graphPointers.values()];graphGesture={distance:Math.hypot(a.x-b.x,a.y-b.y),scale:graphCamera.scale,x:graphCamera.x,y:graphCamera.y,mid:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};}
    });
    graphCanvas.addEventListener('pointermove',e=>{
      if(!graphExpanded||!graphPointers.has(e.pointerId))return;
      const old=graphPointers.get(e.pointerId),p=graphRelativePoint(e);
      graphPointers.set(e.pointerId,p);
      if(Math.hypot(p.x-old.x,p.y-old.y)>1)graphPointerMoved=true;
      if(graphPointers.size===2){
        const [a,b]=[...graphPointers.values()],mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2},distance=Math.max(1,Math.hypot(a.x-b.x,a.y-b.y));
        if(!graphGesture)return;
        const scale=Math.min(graphFitScale*4,Math.max(graphFitScale*.5,graphGesture.scale*distance/Math.max(1,graphGesture.distance)));
        const worldX=(graphGesture.mid.x-graphGesture.x)/graphGesture.scale,worldY=(graphGesture.mid.y-graphGesture.y)/graphGesture.scale;
        graphCamera.scale=scale;graphCamera.x=mid.x-worldX*scale;graphCamera.y=mid.y-worldY*scale;
        graphPointerMoved=true;updateGraphZoomLabel();drawGraph();
      }else if(graphPointers.size===1){graphCamera.x+=p.x-old.x;graphCamera.y+=p.y-old.y;drawGraph();}
    });
    function endGraphPointer(e){
      if(!graphPointers.has(e.pointerId))return;
      const p=graphRelativePoint(e),wasSingle=graphPointers.size===1;
      graphPointers.delete(e.pointerId);
      if(graphPointers.size<2)graphGesture=null;
      if(!wasSingle||graphPointerMoved||e.type==='pointercancel')return;
      const world=graphToWorld(p.x,p.y);
      const node=graphNodes.find(n=>Math.hypot(n.x-world.x,n.y-world.y)<15/graphCamera.scale);
      if(node){loadGardenNote(node.id);drawGraph();}
    }
    graphCanvas.addEventListener('pointerup',endGraphPointer);
    graphCanvas.addEventListener('pointercancel',endGraphPointer);
    graphCanvas.addEventListener('click',e=>{
      if(graphExpanded)return;const p=graphRelativePoint(e),world=graphToWorld(p.x,p.y);
      const n=graphNodes.find(n=>Math.hypot(n.x-world.x,n.y-world.y)<16/graphCamera.scale);
      if(n)loadGardenNote(n.id);
    });
    // 9. MODALS
    function openSearchModal() {
      document.getElementById('searchModal').classList.add('open');
      const input = document.getElementById('modalSearchInput');
      input.value = '';
      input.focus();
      renderSearchResults('');
    }
    function closeSearchModal() {
      document.getElementById('searchModal').classList.remove('open');
    }

    function renderSearchResults(q) {
      const res = document.getElementById('modalResults');
      const filtered = Object.values(vault).filter(n => 
        n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      );
      res.innerHTML = filtered.map(n => `
        <div onclick="closeSearchModal(); openNoteInGarden(${jsArg(n.id)})" style="padding:8px; border-bottom:1px solid var(--border); cursor:pointer;">
          <div style="font-weight:600; font-size:13px; font-family:var(--font-serif);">${esc(n.title)}</div>
          <div style="font-size:11px; color:var(--text-muted); font-family:var(--font-mono);">${esc(n.stage)} &middot; ${esc(n.folder)}</div>
        </div>
      `).join('');
    }

    document.getElementById('modalSearchInput')?.addEventListener('input', (e) => {
      renderSearchResults(e.target.value.toLowerCase());
    });

    function openSyncModal() {
      document.getElementById('syncModal').classList.add('open');
    }
    function closeSyncModal() {
      document.getElementById('syncModal').classList.remove('open');
    }

    // Hotkey: Cmd+K / Ctrl+K
    window.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openSearchModal();
      }
      if (e.key === 'Escape') {
        closeSearchModal();
        closeSyncModal();
      }
    });

    window.addEventListener('resize', () => {
      const canvas = document.getElementById('graphCanvas');
      if (canvas && canvas.parentElement) {
        initGraph();
      }
    });
    // Keep canvas drawing dimensions synchronised with responsive graph column.
    if (typeof ResizeObserver !== 'undefined') {
      const graphContainer = document.getElementById('graphCanvas');
      if (graphContainer) {
        let graphWidth = 0;
        new ResizeObserver(entries => {
          const width = Math.round(entries[0]?.contentRect.width || 0);
          if (width > 0 && width !== graphWidth) {
            graphWidth = width;
            if (document.getElementById('view-garden')?.classList.contains('active')) initGraph();
          }
        }).observe(graphContainer);
      }
    }


    // Boot
    window.onload = async function() {
      await GardenWidgets.initialize();
      fetchBioMarkdown();
      fetchNowMarkdown();
      fetchAllGardenNotes();
      switchView('home', false);
      if (new URLSearchParams(window.location.search).get('knowledge') === '1') {
        toggleTeddyChat();
        askTeddyPrompt('Open private Knowledge');
      }
    };

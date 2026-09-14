(function () {
  var data = [];
  var grid = document.getElementById('font-grid');
  var searchInput = document.getElementById('search-input');
  var categoryFilters = document.getElementById('category-filters');
  var langFilters = document.getElementById('lang-filters');

  var activeCategory = '';
  var activeLang = '';
  var query = '';

  function init() {
    fetch('data.json')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        data = d;
        bindEvents();
        render();
      })
      .catch(function () {
        if (grid) grid.innerHTML = '<div class="empty-state">加载失败，请刷新重试</div>';
      });
  }

  function bindEvents() {
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        query = this.value.trim().toLowerCase();
        render();
      });
    }
    if (categoryFilters) {
      categoryFilters.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;
        var val = btn.dataset.value || '';
        activeCategory = activeCategory === val ? '' : val;
        updateButtons(categoryFilters, activeCategory);
        render();
      });
    }
    if (langFilters) {
      langFilters.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;
        var val = btn.dataset.value || '';
        activeLang = activeLang === val ? '' : val;
        updateButtons(langFilters, activeLang);
        render();
      });
    }
  }

  function updateButtons(container, active) {
    var btns = container.querySelectorAll('.filter-btn');
    btns.forEach(function (b) {
      b.classList.toggle('active', (b.dataset.value || '') === active);
    });
  }

  function match(font) {
    if (activeCategory && font.category !== activeCategory) return false;
    if (activeLang && font.languages.indexOf(activeLang) === -1) return false;
    if (query) {
      var hay = [
        font.name.zh || '',
        font.name.en || '',
        font.vendor,
        font.description || '',
        font.license,
        font.tags.join(' '),
      ].join(' ').toLowerCase();
      if (hay.indexOf(query) === -1) return false;
    }
    return true;
  }

  function cardHTML(font) {
    var name = font.name.zh && font.name.en
      ? font.name.zh + ' / ' + font.name.en
      : (font.name.zh || font.name.en || font.slug);

    var preview = font.preview
      ? '<img class="preview-img" src="images/' + font.preview + '" alt="' + esc(name) + '">'
      : '<div class="preview-placeholder">' + esc((font.name.zh || font.name.en || '?').charAt(0)) + '</div>';

    var badges = '<span class="badge badge-license">' + esc(font.license) + '</span>';
    if (font.category) {
      var catLabel = { 'sans-serif': '无衬线', 'serif': '衬线', 'monospace': '等宽', 'display': '展示', 'handwriting': '手写' };
      badges += ' <span class="badge badge-category">' + (catLabel[font.category] || font.category) + '</span>';
    }
    var shownLangs = font.languages.slice(0, 3);
    shownLangs.forEach(function (l) {
      badges += ' <span class="badge badge-lang">' + esc(l) + '</span>';
    });

    return '<a class="font-card" href="fonts/' + font.slug + '.html">' +
      preview +
      '<div class="card-name">' + esc(name) + '</div>' +
      '<div class="card-vendor">' + esc(font.vendor) + '</div>' +
      '<div class="card-meta">' + badges + '</div>' +
      '</a>';
  }

  function render() {
    if (!grid) return;
    var filtered = data.filter(match);
    if (filtered.length === 0) {
      grid.innerHTML = '<div class="empty-state">没有匹配的字体</div>';
      return;
    }
    grid.innerHTML = filtered.map(cardHTML).join('');
  }

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

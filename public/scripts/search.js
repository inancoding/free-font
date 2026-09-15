(function () {
  var data = [];
  var grid = document.getElementById('font-grid');
  var searchInput = document.getElementById('search-input');
  var categoryFilters = document.getElementById('category-filters');
  var langFilters = document.getElementById('lang-filters');
  var tagFilters = document.getElementById('tag-filters');

  var activeCategory = '';
  var activeLang = '';
  var activeTag = '';
  var query = '';

  var LANG_NAMES = {
    'zh-Hans': '简体中文',
    'zh-Hant': '繁体中文',
    en: '英语',
    ja: '日语',
    ko: '韩语',
    vi: '越南语',
    th: '泰语',
    ar: '阿拉伯语',
    ru: '俄语',
    el: '希腊语',
  };

  function langName(code) {
    return LANG_NAMES[code] || code;
  }

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
    if (tagFilters) {
      tagFilters.addEventListener('click', function (e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;
        var val = btn.dataset.value || '';
        activeTag = activeTag === val ? '' : val;
        updateButtons(tagFilters, activeTag);
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
    if (activeTag && font.tags.indexOf(activeTag) === -1) return false;
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

    var preview = font.cover
      ? '<img class="preview-img" src="images/' + font.cover + '" alt="' + esc(name) + '">'
      : '<div class="preview-placeholder">' + esc((font.name.zh || font.name.en || '?').charAt(0)) + '</div>';

    var badges = '<span class="badge badge-license">' + esc(font.license) + '</span>';
    if (font.category) {
      badges += ' <span class="badge badge-category">' + esc(font.category) + '</span>';
    }
    var shownLangs = font.languages.slice(0, 3);
    shownLangs.forEach(function (l) {
      badges += ' <span class="badge badge-lang">' + esc(langName(l)) + '</span>';
    });
    if (font.tags) {
      font.tags.slice(0, 2).forEach(function (t) {
        badges += ' <span class="badge badge-tag">' + esc(t) + '</span>';
      });
    }

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

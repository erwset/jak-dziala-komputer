// Ustawia motyw zanim strona sie narysuje (zwykly skrypt, nie modul).
(function () {
  var saved = null;
  try { saved = localStorage.getItem('cw-theme'); } catch (e) {}
  var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
})();

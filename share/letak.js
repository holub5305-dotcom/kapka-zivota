/* Kapka života — leták: tlačítko Vytisknout (v1.2.8: přesunuto ze stránky kvůli CSP bez inline skriptů).
 * Autor projektu: Vladimír Holub. © 2026 Vladimír Holub. Všechna práva vyhrazena. */
(function () {
  var btn = document.getElementById('print-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      window.print();
    });
  }
})();

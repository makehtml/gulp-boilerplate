(function () {
  var nav = document.querySelector('.nav');
  var menu = nav.querySelector('.menu');
  var hamburger = nav.querySelector('.hamburger');

  hamburger.addEventListener('click', onHamburgerClick);

  function removeNoJs() {
    menu.classList.remove('menu--no-js');
  }

  function onHamburgerClick() {
    hamburger.classList.toggle('is-active');
    menu.classList.toggle('menu--active');
  }

  removeNoJs();
})();

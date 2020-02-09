/**
 * Меню в навигации сайта
 */
function setupMenusToggling() {
  const menuClass = '';
  const toggleClass = '';
  let menus = document.querySelectorAll(menuClass);
  let toggle = document.querySelector(toggleClass);

  /**
   * Скрытие всех меню в мобильной версии, если js подгрузился
   */
  menus.forEach(menu => {
    menu.classList.remove(`.${menuClass}--no-js`);
  });

  /**
   * Скрытие/открытие меню навигации сайта в мобильной и планшетной версии
   */
  toggle.addEventListener('click', ()=> {
    menus.forEach(menu => {
      menu.classList.toggle(`.${menuClass}--open`);
    })
  });
};

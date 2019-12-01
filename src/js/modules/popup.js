/**
 * Все попапы, оверлей и кнопки открытия/скрытия попапа
 */
const popups = document.querySelectorAll('.popup');

/**
 * Скрытия любого попапа при клике на оверлей
 */
overlay.addEventListener('click', ()=> {
  popups.forEach(popup=>{
    popup.classList.remove('popup--show');
  });
  overlay.classList.remove('overlay--show');
});

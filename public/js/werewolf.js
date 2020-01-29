export function Werewolf() {
  let ol = document.createElement('ol');

  for(i = 0; i < 3; i++){
    let button = document.createElement('button');
    button.innerHTML = 'Center Card #' + (i + 1);
    ol.appendChild(button);
}

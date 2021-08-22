export const bottomNotify = (type, content, timeout) => {
  const container = document.createElement('div');
  const text = document.createElement('span');
  container.classList.add('bottom-notify');
  container.classList.add(`bottom-notify--${type}`);
  container.classList.add('fadeInUp'); // anim
  text.innerText = content;
  container.appendChild(text);
  const timestamp = Date.now();
  container.id = `bottom-notify-${timestamp}`;
  document.body.appendChild(container);
  if (timeout) {
    setTimeout(() => {
      const el = document.querySelector(`#bottom-notify-${timestamp}`);
      if (el) {
        el.classList.remove('fadeInUp');
        el.classList.add('fadeOutDown');
        setTimeout(() => {
          document.body.removeChild(el);
        }, 300);
      }
    }, timeout + 300);
  }
};

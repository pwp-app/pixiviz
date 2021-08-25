let showed = false;

const queue = [];

export const bottomNotify = (type, content, timeout) => {
  if (showed) {
    queue.push([type, content, timeout]);
    return;
  }
  showed = true;
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
      container.classList.remove('fadeInUp');
      container.classList.add('fadeOutDown');
      setTimeout(() => {
        document.body.removeChild(container);
        showed = false;
        setTimeout(() => {
          if (queue.length) {
            const next = queue.shift();
            bottomNotify.call(null, ...next);
          }
        }, 100);
      }, 300);
    }, timeout + 300);
  }
};

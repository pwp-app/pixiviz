export const registerThemeColorHandler = () => {
  window.addEventListener('storage', () => {
    const value = window.localStorage.getItem('enable-dark');
    if (value === 'true') {
      !document.documentElement.classList.contains('dark') &&
        document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.contains('dark') &&
        document.documentElement.classList.remove('dark');
    }
  });
};

export const updateThemeColor = () => {
  setTimeout(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    const bgColor = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue('--background-primary')
      .trim();
    meta.setAttribute('content', bgColor);
  });
};

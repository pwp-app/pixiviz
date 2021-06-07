export const downloadFromBlob = (blobUrl, filename) => {
  const saveLink = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
  saveLink.download = filename;
  saveLink.href = blobUrl;
  const event = new MouseEvent('click');
  setTimeout(() => {
    saveLink.dispatchEvent(event);
  });
};

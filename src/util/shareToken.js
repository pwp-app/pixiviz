import { md5 } from 'hash-wasm';
import { nanoid } from 'nanoid';

export const getShareToken = async () => {
  let token;
  try {
    token = (await md5(window.aegis?.bean?.aid)) || nanoid();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  return token || nanoid();
};

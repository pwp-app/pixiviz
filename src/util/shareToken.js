import { md5 } from 'hash-wasm';
import { nanoid } from 'nanoid';

export const getShareToken = async () => {
  let token;
  try {
    const userAid = window.aegis?.bean?.aid;
    if (userAid) {
      token = await md5(userAid);
    } else {
      token = nanoid();
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  return token || nanoid();
};

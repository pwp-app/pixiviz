import { nanoid } from 'nanoid';

export const getShareToken = () => window.aegis?.bean?.id || nanoid();

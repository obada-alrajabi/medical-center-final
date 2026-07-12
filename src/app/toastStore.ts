import type { ToastItem } from './types';

type _TL = (t: ToastItem) => void;
type _RL = (id: number) => void;

let _toastSeq = 0;
export const _toastAdd: _TL[] = [];
export const _toastRem: _RL[] = [];

export function fireToast(msg: string, type: ToastItem["type"] = "success"): void {
  const id = ++_toastSeq;
  _toastAdd.forEach(l => l({ id, msg, type }));
  setTimeout(() => _toastRem.forEach(l => l(id)), 3500);
}

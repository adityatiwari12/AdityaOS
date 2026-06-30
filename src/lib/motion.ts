import type { Transition } from 'framer-motion';

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 28,
  mass: 1,
};

export const springBouncy: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 22,
  mass: 0.9,
};

export const springWindow: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 32,
  mass: 1,
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: springGentle,
};

import { kitPerreria } from './perreria';
import { kitHamburgueseria } from './hamburgueseria';
import { kitPizzeria } from './pizzeria';
import { kitRestaurante } from './restaurante';
import { Kit } from './types';

export const availableKits: Kit[] = [
  kitPerreria,
  kitHamburgueseria,
  kitPizzeria,
  kitRestaurante
];

export * from './types';
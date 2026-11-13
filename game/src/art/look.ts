import type { Rgb } from './pixelCanvas';

/** How a character is drawn. Colours are 0xRRGGBB. */
export interface Look {
  hair: Rgb;
  top: Rgb;
  bottom: Rgb;
  shoes: Rgb;
  /** Backpack colour, if they carry one. */
  bag?: Rgb;
  glasses?: boolean;
  /** Tudung (headscarf) colour; replaces the hair when set. */
  tudung?: Rgb;
  /** Hair falls past the shoulders. */
  longHair?: boolean;
  /** A long coat over the top (e.g. a lab coat), drawn down to the knees. */
  coat?: Rgb;
}

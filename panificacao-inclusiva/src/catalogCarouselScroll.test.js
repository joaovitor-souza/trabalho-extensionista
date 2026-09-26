import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  adjacentCardIndex,
  carouselScrollTargetLeft,
  carouselStepPixels,
  leadingCardIndex,
  resolveCarouselCurrentIndex,
} from './catalogCarouselScroll.js';

const cards = [{ offsetLeft: 0 }, { offsetLeft: 322 }, { offsetLeft: 644 }];

describe('leadingCardIndex', () => {
  it('returns the card aligned with scrollLeft at the start', () => {
    assert.equal(leadingCardIndex(cards, 0), 0);
    assert.equal(leadingCardIndex(cards, 322), 1);
    assert.equal(leadingCardIndex(cards, 644), 2);
  });

  it('snaps to the nearest card when scroll is between cards', () => {
    assert.equal(leadingCardIndex(cards, 50), 0);
    assert.equal(leadingCardIndex(cards, 315), 1);
    assert.equal(leadingCardIndex(cards, 400), 1);
  });

  it('after first move, second right step increments index even with next card peeking', () => {
    const scrollLeftAfterFirstMove = 315;
    const current = leadingCardIndex(cards, scrollLeftAfterFirstMove);
    assert.equal(current, 1);

    const secondTarget = adjacentCardIndex(current, 'right', cards.length);
    assert.equal(secondTarget, 2);
    assert.notEqual(secondTarget, current);
  });
});

describe('adjacentCardIndex', () => {
  it('moves one index at a time and clamps at edges', () => {
    assert.equal(adjacentCardIndex(0, 'left', 3), 0);
    assert.equal(adjacentCardIndex(0, 'right', 3), 1);
    assert.equal(adjacentCardIndex(2, 'right', 3), 2);
    assert.equal(adjacentCardIndex(2, 'left', 3), 1);
  });
});

describe('carouselStepPixels', () => {
  it('is one card width plus gap', () => {
    assert.equal(carouselStepPixels(300, 22), 322);
  });
});

describe('carouselScrollTargetLeft', () => {
  it('subtracts track padding from card offset', () => {
    assert.equal(carouselScrollTargetLeft({ offsetLeft: 322 }, 16), 306);
    assert.equal(carouselScrollTargetLeft({ offsetLeft: 8 }, 16), 0);
  });
});

describe('resolveCarouselCurrentIndex', () => {
  it('uses pending target index while smooth scroll is in flight', () => {
    const track = {
      scrollLeft: 120,
      dataset: { carouselTargetIndex: '1' },
    };

    assert.equal(resolveCarouselCurrentIndex(track, cards), 1);
  });

  it('clears pending target once scroll settles on the card', () => {
    const track = {
      scrollLeft: carouselScrollTargetLeft(cards[1], 0),
      dataset: { carouselTargetIndex: '1' },
    };

    assert.equal(resolveCarouselCurrentIndex(track, cards), 1);
    assert.equal(track.dataset.carouselTargetIndex, undefined);
  });
});

export const CATALOG_CARD_SELECTOR = '.catalog-product-card';

const SCROLL_SETTLE_TOLERANCE_PX = 12;

/**
 * Index of the card whose snap position is nearest to scrollLeft.
 * Avoids treating a peeking next card as the active slide.
 * @param {{ offsetLeft: number }[]} cards
 */
export function leadingCardIndex(cards, scrollLeft) {
  if (cards.length === 0) return -1;

  let nearestIndex = 0;
  let nearestDistance = Infinity;

  for (let i = 0; i < cards.length; i += 1) {
    const distance = Math.abs(cards[i].offsetLeft - scrollLeft);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = i;
    }
  }

  return nearestIndex;
}

export function adjacentCardIndex(currentIndex, direction, total) {
  if (currentIndex < 0 || total === 0) return -1;
  if (direction === 'right') return Math.min(currentIndex + 1, total - 1);
  return Math.max(currentIndex - 1, 0);
}

export function carouselStepPixels(cardWidth, gap) {
  return cardWidth + gap;
}

/** @param {{ offsetLeft: number }} card */
export function carouselScrollTargetLeft(card, paddingLeft = 0) {
  return Math.max(0, card.offsetLeft - paddingLeft);
}

/** @param {HTMLElement} track */
export function readTrackPaddingLeft(track) {
  if (typeof getComputedStyle === 'undefined') return 0;
  const padding = parseFloat(getComputedStyle(track).paddingLeft);
  return Number.isFinite(padding) ? padding : 0;
}

/**
 * @param {HTMLElement} track
 * @param {{ offsetLeft: number }[]} cards
 */
export function resolveCarouselCurrentIndex(track, cards) {
  const paddingLeft = readTrackPaddingLeft(track);
  let current = leadingCardIndex(cards, track.scrollLeft);

  const pendingRaw = track.dataset.carouselTargetIndex;
  if (pendingRaw === undefined) return current;

  const pending = Number.parseInt(pendingRaw, 10);
  if (!Number.isFinite(pending) || pending < 0 || pending >= cards.length) {
    delete track.dataset.carouselTargetIndex;
    return current;
  }

  const targetLeft = carouselScrollTargetLeft(cards[pending], paddingLeft);
  if (Math.abs(track.scrollLeft - targetLeft) > SCROLL_SETTLE_TOLERANCE_PX) {
    return pending;
  }

  delete track.dataset.carouselTargetIndex;
  return leadingCardIndex(cards, track.scrollLeft);
}

/**
 * @param {HTMLElement | null} track
 * @param {'left' | 'right'} direction
 */
export function scrollCatalogCarousel(track, direction) {
  if (!track) return;

  const cards = Array.from(track.querySelectorAll(CATALOG_CARD_SELECTOR));
  if (cards.length === 0) return;

  const paddingLeft = readTrackPaddingLeft(track);
  const current = resolveCarouselCurrentIndex(track, cards);
  const next = adjacentCardIndex(current, direction, cards.length);
  if (next === current || next < 0) return;

  const targetLeft = carouselScrollTargetLeft(cards[next], paddingLeft);
  track.dataset.carouselTargetIndex = String(next);
  track.scrollTo({ left: targetLeft, behavior: 'smooth' });
}

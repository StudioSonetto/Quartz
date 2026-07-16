import type { Command } from "#shared/types";

const next: Command = {
  id: "core.slide.next",
  title: "Next Slide",
  category: "Slide",
  icon: "i-carbon-chevron-right",
  when: (ctx) => ctx.deck.currentSlidesIndex < ctx.deck.slides.length - 1,
  run: (ctx) => ctx.deck.nextSlides(),
};

const prev: Command = {
  id: "core.slide.prev",
  title: "Previous Slide",
  category: "Slide",
  icon: "i-carbon-chevron-left",
  when: (ctx) => ctx.deck.currentSlidesIndex > 0,
  run: (ctx) => ctx.deck.prevSlides(),
};

const add: Command = {
  id: "core.slide.add",
  title: "Add Slide",
  category: "Slide",
  icon: "i-carbon-add",
  when: (ctx) => !!ctx.deckId,
  run: async (ctx) => {
    if (!ctx.deckId) return;
    await ctx.deck.insertNewSlides(ctx.deckId);
    await ctx.deck.fetchAllSlides(ctx.deckId);
  },
};

export default [next, prev, add];

import { animate, inView } from "motion";

export function useReveal(root: Readonly<Ref<HTMLElement | null>>) {
  onMounted(() => {
    const items = root.value!.querySelectorAll<HTMLElement>("[data-reveal]");
    const opacity = new Map(
      [...items].map((item) => [item, +getComputedStyle(item).opacity]),
    );

    animate(items, { opacity: 0, y: 60 }, { duration: 0 });

    let batch = 0;

    onBeforeUnmount(
      inView(
        items,
        (el) => {
          const item = el as HTMLElement;

          if (!batch) requestAnimationFrame(() => (batch = 0));

          animate(
            item,
            { opacity: opacity.get(item), y: 0 },
            {
              duration: 0.9,
              delay: Math.min(batch++, 4) * 0.15,
              ease: [0.16, 1, 0.3, 1],
            },
          ).then(() => (item.style.opacity = item.style.transform = ""));
        },
        { amount: 0.3 },
      ),
    );
  });
}

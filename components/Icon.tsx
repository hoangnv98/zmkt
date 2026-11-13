const PATHS = {
  check: "M3 8.5l3.2 3.2L13 4.8",
  x: "M4 4l8 8M12 4l-8 8",
  arrow: "M3 8h10M9 4l4 4-4 4",
  back: "M13 8H3M7 4L3 8l4 4",
  down: "M4 6l4 4 4-4",
  stop: "M4.5 4.5h7v7h-7z",
  chat: "M3 3.5h10v7H7l-3 2.5v-2.5H3z",
  clock: "M8 4.5V8l2.2 1.6M14 8A6 6 0 112 8a6 6 0 0112 0z",
  dot: "M8 6.2a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6z",
  plus: "M8 3v10M3 8h10",
  bag: "M3.5 5.5h9l-.8 8h-7.4zM6 5.5V4.5a2 2 0 014 0v1",
  send: "M8 13V3M3.5 7.5L8 3l4.5 4.5",
  eye: "M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8zM8 6.3a1.7 1.7 0 100 3.4 1.7 1.7 0 000-3.4z",
} as const;

export function Icon({ name, size = 14 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

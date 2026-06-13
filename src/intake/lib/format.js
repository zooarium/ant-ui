// Money formatting for the intake UI. Single place to change currency display.
export const money = (n) => (Number(n) || 0).toFixed(2);

// Intake env, re-exported from the single env source (src/infra/config.js).
// Intake lib/ imports from here so it never reads import.meta.env directly.
import { config } from '@/infra/config';

export const intakeConfig = config.intake;

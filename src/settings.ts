import { PluginSettings, S3Config, ReplacementType } from "./types";
import { FILE_CATEGORIES } from "./file-categories";

const DEFAULT_S3: S3Config = {
  provider: "r2",
  endpoint: "",
  region: "auto",
  bucketName: "",
  accessKeyId: "",
  secretAccessKey: "",
  customDomainName: "",
  pathTemplate: "attachments/{ext}/{hash2}/{hash}.{ext}",
};

const DEFAULT_ENABLED_EXTS: string[] = [
  "pdf",
  "mp3", "m4a", "wav",
  "mp4", "mov",
  "epub",
];

const DEFAULT_MIN_SIZE: Record<string, number> = {
  pdf: 1,
  mp3: 10, m4a: 10, wav: 10,
  mp4: 0, mov: 0,
  epub: 10,
};

const DEFAULT_AUTO_CANDIDATE_EXTS: string[] = [
  "pdf",
  "mp3", "m4a", "wav",
  "mp4", "mov",
  "epub",
];

export const DEFAULT_SETTINGS: PluginSettings = {
  enabled: true,
  autoScanEnabled: false,
  scanIntervalMinutes: 30,
  quietSeconds: 600,
  autoScanMinSizeMiB: 0,
  attachmentRoot: "99 Attachments",
  deletePolicy: "confirm",
  autoDeleteDelayHours: 24,
  s3: DEFAULT_S3,
  enabledExtensions: DEFAULT_ENABLED_EXTS,
  minSizeRules: DEFAULT_MIN_SIZE,
  autoCandidateExts: DEFAULT_AUTO_CANDIDATE_EXTS,
  customExtensions: [],
  customReplacements: {},
  pendingDeletes: [],
  logs: [],
};

interface OldRule {
  extensions: string;
  minSizeMiB: number;
  autoCandidate: boolean;
  replacement: string;
}

interface OldLoadedSettings {
  r2?: Partial<S3Config>;
  rules?: OldRule[];
  [key: string]: any;
}

function migrateOldSettings(loaded: OldLoadedSettings): Partial<PluginSettings> {
  const result: Partial<PluginSettings> = {};

  if (loaded.r2) {
    result.s3 = {
      ...DEFAULT_S3,
      ...loaded.r2,
      provider: "r2",
      region: "auto",
    };
  }

  if (Array.isArray(loaded.rules) && loaded.rules.length > 0) {
    const enabledExtensions: string[] = [];
    const minSizeRules: Record<string, number> = {};
    const autoCandidateExts: string[] = [];
    const customReplacements: Record<string, ReplacementType> = {};

    for (const rule of loaded.rules) {
      const exts = rule.extensions
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      for (const ext of exts) {
        enabledExtensions.push(ext);
        minSizeRules[ext] = rule.minSizeMiB;
        if (rule.autoCandidate) autoCandidateExts.push(ext);
        if (rule.replacement !== FILE_CATEGORIES.find((c) => c.extensions.includes(ext))?.replacement) {
          customReplacements[ext] = rule.replacement as ReplacementType;
        }
      }
    }

    result.enabledExtensions = enabledExtensions;
    result.minSizeRules = minSizeRules;
    result.autoCandidateExts = autoCandidateExts;
    result.customReplacements = customReplacements;
  }

  return result;
}

export function mergeSettings(defaults: PluginSettings, loaded: any): PluginSettings {
  const migrated = migrateOldSettings(loaded || {});

  const s3Data = loaded?.s3 || migrated.s3 || loaded?.r2 || {};
  const s3: S3Config = {
    ...defaults.s3,
    ...s3Data,
    provider: s3Data.provider || (loaded?.r2 ? "r2" : "r2"),
    region: s3Data.region || (s3Data.provider === "r2" || loaded?.r2 ? "auto" : "us-east-1"),
  };

  return {
    ...defaults,
    ...loaded,
    ...migrated,
    s3,
    enabledExtensions: migrated.enabledExtensions || loaded?.enabledExtensions || defaults.enabledExtensions,
    minSizeRules: migrated.minSizeRules || loaded?.minSizeRules || defaults.minSizeRules,
    autoCandidateExts: migrated.autoCandidateExts || loaded?.autoCandidateExts || defaults.autoCandidateExts,
    customExtensions: loaded?.customExtensions || defaults.customExtensions,
    customReplacements: migrated.customReplacements || loaded?.customReplacements || defaults.customReplacements,
    pendingDeletes: Array.isArray(loaded?.pendingDeletes) ? loaded.pendingDeletes : [],
    logs: Array.isArray(loaded?.logs) ? loaded.logs.slice(0, 100) : [],
  };
}

export function getReplacementForExt(
  ext: string,
  settings: PluginSettings
): ReplacementType {
  if (settings.customReplacements[ext]) return settings.customReplacements[ext];
  const allExts = [...FILE_CATEGORIES.flatMap((c) => c.extensions), ...settings.customExtensions];
  if (!allExts.includes(ext) && !settings.enabledExtensions.includes(ext)) return "markdown";
  const category = FILE_CATEGORIES.find((c) => c.extensions.includes(ext));
  return category?.replacement || "markdown";
}

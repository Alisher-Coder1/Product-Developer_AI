import fs from "fs/promises";
import path from "path";

async function loadConfig(projectPath, config = null) {
  if (config) return config;

  const configPath = path.join(projectPath, "architecture", "stages-config.json");
  try {
    const raw = await fs.readFile(configPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Failed to load config: ${err.message}`);
  }
}

async function artifactExists(projectPath, artifact) {
  const fullPath = path.join(projectPath, artifact);
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

export async function getMissingArtifacts(stage, projectPath, config = null) {
  const loadedConfig = await loadConfig(projectPath, config);

  if (!loadedConfig.stages?.[stage]) {
    throw new Error(`Unknown stage: ${stage}`);
  }

  const requiredArtifacts = loadedConfig.stages[stage].requiredArtifacts || [];
  const results = await Promise.all(
    requiredArtifacts.map(artifact => artifactExists(projectPath, artifact))
  );
  return requiredArtifacts.filter((_, idx) => !results[idx]);
}

export async function canTransition(currentStage, targetStage, projectPath, config = null) {
  try {
    const loadedConfig = await loadConfig(projectPath, config);

    if (!loadedConfig.stages?.[currentStage]) {
      return { allowed: false, missingArtifacts: [], message: `Unknown current stage: ${currentStage}` };
    }
    if (!loadedConfig.stages?.[targetStage]) {
      return { allowed: false, missingArtifacts: [], message: `Unknown target stage: ${targetStage}` };
    }

    const missingArtifacts = await getMissingArtifacts(currentStage, projectPath, loadedConfig);

    if (missingArtifacts.length > 0) {
      return {
        allowed: false,
        missingArtifacts,
        message: "Stage transition denied: required artifacts are missing"
      };
    }

    return {
      allowed: true,
      missingArtifacts: [],
      message: "Stage transition allowed"
    };
  } catch (err) {
    return { allowed: false, missingArtifacts: [], message: err.message };
  }
}
#!/usr/bin/env node

import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const DEFAULT_MEDIA_DIRECTORY = 'entry/src/main/resources/base/media';
const HALF_STEP_EPSILON = 0.0001;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Extract file and node identifiers required by the REST API from a Figma design URL. */
export function parseFigmaUrl(rawUrl) {
  let figmaUrl;
  try {
    figmaUrl = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid Figma URL: ${rawUrl}`);
  }
  if (figmaUrl.protocol !== 'https:' || !['figma.com', 'www.figma.com'].includes(figmaUrl.hostname)) {
    throw new Error('Only https://www.figma.com/design/... URLs are supported');
  }
  const fileKeyMatch = figmaUrl.pathname.match(/^\/design\/([A-Za-z0-9]+)(?:\/|$)/);
  if (!fileKeyMatch) throw new Error('Unable to parse the Figma fileKey from /design/:fileKey/');
  const urlNodeId = figmaUrl.searchParams.get('node-id');
  if (!urlNodeId) throw new Error('Figma URL is missing node-id; provide a specific node URL');
  const nodeId = urlNodeId.replaceAll('-', ':');
  if (!/^\d+:\d+$/.test(nodeId)) throw new Error(`Invalid Figma node-id: ${urlNodeId}`);
  return { fileKey: fileKeyMatch[1], nodeId };
}

function isHalfStep(value) {
  return typeof value === 'number' && Number.isFinite(value) &&
    Math.abs(value * 2 - Math.round(value * 2)) <= HALF_STEP_EPSILON;
}

export function validateBoundaryDecision(decision) {
  if (!decision || decision.decisionStatus !== 'resolved') throw new Error('Resource boundary is unresolved; download is forbidden');
  if (!decision.visualClosureDecisionId || decision.visualClosureDecisionStatus !== 'confirmed') {
    throw new Error('Resource lacks an AI-confirmed visual-closure decision; download is forbidden');
  }
  if (!['clean', 'manual-approved'].includes(decision.purityStatus)) throw new Error('Resource-boundary purity is unconfirmed; download is forbidden');
  if (decision.purityStatus === 'manual-approved' && decision.manualDecision !== 'accept-current-boundary') {
    throw new Error('Manually approved boundary lacks an explicit decision; download is forbidden');
  }
  if (!decision.selectedBounds || !decision.imageDisplaySize) throw new Error('Resource boundary is missing dimensions');
  for (const key of ['x', 'y', 'width', 'height']) {
    if (!isHalfStep(decision.selectedBounds[key])) throw new Error(`Resource-boundary ${key} is neither an integer nor a .5 value`);
  }
  if (decision.selectedBounds.width !== decision.imageDisplaySize.width ||
      decision.selectedBounds.height !== decision.imageDisplaySize.height) {
    throw new Error('Image display dimensions do not match the export boundary');
  }
  const parsed = parseFigmaUrl(decision.figmaNodeUrl);
  const inheritedMatch = decision.selectedExportNodeId?.match(/^I(\d+:\d+);/);
  const addressableNodeId = inheritedMatch?.[1] ?? decision.selectedExportNodeId;
  if (parsed.nodeId !== addressableNodeId) throw new Error('Figma URL does not match the selected export boundary');
  if ((decision.layoutSlotNodeIds ?? []).includes(decision.selectedExportNodeId)) {
    throw new Error('Selected export node is a layout slot');
  }
  return { fileKey: parsed.fileKey, nodeId: decision.selectedExportNodeId };
}

export function validatePngPixelSize(logicalSize, pixelSize) {
  const scaled = logicalSize * 3;
  if (Number.isInteger(logicalSize)) return pixelSize === scaled;
  return isHalfStep(logicalSize) && (pixelSize === Math.floor(scaled) || pixelSize === Math.ceil(scaled));
}

export function buildExportApiUrl(fileKey, nodeId) {
  const query = new URLSearchParams({
    ids: nodeId,
    format: 'png',
    scale: '3',
    contents_only: 'true',
    use_absolute_bounds: 'true'
  });
  return `https://api.figma.com/v1/images/${fileKey}?${query.toString()}`;
}

function resolveFileName(fileName, nodeId) {
  const defaultName = `figma_${nodeId.replace(/[^A-Za-z0-9]+/g, '_').toLowerCase()}_3x.png`;
  const resolvedName = fileName ? (fileName.endsWith('.png') ? fileName : `${fileName}.png`) : defaultName;
  if (path.basename(resolvedName) !== resolvedName) throw new Error('fileName must be a file name without a directory');
  const resourceName = resolvedName.slice(0, -4);
  if (!/^[a-z][a-z0-9_]*$/.test(resourceName)) {
    throw new Error('fileName must follow HarmonyOS media naming: start with a lowercase letter and contain only lowercase letters, digits, and underscores');
  }
  return { fileName: resolvedName, resourceName };
}

async function assertFileAbsent(filePath, shouldOverwrite) {
  if (shouldOverwrite) return;
  try {
    await access(filePath);
  } catch {
    return;
  }
  throw new Error(`Target file already exists: ${filePath}; pass --overwrite only after confirming replacement`);
}

async function fetchOrThrow(url, options, purpose) {
  const response = await fetch(url, options);
  if (response.ok) return response;
  const errorBody = (await response.text()).slice(0, 500);
  throw new Error(`${purpose} failed (HTTP ${response.status}): ${errorBody || response.statusText}`);
}

function readPngSize(imageBytes) {
  if (imageBytes.length < 24 || !imageBytes.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Figma response is not a valid PNG');
  }
  return { width: imageBytes.readUInt32BE(16), height: imageBytes.readUInt32BE(20) };
}

/** Export and immediately save a 3x PNG for a node using a resolved boundary decision. */
export async function downloadFigmaNodePng(options) {
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new Error('Missing FIGMA_TOKEN; configure a Figma Personal Access Token in the current shell');
  const decision = options.boundaryDecision;
  const parsed = validateBoundaryDecision(decision);
  const naming = resolveFileName(options.fileName, parsed.nodeId);
  const outputDirectory = path.resolve(options.outputDirectory || DEFAULT_MEDIA_DIRECTORY);
  const localFilePath = path.join(outputDirectory, naming.fileName);
  await assertFileAbsent(localFilePath, options.overwrite === true);

  const exportResponse = await fetchOrThrow(buildExportApiUrl(parsed.fileKey, parsed.nodeId), {
    headers: { 'X-Figma-Token': token }
  }, 'Requesting the Figma PNG export URL');
  const exportResult = await exportResponse.json();
  const imageUrl = exportResult.images?.[parsed.nodeId];
  if (typeof imageUrl !== 'string' || imageUrl.length === 0) {
    const detail = exportResult.err ? `: ${exportResult.err}` : '';
    throw new Error(`Figma did not return an image URL for node ${parsed.nodeId}${detail}`);
  }

  const imageResponse = await fetchOrThrow(imageUrl, {}, 'Downloading the Figma PNG');
  const imageBytes = Buffer.from(await imageResponse.arrayBuffer());
  const imageSize = readPngSize(imageBytes);
  if (!validatePngPixelSize(decision.imageDisplaySize.width, imageSize.width) ||
      !validatePngPixelSize(decision.imageDisplaySize.height, imageSize.height)) {
    throw new Error(`PNG pixel dimensions ${imageSize.width}x${imageSize.height} do not match the export boundary`);
  }

  const temporaryFilePath = `${localFilePath}.tmp-${process.pid}-${Date.now()}`;
  await mkdir(outputDirectory, { recursive: true });
  try {
    await writeFile(temporaryFilePath, imageBytes);
    await rename(temporaryFilePath, localFilePath);
  } finally {
    await rm(temporaryFilePath, { force: true });
  }

  return {
    boundaryDecisionId: decision.boundaryDecisionId,
    fileKey: parsed.fileKey,
    nodeId: parsed.nodeId,
    localFilePath,
    resourceName: naming.resourceName,
    arkUiUsage: `Image($r('app.media.${naming.resourceName}'))`,
    logicalWidth: decision.imageDisplaySize.width,
    logicalHeight: decision.imageDisplaySize.height,
    pixelWidth: imageSize.width,
    pixelHeight: imageSize.height
  };
}

function parseArguments(argumentsList) {
  const options = { overwrite: false };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--boundary-manifest') options.boundaryManifest = argumentsList[++index];
    else if (argument === '--decision-id') options.decisionId = argumentsList[++index];
    else if (argument === '--output-dir') options.outputDirectory = argumentsList[++index];
    else if (argument === '--file-name' || argument === '--fileName') options.fileName = argumentsList[++index];
    else if (argument === '--overwrite') options.overwrite = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  if (!options.boundaryManifest || !options.decisionId) {
    throw new Error('Usage: node download_figma_png.mjs --boundary-manifest <boundary-report.json> --decision-id <ID> [--output-dir <directory>] [--file-name <file-name>] [--overwrite]');
  }
  return options;
}

async function runCli() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const manifest = JSON.parse(await readFile(options.boundaryManifest, 'utf8'));
    const decisions = manifest.decisions ?? manifest.exportBoundaryDecision ?? [];
    const boundaryDecision = decisions.find((decision) => decision.boundaryDecisionId === options.decisionId);
    if (!boundaryDecision) throw new Error(`Decision not found in boundary report: ${options.decisionId}`);
    const result = await downloadFigmaNodePng({ ...options, boundaryDecision });
    console.log(`Local file path: ${result.localFilePath}`);
    console.log(`resourceName: ${result.resourceName}`);
    console.log(`ArkUI usage: ${result.arkUiUsage}`);
    console.log(`Logical dimensions: ${result.logicalWidth}x${result.logicalHeight}`);
    console.log(`PNG pixel dimensions: ${result.pixelWidth}x${result.pixelHeight}`);
  } catch (error) {
    console.error(`[figma-asset-download] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await runCli();

/**
 *  API stworzone przez:
 * @author Denis Rudolf Damian Kontek
 * @copyright Denis Rudolf Damian Kontek
 * @license UNLICENSED
 * @async
 * @example
 * import FTPlog = api.logger("FTP" // domyślnie ./Data/logs
 * import FTPlog = api.logger("FTP","./Data/logs"
 * FTPlog("Wczytano config"    // poziom "info", wyświetla w konsoli
 * FTPlog("Wczytano config", "error", false
 * api.zapisz("/logs/log.json", {data: "12.05.2025", text: "Zapisano config"}
 * api.wczytaj("./config/config.json"
 * @since 1.0.0v
 */
"use strict";
// C++ Imports
type tSoulAPIc = {
  add: (a: number, b: number) => number;
};
import { createRequire } from "node:module";
// Tworzymy require i od razu importujemy binarkę
export const { add } = createRequire(import.meta.url)(
  "../C++/build/Release/SoulAPI.node"
) as tSoulAPIc;
// TypeScript/JavaScript Imports
import CONFIG, { type config as tempConfig } from "./Data/config/config.js";
import logger from "./Data/functions/logs.js";
import connectMongo from "./Data/tools/connectMongo.js";
import readMongo from "./Data/tools/readMongo.js";
import writeMongo from "./Data/tools/writeMongo.js";
import updateMongo from "./Data/tools/updateMongo.js";
import deleteMongo from "./Data/tools/deleteMongo.js";
import {
  downloadFiles,
  uploadFiles,
  deleteFiles,
} from "./Data/tools/controlFilesMongo.js";
import res from "./Data/servers/http/res.js";
import sendH1 from "./Data/servers/http/sendH1.js";
import sendH2 from "./Data/servers/http/sendH2.js";
import isBlockedIp from "./Data/functions/isBlockedIp.js";
import ipFromSocket from "./Data/functions/ipFromSocket.js";
import getIp from "./Data/functions/getIp.js";
import pickRoot from "./Data/functions/pickRoot.js";
import safePath from "./Data/functions/safePath.js";
import guessMime from "./Data/functions/guessMime.js";
import createDefaultFirstRunFile from "./Data/functions/createDefaultFirstRunFile.js";
import compareSemVer from "./Data/tools/compareSemVer.js";
import {
  autoRead,
  autoWrite,
  download,
  send,
  watchFile,
  extract,
} from "./Data/functions/soulFS.js";
import ipcRequest from "./Data/functions/ipcBridge.js";
import Router from "./Data/objects/router.js";
import HTTPServer from "./Data/objects/HTTPServer.js";
import CreateServer from "./Data/objects/createServer.js";
// Types
import type { config } from "./Data/types/createDefaultFirstRunFile.js";
import type { installProgramFile } from "./Data/functions/createDefaultFirstRunFile.js";
import type { LogItem, LogFunction } from "./Data/functions/logs.js";
// Exports
export default {
  logger,
  connectMongo,
  readMongo,
  writeMongo,
  updateMongo,
  deleteFiles,
  deleteMongo,
  downloadFiles,
  uploadFiles,
  res,
  sendH1,
  sendH2,
  isBlockedIp,
  ipFromSocket,
  getIp,
  pickRoot,
  safePath,
  guessMime,
  createDefaultFirstRunFile,
  compareSemVer,
  autoRead,
  autoWrite,
  download,
  send,
  watchFile,
  extract,
  ipcRequest,
  Router,
  HTTPServer,
  CreateServer,
  CONFIG,
  add,
};
export {
  logger,
  connectMongo,
  readMongo,
  writeMongo,
  updateMongo,
  deleteFiles,
  deleteMongo,
  downloadFiles,
  uploadFiles,
  res,
  sendH1,
  sendH2,
  isBlockedIp,
  ipFromSocket,
  getIp,
  pickRoot,
  safePath,
  guessMime,
  createDefaultFirstRunFile,
  compareSemVer,
  autoRead,
  autoWrite,
  download,
  send,
  watchFile,
  extract,
  ipcRequest,
  Router,
  HTTPServer,
  CreateServer,
  CONFIG,
};
// Types
export type { config, tempConfig, installProgramFile, LogItem, LogFunction };

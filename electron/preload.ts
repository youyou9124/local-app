import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("mleOptimizerTrainer", {
  platform: process.platform,
});

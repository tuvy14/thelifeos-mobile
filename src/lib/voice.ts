import Constants from "expo-constants";

/** Expo Go can't load the native speech-recognition module — only a dev build
 *  (or standalone/bare) can. Gate all voice features on this so Expo Go is safe. */
export const voiceSupported = Constants.executionEnvironment !== "storeClient";

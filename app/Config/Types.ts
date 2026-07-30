import { ImageContentPart, TextContentPart } from "./Interfaces";

export type MessageContent = string | Array<TextContentPart | ImageContentPart>;


export const CAPABILITY_KEYS = ["vision", "jsonSchema", "thinking", "tools"];

export type ModelCapabilities = Record<typeof CAPABILITY_KEYS[number],boolean>
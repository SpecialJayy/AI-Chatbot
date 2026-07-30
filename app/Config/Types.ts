import { ImageContentPart, TextContentPart } from "./Interfaces";

export type MessageContent = string | Array<TextContentPart | ImageContentPart>;
import OpenAI from "openai";
import { zodFunction } from "openai/helpers/zod";
import { z } from "zod";

// --- EXISTING TOOLS & SCHEMAS ---

const WeatherInput = z.object({
    city: z
        .string()
        .describe("Name of the city in English, example: Warsaw, London"),
});

const PingInput = z.object({});

type WeatherArgs = z.infer<typeof WeatherInput>;

// --- CALENDAR SCHEMAS ---

const AddToCalendarInput = z.object({
    date: z
        .string()
        .describe("Date of the event in YYYY-MM-DD format, e.g., '2026-08-20'"),
    eventName: z.string().describe("Name or description of the event"),
    importance: z
        .enum(["low", "medium", "high"])
        .describe("Priority level of the event"),
});

const RemoveFromCalendarInput = z.object({
    eventName: z
        .string()
        .describe("The exact name of the event to remove from the calendar"),
});

const GetTodaysEntriesInput = z.object({});
const GetTodaysDateInput = z.object({});

const GetAllEntriesInput = z.object({});

const GetEntriesForDayInput = z.object({
    date: z
        .string()
        .describe("The exact date to retrieve events for, in YYYY-MM-DD format (e.g., '2026-08-20')"),
});

// Inferred Types
type AddToCalendarArgs = z.infer<typeof AddToCalendarInput>;
type RemoveFromCalendarArgs = z.infer<typeof RemoveFromCalendarInput>;
type GetEntriesForDayArgs = z.infer<typeof GetEntriesForDayInput>;

// --- CALENDAR CLASS & DATA STORE ---

export class CalendarEntry {
    private date: string;
    private eventName: string;
    private importance: string;

    constructor(date: string, eventName: string, importance: string) {
        this.date = date;
        this.eventName = eventName;
        this.importance = importance;
    }

    public getDate(): string {
        return this.date;
    }
    public setDate(value: string) {
        this.date = value;
    }

    public getEventName(): string {
        return this.eventName;
    }
    public setEventName(value: string) {
        this.eventName = value;
    }

    public getImportance(): string {
        return this.importance;
    }
    public setImportance(value: string) {
        this.importance = value;
    }
}

// In-memory array for calendar entries
const calendar: CalendarEntry[] = [];

// --- HANDLERS ---

export const getWeather = async (
    rawArgs: unknown
): Promise<{ temperature_celsius: number }> => {
    const args: WeatherArgs = WeatherInput.parse(rawArgs);

    const url = `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${args.city}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch weather data`);

    const data = await response.json();
    return { temperature_celsius: data.current.temp_c };
};

export const ping = (): { message: string } => {
    return { message: "Server is reachable." };
};

export const getTodaysDate = (): { date: string } => {
    const today = new Date().toISOString().split("T")[0];
    return { date: today };
};

export const addToCalendar = (
    rawArgs: unknown
): { success: boolean; message: string; entry: { date: string; eventName: string; importance: string } } => {
    const args: AddToCalendarArgs = AddToCalendarInput.parse(rawArgs);
    const entry = new CalendarEntry(args.date, args.eventName, args.importance);
    calendar.push(entry);

    return {
        success: true,
        message: `Added event '${args.eventName}' on ${args.date}.`,
        entry: {
            date: entry.getDate(),
            eventName: entry.getEventName(),
            importance: entry.getImportance(),
        },
    };
};

export const removeFromCalendar = (
    rawArgs: unknown
): { success: boolean; message: string } => {
    const args: RemoveFromCalendarArgs = RemoveFromCalendarInput.parse(rawArgs);
    const initialLength = calendar.length;

    const index = calendar.findIndex(
        (e) => e.getEventName().toLowerCase() === args.eventName.toLowerCase()
    );

    if (index === -1) {
        return { success: false, message: `Event '${args.eventName}' not found.` };
    }

    calendar.splice(index, 1);
    return {
        success: true,
        message: `Successfully removed event '${args.eventName}'.`,
    };
};

export const getTodaysEntries = (): {
    entries: { date: string; eventName: string; importance: string }[];
} => {
    const today = new Date().toISOString().split("T")[0];
    const entries = calendar
        .filter((entry) => entry.getDate() === today)
        .map((entry) => ({
            date: entry.getDate(),
            eventName: entry.getEventName(),
            importance: entry.getImportance(),
        }));

    return { entries };
};

export const getAllEntries = (): {
    entries: { date: string; eventName: string; importance: string }[];
} => {
    const entries = calendar.map((entry) => ({
        date: entry.getDate(),
        eventName: entry.getEventName(),
        importance: entry.getImportance(),
    }));

    return { entries };
};

export const getEntriesForDay = (
    rawArgs: unknown
): { entries: { date: string; eventName: string; importance: string }[] } => {
    const args: GetEntriesForDayArgs = GetEntriesForDayInput.parse(rawArgs);

    const entries = calendar
        .filter((entry) => entry.getDate() === args.date)
        .map((entry) => ({
            date: entry.getDate(),
            eventName: entry.getEventName(),
            importance: entry.getImportance(),
        }));

    return { entries };
};

// --- TOOL DEFINITIONS ---

export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    zodFunction({
        name: "getWeather",
        description:
            "Get the current temperature for a specific location using city name. Returns current temperature in °C.",
        parameters: WeatherInput,
    }),
    zodFunction({
        name: "ping",
        description:
            "Ping the server to verify connectivity. Returns a simple success message.",
        parameters: PingInput,
    }),
    zodFunction({
        name: "getTodaysDate",
        description:
            "Returns today's date in YYYY-MM-DD format. Useful when the user asks relative questions like 'what date is today?'.",
        parameters: GetTodaysDateInput,
    }),
    zodFunction({
        name: "addToCalendar",
        description:
            "Adds a new event entry to the calendar with a specified date, event name, and priority level.",
        parameters: AddToCalendarInput,
    }),
    zodFunction({
        name: "removeFromCalendar",
        description:
            "Removes an event from the calendar by matching its event name.",
        parameters: RemoveFromCalendarInput,
    }),
    zodFunction({
        name: "getTodaysEntries",
        description:
            "Retrieves all scheduled calendar events that match today's date.",
        parameters: GetTodaysEntriesInput,
    }), zodFunction({
        name: "getAllEntries",
        description: "Retrieves every scheduled event currently stored in the calendar.",
        parameters: GetAllEntriesInput,
    }),
    zodFunction({
        name: "getEntriesForDay",
        description: "Retrieves all scheduled calendar events that match a specific requested date.",
        parameters: GetEntriesForDayInput,
    }),
];

// --- TOOL HANDLERS REGISTRY ---

export const toolHandlers: Record<
    string,
    (args: any) => Promise<any> | any
> = {
    getWeather,
    ping,
    getTodaysDate,
    addToCalendar,
    removeFromCalendar,
    getTodaysEntries,
    getAllEntries,
    getEntriesForDay,
};
import z from "zod";

export const eventSchema = z.object({
  name: z.string().describe("Name of the event"),
  type: z.string().describe("Type of the event, example: conference, concert"),
  start_date: z.string().describe("Date at which the event starts"),
  end_date: z.string().nullable().describe("Date at which the event ends"),
  hour: z.string().nullable().describe("Time of the event, format HH:MM"),
  place: z.string().describe("Place at which the event will take place"),
  city: z.string().describe("City where the event will take place"),
  ticket_price: z.number().describe("Price of the cheapest ticket option"),
  event_organizer: z.string().describe("organizer responsible for the event"),
  description: z.string().describe("Brief description of the event, and activities"),
  tags: z.array(z.string()).describe("Tags associated with the event, used for example a search engine")
});
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { locationCatalog } from "../lib/location-catalog.js";
import { createRideBooking } from "../lib/ride-booking.js";
import { prisma } from "../lib/prisma.js";

export const ussdRouter = Router();

const ussdLocations = locationCatalog.filter((location) => location.label !== "Current location, East Legon");

type UssdRequestBody = {
  text?: string;
  phoneNumber?: string;
  msisdn?: string;
  sessionId?: string;
  serviceCode?: string;
};

function getMenuLines(items: string[]) {
  return items.map((item, index) => `${index + 1}. ${item}`);
}

function parseSelections(text: string | undefined) {
  return (text ?? "")
    .split("*")
    .map((value) => value.trim())
    .filter(Boolean);
}

function toMenu(message: string, terminal = false) {
  return `${terminal ? "END" : "CON"} ${message}`;
}

function resolveLocation(selection: string | undefined) {
  const index = Number(selection) - 1;

  if (!Number.isInteger(index) || index < 0 || index >= ussdLocations.length) {
    return null;
  }

  return ussdLocations[index];
}

async function findOrCreatePassenger(phone: string) {
  const existingUser = await prisma.user.findUnique({
    where: { phone }
  });

  if (existingUser) {
    if (existingUser.role !== "PASSENGER") {
      throw new Error("This phone number belongs to a driver account. Use a passenger number for USSD rides.");
    }

    return existingUser;
  }

  return prisma.user.create({
    data: {
      name: `Qiilu USSD ${phone.slice(-4)}`,
      phone,
      role: "PASSENGER",
      passwordHash: await bcrypt.hash(randomUUID(), 10),
      preferredPayment: "MOMO",
      momoProvider: "MTN MoMo",
      trustedContacts: [],
      lowBandwidthMode: true,
      safetyShareEnabled: false
    }
  });
}

ussdRouter.get("/locations", (_request, response) => {
  response.json({
    channel: "USSD",
    vehicle: "CAR",
    locations: ussdLocations.map((location, index) => ({
      option: index + 1,
      label: location.label
    }))
  });
});

ussdRouter.post("/entry", async (request, response) => {
  const body = request.body as UssdRequestBody;
  const phone = body.phoneNumber?.trim() || body.msisdn?.trim();
  const selections = parseSelections(body.text);

  response.type("text/plain");

  if (!phone) {
    response.status(400).send(toMenu("Phone number is required for USSD sessions.", true));
    return;
  }

  if (selections.length === 0) {
    response.send(
      toMenu(
        [
          "Welcome to Qiilu",
          "1. Request a car ride",
          "2. Help"
        ].join("\n")
      )
    );
    return;
  }

  if (selections[0] === "2") {
    response.send(
      toMenu(
        [
          "Qiilu USSD lets you book a car without internet.",
          "Dial again, choose 1, then pick pickup, destination, payment, and confirm."
        ].join("\n"),
        true
      )
    );
    return;
  }

  if (selections[0] !== "1") {
    response.send(toMenu("Invalid menu option. Dial again and choose 1 to request a ride.", true));
    return;
  }

  if (selections.length === 1) {
    response.send(
      toMenu(
        ["Choose pickup location", ...getMenuLines(ussdLocations.map((location) => location.label))].join("\n")
      )
    );
    return;
  }

  const pickup = resolveLocation(selections[1]);

  if (!pickup) {
    response.send(toMenu("Invalid pickup location. Dial again and choose a listed location.", true));
    return;
  }

  if (selections.length === 2) {
    response.send(
      toMenu(
        ["Choose destination", ...getMenuLines(ussdLocations.map((location) => location.label))].join("\n")
      )
    );
    return;
  }

  const destination = resolveLocation(selections[2]);

  if (!destination) {
    response.send(toMenu("Invalid destination. Dial again and choose a listed location.", true));
    return;
  }

  if (pickup.label === destination.label) {
    response.send(toMenu("Pickup and destination cannot be the same. Dial again and choose different stops.", true));
    return;
  }

  if (selections.length === 3) {
    response.send(
      toMenu(
        [
          `Trip: ${pickup.label} to ${destination.label}`,
          "Choose payment",
          "1. MoMo",
          "2. Cash"
        ].join("\n")
      )
    );
    return;
  }

  const paymentSelection = selections[3];

  if (paymentSelection !== "1" && paymentSelection !== "2") {
    response.send(toMenu("Invalid payment option. Dial again and choose 1 for MoMo or 2 for Cash.", true));
    return;
  }

  const paymentMethod = paymentSelection === "1" ? "MOMO" : "CASH";

  if (selections.length === 4) {
    response.send(
      toMenu(
        [
          "Confirm car ride",
          `${pickup.label} to ${destination.label}`,
          `Payment: ${paymentMethod === "MOMO" ? "MoMo" : "Cash"}`,
          "1. Confirm",
          "2. Cancel"
        ].join("\n")
      )
    );
    return;
  }

  if (selections[4] === "2") {
    response.send(toMenu("Ride request cancelled. Dial again whenever you need a Qiilu car.", true));
    return;
  }

  if (selections[4] !== "1") {
    response.send(toMenu("Invalid confirmation choice. Dial again to restart the booking.", true));
    return;
  }

  try {
    const passenger = await findOrCreatePassenger(phone);
    const { ride, estimate, payment } = await createRideBooking({
      passengerId: passenger.id,
      pickup: pickup.label,
      destination: destination.label,
      paymentMethod,
      momoProvider: "MTN MoMo",
      requestSource: "USSD",
      trustedContacts: [],
      lowBandwidthBooking: true,
      safetyShareEnabled: false
    });

    response.send(
      toMenu(
        [
          "Qiilu ride confirmed",
          `Ref: ${ride.id.slice(-6).toUpperCase()}`,
          `${estimate.distanceKm} km • ${estimate.durationMinutes} min`,
          `Fare: GHS ${estimate.fareGhs.toFixed(2)}`,
          `Payment: ${payment.method === "MOMO" ? "MoMo" : "Cash"}`,
          "A driver will contact you shortly."
        ].join("\n"),
        true
      )
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "We could not create your USSD ride right now.";
    response.send(toMenu(message, true));
  }
});

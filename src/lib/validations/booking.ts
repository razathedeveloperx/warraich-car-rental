import { z } from "zod";

export const dateAvailabilitySchema = z
  .object({
    pickupDateTime: z.string().datetime({ message: "Invalid pickup date and time format" }),
    returnDateTime: z.string().datetime({ message: "Invalid return date and time format" }),
  })
  .refine(
    (data) => new Date(data.returnDateTime).getTime() > new Date(data.pickupDateTime).getTime(),
    {
      message: "Return date and time must be strictly after pickup date and time",
      path: ["returnDateTime"],
    }
  );

export const createBookingRequestSchema = z
  .object({
    carId: z.string().min(1, "Please select a vehicle"),
    pickupDateTime: z.string().datetime({ message: "Invalid pickup date format" }),
    returnDateTime: z.string().datetime({ message: "Invalid return date format" }),
    pickupLocation: z.string().min(2, "Pickup location is required"),
    returnLocation: z.string().min(2, "Return location is required"),
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Valid email address is required"),
    phone: z.string().min(7, "Valid phone number is required"),
    address: z.string().optional(),
    nationalIdOrPassport: z.string().optional(),
    customerNotes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
    extras: z
      .array(
        z.object({
          extraId: z.string(),
          quantity: z.number().int().positive().default(1),
        })
      )
      .optional()
      .default([]),
  })
  .refine(
    (data) => new Date(data.returnDateTime).getTime() > new Date(data.pickupDateTime).getTime(),
    {
      message: "Return date must be strictly after pickup date",
      path: ["returnDateTime"],
    }
  );

export const bookingStatusUpdateSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(["PENDING", "CONFIRMED", "ACTIVE", "COMPLETED", "CANCELLED"]),
  reason: z.string().optional(),
  internalNotes: z.string().optional(),
});

export const addPaymentSchema = z.object({
  bookingId: z.string().optional(),
  parkingRecordId: z.string().optional(),
  carId: z.string().optional(),
  direction: z.enum(["INFLOW", "OUTFLOW"]).default("INFLOW"),
  category: z.string().default("RENTAL"),
  amount: z.number().positive("Payment amount must be greater than 0"),
  currency: z.string().default("PKR"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CREDIT_CARD", "POS", "CHEQUE"]).default("CASH"),
  paymentType: z.enum([
    "RENTAL",
    "DEPOSIT",
    "REFUND",
    "DAMAGE_CHARGE",
    "PARKING_FEE",
    "MAINTENANCE_OIL",
    "SALARY",
    "FUEL",
    "EXPENSE",
    "OTHER",
  ]).default("RENTAL"),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  vehiclePlate: z.string().optional(),
  monthBilled: z.string().optional(),
  transactionReference: z.string().optional(),
  notes: z.string().optional(),
  paidAt: z.string().optional(),
});

export const parkingRecordSchema = z.object({
  vehiclePlate: z.string().min(2, "Vehicle plate number is required"),
  vehicleModel: z.string().min(2, "Vehicle model is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  ownerPhone: z.string().min(7, "Owner phone is required"),
  ownerCnic: z.string().optional(),
  monthlyFee: z.number().positive("Monthly fee must be greater than 0"),
  slotNumber: z.string().optional(),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

export const vehicleInspectionSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  inspectionType: z.enum(["PRE_RENTAL", "POST_RENTAL"]).default("PRE_RENTAL"),
  isMonthlyRental: z.boolean().default(false),
  oilChanged: z.boolean().default(false),
  oilBrand: z.string().optional(),
  oilCost: z.number().nonnegative().optional(),
  odometerReading: z.number().int().nonnegative().optional(),
  nextOilOdometer: z.number().int().nonnegative().optional(),
  engineOk: z.boolean().default(true),
  brakesOk: z.boolean().default(true),
  tiresOk: z.boolean().default(true),
  acOk: z.boolean().default(true),
  lightsOk: z.boolean().default(true),
  bodyClean: z.boolean().default(true),
  scratchesNotes: z.string().optional(),
  fuelLevel: z.string().default("FULL"),
  toolsAndSpare: z.boolean().default(true),
  isVehicleApproved: z.boolean().default(true),
  inspectedBy: z.string().optional(),
  notes: z.string().optional(),
});

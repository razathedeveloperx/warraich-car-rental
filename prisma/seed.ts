import { PrismaClient, Role, OperationalStatus, BookingStatus, PaymentMethod, PaymentType, PaymentStatus, ExtraPriceType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Warraich Motors database...");

  // 1. Business Settings
  await prisma.businessSettings.upsert({
    where: { id: 1 },
    update: {
      contactPhone: "0313 6225135",
      contactEmail: "warraichmotorsgujrat@gmail.com",
      address: "Mian, GT Rd, Small Industrial Area, Punjab, Gujrat, 50700",
    },
    create: {
      id: 1,
      companyName: "Warraich Motors Gujrat",
      contactPhone: "0313 6225135",
      contactEmail: "warraichmotorsgujrat@gmail.com",
      address: "Mian, GT Rd, Small Industrial Area, Punjab, Gujrat, 50700",
      currency: "PKR",
      timezone: "Asia/Karachi",
      turnaroundBufferHours: 2,
      blockingStatuses: "PENDING,CONFIRMED,ACTIVE",
      defaultRentalRules: "Minimum driver age is 21. Original CNIC or Passport and valid driving licence are required at pickup. Fuel policy: Same to same.",
      bookingPolicy: "All online bookings require manual staff review and approval. You will receive an SMS and WhatsApp/email upon confirmation.",
      cancellationPolicy: "Free cancellation up to 24 hours prior to scheduled pickup time.",
    },
  });

  // 2. Staff and Admin Users
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const staffPasswordHash = await bcrypt.hash("Staff@12345", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@warraichmotors.pk" },
    update: { passwordHash: adminPasswordHash },
    create: {
      name: "Tariq Warraich (Admin)",
      email: "admin@warraichmotors.pk",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@warraichmotors.pk" },
    update: { passwordHash: staffPasswordHash },
    create: {
      name: "Hamza Malik (Fleet Staff)",
      email: "staff@warraichmotors.pk",
      passwordHash: staffPasswordHash,
      role: Role.STAFF,
      isActive: true,
    },
  });

  console.log("✅ Admin & Staff users seeded (admin@warraichmotors.pk / Admin@12345)");

  // 3. Rental Extras & Packages
  const extrasData = [
    {
      name: "Chauffeur Driven (Professional Uniformed Driver)",
      description: "Experienced, verified professional driver for 12 hours daily within city/intercity.",
      price: 3500,
      priceType: ExtraPriceType.PER_DAY,
    },
    {
      name: "Full Comprehensive Damage Waiver (Zero Deductible)",
      description: "Full insurance waiver against minor accidental scratches and damages.",
      price: 2000,
      priceType: ExtraPriceType.PER_DAY,
    },
    {
      name: "Child Safety Seat (ISOFIX)",
      description: "ECE R44/04 certified safety booster or rear/forward baby seat.",
      price: 800,
      priceType: ExtraPriceType.PER_DAY,
    },
    {
      name: "Airport Meet & Greet (Islamabad/Lahore/Sialkot)",
      description: "Direct handover and drop-off service at international terminals.",
      price: 5000,
      priceType: ExtraPriceType.FLAT,
    },
    {
      name: "High-Speed 4G Mobile Wi-Fi Hotspot",
      description: "Portable 4G LTE Wi-Fi router with unlimited high-speed data.",
      price: 600,
      priceType: ExtraPriceType.PER_DAY,
    },
  ];

  for (const extra of extrasData) {
    const existing = await prisma.rentalExtra.findFirst({ where: { name: extra.name } });
    if (!existing) {
      await prisma.rentalExtra.create({ data: extra });
    }
  }

  // 4. Fleet Vehicles
  const fleetData = [
    // --- SECTION 1: LUXURY COLLECTION ---
    {
      registrationNumber: "ISB-24-0063",
      make: "Mercedes-Benz",
      model: "G-Class G63 AMG (G Wagon)",
      year: 2024,
      slug: "mercedes-benz-g-wagon-g63",
      category: "LUXURY",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 5,
      luggageCapacity: 4,
      dailyRate: 75000,
      weeklyRate: 450000,
      monthlyRate: 1600000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "The commanding Mercedes-Benz G63 AMG G-Wagon. Handcrafted 4.0L V8 Biturbo, side-exit AMG exhausts, Nappa leather interior, carbon fiber trims, and unmatched road dominance across Punjab.",
      images: [
        "https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      registrationNumber: "ISB-24-0001",
      make: "Mercedes-Maybach",
      model: "S-Class Maybach S680",
      year: 2024,
      slug: "mercedes-maybach-s-class-s680",
      category: "LUXURY",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 4,
      luggageCapacity: 4,
      dailyRate: 85000,
      weeklyRate: 500000,
      monthlyRate: 1800000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "The pinnacle of ultra-luxury motoring. Extended wheelbase, executive reclining rear lounge seats with calf rest and hot-stone massage, silver champagne flutes, Burmester 4D surround sound, and serene acoustic isolation.",
      images: [
        "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      registrationNumber: "LHR-24-0005",
      make: "Mercedes-Benz",
      model: "S-Class S450 Saloon",
      year: 2024,
      slug: "mercedes-benz-s-class-s450",
      category: "LUXURY",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 4,
      luggageCapacity: 4,
      dailyRate: 60000,
      weeklyRate: 360000,
      monthlyRate: 1300000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "The gold standard of world executive luxury. Panoramic sunroof, digital light headlights, ambient active LED lighting, rear entertainment tablets, and ultra-smooth airmatic suspension.",
      images: [
        "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      registrationNumber: "ISB-24-0099",
      make: "Land Rover",
      model: "Range Rover Vogue Autobiography",
      year: 2024,
      slug: "range-rover-vogue-autobiography",
      category: "LUXURY",
      transmission: "AUTOMATIC",
      fuelType: "DIESEL",
      seatingCapacity: 5,
      luggageCapacity: 5,
      dailyRate: 70000,
      weeklyRate: 420000,
      monthlyRate: 1500000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "The peerless luxury SUV. Flush door handles, semi-aniline leather seating, active noise cancellation, adaptive off-road air suspension, and commanding British presence.",
      images: [
        "https://images.unsplash.com/photo-1606220838315-056192d5e927?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      registrationNumber: "LHR-23-4400",
      make: "BMW",
      model: "4 Series Coupe 2-Door Sports",
      year: 2023,
      slug: "bmw-4-series-2-door-sports-coupe",
      category: "LUXURY",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 4,
      luggageCapacity: 3,
      dailyRate: 35000,
      weeklyRate: 210000,
      monthlyRate: 750000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "Aggressive styling with bold vertical kidney grille, frameless coupe doors, M Sport steering, sport exhaust tone, and dynamic twin-power turbo performance.",
      images: [
        "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      registrationNumber: "LHR-23-9999",
      make: "Audi",
      model: "A6 Matrix LED Executive",
      year: 2023,
      slug: "audi-a6-matrix-led-executive",
      category: "LUXURY",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 5,
      luggageCapacity: 4,
      dailyRate: 30000,
      weeklyRate: 180000,
      monthlyRate: 650000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "Progressive luxury sedan featuring dynamic Matrix LED headlights, dual touch MMI screens, Bang & Olufsen audio system, and exceptionally smooth highway cruising.",
      images: [
        "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      registrationNumber: "LHR-24-0300",
      make: "Toyota",
      model: "Land Cruiser V8 (LC 300)",
      year: 2024,
      slug: "toyota-v8-lc-300",
      category: "LUXURY",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 7,
      luggageCapacity: 6,
      dailyRate: 50000,
      weeklyRate: 300000,
      monthlyRate: 1100000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "The king of SUVs. The latest Toyota Land Cruiser 300 Series V8 twin-turbo with full Modelista styling, height control, 3D multi-terrain monitor, and bulletproof prestige.",
      images: ["/toyota-v8-lc-300.webp"],
    },

    // --- SECTION 2: POPULAR SUVS & EXECUTIVE FLEET ---
    {
      registrationNumber: "LEA-23-9001",
      make: "Toyota",
      model: "Land Cruiser Prado TX",
      year: 2023,
      slug: "toyota-tx-prado",
      category: "SUV",
      transmission: "AUTOMATIC",
      fuelType: "DIESEL",
      seatingCapacity: 7,
      luggageCapacity: 5,
      dailyRate: 35000,
      weeklyRate: 210000,
      monthlyRate: 750000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "The trusted symbol of prestige and durability across Gujrat. Toyota Land Cruiser Prado TX with 2.8L turbo diesel engine, electric sunroof, plush leather seating, and terrain control.",
      images: ["/toyota-tx-prado.jpg"],
    },
    {
      registrationNumber: "ISB-24-4412",
      make: "Toyota",
      model: "Fortuner Legender 4x4",
      year: 2024,
      slug: "toyota-fortuner-legender",
      category: "SUV",
      transmission: "AUTOMATIC",
      fuelType: "DIESEL",
      seatingCapacity: 7,
      luggageCapacity: 4,
      dailyRate: 25000,
      weeklyRate: 150000,
      monthlyRate: 550000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "The bold Toyota Fortuner Legender with sharp bi-beam LED headlights, dual-tone black roof, JBL premium audio, powered tailgate, and genuine 4x4 capability.",
      images: ["/toyota-fortuner.jpg"],
    },
    {
      registrationNumber: "GJT-23-8844",
      make: "MG",
      model: "HS Trophy 1.5T (White)",
      year: 2023,
      slug: "mg-hs-trophy-white",
      category: "SUV",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 5,
      luggageCapacity: 4,
      dailyRate: 16000,
      weeklyRate: 96000,
      monthlyRate: 350000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "Striking European styling in Arctic White. Equipped with a massive panoramic glass sunroof, dual-tone leather bucket seats, ambient lighting, and turbocharged punch.",
      images: ["/mg-white.jpg"],
    },
    {
      registrationNumber: "GJT-23-1100",
      make: "Honda",
      model: "Civic RS Turbo (White)",
      year: 2023,
      slug: "honda-civic-rs-turbo-white",
      category: "SEDAN",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 5,
      luggageCapacity: 3,
      dailyRate: 15000,
      weeklyRate: 90000,
      monthlyRate: 320000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "Sporty, aerodynamic, and high-performance. 1.5L VTEC Turbo with Honda SENSING, black alloy wheels, dual exhaust tips, paddle shifters, and pristine white exterior.",
      images: ["/civic-white.avif"],
    },
    {
      registrationNumber: "ISB-23-9911",
      make: "Honda",
      model: "Civic RS Turbo (Black)",
      year: 2023,
      slug: "honda-civic-rs-turbo-black",
      category: "SEDAN",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 5,
      luggageCapacity: 3,
      dailyRate: 15000,
      weeklyRate: 90000,
      monthlyRate: 320000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "Stealthy and aggressive in Crystal Black Pearl. Features dark chrome accents, blacked-out alloy wheels, push-start engine, digital cockpit, and chilled dual-zone climate control.",
      images: [
        "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80",
      ],
    },
    {
      registrationNumber: "GJT-24-5588",
      make: "Toyota",
      model: "Corolla Altis Grande 1.8",
      year: 2024,
      slug: "toyota-corolla-altis-grande-2024",
      category: "SEDAN",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 5,
      luggageCapacity: 3,
      dailyRate: 12000,
      weeklyRate: 72000,
      monthlyRate: 260000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "The gold standard of executive reliability in Punjab. Full options with electric sunroof, cruise control, plush leather seats, paddle shifters, and chilled dual-zone AC.",
      images: ["/Toyota-Grandi.webp"],
    },
    {
      registrationNumber: "GJT-24-7701",
      make: "Hyundai",
      model: "Elantra GLS 2.0",
      year: 2024,
      slug: "hyundai-elantra-2024",
      category: "SEDAN",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 5,
      luggageCapacity: 3,
      dailyRate: 15000,
      weeklyRate: 90000,
      monthlyRate: 320000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "Sleek and luxurious executive sedan parked right outside our Warraich Motors showroom. Features dynamic LED headlights, push start, premium leather interior, wireless charging, and whisper-quiet suspension.",
      images: ["/Hyundai.webp"],
    },
    {
      registrationNumber: "GJT-23-2289",
      make: "Toyota",
      model: "Corolla GLi / Altis",
      year: 2023,
      slug: "toyota-corolla-gli-2023",
      category: "SEDAN",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 5,
      luggageCapacity: 3,
      dailyRate: 9000,
      weeklyRate: 54000,
      monthlyRate: 195000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "The undisputed workhorse of Pakistani roads. Outstanding suspension, powerful air conditioning, exceptional ride comfort, and generous trunk capacity for family or business trips.",
      images: ["/Corolla.webp"],
    },
    {
      registrationNumber: "GJT-24-1290",
      make: "Suzuki",
      model: "Alto VXL 660cc AGS",
      year: 2024,
      slug: "suzuki-alto-vxl-2024",
      category: "ECONOMY",
      transmission: "AUTOMATIC",
      fuelType: "PETROL",
      seatingCapacity: 4,
      luggageCapacity: 2,
      dailyRate: 4500,
      weeklyRate: 27000,
      monthlyRate: 95000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "Pakistan's #1 favorite city car. Incredible fuel average, ice-cool air conditioning, automatic gear shift, and effortless parking in bustling Gujrat bazaars.",
      images: ["/Alto.webp"],
    },
    {
      registrationNumber: "RWP-23-6600",
      make: "Toyota",
      model: "Hiace Grand Cabin Executive (14-Seater)",
      year: 2023,
      slug: "toyota-hiace-grand-cabin-2023",
      category: "VAN",
      transmission: "AUTOMATIC",
      fuelType: "DIESEL",
      seatingCapacity: 14,
      luggageCapacity: 8,
      dailyRate: 18000,
      weeklyRate: 108000,
      monthlyRate: 400000,
      currency: "PKR",
      operationalStatus: OperationalStatus.AVAILABLE,
      isPublished: true,
      description: "High-roof 14-passenger luxury van. Individual reclining high-back seats, separate passenger air conditioning ducts, and cavernous rear luggage hold.",
      images: [
        "https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=1200&q=80",
      ],
    },
  ];

  for (const carItem of fleetData) {
    const { images, ...carProps } = carItem;
    const car = await prisma.car.upsert({
      where: { registrationNumber: carProps.registrationNumber },
      update: carProps,
      create: carProps,
    });

    // Seed/update images
    for (let i = 0; i < images.length; i++) {
      const existingImage = await prisma.carImage.findFirst({
        where: { carId: car.id, sortOrder: i },
      });
      if (!existingImage) {
        await prisma.carImage.create({
          data: {
            carId: car.id,
            imageUrl: images[i],
            altText: `${car.make} ${car.model} view ${i + 1}`,
            sortOrder: i,
          },
        });
      } else {
        await prisma.carImage.update({
          where: { id: existingImage.id },
          data: {
            imageUrl: images[i],
            altText: `${car.make} ${car.model} view ${i + 1}`,
          },
        });
      }
    }
  }

  console.log("✅ Fleet seeded (7 high-demand vehicles with photos and rates)");

  // 5. Demo Customers & Initial Bookings
  const demoCustomer1 = await prisma.customer.upsert({
    where: { id: "demo-cust-1" },
    update: {},
    create: {
      id: "demo-cust-1",
      fullName: "Chaudhry Bilal Warraich",
      phone: "+92 301 7788990",
      email: "bilal.warraich@example.com",
      address: "Rehman Shaheed Road, Gujrat",
      drivingLicenceDetails: "DL-GJT-99882",
      internalNotes: "VIP client. Prefers chauffeur-driven vehicles. Prompt payer.",
    },
  });

  const demoCustomer2 = await prisma.customer.upsert({
    where: { id: "demo-cust-2" },
    update: {},
    create: {
      id: "demo-cust-2",
      fullName: "Dr. Ayesha Siddiqa",
      phone: "+92 321 4455667",
      email: "ayesha.siddiqa@example.com",
      address: "Court Road, Gujrat",
      drivingLicenceDetails: "DL-LHR-55441",
      internalNotes: "Visiting consultant. Rents monthly sedans.",
    },
  });

  const corolla = await prisma.car.findUnique({ where: { slug: "toyota-corolla-altis-grande-2024" } });
  const prado = await prisma.car.findUnique({ where: { slug: "toyota-prado-tx-2023" } });

  if (corolla) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const fourDaysLater = new Date(tomorrow);
    fourDaysLater.setDate(tomorrow.getDate() + 3);
    fourDaysLater.setHours(18, 0, 0, 0);

    const existingBooking = await prisma.booking.findFirst({
      where: { bookingReference: "WM-DEMO01" },
    });

    if (!existingBooking) {
      const b = await prisma.booking.create({
        data: {
          bookingReference: "WM-DEMO01",
          customerId: demoCustomer1.id,
          carId: corolla.id,
          pickupDateTime: tomorrow,
          returnDateTime: fourDaysLater,
          pickupLocation: "Warraich Motors Office, GT Road Gujrat",
          returnLocation: "Warraich Motors Office, GT Road Gujrat",
          status: BookingStatus.CONFIRMED,
          rentalPrice: 36000,
          extrasTotal: 10500,
          discount: 0,
          depositAmount: 10000,
          totalAmount: 46500,
          amountPaid: 46500,
          currency: "PKR",
          customerNotes: "Requires car washed and fuel tank full upon pickup.",
          internalNotes: "Advance payment received via Bank Alfalah transfer.",
          payments: {
            create: {
              amount: 46500,
              currency: "PKR",
              paymentMethod: PaymentMethod.BANK_TRANSFER,
              paymentType: PaymentType.RENTAL,
              status: PaymentStatus.COMPLETED,
              transactionReference: "ALFALAH-TX-889912",
              notes: "Full payment received in advance",
            },
          },
          auditLogs: {
            create: {
              userId: admin.id,
              action: "CONFIRMED",
              fromStatus: BookingStatus.PENDING,
              toStatus: BookingStatus.CONFIRMED,
              details: "Manual approval given after bank transfer verification.",
            },
          },
        },
      });
    }
  }

  if (prado) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(9, 0, 0, 0);

    const tenDaysLater = new Date(nextWeek);
    tenDaysLater.setDate(nextWeek.getDate() + 4);
    tenDaysLater.setHours(20, 0, 0, 0);

    const existingPending = await prisma.booking.findFirst({
      where: { bookingReference: "WM-DEMO02" },
    });

    if (!existingPending) {
      await prisma.booking.create({
        data: {
          bookingReference: "WM-DEMO02",
          customerId: demoCustomer2.id,
          carId: prado.id,
          pickupDateTime: nextWeek,
          returnDateTime: tenDaysLater,
          pickupLocation: "Islamabad International Airport Terminal 1",
          returnLocation: "Warraich Motors Office, Gujrat",
          status: BookingStatus.PENDING,
          rentalPrice: 140000,
          extrasTotal: 5000,
          discount: 0,
          depositAmount: 28000,
          totalAmount: 145000,
          amountPaid: 0,
          currency: "PKR",
          customerNotes: "Airport pickup requested. Arriving on flight PK-788.",
          internalNotes: "Pending staff review of driving license and flight itinerary.",
          auditLogs: {
            create: {
              action: "CREATED",
              toStatus: BookingStatus.PENDING,
              details: "Submitted via website booking engine.",
            },
          },
        },
      });
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { User } from "../models/User.ts";
import { Ingredient } from "../models/Ingredient.ts";
import { WasteRecord } from "../models/WasteRecord.ts";
import { AppSetting } from "../models/AppSetting.ts";
import { AuditLog } from "../models/AuditLog.ts";

export const INITIAL_INGREDIENTS = [
  {
    name: "Basmati Rice Royal",
    category: "Bakery & Dry Goods",
    unit: "kg",
    availableQuantity: 95.0,
    reorderLevel: 25.0,
    costPerUnit: 95.0,
    supplier: "Dehradun Grain Merchants",
    storageLocation: "Dry Pantry",
  },
  {
    name: "Paneer Fresh Malai",
    category: "Dairy & Eggs",
    unit: "kg",
    availableQuantity: 14.5,
    reorderLevel: 10.0,
    costPerUnit: 340.0,
    supplier: "Heritage Dairies",
    storageLocation: "Walk-in Chiller",
    expiryDays: 3, // close to expiry
  },
  {
    name: "Chicken Breast Boneless",
    category: "Meat & Poultry",
    unit: "kg",
    availableQuantity: 32.0,
    reorderLevel: 15.0,
    costPerUnit: 260.0,
    supplier: "Godrej Real Good Poultry",
    storageLocation: "Deep Freezer",
  },
  {
    name: "Tiger Prawns Peeled & Deveined",
    category: "Seafood",
    unit: "kg",
    availableQuantity: 11.2,
    reorderLevel: 8.0,
    costPerUnit: 680.0,
    supplier: "Coastal Catch Seafoods",
    storageLocation: "Deep Freezer",
  },
  {
    name: "Alphonso Mango Puree",
    category: "Vegetables & Produce",
    unit: "litre",
    availableQuantity: 18.0,
    reorderLevel: 10.0,
    costPerUnit: 310.0,
    supplier: "Ratnagiri Farms Direct",
    storageLocation: "Pastry Chiller",
  },
  {
    name: "Heavy Cooking Cream 35%",
    category: "Dairy & Eggs",
    unit: "litre",
    availableQuantity: 16.0,
    reorderLevel: 10.0,
    costPerUnit: 240.0,
    supplier: "Amul Pro Food Services",
    storageLocation: "Walk-in Chiller",
  },
  {
    name: "Fresh Button Mushrooms",
    category: "Vegetables & Produce",
    unit: "kg",
    availableQuantity: 4.5, // LOW STOCK!
    reorderLevel: 8.0,
    costPerUnit: 190.0,
    supplier: "Ooty Alpine Farms",
    storageLocation: "Veg Prep Chiller",
    expiryDays: 2,
  },
  {
    name: "Bell Peppers Tricolor",
    category: "Vegetables & Produce",
    unit: "kg",
    availableQuantity: 12.0,
    reorderLevel: 8.0,
    costPerUnit: 140.0,
    supplier: "Nashik Green Agro",
    storageLocation: "Veg Prep Chiller",
  },
  {
    name: "Red Onions Nashik",
    category: "Vegetables & Produce",
    unit: "kg",
    availableQuantity: 75.0,
    reorderLevel: 30.0,
    costPerUnit: 36.0,
    supplier: "Nashik Green Agro",
    storageLocation: "Dry Pantry",
  },
  {
    name: "Plum Tomatoes Salad Grade",
    category: "Vegetables & Produce",
    unit: "kg",
    availableQuantity: 38.0,
    reorderLevel: 20.0,
    costPerUnit: 42.0,
    supplier: "Pune Fresh Produce",
    storageLocation: "Veg Prep Chiller",
  },
  {
    name: "Fresh Mint & Coriander",
    category: "Vegetables & Produce",
    unit: "kg",
    availableQuantity: 2.1, // LOW STOCK!
    reorderLevel: 5.0,
    costPerUnit: 85.0,
    supplier: "Local Hydroponic Greens",
    storageLocation: "Veg Prep Chiller",
    expiryDays: 1,
  },
  {
    name: "Norwegian Salmon Fillet",
    category: "Seafood",
    unit: "kg",
    availableQuantity: 7.5,
    reorderLevel: 5.0,
    costPerUnit: 1450.0,
    supplier: "Global Seafood Imports",
    storageLocation: "Walk-in Chiller",
    expiryDays: 4,
  },
  {
    name: "Pasteurized Table Butter",
    category: "Dairy & Eggs",
    unit: "kg",
    availableQuantity: 24.0,
    reorderLevel: 10.0,
    costPerUnit: 480.0,
    supplier: "Amul Pro Food Services",
    storageLocation: "Walk-in Chiller",
  },
  {
    name: "Pasteurized Full Cream Milk",
    category: "Dairy & Eggs",
    unit: "litre",
    availableQuantity: 42.0,
    reorderLevel: 20.0,
    costPerUnit: 64.0,
    supplier: "Mother Dairy Hospitality",
    storageLocation: "Walk-in Chiller",
  },
  {
    name: "Farm Fresh Large Brown Eggs",
    category: "Dairy & Eggs",
    unit: "pieces",
    availableQuantity: 320,
    reorderLevel: 120,
    costPerUnit: 7.5,
    supplier: "Baramati Agro Poultry",
    storageLocation: "Pastry Chiller",
  },
  {
    name: "Belgian Dark Chocolate 70%",
    category: "Bakery & Dry Goods",
    unit: "kg",
    availableQuantity: 9.0,
    reorderLevel: 6.0,
    costPerUnit: 890.0,
    supplier: "Callebaut Pastry Line",
    storageLocation: "Pastry Chiller",
  },
  {
    name: "Extra Virgin Olive Oil",
    category: "Oils, Sauces & Spices",
    unit: "litre",
    availableQuantity: 22.0,
    reorderLevel: 10.0,
    costPerUnit: 720.0,
    supplier: "Borges Horeca",
    storageLocation: "Dry Pantry",
  },
  {
    name: "Lamb Curry Cut Fresh",
    category: "Meat & Poultry",
    unit: "kg",
    availableQuantity: 18.0,
    reorderLevel: 12.0,
    costPerUnit: 740.0,
    supplier: "Modern Meat Packers",
    storageLocation: "Walk-in Chiller",
  },
];

export async function seedDatabase(forceReset = false): Promise<void> {
  try {
    const existingUsersCount = await User.countDocuments();
    if (existingUsersCount > 0 && !forceReset) {
      console.log("[Seed] Database already initialized. Skipping seed.");
      return;
    }

    if (forceReset) {
      console.log("[Seed] Resetting database collections...");
      await Promise.all([
        User.deleteMany({}),
        Ingredient.deleteMany({}),
        WasteRecord.deleteMany({}),
        AuditLog.deleteMany({}),
        AppSetting.deleteMany({}),
      ]);
    }

    console.log("[Seed] Creating default hotel settings...");
    await AppSetting.create({
      hotelName: "The Grand Horizon Palace & Convention Centre",
      hotelLocation: "New Delhi / Mumbai",
      currency: "INR",
      currencySymbol: "₹",
      monthlyWasteBudgetINR: 75000,
      costReductionGoalPercent: 18,
      autoDeductInventory: true,
      allowStaffEditHours: 24,
      updatedBy: "System Setup",
    });

    console.log("[Seed] Creating Manager and Staff accounts...");
    const managerEmail = process.env.MANAGER_EMAIL || "manager@wastenot.com";
    const managerPassword = process.env.MANAGER_PASSWORD || "Manager@123";
    const staffEmail = process.env.STAFF_EMAIL || "chef@wastenot.com";
    const staffPassword = process.env.STAFF_PASSWORD || "Chef@123";

    const manager = await User.create({
      name: "Chef Rajiv Sharma (Executive Chef)",
      email: managerEmail,
      password: managerPassword,
      role: "manager",
      kitchenStation: "All Stations (Executive)",
      employeeId: "WN-EX01",
      active: true,
    });

    const chefPriya = await User.create({
      name: "Sous Chef Priya Patel",
      email: staffEmail,
      password: staffPassword,
      role: "staff",
      kitchenStation: "Main Kitchen",
      employeeId: "WN-CK02",
      active: true,
    });

    const chefAmit = await User.create({
      name: "Chef de Partie Amit Kumar",
      email: "amit.kumar@wastenot.com",
      password: "Chef@123",
      role: "staff",
      kitchenStation: "Banquet Kitchen",
      employeeId: "WN-CK03",
      active: true,
    });

    const chefSunita = await User.create({
      name: "Demi Chef Sunita Rao",
      email: "sunita.rao@wastenot.com",
      password: "Chef@123",
      role: "staff",
      kitchenStation: "Bakery & Pastry",
      employeeId: "WN-CK04",
      active: true,
    });

    console.log("[Seed] Creating 18 hotel ingredients...");
    const now = new Date();
    const createdIngredients: any[] = [];

    for (const item of INITIAL_INGREDIENTS) {
      let expiryDate: Date | undefined;
      if (item.expiryDays) {
        expiryDate = new Date(now.getTime() + item.expiryDays * 86400000);
      } else {
        expiryDate = new Date(now.getTime() + 45 * 86400000);
      }

      const ing = await Ingredient.create({
        name: item.name,
        category: item.category,
        unit: item.unit,
        availableQuantity: item.availableQuantity,
        reorderLevel: item.reorderLevel,
        costPerUnit: item.costPerUnit,
        supplier: item.supplier,
        storageLocation: item.storageLocation,
        expiryDate,
      });
      createdIngredients.push(ing);
    }

    console.log("[Seed] Generating 45 historical waste records over 35 days...");
    const staffUsers = [chefPriya, chefAmit, chefSunita, manager];

    const historicalTemplates = [
      // Spoilage
      {
        ingName: "Plum Tomatoes Salad Grade",
        qty: 4.5,
        reason: "Spoilage",
        station: "Cold Prep / Garde Manger",
        shift: "Morning Shift (06:00 - 14:00)",
        notes: "Soft rot in bottom crate due to condensation",
      },
      {
        ingName: "Fresh Button Mushrooms",
        qty: 2.2,
        reason: "Spoilage",
        station: "Main Kitchen",
        shift: "Morning Shift (06:00 - 14:00)",
        notes: "Dark gills and sliminess after weekend holding",
      },
      {
        ingName: "Paneer Fresh Malai",
        qty: 3.0,
        reason: "Expired ingredients",
        station: "Main Kitchen",
        shift: "Afternoon Shift (14:00 - 22:00)",
        notes: "Batch past shelf life from banquet buffer",
      },
      // Overproduction
      {
        ingName: "Basmati Rice Royal",
        qty: 6.5,
        reason: "Overproduction",
        station: "Banquet Kitchen",
        shift: "Night Shift (22:00 - 06:00)",
        notes: "Corporate dinner headcount shortfall by 40 covers",
      },
      {
        ingName: "Chicken Breast Boneless",
        qty: 4.8,
        reason: "Overproduction",
        station: "Banquet Kitchen",
        shift: "Night Shift (22:00 - 06:00)",
        notes: "Pre-grilled breast surplus, could not be safely chilled",
      },
      {
        ingName: "French Baguette Dough",
        ingFallback: "Belgian Dark Chocolate 70%",
        qty: 1.8,
        reason: "Overproduction",
        station: "Bakery & Pastry",
        shift: "Morning Shift (06:00 - 14:00)",
        notes: "Over-proofed croissant dough batches discarded",
      },
      // Prep waste
      {
        ingName: "Norwegian Salmon Fillet",
        qty: 1.4,
        reason: "Preparation waste",
        station: "Butchery",
        shift: "Morning Shift (06:00 - 14:00)",
        notes: "Excessive belly fat trim on portioning for à la carte",
      },
      {
        ingName: "Lamb Curry Cut Fresh",
        qty: 2.8,
        reason: "Preparation waste",
        station: "Butchery",
        shift: "Morning Shift (06:00 - 14:00)",
        notes: "Bone marrow splinter and excessive sinew discard",
      },
      {
        ingName: "Bell Peppers Tricolor",
        qty: 3.1,
        reason: "Preparation waste",
        station: "Main Kitchen",
        shift: "Afternoon Shift (14:00 - 22:00)",
        notes: "Poor core extraction ratio during banquet rush",
      },
      // Plate waste
      {
        ingName: "Basmati Rice Royal",
        qty: 5.2,
        reason: "Plate waste",
        station: "Banquet Kitchen",
        shift: "Night Shift (22:00 - 06:00)",
        notes: "Wedding buffet line service unconsumed returned pans",
      },
      {
        ingName: "Chicken Breast Boneless",
        qty: 3.5,
        reason: "Plate waste",
        station: "Banquet Kitchen",
        shift: "Night Shift (22:00 - 06:00)",
        notes: "Buffet display chafing dish end-of-service clearing",
      },
      // Storage error
      {
        ingName: "Pasteurized Full Cream Milk",
        qty: 12.0,
        reason: "Storage errors",
        station: "Main Kitchen",
        shift: "Morning Shift (06:00 - 14:00)",
        notes: "Chiller door left ajar overnight, temp spiked to 14°C",
      },
      {
        ingName: "Tiger Prawns Peeled & Deveined",
        qty: 2.5,
        reason: "Storage errors",
        station: "Main Kitchen",
        shift: "Afternoon Shift (14:00 - 22:00)",
        notes: "Defrosted in ambient water bath without timer",
      },
      {
        ingName: "Heavy Cooking Cream 35%",
        qty: 4.0,
        reason: "Spoilage",
        station: "Bakery & Pastry",
        shift: "Afternoon Shift (14:00 - 22:00)",
        notes: "Curdled during sauce reduction, high heat scald",
      },
      {
        ingName: "Fresh Mint & Coriander",
        qty: 1.8,
        reason: "Spoilage",
        station: "Cold Prep / Garde Manger",
        shift: "Evening Shift (18:00 - 02:00)",
        notes: "Wilted leaf rot due to damp packaging",
      },
    ];

    // Distribute entries across the past 35 days
    const wasteDocs = [];
    for (let dayOffset = 34; dayOffset >= 0; dayOffset--) {
      // 1 to 2 entries per day
      const countForDay = dayOffset % 3 === 0 ? 2 : 1;
      for (let c = 0; c < countForDay; c++) {
        const tmpl =
          historicalTemplates[
            (dayOffset * 3 + c) % historicalTemplates.length
          ];
        const ing =
          createdIngredients.find((i) => i.name === tmpl.ingName) ||
          createdIngredients[0];

        // Minor variation in quantity
        const variance = 0.85 + ((dayOffset + c) % 5) * 0.08;
        const qty = Number((tmpl.qty * variance).toFixed(2));
        const totalCost = Math.round(qty * ing.costPerUnit);
        const user = staffUsers[(dayOffset + c) % staffUsers.length];

        const recordDate = new Date(
          now.getTime() -
            dayOffset * 86400000 +
            ((c * 4 + 8) % 12) * 3600000
        );

        let normalizedKg = qty;
        if (ing.unit === "g" || ing.unit === "ml") normalizedKg = qty / 1000;
        if (ing.unit === "pieces") normalizedKg = qty * 0.08;

        wasteDocs.push({
          ingredient: ing._id,
          ingredientName: ing.name,
          category: ing.category,
          quantity: qty,
          unit: ing.unit,
          normalizedKg,
          costPerUnit: ing.costPerUnit,
          totalCost,
          reason: tmpl.reason,
          kitchenStation: tmpl.station,
          shift: tmpl.shift,
          recordedBy: user._id,
          recordedByName: user.name,
          recordedByRole: user.role,
          notes: tmpl.notes,
          recordDate,
          deductedFromStock: false,
        });
      }
    }

    await WasteRecord.insertMany(wasteDocs);

    console.log("[Seed] Writing initial audit log...");
    await AuditLog.create({
      action: "DATABASE_INITIALIZED",
      entityType: "AppSetting",
      performedByName: "System Admin",
      performedByRole: "system",
      details: `Initialized database with 18 ingredients, 4 users, and ${wasteDocs.length} historical food waste records.`,
      timestamp: new Date(),
    });

    console.log("[Seed] Database seeding completed successfully!");
  } catch (error: any) {
    console.error("[Seed] Error seeding database:", error.message);
  }
}

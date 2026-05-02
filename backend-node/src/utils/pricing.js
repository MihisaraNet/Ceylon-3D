/**
 * pricing.js — 3D Printing Cost Calculation Utility
 *
 * Provides two functions for estimating and calculating 3D printing costs:
 *
 * 1. calculateCost()         — Detailed cost breakdown used by the Cost Calculator screen.
 * 2. estimateInitialPrice()  — Quick rough estimate based on file size (used at upload time).
 *
 * Cost Formula (calculateCost):
 *   Material Cost  = weightGrams × MATERIAL_RATE[material]
 *   Machine Cost   = totalHours × 50.00 LKR/hr
 *   Energy Cost    = totalHours × 30.00 LKR/hr
 *   Labour Cost    = flat 100.00 LKR
 *   Support Cost   = 100.00 LKR (if support structures needed, else 0)
 *   Total Cost     = sum of all above
 *   Selling Price  = Total Cost × 1.5 (50% markup)
 *
 * Material Rates (LKR per gram):
 *   PLA/PLA+ = 5.00  |  ABS/ABS+ = 6.00
 *
 * @module utils/pricing
 */

// Material cost rates in LKR per gram
const MATERIAL_RATE = { PLA: 5.00, 'PLA+': 5.00, ABS: 6.00, 'ABS+': 6.00 };

/**
 * Calculate a detailed cost breakdown for a 3D print job.
 *
 * @param {Object}  params                    - Print job parameters.
 * @param {number}  [params.printTimeHours=0] - Print time in hours.
 * @param {number}  [params.printTimeMinutes=0] - Additional print time in minutes.
 * @param {number}  [params.weightGrams=0]    - Material weight in grams.
 * @param {string}  [params.material='PLA']   - Material type (PLA, PLA+, ABS, ABS+).
 * @param {boolean} [params.supportStructures=false] - Whether supports are needed.
 * @returns {Object} Detailed cost breakdown with all components and selling price.
 */
const calculateCost = ({ printTimeHours=0, printTimeMinutes=0, weightGrams=0, material='PLA', supportStructures=false }) => {
  // Normalize the material name and fall back to PLA if unknown
  const mat  = (material||'PLA').toUpperCase();
  const norm = MATERIAL_RATE[mat] != null ? mat : 'PLA';
  const rate = MATERIAL_RATE[norm];

  // Convert total print time to decimal hours
  const hrs  = Number(printTimeHours) + Number(printTimeMinutes)/60;

  // Calculate individual cost components
  const materialCost = Number(weightGrams) * rate;        // Cost of raw material
  const machineCost  = hrs * 50.00;                       // Printer depreciation / usage
  const energyCost   = hrs * 30.00;                       // Electricity consumed
  const laborCost    = 100.00;                            // Flat labour charge
  const supportCost  = supportStructures ? 100.00 : 0;   // Support removal overhead

  // Sum all costs
  const totalCost    = materialCost + machineCost + energyCost + laborCost + supportCost;

  // Apply 50% markup for the selling price
  const sellingPrice = Math.round(totalCost * 1.5 * 100) / 100;

  return {
    material: norm, weightGrams: Number(weightGrams),
    printTimeHours: Number(printTimeHours), printTimeMinutes: Number(printTimeMinutes),
    supportStructures: Boolean(supportStructures),
    materialCost: Math.round(materialCost*100)/100,
    machineCost:  Math.round(machineCost*100)/100,
    energyCost:   Math.round(energyCost*100)/100,
    laborCost, supportCost,
    totalCost: Math.round(totalCost*100)/100,
    sellingPrice,
  };
};

/**
 * Estimate an initial price based on file size, material, and quantity.
 * Used as a rough estimate when the customer first uploads an STL file,
 * before the admin has reviewed the actual print specifications.
 *
 * Formula: (8 + fileSizeMB × 4) × materialMultiplier × quantity
 *
 * Material multipliers:
 *   PLA = 1.0  |  ABS = 1.15  |  PETG = 1.30  |  RESIN = 1.60
 *
 * @param {number} fileSizeBytes - Size of the uploaded file in bytes.
 * @param {string} material      - Material type.
 * @param {number} quantity      - Number of copies.
 * @returns {number} Estimated price in LKR (rounded to 2 decimal places).
 */
const estimateInitialPrice = (fileSizeBytes, material, quantity) => {
  const mb   = fileSizeBytes / (1024*1024);
  const mult = { ABS:1.15, PETG:1.30, RESIN:1.60, PLA:1.0 }[(material||'PLA').toUpperCase()] || 1.0;
  return Math.round((8 + mb*4) * mult * (Number(quantity)||1) * 100) / 100;
};

module.exports = { calculateCost, estimateInitialPrice };

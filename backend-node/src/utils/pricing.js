const MATERIAL_RATE = { PLA: 5.00, 'PLA+': 5.00, ABS: 6.00, 'ABS+': 6.00 };

const calculateCost = ({ printTimeHours=0, printTimeMinutes=0, weightGrams=0, material='PLA', supportStructures=false }) => {
  const mat  = (material||'PLA').toUpperCase();
  const norm = MATERIAL_RATE[mat] != null ? mat : 'PLA';
  const rate = MATERIAL_RATE[norm];
  const hrs  = Number(printTimeHours) + Number(printTimeMinutes)/60;

  const materialCost = Number(weightGrams) * rate;
  const machineCost  = hrs * 50.00;
  const energyCost   = hrs * 30.00;
  const laborCost    = 100.00;
  const supportCost  = supportStructures ? 100.00 : 0;
  const totalCost    = materialCost + machineCost + energyCost + laborCost + supportCost;
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

const estimateInitialPrice = (fileSizeBytes, material, quantity) => {
  const mb   = fileSizeBytes / (1024*1024);
  const mult = { ABS:1.15, PETG:1.30, RESIN:1.60, PLA:1.0 }[(material||'PLA').toUpperCase()] || 1.0;
  return Math.round((8 + mb*4) * mult * (Number(quantity)||1) * 100) / 100;
};

module.exports = { calculateCost, estimateInitialPrice };

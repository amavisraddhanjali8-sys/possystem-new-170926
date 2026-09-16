import { Router } from 'express';
import { store, saveDatabase } from '../store';
import { broadcastEvent } from '../services/sse';
import { Vehicle, TransportCalculationInput, TransportCalculationResult } from '../../shared/types';
import { INITIAL_VEHICLES } from '../data/initialData';

const router = Router();

// Fleet Vehicles
router.get('/api/vehicles', (req, res) => {
  res.json(store.vehicles);
});

router.put('/api/vehicles/:id', (req, res) => {
  const { id } = req.params;
  const v = store.vehicles.find(item => item.id === id);
  if (!v) return res.status(404).json({ error: 'Vehicle not found' });

  if (req.body.base_charge !== undefined) v.base_charge = Number(req.body.base_charge);
  if (req.body.per_km_rate !== undefined) v.per_km_rate = Number(req.body.per_km_rate);

  saveDatabase();

  broadcastEvent({
    type: 'TRANSPORT_RULE_CHANGE',
    title: 'Transport Fleet Rates Updated',
    message: `${v.type} base rate set to Rs. ${(v.base_charge ?? 0).toLocaleString()} & per KM to Rs. ${v.per_km_rate}`,
    branch_name: 'All Branches'
  });

  res.json(v);
});

// Transport Rules
router.get(['/api/transport/rules', '/api/transport-rules'], (req, res) => {
  res.json(store.transportRules);
});

router.put(['/api/transport/rules', '/api/transport-rules'], (req, res) => {
  store.transportRules = { ...store.transportRules, ...req.body };
  saveDatabase();

  broadcastEvent({
    type: 'TRANSPORT_RULE_CHANGE',
    title: 'Global Transport Rules & Fuel Surcharge Adjusted',
    message: `Fuel price updated to Rs. ${store.transportRules.fuel_price_per_l}/L. Driver allowance Rs. ${store.transportRules.driver_allowance}.`,
    branch_name: 'All Branches'
  });

  res.json(store.transportRules);
});

// Locations
router.get('/api/locations', (req, res) => {
  res.json(store.locations);
});

// Dynamic Transport Calculation
router.post('/api/transport/calculate', (req, res) => {
  const input: TransportCalculationInput = req.body;

  const loc = store.locations.find(l => l.id === input.location_id);
  const distance_km = input.custom_distance_km || (loc ? loc.distance_km : 25);
  const total_weight = Number(input.total_weight_kg) || 100;
  const max_len = Number(input.max_item_length_m) || 3.0;

  let chosenVehicle: Vehicle = store.vehicles[0] || INITIAL_VEHICLES[0];

  if (input.vehicle_type_override) {
    const override = store.vehicles.find(v => v.id === input.vehicle_type_override || v.type === input.vehicle_type_override);
    if (override) chosenVehicle = override;
  } else {
    if (total_weight > 5000 || max_len > 6.5) {
      chosenVehicle = store.vehicles.find(v => v.id === 'v-trailer') || store.vehicles[2] || INITIAL_VEHICLES[2];
    } else if (total_weight > 1000 || max_len > 3.5) {
      chosenVehicle = store.vehicles.find(v => v.id === 'v-lorry') || store.vehicles[1] || INITIAL_VEHICLES[1];
    }
  }

  const base_charge = Number(chosenVehicle.base_charge ?? (chosenVehicle as any).base_rate ?? 2500);
  const per_km = Number(chosenVehicle.per_km_rate ?? (chosenVehicle as any).cost_per_km ?? 150);
  const distance_cost = Math.max(0, distance_km - (store.transportRules.min_distance_km || 0)) * per_km;

  const fuelDiffPct = ((store.transportRules.fuel_price_per_l - 300) / 300);
  const fuel_adjustment = fuelDiffPct > 0 ? Math.round((base_charge + distance_cost) * fuelDiffPct * 0.15) : 0;

  const driver_allowance = input.include_driver_allowance || distance_km > 50 ? store.transportRules.driver_allowance : 0;

  let runningSubtotal = base_charge + distance_cost + fuel_adjustment + driver_allowance;

  const isNight = input.is_night_delivery;
  const night_surcharge = isNight ? Math.round(runningSubtotal * (store.transportRules.night_delivery_surcharge_pct / 100)) : 0;

  const isRemote = input.is_remote_area || (loc && loc.is_remote);
  const remote_surcharge = isRemote ? Math.round(runningSubtotal * (store.transportRules.remote_area_surcharge_pct / 100)) : 0;

  const total_transport_cost = Math.round(runningSubtotal + night_surcharge + remote_surcharge);
  const travel_time_min = loc ? loc.est_travel_time_min : Math.round(distance_km * 1.5 + 15);

  const vehicleTypeName = chosenVehicle.type || (chosenVehicle as any).vehicle_type || 'Vehicle';
  const breakdown_lines = [
    { label: `Base Charge (${vehicleTypeName})`, amount: base_charge },
    { label: `Distance Rate (${distance_km} km @ Rs.${per_km}/km)`, amount: distance_cost }
  ];

  if (fuel_adjustment > 0) breakdown_lines.push({ label: `Fuel Index Surcharge (Rs.${store.transportRules.fuel_price_per_l}/L)`, amount: fuel_adjustment });
  if (driver_allowance > 0) breakdown_lines.push({ label: `Driver & Crew Allowance (>50km)`, amount: driver_allowance });
  if (night_surcharge > 0) breakdown_lines.push({ label: `Night Delivery Surcharge (${store.transportRules.night_delivery_surcharge_pct}%)`, amount: night_surcharge });
  if (remote_surcharge > 0) breakdown_lines.push({ label: `Remote Terrain Surcharge (${store.transportRules.remote_area_surcharge_pct}%)`, amount: remote_surcharge });

  const result: TransportCalculationResult = {
    vehicle_used: chosenVehicle,
    vehicle_type: vehicleTypeName,
    total_weight_kg: total_weight,
    distance_km,
    base_charge,
    distance_cost,
    fuel_adjustment,
    driver_allowance,
    night_surcharge,
    remote_surcharge,
    total_transport_cost,
    travel_time_min,
    breakdown_lines
  };

  res.json(result);
});

export default router;

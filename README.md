# INNOVISTA Aluminium & Glass POS & Quotation System

An enterprise Point of Sale (POS) and Quotation system built with React, Vite, Tailwind CSS, TypeScript, and Express.

---

## 🚀 How to Run the Local Server

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Local Server
```bash
npm run dev
```
The server will boot with Vite development middleware and Express API endpoints at:
**`http://localhost:3000`**

### 3. Build & Run for Production (Local or Self-Hosted)
```bash
# Build the frontend and backend bundle
npm run build

# Start the compiled production server
npm start
```

---

## 🚚 Transport Fee Calculation Logic

Transport charges are calculated strictly using the base + distance formula:
$$\text{Delivery Fee} = \text{Base Charge} + (\text{Distance in KM} \times \text{Per KM Rate})$$

- **Fleet Vehicles**: Choose from available commercial vehicles (e.g., 1-Ton Van, 5-Ton Lorry, 15-Ton Trailer), each with dedicated base charges and per-km rates.
- **District Filtering**: Filter destinations by any of the 25 Sri Lankan administrative districts.
- **Attributed Distance**: Selecting a destination town automatically loads its attributed kilometer distance from the central hub.
- **Manual KM Override**: Freely adjust the kilometers at any point; the fee re-calculates instantly.

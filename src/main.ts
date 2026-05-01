import "./style.css";
import { renderMap } from "./map";
import { debtData, formatBillions, formatPct } from "./data";

const app = document.querySelector<HTMLDivElement>("#app")!;

// Compute summary stats
const totalDebt = debtData.reduce((s, d) => s + d.debtAbsB, 0);
const avgDebtPct =
  debtData.reduce((s, d) => s + d.debtPctGdp, 0) / debtData.length;
const highest = debtData.reduce((a, b) =>
  a.debtPctGdp > b.debtPctGdp ? a : b
);
app.innerHTML = `
  <header>
    <h1>Global Sovereign Debt Map</h1>
    <p>General government gross debt across ~100 countries · 2024 estimates</p>
  </header>

  <div id="map-root"></div>

  <div class="stats-bar">
    <div class="stat-card">
      <div class="stat-value">${formatBillions(totalDebt)}</div>
      <div class="stat-label">Tracked debt total</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${formatPct(avgDebtPct)}</div>
      <div class="stat-label">Average % of GDP</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${highest.name}</div>
      <div class="stat-label">Highest · ${formatPct(highest.debtPctGdp)} of GDP</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${debtData.length}</div>
      <div class="stat-label">Countries tracked</div>
    </div>
  </div>

  <footer>
    Data: approximate 2024 figures from IMF WEO & World Bank · Built with D3 + TopoJSON
  </footer>
`;

renderMap(document.getElementById("map-root")!);

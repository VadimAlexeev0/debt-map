import * as d3 from "d3";
import { debtByIso3, formatBillions, formatPct } from "./data";

type Mode = "pct" | "abs";

const GEOJSON_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

function getIso3(props: any): string | null {
  if (props.ISO_A3 && props.ISO_A3 !== "-99") return props.ISO_A3;
  if (props.ADM0_A3) return props.ADM0_A3;
  return null;
}

export async function renderMap(container: HTMLElement) {
  let mode: Mode = "pct";

  const width = 960;
  const height = 500;

  container.innerHTML = `
    <div class="map-header">
      <h2>Global Sovereign Debt</h2>
      <div class="map-controls">
        <button class="mode-btn active" data-mode="pct">% of GDP</button>
        <button class="mode-btn" data-mode="abs">Absolute (USD)</button>
      </div>
    </div>
    <div class="map-legend"></div>
    <div class="map-container">
      <svg id="world-map" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
    <div class="map-tooltip" style="display:none"></div>
  `;

  const svg = d3.select<SVGSVGElement, unknown>("#world-map");
  const tooltip = d3.select<HTMLDivElement, unknown>(".map-tooltip");
  const legendEl = container.querySelector<HTMLDivElement>(".map-legend")!;

  // Projection
  const projection = d3
    .geoNaturalEarth1()
    .scale(160)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Zoom
  const zoom = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
      g.attr("transform", event.transform.toString());
    });

  svg.call(zoom as any);

  const g = svg.append("g");

  // Color scales
  const pctColor = d3
    .scaleThreshold<number, string>()
    .domain([20, 40, 60, 80, 100, 150, 200])
    .range([
      "#1a9850",
      "#66bd63",
      "#a6d96a",
      "#fee08b",
      "#fdae61",
      "#f46d43",
      "#d73027",
      "#67001f",
    ]);

  const absColor = d3
    .scaleThreshold<number, string>()
    .domain([1, 5, 20, 100, 500, 1000, 5000])
    .range([
      "#f7fbff",
      "#deebf7",
      "#c6dbef",
      "#9ecae1",
      "#6baed6",
      "#4292c6",
      "#2171b5",
      "#08306b",
    ]);

  // Fetch GeoJSON
  const geojson = (await d3.json(GEOJSON_URL)) as GeoJSON.FeatureCollection;

  // Render countries
  g.selectAll("path.country")
    .data(geojson.features)
    .join("path")
    .attr("class", "country")
    .attr("d", path as any)
    .attr("fill", (d: any) => getColor(getIso3(d.properties)))
    .attr("stroke", "#222")
    .attr("stroke-width", 0.3)
    .on("mouseover", function (event, d: any) {
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", 1);
      const iso3 = getIso3(d.properties);
      showTooltip(event, iso3, d.properties.NAME || d.properties.NAME_LONG || d.properties.ADMIN);
    })
    .on("mousemove", function (event) {
      moveTooltip(event);
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "#222").attr("stroke-width", 0.3);
      tooltip.style("display", "none");
    });

  function getColor(iso3: string | null): string {
    if (!iso3) return "#2a2a2a";
    const d = debtByIso3.get(iso3);
    if (!d) return "#2a2a2a";
    return mode === "pct" ? pctColor(d.debtPctGdp) : absColor(d.debtAbsB);
  }

  function showTooltip(
    event: PointerEvent,
    iso3: string | null,
    fallbackName: string
  ) {
    if (!iso3) {
      tooltip
        .html(`<strong>${fallbackName}</strong><br><em>No data</em>`)
        .style("display", "block");
      return;
    }
    const d = debtByIso3.get(iso3);
    if (!d) {
      tooltip
        .html(`<strong>${fallbackName}</strong><br><em>No data</em>`)
        .style("display", "block");
      return;
    }
    tooltip
      .html(
        `
        <strong>${d.name}</strong><br>
        Debt: <b>${formatBillions(d.debtAbsB)}</b><br>
        % of GDP: <b>${formatPct(d.debtPctGdp)}</b><br>
        GDP: <b>${formatBillions(d.gdpB)}</b>
      `
      )
      .style("display", "block");
    moveTooltip(event);
  }

  function moveTooltip(event: PointerEvent) {
    const containerRect = container.getBoundingClientRect();
    const x = event.clientX - containerRect.left + 12;
    const y = event.clientY - containerRect.top + 12;
    tooltip.style("left", `${x}px`).style("top", `${y}px`);
  }

  function updateColors() {
    g.selectAll<SVGPathElement, any>("path.country")
      .transition()
      .duration(400)
      .attr("fill", (d: any) => getColor(getIso3(d.properties)));
    renderLegend();
  }

  function renderLegend() {
    if (mode === "pct") {
      const stops = [0, 20, 40, 60, 80, 100, 150, 200];
      legendEl.innerHTML = `
        <span class="legend-label">Debt (% of GDP)</span>
        <div class="legend-scale">
          ${stops
            .map(
              (v, i) => `
            <div class="legend-item">
              <div class="legend-swatch" style="background:${pctColor(v + 0.1)}"></div>
              <span>${v}${i === stops.length - 1 ? "+" : `–${stops[i + 1]}`}</span>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    } else {
      const stops = [0, 1, 5, 20, 100, 500, 1000, 5000];
      legendEl.innerHTML = `
        <span class="legend-label">Debt (USD billions)</span>
        <div class="legend-scale">
          ${stops
            .map(
              (v, i) => `
            <div class="legend-item">
              <div class="legend-swatch" style="background:${absColor(v + 0.1)}"></div>
              <span>${
                v === 0
                  ? "0"
                  : formatBillions(v) +
                    (i === stops.length - 1 ? "+" : `–${formatBillions(stops[i + 1])}`)
              }</span>
            </div>
          `
            )
            .join("")}
        </div>
      `;
    }
  }

  // Mode toggle
  container.querySelectorAll<HTMLButtonElement>(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      mode = btn.dataset.mode as Mode;
      container
        .querySelectorAll(".mode-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      updateColors();
    });
  });

  renderLegend();
}

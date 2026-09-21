(() => {
  "use strict";

  const STORAGE_PREFIX = "dk-lss-v1";
  const KEYS = {
    topics: `${STORAGE_PREFIX}.topics`,
    activities: `${STORAGE_PREFIX}.activities`,
    diagnostic: `${STORAGE_PREFIX}.diagnostic`,
    post: `${STORAGE_PREFIX}.post`,
    reflections: `${STORAGE_PREFIX}.reflections`,
    answers: `${STORAGE_PREFIX}.answers`
  };

  const storage = {
    get(key, fallback = null) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (_error) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (_error) {
        return false;
      }
    }
  };

  const session = {
    get(key, fallback = null) {
      try {
        const value = window.sessionStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (_error) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (_error) {
        return false;
      }
    },
    remove(key) {
      try {
        window.sessionStorage.removeItem(key);
      } catch (_error) {
        // La sesión puede estar deshabilitada; la interacción sigue funcionando.
      }
    }
  };

  const numberFormatter = new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 3
  });
  const preciseFormatter = new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: 4
  });

  function formatNumber(value, precision = false) {
    return (precision ? preciseFormatter : numberFormatter).format(value);
  }

  function formatPercent(value) {
    return `${numberFormatter.format(value)}%`;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  function parseNumberList(rawValue) {
    const rawTokens = String(rawValue || "")
      .trim()
      .split(/[\s,;]+/)
      .filter(Boolean);
    const values = [];
    const invalid = [];

    rawTokens.forEach((token) => {
      const normalized = token.replace(/\u2212/g, "-");
      const value = Number(normalized);
      if (Number.isFinite(value)) {
        values.push(value);
      } else {
        invalid.push(token);
      }
    });

    return { values, invalid };
  }

  function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function quantile(sortedValues, probability) {
    if (sortedValues.length === 1) return sortedValues[0];
    const position = (sortedValues.length - 1) * probability;
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);
    if (lowerIndex === upperIndex) return sortedValues[lowerIndex];
    const weight = position - lowerIndex;
    return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
  }

  function sampleStandardDeviation(values, average = mean(values)) {
    if (values.length < 2) return NaN;
    const squaredDeviation = values.reduce(
      (sum, value) => sum + (value - average) ** 2,
      0
    );
    return Math.sqrt(squaredDeviation / (values.length - 1));
  }

  function showError(output, message) {
    if (!output) return;
    const paragraph = document.createElement("p");
    const heading = document.createElement("strong");
    paragraph.className = "lab-error";
    paragraph.setAttribute("role", "alert");
    heading.textContent = "Revisa los datos. ";
    paragraph.append(heading, document.createTextNode(message));
    output.replaceChildren(paragraph);
  }

  function setProgressBar(element, completed, total) {
    if (!element) return;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    if (element instanceof HTMLProgressElement) {
      element.max = total;
      element.value = completed;
      element.textContent = `${completed} de ${total}`;
      return;
    }
    element.setAttribute("aria-valuemax", String(total));
    element.setAttribute("aria-valuenow", String(completed));
    const fill = element.querySelector("span");
    if (fill) fill.style.width = `${clamp(percentage, 0, 100)}%`;
  }

  function initializeTopicProgress() {
    const topicNodes = Array.from(document.querySelectorAll("[data-topic]"));
    if (!topicNodes.length) return;

    const validIds = new Set(topicNodes.map((node) => node.dataset.topic));
    const storedIds = storage.get(KEYS.topics, []);
    const completed = new Set(
      Array.isArray(storedIds) ? storedIds.filter((id) => validIds.has(String(id))) : []
    );
    const count = document.querySelector("[data-progress-count]");
    const progressBar = document.querySelector("[data-progress-bar]");

    function render() {
      topicNodes.forEach((topic) => {
        const id = topic.dataset.topic;
        const button = topic.querySelector("[data-complete]");
        const isComplete = completed.has(id);
        topic.classList.toggle("is-complete", isComplete);
        if (!button) return;
        if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent.trim();
        button.setAttribute("aria-pressed", String(isComplete));
        button.textContent = isComplete ? `✓ ${id} estudiado` : button.dataset.defaultLabel;
      });
      if (count) count.textContent = String(completed.size);
      setProgressBar(progressBar, completed.size, topicNodes.length);
    }

    topicNodes.forEach((topic) => {
      const button = topic.querySelector("[data-complete]");
      if (!button) return;
      button.addEventListener("click", () => {
        const id = topic.dataset.topic;
        if (completed.has(id)) completed.delete(id);
        else completed.add(id);
        storage.set(KEYS.topics, Array.from(completed));
        render();
      });
    });

    render();
  }

  function initializeActivityProgress() {
    const activityNodes = Array.from(document.querySelectorAll("[data-activity]"));
    if (!activityNodes.length) return;

    const validIds = new Set(activityNodes.map((node) => node.dataset.activity));
    const storedIds = storage.get(KEYS.activities, []);
    const completed = new Set(
      Array.isArray(storedIds) ? storedIds.filter((id) => validIds.has(String(id))) : []
    );
    const count = document.querySelector("[data-activity-count]");
    const progressBar = document.querySelector("[data-activity-progress]");

    function render() {
      activityNodes.forEach((activity) => {
        const id = activity.dataset.activity;
        const button = activity.querySelector("[data-activity-complete]");
        const isComplete = completed.has(id);
        activity.classList.toggle("is-complete", isComplete);
        if (!button) return;
        if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent.trim();
        button.setAttribute("aria-pressed", String(isComplete));
        button.textContent = isComplete ? `✓ Producto ${id} registrado` : button.dataset.defaultLabel;
      });
      if (count) count.textContent = String(completed.size);
      setProgressBar(progressBar, completed.size, activityNodes.length);
    }

    activityNodes.forEach((activity) => {
      const button = activity.querySelector("[data-activity-complete]");
      if (!button) return;
      button.addEventListener("click", () => {
        const id = activity.dataset.activity;
        if (completed.has(id)) completed.delete(id);
        else completed.add(id);
        storage.set(KEYS.activities, Array.from(completed));
        render();
      });
    });

    render();
  }

  function renderHistogram(container, values) {
    if (!container) return;
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);

    if (minimum === maximum) {
      container.innerHTML = `<div class="histogram-bin" style="--bar-height: 100%"><span aria-hidden="true"></span><strong>${values.length}</strong><small>${formatNumber(minimum)}</small></div>`;
      container.setAttribute(
        "aria-label",
        `Todas las ${values.length} observaciones tienen el valor ${formatNumber(minimum)}.`
      );
      return;
    }

    const binCount = clamp(Math.ceil(Math.log2(values.length) + 1), 3, 10);
    const binWidth = (maximum - minimum) / binCount;
    const bins = Array.from({ length: binCount }, (_, index) => ({
      lower: minimum + index * binWidth,
      upper: minimum + (index + 1) * binWidth,
      count: 0
    }));

    values.forEach((value) => {
      const rawIndex = Math.floor((value - minimum) / binWidth);
      bins[Math.min(rawIndex, binCount - 1)].count += 1;
    });

    const largestCount = Math.max(...bins.map((bin) => bin.count));
    container.innerHTML = bins
      .map((bin, index) => {
        const height = largestCount ? (bin.count / largestCount) * 100 : 0;
        const interval = index === bins.length - 1 ? "]" : ")";
        const label = `${formatNumber(bin.lower)}–${formatNumber(bin.upper)}`;
        return `<div class="histogram-bin" style="--bar-height: ${height}%" title="${label}: ${bin.count}"><strong>${bin.count}</strong><span aria-hidden="true"></span><small>${formatNumber(bin.lower)}${interval}</small></div>`;
      })
      .join("");
    container.setAttribute(
      "aria-label",
      `Histograma de ${values.length} observaciones en ${binCount} intervalos. Frecuencias: ${bins
        .map((bin) => bin.count)
        .join(", ")}.`
    );
  }

  function initializeDescriptiveStatistics() {
    const input = document.querySelector("#stats-data");
    const calculateButton = document.querySelector("[data-calc-stats]");
    const sampleButton = document.querySelector("[data-sample-stats]");
    const output = document.querySelector("[data-stats-output]");
    const histogram = document.querySelector("[data-histogram]");
    if (!input || !calculateButton || !output) return;

    function calculate() {
      const parsed = parseNumberList(input.value);
      if (parsed.invalid.length) {
        showError(output, `No se reconocieron estos valores: ${parsed.invalid.slice(0, 4).join(", ")}.`);
        if (histogram) histogram.replaceChildren();
        return;
      }
      if (parsed.values.length < 2) {
        showError(output, "Introduce al menos dos observaciones numéricas.");
        if (histogram) histogram.replaceChildren();
        return;
      }

      const sorted = [...parsed.values].sort((a, b) => a - b);
      const average = mean(sorted);
      const median = quantile(sorted, 0.5);
      const q1 = quantile(sorted, 0.25);
      const q3 = quantile(sorted, 0.75);
      const standardDeviation = sampleStandardDeviation(sorted, average);
      const range = sorted[sorted.length - 1] - sorted[0];
      const iqr = q3 - q1;
      const coefficientOfVariation = average !== 0 ? Math.abs(standardDeviation / average) * 100 : NaN;

      output.innerHTML = `<dl class="metric-grid">
        <div><dt>n</dt><dd>${sorted.length}</dd></div>
        <div><dt>Media</dt><dd>${formatNumber(average)}</dd></div>
        <div><dt>Mediana</dt><dd>${formatNumber(median)}</dd></div>
        <div><dt>s muestral</dt><dd>${formatNumber(standardDeviation)}</dd></div>
        <div><dt>CV</dt><dd>${Number.isFinite(coefficientOfVariation) ? formatPercent(coefficientOfVariation) : "No definido"}</dd></div>
        <div><dt>Rango</dt><dd>${formatNumber(range)}</dd></div>
        <div><dt>IQR</dt><dd>${formatNumber(iqr)}</dd></div>
      </dl><p class="calculation-note">Cuartiles por interpolación lineal. La desviación usa n − 1. El CV sólo es interpretable en escalas de razón con cero significativo.</p>`;
      renderHistogram(histogram, sorted);
    }

    calculateButton.addEventListener("click", calculate);
    if (sampleButton) {
      sampleButton.addEventListener("click", () => {
        input.value = "9.8, 10.1, 10.3, 10.7, 11.0, 11.2, 11.4, 11.8, 12.0, 12.1, 12.3, 12.5, 12.8, 13.0, 13.1, 13.4, 13.8, 14.0, 14.2, 14.5, 15.0, 15.8, 18.6, 22.4";
        calculate();
      });
    }
  }

  function initializeDpmoCalculator() {
    const unitsInput = document.querySelector("#dpmo-units");
    const opportunitiesInput = document.querySelector("#dpmo-opportunities");
    const defectsInput = document.querySelector("#dpmo-defects");
    const button = document.querySelector("[data-calc-dpmo]");
    const output = document.querySelector("[data-dpmo-output]");
    if (!unitsInput || !opportunitiesInput || !defectsInput || !button || !output) return;

    button.addEventListener("click", () => {
      const units = Number(unitsInput.value);
      const opportunities = Number(opportunitiesInput.value);
      const defects = Number(defectsInput.value);
      if (![units, opportunities, defects].every(Number.isFinite)) {
        showError(output, "Completa los tres campos con números finitos.");
        return;
      }
      if (units <= 0 || opportunities <= 0 || defects < 0) {
        showError(output, "Unidades y oportunidades deben ser mayores que cero; los defectos no pueden ser negativos.");
        return;
      }
      const totalOpportunities = units * opportunities;
      if (defects > totalOpportunities) {
        showError(output, "Los defectos exceden las oportunidades totales definidas.");
        return;
      }

      const dpu = defects / units;
      const dpo = defects / totalOpportunities;
      const dpmo = dpo * 1_000_000;
      const opportunityYield = (1 - dpo) * 100;
      output.innerHTML = `<dl class="metric-grid">
        <div><dt>Oportunidades</dt><dd>${formatNumber(totalOpportunities)}</dd></div>
        <div><dt>DPU</dt><dd>${preciseFormatter.format(dpu)}</dd></div>
        <div><dt>DPO</dt><dd>${preciseFormatter.format(dpo)}</dd></div>
        <div><dt>DPMO</dt><dd>${formatNumber(dpmo)}</dd></div>
        <div><dt>Rendimiento por oportunidad</dt><dd>${formatPercent(opportunityYield)}</dd></div>
      </dl><p class="calculation-note">Este rendimiento es la fracción observada de oportunidades sin defecto; no es el rendimiento acumulado de una unidad con varias oportunidades.</p>`;
    });
  }

  function renderScatterplot(svg, xValues, yValues, intercept, slope) {
    if (!svg) return;
    const width = 520;
    const height = 300;
    const margin = { top: 18, right: 18, bottom: 44, left: 55 };
    let xMin = Math.min(...xValues);
    let xMax = Math.max(...xValues);
    let yMin = Math.min(...yValues);
    let yMax = Math.max(...yValues);
    const xPadding = (xMax - xMin) * 0.06 || 1;
    const yPadding = (yMax - yMin) * 0.1 || 1;
    xMin -= xPadding;
    xMax += xPadding;
    yMin -= yPadding;
    yMax += yPadding;

    const xScale = (value) =>
      margin.left + ((value - xMin) / (xMax - xMin)) * (width - margin.left - margin.right);
    const yScale = (value) =>
      height - margin.bottom - ((value - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);
    const grid = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const x = margin.left + ratio * (width - margin.left - margin.right);
      const y = margin.top + ratio * (height - margin.top - margin.bottom);
      const xValue = xMin + ratio * (xMax - xMin);
      const yValue = yMax - ratio * (yMax - yMin);
      return `<line class="plot-grid" x1="${x}" y1="${margin.top}" x2="${x}" y2="${height - margin.bottom}"/><text class="plot-label" x="${x}" y="${height - 18}" text-anchor="middle">${formatNumber(xValue)}</text><line class="plot-grid" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/><text class="plot-label" x="${margin.left - 8}" y="${y + 4}" text-anchor="end">${formatNumber(yValue)}</text>`;
    }).join("");
    const points = xValues
      .map(
        (xValue, index) =>
          `<circle class="plot-point" cx="${xScale(xValue)}" cy="${yScale(yValues[index])}" r="5"><title>X ${formatNumber(xValue)}, Y ${formatNumber(yValues[index])}</title></circle>`
      )
      .join("");
    const lineStartX = Math.min(...xValues);
    const lineEndX = Math.max(...xValues);
    const line = `<line class="regression-line" x1="${xScale(lineStartX)}" y1="${yScale(intercept + slope * lineStartX)}" x2="${xScale(lineEndX)}" y2="${yScale(intercept + slope * lineEndX)}"/>`;

    svg.innerHTML = `${grid}<line class="plot-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"/><line class="plot-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"/>${line}${points}<text class="axis-title" x="${(margin.left + width - margin.right) / 2}" y="${height - 2}" text-anchor="middle">X</text><text class="axis-title" transform="translate(14 ${(margin.top + height - margin.bottom) / 2}) rotate(-90)" text-anchor="middle">Y</text>`;
    svg.setAttribute(
      "aria-label",
      `Dispersión de ${xValues.length} pares y recta ajustada con pendiente ${formatNumber(slope)}.`
    );
  }

  function initializeRegressionCalculator() {
    const xInput = document.querySelector("#reg-x");
    const yInput = document.querySelector("#reg-y");
    const button = document.querySelector("[data-calc-regression]");
    const output = document.querySelector("[data-regression-output]");
    const plot = document.querySelector("[data-scatterplot]");
    if (!xInput || !yInput || !button || !output) return;

    button.addEventListener("click", () => {
      const parsedX = parseNumberList(xInput.value);
      const parsedY = parseNumberList(yInput.value);
      if (parsedX.invalid.length || parsedY.invalid.length) {
        showError(output, "Las listas contienen texto o separadores no reconocidos.");
        return;
      }
      if (parsedX.values.length !== parsedY.values.length) {
        showError(output, `X contiene ${parsedX.values.length} valores y Y contiene ${parsedY.values.length}.`);
        return;
      }
      if (parsedX.values.length < 3) {
        showError(output, "Introduce al menos tres pares X–Y.");
        return;
      }

      const xAverage = mean(parsedX.values);
      const yAverage = mean(parsedY.values);
      const sxx = parsedX.values.reduce((sum, x) => sum + (x - xAverage) ** 2, 0);
      const syy = parsedY.values.reduce((sum, y) => sum + (y - yAverage) ** 2, 0);
      const sxy = parsedX.values.reduce(
        (sum, x, index) => sum + (x - xAverage) * (parsedY.values[index] - yAverage),
        0
      );
      if (sxx === 0) {
        showError(output, "X no varía; no es posible estimar una pendiente.");
        return;
      }

      const slope = sxy / sxx;
      const intercept = yAverage - slope * xAverage;
      const correlation = syy > 0 ? sxy / Math.sqrt(sxx * syy) : NaN;
      const rSquared = Number.isFinite(correlation) ? correlation ** 2 : NaN;
      const equationSign = slope >= 0 ? "+" : "−";
      const equation = `ŷ = ${formatNumber(intercept)} ${equationSign} ${formatNumber(Math.abs(slope))}x`;
      output.innerHTML = `<dl class="metric-grid">
        <div><dt>Pares</dt><dd>${parsedX.values.length}</dd></div>
        <div><dt>Intercepto b₀</dt><dd>${formatNumber(intercept)}</dd></div>
        <div><dt>Pendiente b₁</dt><dd>${formatNumber(slope)}</dd></div>
        <div><dt>r</dt><dd>${Number.isFinite(correlation) ? preciseFormatter.format(correlation) : "No definido"}</dd></div>
        <div><dt>R²</dt><dd>${Number.isFinite(rSquared) ? preciseFormatter.format(rSquared) : "No definido"}</dd></div>
      </dl><p class="equation">${equation}</p><p class="calculation-note">Mínimos cuadrados ordinarios. Revisa la dispersión y los residuos antes de usar el modelo para decidir.</p>`;
      renderScatterplot(plot, parsedX.values, parsedY.values, intercept, slope);
    });
  }

  function initializeKanbanCalculator() {
    const demandInput = document.querySelector("#kanban-demand");
    const leadInput = document.querySelector("#kanban-lead");
    const safetyInput = document.querySelector("#kanban-safety");
    const containerInput = document.querySelector("#kanban-container");
    const button = document.querySelector("[data-calc-kanban]");
    const output = document.querySelector("[data-kanban-output]");
    if (!demandInput || !leadInput || !safetyInput || !containerInput || !button || !output) return;

    button.addEventListener("click", () => {
      const demand = Number(demandInput.value);
      const leadTime = Number(leadInput.value);
      const safetyPercent = Number(safetyInput.value);
      const containerCapacity = Number(containerInput.value);
      if (![demand, leadTime, safetyPercent, containerCapacity].every(Number.isFinite)) {
        showError(output, "Completa los cuatro campos con números finitos.");
        return;
      }
      if (demand < 0 || leadTime < 0 || safetyPercent < 0 || containerCapacity <= 0) {
        showError(output, "Demanda, reposición y seguridad no pueden ser negativas; la capacidad debe ser mayor que cero.");
        return;
      }

      const rawCards = (demand * leadTime * (1 + safetyPercent / 100)) / containerCapacity;
      const cards = Math.ceil(rawCards);
      const protectedUnits = cards * containerCapacity;
      const nominalNeed = demand * leadTime;
      const excessUnits = protectedUnits - nominalNeed;
      output.innerHTML = `<dl class="metric-grid">
        <div><dt>Cálculo continuo</dt><dd>${preciseFormatter.format(rawCards)}</dd></div>
        <div><dt>Tarjetas o contenedores</dt><dd>${cards}</dd></div>
        <div><dt>Capacidad autorizada</dt><dd>${formatNumber(protectedUnits)}</dd></div>
        <div><dt>Margen sobre consumo esperado</dt><dd>${formatNumber(excessUnits)}</dd></div>
      </dl><p class="calculation-note">Se redondea hacia arriba. Demanda y tiempo de reposición deben estar expresados en periodos compatibles.</p>`;
    });
  }

  function renderControlChart(svg, values, centerLine, lowerLimit, upperLimit) {
    if (!svg) return;
    const width = 680;
    const height = 300;
    const margin = { top: 20, right: 62, bottom: 42, left: 58 };
    let yMin = Math.min(lowerLimit, ...values);
    let yMax = Math.max(upperLimit, ...values);
    const padding = (yMax - yMin) * 0.1 || 1;
    yMin -= padding;
    yMax += padding;
    const xScale = (index) =>
      margin.left + (index / Math.max(values.length - 1, 1)) * (width - margin.left - margin.right);
    const yScale = (value) =>
      height - margin.bottom - ((value - yMin) / (yMax - yMin)) * (height - margin.top - margin.bottom);
    const ticks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const y = margin.top + ratio * (height - margin.top - margin.bottom);
      const value = yMax - ratio * (yMax - yMin);
      return `<line class="plot-grid" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/><text class="plot-label" x="${margin.left - 8}" y="${y + 4}" text-anchor="end">${formatNumber(value)}</text>`;
    }).join("");
    const limitLines = [
      [upperLimit, "LSC", "control-limit"],
      [centerLine, "Media", "control-center"],
      [lowerLimit, "LIC", "control-limit"]
    ]
      .map(([value, label, className]) => {
        const y = yScale(value);
        return `<line class="${className}" x1="${margin.left}" y1="${y}" x2="${width - margin.right}" y2="${y}"/><text class="limit-label" x="${width - margin.right + 7}" y="${y + 4}">${label}</text>`;
      })
      .join("");
    const polylinePoints = values.map((value, index) => `${xScale(index)},${yScale(value)}`).join(" ");
    const points = values
      .map((value, index) => {
        const isSignal = value > upperLimit || value < lowerLimit;
        return `<circle class="control-point${isSignal ? " is-signal" : ""}" cx="${xScale(index)}" cy="${yScale(value)}" r="${isSignal ? 6 : 4}"><title>Observación ${index + 1}: ${formatNumber(value)}${isSignal ? ", fuera de límites" : ""}</title></circle>`;
      })
      .join("");
    const xLabels = values
      .map((_, index) => {
        if (values.length > 20 && index % Math.ceil(values.length / 10) !== 0 && index !== values.length - 1) return "";
        return `<text class="plot-label" x="${xScale(index)}" y="${height - 18}" text-anchor="middle">${index + 1}</text>`;
      })
      .join("");

    svg.innerHTML = `${ticks}<line class="plot-axis" x1="${margin.left}" y1="${height - margin.bottom}" x2="${width - margin.right}" y2="${height - margin.bottom}"/><line class="plot-axis" x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${height - margin.bottom}"/>${limitLines}<polyline class="control-series" points="${polylinePoints}"/>${points}${xLabels}<text class="axis-title" x="${(margin.left + width - margin.right) / 2}" y="${height - 2}" text-anchor="middle">Orden temporal</text>`;
    const signalCount = values.filter((value) => value > upperLimit || value < lowerLimit).length;
    svg.setAttribute(
      "aria-label",
      `Gráfica I de ${values.length} observaciones, con ${signalCount} punto${signalCount === 1 ? "" : "s"} fuera de los límites preliminares.`
    );
  }

  function initializeControlCalculator() {
    const input = document.querySelector("#control-data");
    const button = document.querySelector("[data-calc-control]");
    const output = document.querySelector("[data-control-output]");
    const plot = document.querySelector("[data-controlplot]");
    if (!input || !button || !output) return;

    button.addEventListener("click", () => {
      const parsed = parseNumberList(input.value);
      if (parsed.invalid.length) {
        showError(output, `No se reconocieron estos valores: ${parsed.invalid.slice(0, 4).join(", ")}.`);
        return;
      }
      if (parsed.values.length < 3) {
        showError(output, "Introduce al menos tres observaciones en orden temporal.");
        return;
      }

      const average = mean(parsed.values);
      const movingRanges = parsed.values.slice(1).map((value, index) => Math.abs(value - parsed.values[index]));
      const movingRangeAverage = mean(movingRanges);
      const upperLimit = average + 2.66 * movingRangeAverage;
      const lowerLimit = average - 2.66 * movingRangeAverage;
      const signals = parsed.values
        .map((value, index) => ({ value, observation: index + 1 }))
        .filter(({ value }) => value > upperLimit || value < lowerLimit);

      output.innerHTML = `<dl class="metric-grid">
        <div><dt>Observaciones</dt><dd>${parsed.values.length}</dd></div>
        <div><dt>Media</dt><dd>${formatNumber(average)}</dd></div>
        <div><dt>Rango móvil medio</dt><dd>${formatNumber(movingRangeAverage)}</dd></div>
        <div><dt>LSC</dt><dd>${formatNumber(upperLimit)}</dd></div>
        <div><dt>LIC</dt><dd>${formatNumber(lowerLimit)}</dd></div>
        <div><dt>Señales simples</dt><dd>${signals.length}</dd></div>
      </dl><p class="calculation-note">Límites individuales preliminares: X̄ ± 2.66 MR̄. ${signals.length ? `Investiga las observaciones ${signals.map((signal) => signal.observation).join(", ")}.` : "No se detectaron puntos fuera de límites; aún deben revisarse patrones y contexto."}</p>`;
      renderControlChart(plot, parsed.values, average, lowerLimit, upperLimit);
    });
  }

  function initializeQuiz() {
    const form = document.querySelector("[data-quiz]");
    if (!form) return;
    const questions = Array.from(form.querySelectorAll("[data-question]"));
    const result = form.querySelector("[data-quiz-result]");
    const diagnosticButton = form.querySelector("[data-save-diagnostic]");
    const resetButton = form.querySelector("[data-quiz-reset]");
    const unitNames = ["Fundamentos Lean", "Fundamentos Six Sigma", "Medición y análisis", "Integración logística"];

    questions.forEach((question) => {
      const feedback = question.querySelector("[data-feedback]");
      if (feedback) feedback.hidden = true;
    });

    function collectScore(reveal = true) {
      let answered = 0;
      let correct = 0;
      const unitResults = Array.from({ length: 4 }, () => ({ answered: 0, correct: 0, total: 0 }));

      questions.forEach((question, index) => {
        const selected = question.querySelector("input[type='radio']:checked");
        const isCorrect = Boolean(selected && selected.value === question.dataset.correct);
        const unitIndex = Math.min(3, Math.floor(index / 5));
        unitResults[unitIndex].total += 1;
        if (selected) {
          answered += 1;
          unitResults[unitIndex].answered += 1;
        }
        if (isCorrect) {
          correct += 1;
          unitResults[unitIndex].correct += 1;
        }

        if (reveal) {
          question.classList.toggle("is-correct", isCorrect);
          question.classList.toggle("is-incorrect", !isCorrect);
          question.querySelectorAll("label").forEach((label) => {
            const radio = label.querySelector("input[type='radio']");
            label.classList.toggle("is-answer-key", radio?.value === question.dataset.correct);
            label.classList.toggle(
              "is-selected-wrong",
              Boolean(radio?.checked && radio.value !== question.dataset.correct)
            );
          });
          const feedback = question.querySelector("[data-feedback]");
          if (feedback) feedback.hidden = false;
        }
      });

      return {
        answered,
        correct,
        total: questions.length,
        score: questions.length ? Math.round((correct / questions.length) * 100) : 0,
        units: unitResults.map((unit, index) => ({
          unit: index + 1,
          label: unitNames[index],
          answered: unit.answered,
          correct: unit.correct,
          total: unit.total,
          score: unit.total ? Math.round((unit.correct / unit.total) * 100) : 0
        }))
      };
    }

    function completeRequired(score) {
      if (score.answered === score.total) return true;
      if (result) {
        result.textContent = `Faltan ${score.total - score.answered} reactivo${score.total - score.answered === 1 ? "" : "s"}. Completa los 20 para obtener una medición comparable.`;
      }
      const firstMissing = questions.find((question) => !question.querySelector("input[type='radio']:checked"));
      firstMissing?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }

    function saveAttempt(type) {
      const provisionalScore = collectScore(false);
      if (!completeRequired(provisionalScore)) return;
      const score = collectScore(true);
      if (type === "diagnostic" && storage.get(KEYS.diagnostic)) {
        if (result) result.textContent = "El diagnóstico inicial ya está registrado y se conserva para mantener una línea base comparable.";
        return;
      }
      const attempt = { ...score, recordedAt: new Date().toISOString() };
      const saved = storage.set(type === "diagnostic" ? KEYS.diagnostic : KEYS.post, attempt);
      if (type === "diagnostic" && saved && diagnosticButton) {
        diagnosticButton.disabled = true;
        diagnosticButton.textContent = "Diagnóstico registrado";
      }
      if (result) {
        result.textContent = `${type === "diagnostic" ? "Diagnóstico" : "Salida"}: ${score.correct}/${score.total} (${score.score}%). ${saved ? "Resultado guardado en este navegador." : "El navegador no permitió conservarlo; el resultado sigue visible."}`;
      }
      renderLearningDashboard();
    }

    function saveSessionAnswers() {
      const answers = {};
      questions.forEach((question) => {
        const checked = question.querySelector("input[type='radio']:checked");
        if (checked) answers[checked.name] = checked.value;
      });
      session.set(KEYS.answers, answers);
    }

    const savedAnswers = session.get(KEYS.answers, {});
    if (savedAnswers && typeof savedAnswers === "object") {
      Object.entries(savedAnswers).forEach(([name, value]) => {
        const radio = form.querySelector(`input[name="${CSS.escape(name)}"][value="${CSS.escape(String(value))}"]`);
        if (radio) radio.checked = true;
      });
    }

    form.addEventListener("change", saveSessionAnswers);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      saveAttempt("post");
    });
    diagnosticButton?.addEventListener("click", () => saveAttempt("diagnostic"));
    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        session.remove(KEYS.answers);
        questions.forEach((question) => {
          question.classList.remove("is-correct", "is-incorrect");
          question.querySelectorAll("label").forEach((label) =>
            label.classList.remove("is-answer-key", "is-selected-wrong")
          );
          const feedback = question.querySelector("[data-feedback]");
          if (feedback) feedback.hidden = true;
        });
        if (result) result.textContent = "Selección limpia. El diagnóstico y la salida guardados se mantienen en el tablero.";
      }, 0);
    });
    resetButton?.setAttribute("aria-label", "Limpiar respuestas actuales del cuestionario");

    const diagnostic = storage.get(KEYS.diagnostic);
    if (diagnostic && diagnosticButton) {
      diagnosticButton.disabled = true;
      diagnosticButton.textContent = "Diagnóstico registrado";
      diagnosticButton.setAttribute("aria-describedby", "quiz-title");
    }
  }

  function validAttempt(value) {
    return Boolean(
      value &&
        Number.isFinite(value.score) &&
        Array.isArray(value.units) &&
        value.units.length === 4
    );
  }

  function renderLearningDashboard() {
    const diagnosticRaw = storage.get(KEYS.diagnostic);
    const postRaw = storage.get(KEYS.post);
    const diagnostic = validAttempt(diagnosticRaw) ? diagnosticRaw : null;
    const post = validAttempt(postRaw) ? postRaw : null;
    const diagnosticNode = document.querySelector("[data-diagnostic-score]");
    const postNode = document.querySelector("[data-post-score]");
    const gainNode = document.querySelector("[data-gain-score]");
    const normalizedNode = document.querySelector("[data-normalized-gain]");
    const mastery = document.querySelector("[data-unit-mastery]");
    const route = document.querySelector("[data-adaptive-route]");

    if (diagnosticNode) diagnosticNode.textContent = diagnostic ? formatPercent(diagnostic.score) : "—";
    if (postNode) postNode.textContent = post ? formatPercent(post.score) : "—";
    if (gainNode) {
      gainNode.textContent = diagnostic && post ? `${post.score - diagnostic.score >= 0 ? "+" : ""}${post.score - diagnostic.score} pp` : "—";
    }
    if (normalizedNode) {
      if (diagnostic && post && diagnostic.score < 100) {
        normalizedNode.textContent = preciseFormatter.format(
          (post.score - diagnostic.score) / (100 - diagnostic.score)
        );
      } else if (diagnostic && post && diagnostic.score === 100) {
        normalizedNode.textContent = "No aplica";
      } else {
        normalizedNode.textContent = "—";
      }
    }

    const latest = post || diagnostic;
    if (mastery) {
      if (!latest) {
        mastery.innerHTML = "<p>Registra el diagnóstico para activar la comparación.</p>";
      } else {
        mastery.innerHTML = latest.units
          .map((unit, index) => {
            const baseline = diagnostic?.units?.[index]?.score;
            const current = post?.units?.[index]?.score ?? baseline;
            const comparison = diagnostic && post ? `${baseline}% → ${current}%` : `${current}%`;
            return `<div class="mastery-row"><div><span>Unidad ${index + 1}</span><strong>${comparison}</strong></div><div class="mastery-track" role="progressbar" aria-label="Dominio de unidad ${index + 1}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${current}"><span style="width:${clamp(current, 0, 100)}%"></span></div></div>`;
          })
          .join("");
      }
    }

    if (route) {
      if (!latest) {
        route.innerHTML = "<p>La ruta aparecerá después de calificar.</p>";
      } else {
        const reinforcement = latest.units.filter((unit) => unit.score < 70);
        if (!reinforcement.length) {
          route.innerHTML = "<p><strong>Las cuatro unidades alcanzan al menos 70%.</strong> Consolida con el proyecto integrador y explica una decisión con datos propios o simulados.</p>";
        } else {
          route.innerHTML = `<p>Prioriza los bloques por debajo de 70%:</p><div class="adaptive-links">${reinforcement
            .map(
              (unit) =>
                `<a href="#unidad-${unit.unit}"><span>Unidad ${unit.unit}</span><strong>${unit.score}%</strong><small>${unit.label}</small></a>`
            )
            .join("")}</div>`;
        }
      }
    }
  }

  function currentReflections() {
    return Object.fromEntries(
      Array.from(document.querySelectorAll("[data-reflection]")).map((field) => [
        field.dataset.reflection,
        field.value.trim()
      ])
    );
  }

  function initializeReflections() {
    const fields = Array.from(document.querySelectorAll("[data-reflection]"));
    const saveButton = document.querySelector("[data-save-reflections]");
    const exportButton = document.querySelector("[data-export-learning]");
    const status = document.querySelector("[data-reflection-status]");
    if (!fields.length) return;

    const saved = storage.get(KEYS.reflections, {});
    if (saved && typeof saved === "object") {
      fields.forEach((field) => {
        if (typeof saved[field.dataset.reflection] === "string") {
          field.value = saved[field.dataset.reflection];
        }
      });
    }

    function save(showConfirmation = true) {
      const succeeded = storage.set(KEYS.reflections, currentReflections());
      if (status && showConfirmation) {
        status.textContent = succeeded
          ? `Bitácora guardada a las ${new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date())}.`
          : "El navegador no permitió guardar; descarga el reporte para conservar tus notas.";
      }
      return succeeded;
    }

    let saveTimer;
    fields.forEach((field) => {
      field.addEventListener("input", () => {
        window.clearTimeout(saveTimer);
        if (status) status.textContent = "Guardando…";
        saveTimer = window.setTimeout(() => save(true), 500);
      });
    });
    saveButton?.addEventListener("click", () => save(true));
    exportButton?.addEventListener("click", () => {
      save(false);
      exportLearningReport(status);
    });
  }

  function exportLearningReport(status) {
    const topics = storage.get(KEYS.topics, []);
    const activities = storage.get(KEYS.activities, []);
    const diagnosticRaw = storage.get(KEYS.diagnostic);
    const postRaw = storage.get(KEYS.post);
    const diagnostic = validAttempt(diagnosticRaw) ? diagnosticRaw : null;
    const post = validAttempt(postRaw) ? postRaw : null;
    const reflections = currentReflections();
    const now = new Date();
    const lines = [
      "REPORTE FORMATIVO — LEAN SIX SIGMA",
      "Aula abierta de Dirk Hans Krakaur Floranes",
      `Fecha de exportación: ${new Intl.DateTimeFormat("es-MX", { dateStyle: "long", timeStyle: "short" }).format(now)}`,
      "",
      "Este reporte reúne el estado conservado en este navegador. No constituye una calificación institucional.",
      "",
      "AVANCE CURRICULAR",
      `Temas estudiados: ${Array.isArray(topics) ? topics.length : 0}/28`,
      `Identificadores: ${Array.isArray(topics) && topics.length ? topics.join(", ") : "ninguno"}`,
      "",
      "PORTAFOLIO DE ACTIVIDADES",
      `Productos registrados: ${Array.isArray(activities) ? activities.length : 0}/10`,
      `Productos: ${Array.isArray(activities) && activities.length ? activities.join(", ") : "ninguno"}`,
      "",
      "MEDICIÓN DEL APRENDIZAJE",
      diagnostic ? `Diagnóstico: ${diagnostic.correct}/${diagnostic.total} (${diagnostic.score}%) — ${diagnostic.recordedAt}` : "Diagnóstico: no registrado",
      post ? `Salida: ${post.correct}/${post.total} (${post.score}%) — ${post.recordedAt}` : "Salida: no registrada"
    ];

    if (diagnostic && post) {
      const normalized = diagnostic.score < 100
        ? (post.score - diagnostic.score) / (100 - diagnostic.score)
        : null;
      lines.push(`Ganancia: ${post.score - diagnostic.score >= 0 ? "+" : ""}${post.score - diagnostic.score} puntos porcentuales`);
      lines.push(`Ganancia normalizada: ${normalized === null ? "no aplica (diagnóstico de 100%)" : preciseFormatter.format(normalized)}`);
    }

    const unitSource = post || diagnostic;
    if (unitSource) {
      lines.push("");
      unitSource.units.forEach((unit, index) => {
        const baseline = diagnostic?.units?.[index]?.score;
        const final = post?.units?.[index]?.score;
        lines.push(
          `Unidad ${unit.unit} — ${unit.label}: ${diagnostic && post ? `${baseline}% → ${final}%` : `${unit.score}%`}`
        );
      });
    }

    const reflectionLabels = {
      before: "Antes de estudiar",
      evidence: "Evidencia que cambió o matizó la hipótesis",
      transfer: "Transferencia",
      question: "Pregunta abierta"
    };
    lines.push("", "BITÁCORA METACOGNITIVA");
    Object.entries(reflectionLabels).forEach(([key, label]) => {
      lines.push("", label.toUpperCase(), reflections[key] || "Sin respuesta.");
    });
    lines.push("", "FIN DEL REPORTE");

    const blob = new Blob([lines.join("\r\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-aprendizaje-six-sigma-${now.toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    if (status) status.textContent = "Reporte descargado. Incluye avance, resultados y reflexiones.";
  }

  function initializePrintControl() {
    document.querySelectorAll("[data-print]").forEach((button) => {
      button.addEventListener("click", () => window.print());
    });
  }

  function initialize() {
    initializeTopicProgress();
    initializeActivityProgress();
    initializeDescriptiveStatistics();
    initializeDpmoCalculator();
    initializeRegressionCalculator();
    initializeKanbanCalculator();
    initializeControlCalculator();
    initializeQuiz();
    initializeReflections();
    initializePrintControl();
    renderLearningDashboard();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();

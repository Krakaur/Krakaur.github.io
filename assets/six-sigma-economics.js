(() => {
  "use strict";

  const currencyFormatter = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const numberFormatter = new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  class InputError extends Error {
    constructor(input, message) {
      super(message);
      this.input = input;
    }
  }

  const create = (tag, className, text) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  };

  const replaceChildren = (element, ...children) => {
    element.replaceChildren(...children);
  };

  const formatCurrency = (value) => currencyFormatter.format(value);
  const formatNumber = (value) => numberFormatter.format(value);
  const formatPercent = (value) => `${formatNumber(value)}%`;

  const parseLocaleNumber = (raw) => {
    const compact = String(raw).trim().replace(/\s/g, "");
    if (!compact) return Number.NaN;

    let normalized = compact;
    if (compact.includes(",") && compact.includes(".")) {
      const decimalSeparator = compact.lastIndexOf(",") > compact.lastIndexOf(".") ? "," : ".";
      const thousandsSeparator = decimalSeparator === "," ? "." : ",";
      normalized = compact.split(thousandsSeparator).join("");
      if (decimalSeparator === ",") normalized = normalized.replace(",", ".");
    } else if (compact.includes(",")) {
      normalized = compact.replace(",", ".");
    }

    return Number(normalized);
  };

  const readNumber = (form, name, label, options = {}) => {
    const input = form.elements.namedItem(name);
    const value = parseLocaleNumber(input.value);
    const { min = -Infinity, max = Infinity, integer = false, exclusiveMin = false } = options;
    const belowMinimum = exclusiveMin ? value <= min : value < min;

    if (!Number.isFinite(value)) {
      throw new InputError(input, `${label}: escribe un número válido.`);
    }
    if (integer && !Number.isInteger(value)) {
      throw new InputError(input, `${label}: usa un número entero.`);
    }
    if (belowMinimum || value > max) {
      const lowerSymbol = exclusiveMin ? ">" : "≥";
      const upperText = Number.isFinite(max) ? ` y ≤ ${max}` : "";
      throw new InputError(input, `${label}: el valor debe ser ${lowerSymbol} ${min}${upperText}.`);
    }
    return value;
  };

  const readCashFlows = (form) => {
    const input = form.elements.namedItem("cashflows");
    const raw = input.value.trim();
    if (!raw) throw new InputError(input, "Flujos: escribe al menos un valor.");

    const usesStrongDelimiter = /[;\n]/.test(raw);
    const tokens = usesStrongDelimiter ? raw.split(/[;\n]+/) : raw.split(",");
    const values = tokens.map((token) => parseLocaleNumber(token)).filter((value, index) => {
      if (String(tokens[index]).trim() === "") return false;
      return true;
    });

    if (!values.length || values.some((value) => !Number.isFinite(value))) {
      throw new InputError(input, "Flujos: separa cada valor con coma, punto y coma o salto de línea. Usa punto decimal si la coma separa periodos.");
    }
    if (values.length > 60) {
      throw new InputError(input, "Flujos: usa un máximo de 60 periodos por cálculo.");
    }
    return values;
  };

  const clearFormState = (form) => {
    form.querySelectorAll("[aria-invalid='true']").forEach((field) => field.removeAttribute("aria-invalid"));
    const error = form.querySelector("[data-error]");
    if (error) error.textContent = "";
  };

  const showInputError = (form, error) => {
    const errorBox = form.querySelector("[data-error]");
    if (errorBox) errorBox.textContent = error.message;
    if (error.input) {
      error.input.setAttribute("aria-invalid", "true");
      error.input.focus();
    }
  };

  const resultBlock = (headline, explanation) => {
    const wrapper = create("div");
    const value = create("strong", "", headline);
    const text = create("p", "", explanation);
    wrapper.append(value, text);
    return wrapper;
  };

  const presentValue = (futureValue, rate, periods) => futureValue / ((1 + rate) ** periods);
  const futureValue = (present, rate, periods) => present * ((1 + rate) ** periods);
  const annuityFactor = (rate, periods) => rate === 0 ? periods : (1 - ((1 + rate) ** -periods)) / rate;

  const findPayback = (investment, cashflows, rate = 0) => {
    if (investment <= 0) return 0;
    let cumulative = -investment;
    for (let index = 0; index < cashflows.length; index += 1) {
      const flow = cashflows[index] / ((1 + rate) ** (index + 1));
      const before = cumulative;
      cumulative += flow;
      if (before < 0 && cumulative >= 0 && flow > 0) {
        return index + (-before / flow);
      }
    }
    return null;
  };

  const initializeTimeValue = (form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormState(form);
      try {
        const operation = form.elements.namedItem("operation").value;
        const amount = readNumber(form, "amount", "Monto", { min: 0, exclusiveMin: true });
        const ratePercent = readNumber(form, "rate", "Tasa", { min: 0, max: 1000 });
        const periods = readNumber(form, "periods", "Periodos", { min: 1, max: 600, integer: true });
        const rate = ratePercent / 100;
        const result = operation === "future" ? futureValue(amount, rate, periods) : presentValue(amount, rate, periods);
        const direction = operation === "future" ? "capitalizar" : "descontar";
        const origin = operation === "future" ? "presente" : "futuro";
        const destination = operation === "future" ? "futuro" : "presente";
        const explanation = `Al ${direction} ${formatNumber(amount)} desde el ${origin} durante ${periods} periodo${periods === 1 ? "" : "s"} a ${formatPercent(ratePercent)}, el valor ${destination} equivalente es ${formatNumber(result)} unidades monetarias.`;
        replaceChildren(form.querySelector("[data-result]"), resultBlock(`${formatNumber(result)} u.m.`, explanation));
      } catch (error) {
        if (error instanceof InputError) showInputError(form, error);
        else throw error;
      }
    });
  };

  const buildNpvTable = (investment, cashflows, rate) => {
    const table = create("table", "calculator-table");
    const caption = create("caption", "", "Trazabilidad de flujos descontados");
    const head = create("thead");
    const headRow = create("tr");
    ["Periodo", "Flujo", "Factor", "Valor presente"].forEach((label) => headRow.append(create("th", "", label)));
    head.append(headRow);
    const body = create("tbody");

    const initialRow = create("tr");
    ["0", formatCurrency(-investment), "1.0000", formatCurrency(-investment)].forEach((value) => initialRow.append(create("td", "", value)));
    body.append(initialRow);

    cashflows.forEach((flow, index) => {
      const period = index + 1;
      const factor = 1 / ((1 + rate) ** period);
      const row = create("tr");
      [String(period), formatCurrency(flow), factor.toFixed(4), formatCurrency(flow * factor)].forEach((value) => row.append(create("td", "", value)));
      body.append(row);
    });
    table.append(caption, head, body);
    return table;
  };

  const initializeNpv = (form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormState(form);
      try {
        const investment = readNumber(form, "investment", "Inversión", { min: 0, exclusiveMin: true });
        const ratePercent = readNumber(form, "rate", "Tasa", { min: 0, max: 1000 });
        const cashflows = readCashFlows(form);
        const rate = ratePercent / 100;
        const npv = cashflows.reduce((total, flow, index) => total + (flow / ((1 + rate) ** (index + 1))), -investment);
        const criterion = npv > 0 ? "supera" : npv < 0 ? "no alcanza" : "iguala";
        const explanation = `A ${formatPercent(ratePercent)} por periodo, la serie ${criterion} el rendimiento requerido por ${formatCurrency(Math.abs(npv))}. La conclusión depende de la calidad y calendario de los flujos.`;
        replaceChildren(form.querySelector("[data-result]"), resultBlock(formatCurrency(npv), explanation));
        replaceChildren(form.querySelector("[data-table]"), buildNpvTable(investment, cashflows, rate));
      } catch (error) {
        if (error instanceof InputError) showInputError(form, error);
        else throw error;
      }
    });
  };

  const paybackCard = (label, value, horizon) => {
    const wrapper = create("div");
    wrapper.append(create("small", "", label));
    const outcome = value === null ? `No se recupera en ${horizon} periodos` : `${formatNumber(value)} periodos`;
    wrapper.append(create("strong", "", outcome));
    return wrapper;
  };

  const initializePayback = (form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormState(form);
      try {
        const investment = readNumber(form, "investment", "Inversión", { min: 0, exclusiveMin: true });
        const ratePercent = readNumber(form, "rate", "Tasa", { min: 0, max: 1000 });
        const cashflows = readCashFlows(form);
        const simple = findPayback(investment, cashflows);
        const discounted = findPayback(investment, cashflows, ratePercent / 100);
        replaceChildren(
          form.querySelector("[data-result]"),
          paybackCard("Recuperación simple", simple, cashflows.length),
          paybackCard("Recuperación descontada", discounted, cashflows.length)
        );
      } catch (error) {
        if (error instanceof InputError) showInputError(form, error);
        else throw error;
      }
    });
  };

  const businessMetric = (label, value, detail) => {
    const wrapper = create("div", "business-metric");
    wrapper.append(create("span", "", label), create("strong", "", value), create("small", "", detail));
    return wrapper;
  };

  const calculateBusinessCase = ({ units, defectRate, defectCost, reduction, implementation, sustain, years, rate }) => {
    const baselineCost = units * defectRate * defectCost;
    const avoidedDefects = units * defectRate * reduction;
    const grossSavings = baselineCost * reduction;
    const annualNet = grossSavings - sustain;
    const factor = annuityFactor(rate, years);
    const npv = -implementation + (annualNet * factor);
    const simplePaybackRaw = annualNet > 0 ? implementation / annualNet : null;
    const simplePayback = simplePaybackRaw !== null && simplePaybackRaw <= years ? simplePaybackRaw : null;
    const discountedPayback = annualNet > 0 ? findPayback(implementation, Array(years).fill(annualNet), rate) : null;
    const breakEvenReduction = baselineCost > 0 ? (sustain + (implementation / factor)) / baselineCost : Infinity;
    return { baselineCost, avoidedDefects, grossSavings, annualNet, npv, simplePayback, discountedPayback, breakEvenReduction };
  };

  const initializeBusinessCase = (form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      clearFormState(form);
      try {
        const units = readNumber(form, "units", "Unidades", { min: 1, max: 1e12, integer: true });
        const defectRatePercent = readNumber(form, "defectRate", "Tasa defectuosa", { min: 0, max: 100 });
        const defectCost = readNumber(form, "defectCost", "Costo por defecto", { min: 0 });
        const reductionPercent = readNumber(form, "reduction", "Reducción", { min: 0, max: 100 });
        const implementation = readNumber(form, "implementation", "Inversión", { min: 0 });
        const sustain = readNumber(form, "sustain", "Costo de sostener", { min: 0 });
        const years = readNumber(form, "years", "Horizonte", { min: 1, max: 50, integer: true });
        const ratePercent = readNumber(form, "rate", "Tasa", { min: 0, max: 1000 });
        const realized = form.elements.namedItem("realized");
        if (!realized.checked) {
          throw new InputError(realized, "Confirma que documentaste el mecanismo de realización del beneficio.");
        }

        const values = {
          units,
          defectRate: defectRatePercent / 100,
          defectCost,
          reduction: reductionPercent / 100,
          implementation,
          sustain,
          years,
          rate: ratePercent / 100
        };
        const result = calculateBusinessCase(values);
        const paybackText = result.simplePayback === null ? `No en ${years} años` : `${formatNumber(result.simplePayback)} años`;
        const discountedText = result.discountedPayback === null ? `No en ${years} años` : `${formatNumber(result.discountedPayback)} años`;
        replaceChildren(
          form.querySelector("[data-result]"),
          businessMetric("Costo de mala calidad base", formatCurrency(result.baselineCost), `${formatNumber(units * values.defectRate)} defectos esperados por año`),
          businessMetric("Ahorro bruto anual", formatCurrency(result.grossSavings), `${formatNumber(result.avoidedDefects)} defectos evitados según el efecto esperado`),
          businessMetric("Beneficio neto anual", formatCurrency(result.annualNet), "ahorro bruto menos costo anual de sostener"),
          businessMetric("VPN del caso base", formatCurrency(result.npv), `horizonte de ${years} años a ${formatPercent(ratePercent)}`),
          businessMetric("Recuperación simple", paybackText, "no descuenta los flujos"),
          businessMetric("Recuperación descontada", discountedText, "acumula beneficios a valor presente")
        );

        const sensitivity = form.querySelector("[data-sensitivity]");
        const lowReduction = Math.max(0, values.reduction * 0.8);
        const highReduction = Math.min(1, values.reduction * 1.2);
        const low = calculateBusinessCase({ ...values, reduction: lowReduction });
        const high = calculateBusinessCase({ ...values, reduction: highReduction });
        const heading = create("h3", "", "Sensibilidad del efecto");
        const statement = create("p", "", `Si la reducción fuera ${formatPercent(lowReduction * 100)}, el VPN sería ${formatCurrency(low.npv)}; si fuera ${formatPercent(highReduction * 100)}, sería ${formatCurrency(high.npv)}. El punto de equilibrio estimado es ${Number.isFinite(result.breakEvenReduction) ? formatPercent(result.breakEvenReduction * 100) : "no calculable"} de reducción, manteniendo los demás supuestos.`);
        replaceChildren(sensitivity, heading, statement);
        sensitivity.hidden = false;
      } catch (error) {
        if (error instanceof InputError) showInputError(form, error);
        else throw error;
      }
    });
  };

  const initializeQuiz = (form) => {
    const fields = Array.from(form.querySelectorAll("fieldset[data-answer]"));
    const output = form.querySelector("[data-quiz-result]");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let correct = 0;
      let missing = 0;
      let firstMissing = null;

      fields.forEach((field) => {
        field.classList.remove("is-correct", "is-incorrect", "is-missing");
        field.classList.add("is-reviewed");
        const selected = field.querySelector("input:checked");
        if (!selected) {
          missing += 1;
          field.classList.add("is-missing");
          if (!firstMissing) firstMissing = field;
        } else if (selected.value === field.dataset.answer) {
          correct += 1;
          field.classList.add("is-correct");
        } else {
          field.classList.add("is-incorrect");
        }
      });

      if (missing) {
        output.textContent = `Faltan ${missing} reactivo${missing === 1 ? "" : "s"}. Revisa los recuadros marcados.`;
        firstMissing?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstMissing?.querySelector("input")?.focus({ preventScroll: true });
        return;
      }

      const percent = Math.round((correct / fields.length) * 100);
      const guidance = percent >= 88 ? "Argumentación consistente." : percent >= 63 ? "Buen avance; revisa las explicaciones de los errores." : "Conviene volver a flujo incremental, equivalencia y límites de cada indicador.";
      output.textContent = `${correct} de ${fields.length} correctas (${percent}%). ${guidance}`;
    });

    form.addEventListener("reset", () => {
      window.setTimeout(() => {
        fields.forEach((field) => field.classList.remove("is-reviewed", "is-correct", "is-incorrect", "is-missing"));
        output.textContent = "Responde los ocho reactivos.";
      }, 0);
    });
  };

  document.querySelectorAll("[data-calculator]").forEach((form) => {
    const type = form.dataset.calculator;
    if (type === "time-value") initializeTimeValue(form);
    if (type === "npv") initializeNpv(form);
    if (type === "payback") initializePayback(form);
    if (type === "business-case") initializeBusinessCase(form);
  });

  const quiz = document.querySelector("[data-economics-quiz]");
  if (quiz) initializeQuiz(quiz);
})();

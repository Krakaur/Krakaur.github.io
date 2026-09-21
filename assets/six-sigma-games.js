(() => {
  "use strict";

  const STORAGE_KEY = "dk-lss-arcade-v1";
  const STATE_VERSION = 1;
  const XP_PER_LEVEL = 120;
  const DOMAIN_ORDER = ["dmaic", "waste", "evidence", "numbers", "control"];
  const DOMAIN_META = {
    dmaic: { label: "Misión DMAIC", short: "DMAIC", container: "game-dmaic" },
    waste: { label: "Radar de desperdicios", short: "Mudas", container: "game-waste" },
    evidence: { label: "Tribunal de evidencia", short: "Evidencia", container: "game-evidence" },
    numbers: { label: "Reto numérico", short: "Cálculo", container: "game-numbers" },
    control: { label: "Señal o ruido", short: "Control", container: "game-control" }
  };
  const LEARNING_TRACKS = [
    {
      id: "qualitative",
      label: "Dominio cualitativo",
      description: "Reconocimiento conceptual de DMAIC y desperdicios",
      domains: ["dmaic", "waste"]
    },
    {
      id: "quantitative",
      label: "Dominio cuantitativo",
      description: "Cálculo e interpretación de variación",
      domains: ["numbers", "control"]
    },
    {
      id: "transfer",
      label: "Transferencia",
      description: "Juicio sobre evidencia y alcance de conclusiones",
      domains: ["evidence"]
    }
  ];

  const DMAIC_ITEMS = [
    {
      id: "dmaic-charter",
      prompt: "El equipo acuerda el problema, el alcance, la meta, los responsables y la fecha objetivo en un Project Charter.",
      answer: "Definir",
      rationale: "El Charter delimita el proyecto y alinea la necesidad del cliente con una meta verificable; corresponde a Definir."
    },
    {
      id: "dmaic-ctq",
      prompt: "La voz del cliente se traduce en una característica crítica: entregar cada pedido completo y antes de 24 horas.",
      answer: "Definir",
      rationale: "Convertir la voz del cliente en un CTQ operacional establece qué valor debe proteger el proyecto."
    },
    {
      id: "dmaic-scope",
      prompt: "Se excluyen del proyecto las rutas foráneas y se fija como frontera el proceso desde la liberación hasta el embarque.",
      answer: "Definir",
      rationale: "Acordar fronteras evita que el proyecto cambie de alcance sin justificación."
    },
    {
      id: "dmaic-msa",
      prompt: "Tres inspectores miden repetidamente las mismas piezas para estimar repetibilidad y reproducibilidad.",
      answer: "Medir",
      rationale: "Antes de analizar el proceso se verifica que el sistema de medición produzca datos utilizables."
    },
    {
      id: "dmaic-baseline",
      prompt: "Se recolectan cuatro semanas de tiempo de ciclo con una definición operacional común para establecer la línea base.",
      answer: "Medir",
      rationale: "La línea base cuantifica el desempeño inicial con datos comparables."
    },
    {
      id: "dmaic-capability-baseline",
      prompt: "Con un proceso estable y medición válida se calculan Cp y Cpk antes de proponer soluciones.",
      answer: "Medir",
      rationale: "La capacidad inicial documenta la distancia entre el desempeño observado y los requisitos."
    },
    {
      id: "dmaic-root-cause",
      prompt: "El equipo contrasta con datos si la distancia recorrida y el número de líneas explican el tiempo de surtido.",
      answer: "Analizar",
      rationale: "Contrastar causas potenciales con evidencia es el propósito de Analizar."
    },
    {
      id: "dmaic-hypothesis",
      prompt: "Se prueba si la tasa de defectos difiere entre turnos y se reportan efecto, incertidumbre y supuestos.",
      answer: "Analizar",
      rationale: "La inferencia ayuda a discriminar asociaciones plausibles de variación aleatoria."
    },
    {
      id: "dmaic-regression",
      prompt: "Se examinan residuos y observaciones influyentes antes de interpretar un modelo de regresión.",
      answer: "Analizar",
      rationale: "El diagnóstico del modelo pertenece al análisis de la relación entre variables."
    },
    {
      id: "dmaic-pilot",
      prompt: "Se prueba en una celda piloto un nuevo orden de surtido y se compara su efecto con la línea base.",
      answer: "Mejorar",
      rationale: "Pilotear una solución permite estimar su efecto y sus consecuencias antes de ampliarla."
    },
    {
      id: "dmaic-doe",
      prompt: "Se realiza un diseño factorial para elegir temperatura y velocidad que reduzcan defectos sin elevar el consumo.",
      answer: "Mejorar",
      rationale: "El experimento compara alternativas y sus interacciones para seleccionar una mejora."
    },
    {
      id: "dmaic-pokayoke",
      prompt: "Se instala un conector que físicamente impide montar la pieza con orientación invertida.",
      answer: "Mejorar",
      rationale: "El poka-yoke modifica el proceso para prevenir el modo de falla."
    },
    {
      id: "dmaic-control-plan",
      prompt: "Se documentan variable, frecuencia, responsable, límites y reacción ante señales especiales.",
      answer: "Controlar",
      rationale: "Un plan de control sostiene la mejora y define una respuesta antes de que el desempeño se deteriore."
    },
    {
      id: "dmaic-spc",
      prompt: "El dueño del proceso revisa semanalmente una carta de control y activa el plan de reacción cuando aparece una señal.",
      answer: "Controlar",
      rationale: "El seguimiento estadístico y la reacción estandarizada forman parte de Controlar."
    },
    {
      id: "dmaic-standard-work",
      prompt: "Tras confirmar el resultado, se actualizan el trabajo estándar, la capacitación y la auditoría de sostenimiento.",
      answer: "Controlar",
      rationale: "Estandarizar y auditar conserva el nuevo método una vez demostrada la mejora."
    }
  ];

  const WASTE_OPTIONS = [
    "Defectos",
    "Sobreproducción",
    "Espera",
    "Talento no utilizado",
    "Transporte",
    "Inventario",
    "Movimiento",
    "Sobreprocesamiento"
  ];

  const WASTE_ITEMS = [
    {
      id: "waste-rework",
      prompt: "Una orden regresa a captura porque el código del cliente se registró de forma incorrecta.",
      answer: "Defectos",
      rationale: "El error exige corrección y consume capacidad que no agrega valor para el cliente."
    },
    {
      id: "waste-scrap",
      prompt: "Una pieza se desecha porque su diámetro quedó fuera de especificación.",
      answer: "Defectos",
      rationale: "El producto no conforme representa desperdicio por defectos."
    },
    {
      id: "waste-forecast",
      prompt: "Se fabrican 2 000 unidades sin pedido para mantener ocupada la línea, aunque la demanda semanal es de 900.",
      answer: "Sobreproducción",
      rationale: "Producir antes o en mayor cantidad que la demanda genera sobreproducción y suele originar otros desperdicios."
    },
    {
      id: "waste-batch",
      prompt: "Un reporte mensual se imprime diariamente aun cuando nadie lo utiliza hasta el cierre.",
      answer: "Sobreproducción",
      rationale: "Generar información antes de que sea necesaria también es sobreproducción."
    },
    {
      id: "waste-approval",
      prompt: "El lote permanece detenido tres horas porque falta la firma de una persona que está en reunión.",
      answer: "Espera",
      rationale: "El producto no se transforma mientras aguarda una autorización."
    },
    {
      id: "waste-machine",
      prompt: "Dos operadores permanecen inactivos mientras reinicia una máquina después de cada cambio de modelo.",
      answer: "Espera",
      rationale: "La capacidad humana permanece ociosa por el tiempo de preparación del equipo."
    },
    {
      id: "waste-ideas",
      prompt: "El personal identifica una causa recurrente, pero el sistema de mejora no permite registrar sus propuestas.",
      answer: "Talento no utilizado",
      rationale: "Ignorar conocimiento y capacidad de resolución desaprovecha el talento de las personas."
    },
    {
      id: "waste-skill",
      prompt: "Una ingeniera dedica gran parte de su jornada a copiar manualmente datos que podrían integrarse de forma automática.",
      answer: "Talento no utilizado",
      rationale: "Asignar trabajo rutinario evitable impide aplicar capacidades de mayor valor."
    },
    {
      id: "waste-warehouse",
      prompt: "Las piezas viajan entre tres edificios antes de llegar al punto de ensamble.",
      answer: "Transporte",
      rationale: "El traslado innecesario de materiales es desperdicio por transporte."
    },
    {
      id: "waste-paper",
      prompt: "Cada expediente físico cruza dos pisos para obtener sellos que podrían colocarse en el mismo punto.",
      answer: "Transporte",
      rationale: "El desplazamiento innecesario del objeto de trabajo constituye transporte."
    },
    {
      id: "waste-buffer",
      prompt: "Hay seis semanas de materia prima almacenada para un insumo que llega diariamente.",
      answer: "Inventario",
      rationale: "El material acumulado por encima de la necesidad inmediata inmoviliza recursos y oculta problemas."
    },
    {
      id: "waste-wip",
      prompt: "Cincuenta expedientes esperan en una bandeja entre captura y validación.",
      answer: "Inventario",
      rationale: "El trabajo en proceso pendiente también es inventario."
    },
    {
      id: "waste-walk",
      prompt: "La operadora camina doce metros en cada ciclo para buscar una herramienta de uso frecuente.",
      answer: "Movimiento",
      rationale: "El desplazamiento innecesario de personas es desperdicio por movimiento."
    },
    {
      id: "waste-reach",
      prompt: "El técnico debe inclinarse y girar repetidamente para tomar componentes ubicados detrás de su estación.",
      answer: "Movimiento",
      rationale: "Los alcances y giros evitables no transforman el producto y pueden elevar el riesgo ergonómico."
    },
    {
      id: "waste-double-entry",
      prompt: "El mismo dato se captura en dos sistemas porque ambos exigen formatos diferentes.",
      answer: "Sobreprocesamiento",
      rationale: "Repetir una operación que no cambia el valor recibido es sobreprocesamiento."
    },
    {
      id: "waste-polish",
      prompt: "Se pule una superficie interna hasta un acabado superior al que exige el diseño y que el cliente no observa.",
      answer: "Sobreprocesamiento",
      rationale: "Aplicar precisión o acabado más allá del requisito consume recursos sin aumentar el valor acordado."
    }
  ];

  const EVIDENCE_OPTIONS = ["Sostenida", "Insuficiente", "Contradicha"];
  const EVIDENCE_ITEMS = [
    {
      id: "evidence-dpmo",
      prompt: "Se observaron 3 400 defectos por millón de oportunidades; por tanto, 0.34% de las oportunidades presentó defecto.",
      answer: "Sostenida",
      rationale: "3 400 ÷ 1 000 000 = 0.0034, equivalente a 0.34%. La unidad de análisis sigue siendo la oportunidad, no necesariamente la unidad producida."
    },
    {
      id: "evidence-null",
      prompt: "Como p = 0.18, quedó demostrado que los dos turnos tienen exactamente la misma media.",
      answer: "Contradicha",
      rationale: "No rechazar H₀ no demuestra igualdad exacta. El resultado indica que los datos y el diseño no aportaron evidencia suficiente contra H₀."
    },
    {
      id: "evidence-causal-observational",
      prompt: "En registros observacionales, quienes recibieron capacitación tuvieron menos defectos; por eso la capacitación causó la reducción.",
      answer: "Insuficiente",
      rationale: "La asociación es compatible con un efecto, pero selección, experiencia u otras variables pueden explicarla. Hace falta un diseño causal más sólido."
    },
    {
      id: "evidence-control-capability",
      prompt: "Todos los puntos están dentro de los límites de control; por tanto, cada pieza cumple especificaciones.",
      answer: "Contradicha",
      rationale: "Los límites de control describen variación del proceso; las especificaciones expresan requisitos. Un proceso estable puede ser incapaz."
    },
    {
      id: "evidence-before-after",
      prompt: "El tiempo promedio bajó después del cambio, pero no hubo grupo comparador ni control de demanda; el cambio fue la única causa.",
      answer: "Insuficiente",
      rationale: "La comparación antes-después documenta una diferencia temporal, pero no descarta historia, estacionalidad o cambios en la mezcla."
    },
    {
      id: "evidence-r2",
      prompt: "R² = 0.94 garantiza que la relación es causal y que los residuos cumplen todos los supuestos.",
      answer: "Contradicha",
      rationale: "R² resume variación explicada dentro del modelo; no establece causalidad ni sustituye el diagnóstico de residuos."
    },
    {
      id: "evidence-interviews",
      prompt: "Doce entrevistas intencionales permiten describir temas recurrentes, pero no estimar su prevalencia en toda la población.",
      answer: "Sostenida",
      rationale: "La conclusión conserva la fuerza exploratoria del material cualitativo sin convertirla en una estimación poblacional."
    },
    {
      id: "evidence-cpk",
      prompt: "Con medición válida, distribución adecuada y proceso estable, Cpk = 1.41 aporta evidencia de capacidad respecto de los límites usados.",
      answer: "Sostenida",
      rationale: "Bajo esos supuestos, Cpk compara la dispersión y el centrado del proceso con las especificaciones. Deben conservarse el contexto y los límites analizados."
    },
    {
      id: "evidence-correlation",
      prompt: "Una correlación de cero demuestra que no existe ninguna relación entre las variables.",
      answer: "Contradicha",
      rationale: "La correlación lineal puede ser cero aun cuando exista una relación no lineal. También importa la incertidumbre de la estimación."
    },
    {
      id: "evidence-pareto",
      prompt: "Tres categorías reúnen 78% de los defectos observados; atenderlas primero es una hipótesis de priorización, no prueba de causa raíz.",
      answer: "Sostenida",
      rationale: "El Pareto localiza concentración, pero la frecuencia de una categoría no identifica por sí sola su mecanismo causal."
    },
    {
      id: "evidence-significance",
      prompt: "Un efecto estadísticamente significativo siempre es operacionalmente importante.",
      answer: "Contradicha",
      rationale: "La significancia depende también del tamaño muestral. La decisión requiere magnitud, incertidumbre, costo y relevancia práctica."
    },
    {
      id: "evidence-mixed",
      prompt: "Los datos de proceso muestran dónde ocurre la demora y las entrevistas explican mecanismos plausibles; la triangulación fortalece, pero no vuelve infalible, la conclusión.",
      answer: "Sostenida",
      rationale: "Integrar fuentes complementarias puede aumentar la credibilidad si se explican sus límites y las discrepancias."
    }
  ];

  const CONTROL_OPTIONS = [
    "Variación común",
    "Punto fuera de límites",
    "Corrida en un lado",
    "Tendencia sostenida"
  ];

  const CONTROL_ITEMS = [
    {
      id: "control-common-1",
      center: 10,
      lower: 8,
      upper: 12,
      values: [9.4, 10.5, 9.7, 10.2, 10.8, 9.3, 10.1, 9.8, 10.6, 9.5],
      answer: "Variación común",
      rationale: "No hay puntos fuera de límites ni una corrida de ocho puntos del mismo lado ni seis puntos consecutivos en tendencia. No investigar cada oscilación evita sobreajustar el proceso."
    },
    {
      id: "control-common-2",
      center: 50,
      lower: 44,
      upper: 56,
      values: [49, 52, 48, 51, 47, 53, 50, 46, 52, 49, 54, 48],
      answer: "Variación común",
      rationale: "La secuencia fluctúa dentro de los límites sin activar las tres reglas declaradas. Esto no demuestra capacidad respecto de especificaciones."
    },
    {
      id: "control-outside-high",
      center: 20,
      lower: 16,
      upper: 24,
      values: [19.1, 20.4, 18.9, 21.2, 19.7, 20.3, 24.8, 20.1, 19.4, 21],
      answer: "Punto fuera de límites",
      rationale: "La observación 7 rebasa el límite superior. Debe investigarse el contexto de esa observación antes de cambiar todo el proceso."
    },
    {
      id: "control-outside-low",
      center: 100,
      lower: 92,
      upper: 108,
      values: [101, 99, 103, 98, 100, 91, 102, 97, 101, 99],
      answer: "Punto fuera de límites",
      rationale: "La observación 6 está por debajo del límite inferior y constituye una señal especial aunque la dirección parezca favorable."
    },
    {
      id: "control-run-high",
      center: 30,
      lower: 25,
      upper: 35,
      values: [30.4, 31.1, 32, 30.8, 31.7, 33.1, 32.6, 31.4, 30.9],
      answer: "Corrida en un lado",
      rationale: "Los nueve puntos están por encima de la línea central. La persistencia sugiere un desplazamiento aunque ninguno rebase los límites."
    },
    {
      id: "control-run-low",
      center: 75,
      lower: 68,
      upper: 82,
      values: [74, 73.2, 71.8, 72.5, 70.9, 73.7, 72.2, 71.5],
      answer: "Corrida en un lado",
      rationale: "Ocho puntos consecutivos están debajo de la línea central; la regla detecta un cambio de nivel."
    },
    {
      id: "control-trend-up",
      center: 15,
      lower: 10,
      upper: 20,
      values: [12.1, 12.8, 13.5, 14.2, 15, 15.9, 16.7, 15.4, 14.8],
      answer: "Tendencia sostenida",
      rationale: "Las primeras siete observaciones aumentan de forma consecutiva. La tendencia activa una señal antes de llegar al límite."
    },
    {
      id: "control-trend-down",
      center: 40,
      lower: 34,
      upper: 46,
      values: [44.1, 43.4, 42.7, 41.9, 40.8, 39.6, 38.9, 40.2, 41.1],
      answer: "Tendencia sostenida",
      rationale: "Las primeras siete observaciones disminuyen consecutivamente; la secuencia merece investigación aun dentro de límites."
    }
  ];

  const BADGES = [
    { id: "first", icon: "✦", label: "Primer kaizen", description: "Respondiste tu primer desafío.", test: (s) => totalAttempts(s) >= 1 },
    { id: "ten", icon: "◈", label: "Gemba curioso", description: "Reuniste evidencia en 10 desafíos.", test: (s) => totalAttempts(s) >= 10 },
    { id: "twenty-five", icon: "⬡", label: "Práctica deliberada", description: "Completaste 25 desafíos sin depender de un cronómetro.", test: (s) => totalAttempts(s) >= 25 },
    { id: "streak-three", icon: "↗", label: "Tres con fundamento", description: "Lograste una racha de tres respuestas correctas.", test: (s) => s.bestStreak >= 3 },
    { id: "streak-five", icon: "★", label: "Racha analítica", description: "Lograste una racha de cinco respuestas correctas.", test: (s) => s.bestStreak >= 5 },
    { id: "balanced", icon: "◎", label: "Mirada integral", description: "Exploraste los cinco dominios.", test: (s) => DOMAIN_ORDER.every((key) => s.domains[key].attempts >= 1) },
    { id: "dmaic-master", icon: "D", label: "Guía DMAIC", description: "Alcanzaste dominio reciente en Misión DMAIC.", test: (s) => isMastered(s.domains.dmaic) },
    { id: "waste-master", icon: "8", label: "Ojo para muda", description: "Alcanzaste dominio reciente en Radar de desperdicios.", test: (s) => isMastered(s.domains.waste) },
    { id: "evidence-master", icon: "E", label: "Criterio probatorio", description: "Alcanzaste dominio reciente en Tribunal de evidencia.", test: (s) => isMastered(s.domains.evidence) },
    { id: "numbers-master", icon: "Σ", label: "Cálculo con sentido", description: "Alcanzaste dominio reciente en Reto numérico.", test: (s) => isMastered(s.domains.numbers) },
    { id: "control-master", icon: "I", label: "Lector de señales", description: "Alcanzaste dominio reciente en Señal o ruido.", test: (s) => isMastered(s.domains.control) },
    { id: "integrator", icon: "∞", label: "Integración Lean Six Sigma", description: "Alcanzaste dominio reciente en los cinco juegos.", test: (s) => DOMAIN_ORDER.every((key) => isMastered(s.domains[key])) }
  ];

  let state = loadState();
  let activeDomain = "dmaic";
  const currentItems = {};

  function createDomainState() {
    return {
      attempts: 0,
      correct: 0,
      independentAttempts: 0,
      independentCorrect: 0,
      firstResult: null,
      lastResult: null,
      initialWindow: [],
      recentWindow: []
    };
  }

  function createInitialState() {
    return {
      version: STATE_VERSION,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sessionSeed: makeSeed(),
      xp: 0,
      streak: 0,
      bestStreak: 0,
      badges: {},
      domains: Object.fromEntries(DOMAIN_ORDER.map((key) => [key, createDomainState()])),
      history: []
    };
  }

  function normalizeBooleanArray(value, limit) {
    return Array.isArray(value) ? value.slice(-limit).map(Boolean) : [];
  }

  function normalizeDomain(value) {
    const safe = value && typeof value === "object" ? value : {};
    const attempts = Number.isInteger(safe.attempts) && safe.attempts >= 0 ? safe.attempts : 0;
    const correct = Number.isInteger(safe.correct) && safe.correct >= 0
      ? Math.min(safe.correct, attempts)
      : 0;
    const independentAttempts = Number.isInteger(safe.independentAttempts) && safe.independentAttempts >= 0
      ? Math.min(safe.independentAttempts, attempts)
      : 0;
    const independentCorrect = Number.isInteger(safe.independentCorrect) && safe.independentCorrect >= 0
      ? Math.min(safe.independentCorrect, independentAttempts)
      : 0;
    return {
      attempts,
      correct,
      independentAttempts,
      independentCorrect,
      firstResult: typeof safe.firstResult === "boolean" ? safe.firstResult : null,
      lastResult: typeof safe.lastResult === "boolean" ? safe.lastResult : null,
      initialWindow: normalizeBooleanArray(safe.initialWindow, 5),
      recentWindow: normalizeBooleanArray(safe.recentWindow, 5)
    };
  }

  function normalizeState(value) {
    if (!value || typeof value !== "object" || value.version !== STATE_VERSION) return createInitialState();
    const clean = createInitialState();
    clean.startedAt = typeof value.startedAt === "string" ? value.startedAt : clean.startedAt;
    clean.updatedAt = typeof value.updatedAt === "string" ? value.updatedAt : clean.updatedAt;
    clean.sessionSeed = Number.isInteger(value.sessionSeed) && value.sessionSeed >= 0
      ? value.sessionSeed >>> 0
      : clean.sessionSeed;
    clean.xp = Number.isFinite(value.xp) && value.xp >= 0 ? Math.floor(value.xp) : 0;
    clean.streak = Number.isInteger(value.streak) && value.streak >= 0 ? value.streak : 0;
    clean.bestStreak = Number.isInteger(value.bestStreak) && value.bestStreak >= 0
      ? Math.max(value.bestStreak, clean.streak)
      : clean.streak;
    clean.badges = value.badges && typeof value.badges === "object" && !Array.isArray(value.badges)
      ? Object.fromEntries(
          Object.entries(value.badges)
            .filter(
              ([id, date]) =>
                BADGES.some((badge) => badge.id === id) &&
                typeof date === "string" &&
                Number.isFinite(Date.parse(date))
            )
        )
      : {};
    DOMAIN_ORDER.forEach((key) => {
      clean.domains[key] = normalizeDomain(value.domains?.[key]);
    });
    clean.history = Array.isArray(value.history)
      ? value.history.slice(-250).filter((entry) => entry && typeof entry === "object")
      : [];
    return clean;
  }

  function loadState() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : createInitialState();
    } catch (_error) {
      return createInitialState();
    }
  }

  function saveState() {
    state.updatedAt = new Date().toISOString();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (_error) {
      return false;
    }
  }

  function totalAttempts(source = state) {
    return DOMAIN_ORDER.reduce((sum, key) => sum + source.domains[key].attempts, 0);
  }

  function accuracy(results) {
    if (!results.length) return null;
    return Math.round((results.filter(Boolean).length / results.length) * 100);
  }

  function recentAccuracy(domainState) {
    return accuracy(domainState.recentWindow);
  }

  function isMastered(domainState) {
    const score = recentAccuracy(domainState);
    return domainState.attempts >= 5 && score !== null && score >= 80;
  }

  function levelFromXp(xp) {
    return Math.floor(xp / XP_PER_LEVEL) + 1;
  }

  function levelTitle(level) {
    const titles = ["Observador", "Explorador", "Analista", "Experimentador", "Facilitador", "Integrador"];
    return titles[Math.min(level - 1, titles.length - 1)];
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = String(text);
    return element;
  }

  function appendTextBlock(parent, tag, className, text) {
    const element = node(tag, className, text);
    parent.appendChild(element);
    return element;
  }

  function setLiveRegion(element) {
    element.setAttribute("role", "status");
    element.setAttribute("aria-live", "polite");
    element.setAttribute("aria-atomic", "true");
  }

  function shufflePick(items, previousId) {
    const candidates = items.length > 1 ? items.filter((item) => item.id !== previousId) : items;
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  function domainStateLabel(key) {
    const domain = state.domains[key];
    if (!domain.attempts) return "new";
    if (isMastered(domain)) return "complete";
    return "active";
  }

  function awardBadges() {
    const now = new Date().toISOString();
    const newBadges = [];
    BADGES.forEach((badge) => {
      if (!state.badges[badge.id] && badge.test(state)) {
        state.badges[badge.id] = now;
        newBadges.push(badge);
      }
    });
    return newBadges;
  }

  function shortResponse(value) {
    return String(value ?? "").slice(0, 120);
  }

  function recordAttempt(domainKey, challengeId, correct, response, expected, metadata = {}) {
    const domain = state.domains[domainKey];
    const previousStreak = state.streak;
    state.streak = correct ? previousStreak + 1 : 0;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    const xpEarned = correct ? 20 + Math.min(previousStreak, 5) * 2 : 5;
    state.xp += xpEarned;
    domain.attempts += 1;
    if (correct) domain.correct += 1;
    if (!metadata.usedHint) {
      domain.independentAttempts += 1;
      if (correct) domain.independentCorrect += 1;
    }
    if (domain.firstResult === null) domain.firstResult = correct;
    domain.lastResult = correct;
    if (domain.initialWindow.length < 5) domain.initialWindow.push(correct);
    domain.recentWindow.push(correct);
    domain.recentWindow = domain.recentWindow.slice(-5);
    state.history.push({
      domain: domainKey,
      challengeId,
      correct,
      response: shortResponse(response),
      expected: shortResponse(expected),
      usedHint: Boolean(metadata.usedHint),
      confidence: Number.isFinite(metadata.confidence)
        ? Math.max(0, Math.min(100, Math.round(metadata.confidence)))
        : null,
      variant: shortResponse(metadata.variant || challengeId),
      seed: Number.isInteger(metadata.seed) ? metadata.seed >>> 0 : null,
      xpEarned,
      recordedAt: new Date().toISOString()
    });
    state.history = state.history.slice(-250);
    const newBadges = awardBadges();
    const saved = saveState();
    renderDashboard();
    return { xpEarned, newBadges, saved };
  }

  function feedbackText(correct, rationale, outcome) {
    const opening = correct ? "Decisión sustentada." : "Conviene revisar el criterio.";
    const badgeText = outcome.newBadges.length
      ? ` Nueva insignia: ${outcome.newBadges.map((badge) => badge.label).join(", ")}.`
      : "";
    const storageText = outcome.saved ? "" : " El navegador no permitió conservar este avance.";
    return `${opening} ${rationale} +${outcome.xpEarned} XP.${badgeText}${storageText}`;
  }

  function makeSeed() {
    try {
      const values = new Uint32Array(1);
      window.crypto.getRandomValues(values);
      return values[0];
    } catch (_error) {
      return Math.floor(Math.random() * 0x100000000) >>> 0;
    }
  }

  function makeSeededRandom(seed) {
    let value = seed >>> 0;
    return () => {
      value += 0x6d2b79f5;
      let mixed = value;
      mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
      mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hintForDomain(domainKey, item) {
    if (item.hint) return item.hint;
    const hints = {
      dmaic: "Identifica el propósito inmediato: delimitar, cuantificar, explicar, cambiar o sostener. No clasifiques sólo por el nombre de la herramienta.",
      waste: "Sigue aquello que se desplaza o se acumula: producto, información y personas no producen el mismo tipo de muda.",
      evidence: "Separa tres capas: qué datos se observaron, qué permite el diseño y qué fuerza tiene la conclusión.",
      control: "Primero busca puntos fuera; luego cuenta puntos consecutivos del mismo lado y secuencias monotónicas. Los límites de control no son especificaciones."
    };
    return hints[domainKey] || "Expresa el criterio antes de elegir una respuesta.";
  }

  function makeConfidenceControl(idPrefix) {
    const wrapper = node("div", "confidence-control");
    const label = node("p", "confidence-label", "Antes de responder, ¿qué confianza tienes en que acertarás?");
    label.id = `${idPrefix}-confidence-label`;
    const scale = node("div", "confidence-scale");
    scale.setAttribute("role", "group");
    scale.setAttribute("aria-labelledby", label.id);
    let selectedValue = null;
    const buttons = [0, 25, 50, 75, 100].map((value) => {
      const button = node("button", "scale-button", `${value}%`);
      button.type = "button";
      button.dataset.confidence = String(value);
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        selectedValue = value;
        buttons.forEach((choice) => {
          choice.setAttribute("aria-pressed", String(choice === button));
          choice.classList.toggle("is-selected", choice === button);
        });
      });
      scale.appendChild(button);
      return button;
    });
    wrapper.append(label, scale);
    return {
      wrapper,
      reset() {
        selectedValue = null;
        buttons.forEach((button) => {
          button.disabled = false;
          button.setAttribute("aria-pressed", "false");
          button.classList.remove("is-selected");
        });
      },
      setDisabled(disabled) {
        buttons.forEach((button) => {
          button.disabled = disabled;
        });
      },
      value() {
        return selectedValue;
      },
      focus() {
        buttons[0]?.focus();
      }
    };
  }

  function makeGameHeader(domainKey, description) {
    const header = node("header", "game-stage");
    appendTextBlock(header, "p", "game-kicker", "Práctica sin límite de tiempo");
    appendTextBlock(header, "h2", "game-title", DOMAIN_META[domainKey].label);
    appendTextBlock(header, "p", "game-description", description);
    return header;
  }

  function buildChoiceChallenge(domainKey, items, options, description, promptLabel, extraRenderer) {
    const container = document.getElementById(DOMAIN_META[domainKey].container);
    if (!container) return;
    container.replaceChildren();
    container.classList.add("game-panel");
    container.dataset.game = domainKey;

    const header = makeGameHeader(domainKey, description);
    const card = node("article", "challenge-card");
    const stage = node("div", "game-stage");
    const counter = node("p", "challenge-counter");
    const prompt = node("h3", "challenge-prompt");
    prompt.id = `${domainKey}-prompt`;
    prompt.tabIndex = -1;
    const context = node("div", "challenge-context");
    const choices = node("div", "choice-grid");
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-labelledby", prompt.id);
    const confidence = makeConfidenceControl(domainKey);
    const hintBox = node("p", "game-hint", "La pista es opcional; su uso se registra para separar el desempeño independiente.");
    setLiveRegion(hintBox);
    const feedback = node("p", "game-feedback", "Elige una respuesta y contrástala con la explicación.");
    feedback.dataset.tone = "neutral";
    setLiveRegion(feedback);
    const actions = node("div", "game-actions");
    const hintButton = node("button", "game-button hint game-hint-button", "Usar pista");
    hintButton.type = "button";
    const nextButton = node("button", "game-button game-next", "Siguiente desafío");
    nextButton.type = "button";
    nextButton.hidden = true;
    actions.append(hintButton, nextButton);
    stage.append(counter, prompt, context, choices, confidence.wrapper, hintBox, feedback, actions);
    card.appendChild(stage);
    if (!container.closest(".game-module")) container.appendChild(header);
    container.appendChild(card);
    let usedHint = false;

    hintButton.addEventListener("click", () => {
      if (hintButton.disabled || usedHint) return;
      usedHint = true;
      hintBox.textContent = `Pista: ${hintForDomain(domainKey, currentItems[domainKey])}`;
      hintButton.textContent = "Pista consultada";
      hintButton.disabled = true;
    });

    function renderChallenge(shouldFocus = false) {
      const previous = currentItems[domainKey]?.id;
      const item = shufflePick(items, previous);
      currentItems[domainKey] = item;
      counter.textContent = `${promptLabel} · intento ${state.domains[domainKey].attempts + 1}`;
      prompt.textContent = item.prompt || "Interpreta la carta con las reglas declaradas y elige la señal dominante.";
      context.replaceChildren();
      if (typeof extraRenderer === "function") extraRenderer(context, item);
      choices.replaceChildren();
      feedback.textContent = "Elige una respuesta y contrástala con la explicación.";
      feedback.dataset.tone = "neutral";
      hintBox.textContent = "La pista es opcional; su uso se registra para separar el desempeño independiente.";
      usedHint = false;
      hintButton.disabled = false;
      hintButton.textContent = "Usar pista";
      confidence.reset();
      nextButton.hidden = true;

      options.forEach((option, optionIndex) => {
        const button = node("button", "choice-button");
        button.type = "button";
        button.dataset.value = option;
        const key = node("span", "choice-key", String.fromCharCode(65 + optionIndex));
        key.setAttribute("aria-hidden", "true");
        const copy = node("span", "choice-copy", option);
        button.append(key, copy);
        button.addEventListener("click", () => {
          if (choices.dataset.answered === "true") return;
          if (confidence.value() === null) {
            feedback.textContent = "Declara primero tu confianza. Esta decisión permite comparar certeza subjetiva y acierto.";
            feedback.dataset.tone = "review";
            confidence.focus();
            return;
          }
          choices.dataset.answered = "true";
          const correct = option === item.answer;
          confidence.setDisabled(true);
          hintButton.disabled = true;
          Array.from(choices.children).forEach((choice) => {
            choice.disabled = true;
            choice.classList.toggle("is-selected", choice === button);
            choice.classList.toggle("is-correct", choice.dataset.value === item.answer);
            choice.classList.toggle("is-incorrect", choice === button && !correct);
          });
          const outcome = recordAttempt(domainKey, item.id, correct, option, item.answer, {
            usedHint,
            confidence: confidence.value(),
            variant: item.id,
            seed: null
          });
          feedback.textContent = feedbackText(correct, item.rationale, outcome);
          feedback.dataset.tone = correct ? "correct" : "incorrect";
          nextButton.hidden = false;
          feedback.tabIndex = -1;
          feedback.focus();
        });
        choices.appendChild(button);
      });
      delete choices.dataset.answered;
      if (shouldFocus) prompt.focus();
    }

    nextButton.addEventListener("click", () => renderChallenge(true));
    renderChallenge(false);
  }

  function initializeDmaicGame() {
    buildChoiceChallenge(
      "dmaic",
      DMAIC_ITEMS,
      ["Definir", "Medir", "Analizar", "Mejorar", "Controlar"],
      "Ubica una decisión en la fase cuyo propósito metodológico la justifica.",
      "Clasificación de fase"
    );
  }

  function initializeWasteGame() {
    buildChoiceChallenge(
      "waste",
      WASTE_ITEMS,
      WASTE_OPTIONS,
      "Reconoce el desperdicio dominante sin perder de vista que una situación real puede contener varios.",
      "Escena de gemba"
    );
  }

  function initializeEvidenceGame() {
    buildChoiceChallenge(
      "evidence",
      EVIDENCE_ITEMS,
      EVIDENCE_OPTIONS,
      "Juzga la fuerza de una afirmación: sostenida por lo descrito, insuficiente para concluir o contradicha por el método.",
      "Expediente"
    );
  }

  function randomInteger(minimum, maximum, random = Math.random) {
    return Math.floor(random() * (maximum - minimum + 1)) + minimum;
  }

  function roundTo(value, decimals) {
    const factor = 10 ** decimals;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function formatNumber(value, decimals = 2) {
    return new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: decimals,
      minimumFractionDigits: Number.isInteger(value) ? 0 : decimals
    }).format(value);
  }

  function generateMeanMedianProblem(seed = makeSeed()) {
    const random = makeSeededRandom(seed);
    const values = Array.from({ length: 5 }, () => randomInteger(8, 28, random));
    const askMean = random() < 0.5;
    const sorted = [...values].sort((a, b) => a - b);
    const answer = askMean
      ? roundTo(values.reduce((sum, value) => sum + value, 0) / values.length, 1)
      : sorted[2];
    return {
      id: `numbers-center-${seed}`,
      variant: askMean ? "media" : "mediana",
      seed,
      prompt: `Datos: ${values.join(", ")}. Calcula la ${askMean ? "media" : "mediana"}${askMean ? " y redondea a una decimal" : ""}.`,
      answer,
      tolerance: askMean ? 0.051 : 0.001,
      expected: formatNumber(answer, askMean ? 1 : 0),
      rationale: askMean
        ? `Media = (${values.join(" + ")}) ÷ 5 = ${formatNumber(answer, 1)}.`
        : `Ordenados: ${sorted.join(", ")}; el valor central es ${formatNumber(answer, 0)}.`,
      hint: askMean
        ? "Suma las cinco observaciones y divide entre cinco. Redondea sólo al final."
        : "Ordena las cinco observaciones y toma la que ocupa la tercera posición."
    };
  }

  function generateDpmoProblem(seed = makeSeed()) {
    const random = makeSeededRandom(seed);
    const units = randomInteger(4, 20, random) * 100;
    const opportunities = randomInteger(2, 6, random);
    const defects = randomInteger(2, 18, random);
    const answer = roundTo((defects / (units * opportunities)) * 1_000_000, 0);
    return {
      id: `numbers-dpmo-${seed}`,
      variant: "dpmo",
      seed,
      prompt: `${units} unidades, ${opportunities} oportunidades de defecto por unidad y ${defects} defectos observados. Calcula DPMO y redondea al entero más cercano.`,
      answer,
      tolerance: 0.51,
      expected: formatNumber(answer, 0),
      rationale: `DPMO = ${defects} ÷ (${units} × ${opportunities}) × 1 000 000 = ${formatNumber(answer, 0)}. Describe rendimiento por oportunidad; sin conocer cómo se distribuyen los defectos entre unidades no determina el rendimiento de unidad.`,
      hint: "Calcula primero las oportunidades totales: unidades × oportunidades por unidad. Después escala la proporción de defectos a un millón."
    };
  }

  function generateKanbanProblem(seed = makeSeed()) {
    const random = makeSeededRandom(seed);
    const demand = randomInteger(8, 30, random);
    const lead = randomInteger(2, 8, random);
    const container = randomInteger(8, 25, random);
    const safetyOptions = [0.05, 0.1, 0.15, 0.2];
    const safety = safetyOptions[randomInteger(0, safetyOptions.length - 1, random)];
    const raw = (demand * lead * (1 + safety)) / container;
    const answer = Math.ceil(raw);
    return {
      id: `numbers-kanban-${seed}`,
      variant: "kanban",
      seed,
      prompt: `Demanda de ${demand} piezas/h, reposición de ${lead} h, contenedor de ${container} piezas y seguridad de ${safety * 100}%. ¿Cuántos kanban completos se requieren?`,
      answer,
      tolerance: 0.001,
      expected: formatNumber(answer, 0),
      rationale: `n = (${demand} × ${lead} × ${formatNumber(1 + safety, 2)}) ÷ ${container} = ${formatNumber(raw, 2)}; se redondea hacia arriba a ${answer}.`,
      hint: "Multiplica demanda por tiempo de reposición y factor de seguridad; divide entre la capacidad del contenedor y redondea siempre hacia arriba."
    };
  }

  function generateImprovementProblem(seed = makeSeed()) {
    const random = makeSeededRandom(seed);
    const before = randomInteger(60, 180, random);
    const reduction = randomInteger(10, Math.floor(before * 0.45), random);
    const after = before - reduction;
    const answer = roundTo((reduction / before) * 100, 1);
    return {
      id: `numbers-improvement-${seed}`,
      variant: "mejora-porcentual",
      seed,
      prompt: `Un indicador donde menor es mejor pasó de ${before} a ${after}. Calcula la mejora porcentual respecto de la línea base y redondea a una decimal.`,
      answer,
      tolerance: 0.051,
      expected: `${formatNumber(answer, 1)}%`,
      rationale: `Mejora = (${before} − ${after}) ÷ ${before} × 100 = ${formatNumber(answer, 1)}%.`,
      hint: "La referencia es el valor inicial: resta el valor final al inicial y divide la reducción entre la línea base."
    };
  }

  function generateCpkProblem(seed = makeSeed()) {
    const random = makeSeededRandom(seed);
    const mean = randomInteger(95, 105, random);
    const spreadLow = randomInteger(7, 12, random);
    const spreadHigh = randomInteger(7, 12, random);
    const lower = mean - spreadLow;
    const upper = mean + spreadHigh;
    const sigma = randomInteger(12, 25, random) / 10;
    const cpu = (upper - mean) / (3 * sigma);
    const cpl = (mean - lower) / (3 * sigma);
    const answer = roundTo(Math.min(cpu, cpl), 2);
    return {
      id: `numbers-cpk-${seed}`,
      variant: "cpk-con-supuestos",
      seed,
      prompt: `Con medición válida y proceso estable: media ${mean}, estimación de σ dentro = ${formatNumber(sigma, 1)}, LIE = ${lower}, LSE = ${upper}. Calcula Cpk y redondea a dos decimales.`,
      answer,
      tolerance: 0.006,
      expected: formatNumber(answer, 2),
      rationale: `Cpl = (${mean} − ${lower}) ÷ (3 × ${formatNumber(sigma, 1)}) = ${formatNumber(cpl, 2)}; Cpu = (${upper} − ${mean}) ÷ (3 × ${formatNumber(sigma, 1)}) = ${formatNumber(cpu, 2)}; Cpk = ${formatNumber(answer, 2)}. La conclusión de capacidad se bloquea si faltan especificaciones, la medición no es válida o el proceso es inestable.`,
      hint: "Calcula Cpu y Cpl con las distancias a cada especificación divididas entre tres veces la estimación de variación intraproceso; Cpk es el menor. Los supuestos declarados permiten el cálculo."
    };
  }

  const NUMBER_GENERATORS = [
    generateMeanMedianProblem,
    generateDpmoProblem,
    generateKanbanProblem,
    generateImprovementProblem,
    generateCpkProblem
  ];

  function parseLocaleNumber(raw) {
    let normalized = String(raw || "").trim().replace(/\s/g, "").replace(/%$/, "");
    if (!normalized) return NaN;
    const comma = normalized.lastIndexOf(",");
    const dot = normalized.lastIndexOf(".");
    if (comma >= 0 && dot >= 0) {
      if (comma > dot) normalized = normalized.replace(/\./g, "").replace(",", ".");
      else normalized = normalized.replace(/,/g, "");
    } else if (comma >= 0) {
      normalized = normalized.replace(",", ".");
    }
    return Number(normalized);
  }

  function initializeNumbersGame() {
    const container = document.getElementById(DOMAIN_META.numbers.container);
    if (!container) return;
    container.replaceChildren();
    container.classList.add("game-panel");
    container.dataset.game = "numbers";
    const header = makeGameHeader(
      "numbers",
      "Resuelve problemas generados al momento y explica qué representa el resultado antes de usarlo para decidir."
    );
    const card = node("article", "challenge-card");
    const stage = node("div", "game-stage");
    const counter = node("p", "challenge-counter");
    const prompt = node("h3", "challenge-prompt");
    prompt.id = "numbers-prompt";
    prompt.tabIndex = -1;
    const form = node("form", "game-form numeric-form");
    form.setAttribute("aria-labelledby", prompt.id);
    const label = node("label", "numeric-label", "Tu resultado");
    label.htmlFor = "numbers-answer";
    const input = node("input", "numeric-input");
    input.id = "numbers-answer";
    input.name = "answer";
    input.type = "text";
    input.inputMode = "decimal";
    input.autocomplete = "off";
    input.placeholder = "Ejemplo: 12,5";
    const submit = node("button", "game-button", "Comprobar cálculo");
    submit.type = "submit";
    const field = node("div", "field-group wide");
    field.append(label, input);
    form.append(field, submit);
    const confidence = makeConfidenceControl("numbers");
    const hintBox = node("p", "game-hint", "La pista es opcional; su uso se registra para separar el desempeño independiente.");
    setLiveRegion(hintBox);
    const feedback = node("p", "game-feedback", "Puedes usar punto o coma decimal; evita separadores de miles.");
    feedback.dataset.tone = "neutral";
    setLiveRegion(feedback);
    const actions = node("div", "game-actions");
    const hintButton = node("button", "game-button hint game-hint-button", "Usar pista");
    hintButton.type = "button";
    const nextButton = node("button", "game-button game-next", "Nuevo problema");
    nextButton.type = "button";
    nextButton.hidden = true;
    actions.append(hintButton, nextButton);
    stage.append(counter, prompt, form, confidence.wrapper, hintBox, feedback, actions);
    card.appendChild(stage);
    if (!container.closest(".game-module")) container.appendChild(header);
    container.appendChild(card);
    let usedHint = false;

    hintButton.addEventListener("click", () => {
      if (hintButton.disabled || usedHint) return;
      usedHint = true;
      hintBox.textContent = `Pista: ${currentItems.numbers.hint}`;
      hintButton.textContent = "Pista consultada";
      hintButton.disabled = true;
    });

    function renderProblem(shouldFocus = false) {
      const generator = NUMBER_GENERATORS[randomInteger(0, NUMBER_GENERATORS.length - 1)];
      const problem = generator(makeSeed());
      currentItems.numbers = problem;
      counter.textContent = `Problema aleatorio · intento ${state.domains.numbers.attempts + 1}`;
      prompt.textContent = problem.prompt;
      input.value = "";
      input.disabled = false;
      submit.disabled = false;
      input.classList.remove("is-correct", "is-incorrect");
      confidence.reset();
      usedHint = false;
      hintButton.disabled = false;
      hintButton.textContent = "Usar pista";
      hintBox.textContent = "La pista es opcional; su uso se registra para separar el desempeño independiente.";
      feedback.textContent = "Puedes usar punto o coma decimal; evita separadores de miles.";
      feedback.dataset.tone = "neutral";
      nextButton.hidden = true;
      if (shouldFocus) {
        prompt.focus();
        input.focus();
      }
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (submit.disabled) return;
      const value = parseLocaleNumber(input.value);
      if (!Number.isFinite(value)) {
        feedback.textContent = "Introduce un valor numérico antes de comprobar.";
        feedback.dataset.tone = "review";
        input.focus();
        return;
      }
      if (confidence.value() === null) {
        feedback.textContent = "Declara primero tu confianza. Esta decisión permite comparar certeza subjetiva y acierto.";
        feedback.dataset.tone = "review";
        confidence.focus();
        return;
      }
      const problem = currentItems.numbers;
      const correct = Math.abs(value - problem.answer) <= problem.tolerance;
      input.disabled = true;
      submit.disabled = true;
      confidence.setDisabled(true);
      hintButton.disabled = true;
      input.classList.toggle("is-correct", correct);
      input.classList.toggle("is-incorrect", !correct);
      const outcome = recordAttempt("numbers", problem.id, correct, value, problem.expected, {
        usedHint,
        confidence: confidence.value(),
        variant: problem.variant,
        seed: problem.seed
      });
      const answerLead = correct
        ? "Cálculo consistente."
        : `Resultado esperado: ${problem.expected}.`;
      feedback.textContent = `${answerLead} ${feedbackText(correct, problem.rationale, outcome)}`;
      feedback.dataset.tone = correct ? "correct" : "incorrect";
      nextButton.hidden = false;
      feedback.tabIndex = -1;
      feedback.focus();
    });
    nextButton.addEventListener("click", () => renderProblem(true));
    renderProblem(false);
  }

  function svgNode(tag, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, String(value)));
    return element;
  }

  function renderControlChart(container, item) {
    container.replaceChildren();
    const width = 680;
    const height = 310;
    const margin = { top: 24, right: 30, bottom: 48, left: 58 };
    const chartPanel = node("div", "game-chart");
    const svg = svgNode("svg", {
      class: "control-chart",
      viewBox: `0 0 ${width} ${height}`,
      width,
      height,
      role: "img",
      "aria-labelledby": "control-chart-title control-chart-description"
    });
    const title = svgNode("title", { id: "control-chart-title" });
    title.textContent = "Carta de control de individuales";
    const description = svgNode("desc", { id: "control-chart-description" });
    description.textContent = `Valores en orden temporal: ${item.values.join(", ")}. Línea central ${item.center}, límite inferior ${item.lower} y límite superior ${item.upper}.`;
    svg.append(title, description);

    const yMin = Math.min(item.lower, ...item.values) - Math.abs(item.upper - item.lower) * 0.08;
    const yMax = Math.max(item.upper, ...item.values) + Math.abs(item.upper - item.lower) * 0.08;
    const x = (index) => margin.left + (index / (item.values.length - 1)) * (width - margin.left - margin.right);
    const y = (value) => margin.top + ((yMax - value) / (yMax - yMin)) * (height - margin.top - margin.bottom);

    [
      { value: item.upper, label: "LSC", className: "chart-limit" },
      { value: item.center, label: "LC", className: "chart-center" },
      { value: item.lower, label: "LIC", className: "chart-limit" }
    ].forEach((reference) => {
      const line = svgNode("line", {
        x1: margin.left,
        y1: y(reference.value),
        x2: width - margin.right,
        y2: y(reference.value),
        class: reference.className
      });
      const label = svgNode("text", {
        x: margin.left - 8,
        y: y(reference.value) + 4,
        "text-anchor": "end",
        class: "chart-label"
      });
      label.textContent = `${reference.label} ${formatNumber(reference.value, 1)}`;
      svg.append(line, label);
    });

    const axis = svgNode("line", {
      x1: margin.left,
      y1: height - margin.bottom,
      x2: width - margin.right,
      y2: height - margin.bottom,
      class: "chart-axis"
    });
    svg.appendChild(axis);

    const pathData = item.values.map((value, index) => `${index ? "L" : "M"} ${x(index)} ${y(value)}`).join(" ");
    svg.appendChild(svgNode("path", { d: pathData, class: "chart-line", fill: "none" }));
    item.values.forEach((value, index) => {
      const circle = svgNode("circle", {
        cx: x(index),
        cy: y(value),
        r: 5,
        class: value > item.upper || value < item.lower ? "chart-point signal" : "chart-point"
      });
      const pointTitle = svgNode("title");
      pointTitle.textContent = `Observación ${index + 1}: ${formatNumber(value, 2)}`;
      circle.appendChild(pointTitle);
      const tick = svgNode("text", {
        x: x(index),
        y: height - margin.bottom + 22,
        "text-anchor": "middle",
        class: "chart-label"
      });
      tick.textContent = String(index + 1);
      svg.append(circle, tick);
    });
    chartPanel.appendChild(svg);
    container.appendChild(chartPanel);
  }

  function initializeControlGame() {
    buildChoiceChallenge(
      "control",
      CONTROL_ITEMS,
      CONTROL_OPTIONS,
      "Interpreta una carta I con límites históricos. Aplica sólo estas reglas: un punto fuera, ocho puntos del mismo lado o seis en tendencia.",
      "Carta I",
      (context, item) => renderControlChart(context, item)
    );
  }

  function addStatCard(parent, label, value, detail) {
    const card = node("div", "stat-card");
    appendTextBlock(card, "span", "stat-label", label);
    appendTextBlock(card, "strong", "stat-value", value);
    if (detail) appendTextBlock(card, "small", "stat-detail", detail);
    parent.appendChild(card);
    return card;
  }

  function resultLabel(value) {
    if (value === null) return "Sin intento";
    return value ? "Correcto" : "Por revisar";
  }

  function aggregateWindows(windowName) {
    return DOMAIN_ORDER.flatMap((key) => state.domains[key][windowName]);
  }

  function aggregateTrackWindow(track, windowName) {
    return track.domains.flatMap((key) => state.domains[key][windowName]);
  }

  function calibrationSummary() {
    const attempts = state.history.filter(
      (entry) => Number.isFinite(entry.confidence) && typeof entry.correct === "boolean"
    );
    if (!attempts.length) return null;
    const probability = attempts.map((entry) => entry.confidence / 100);
    const outcomes = attempts.map((entry) => (entry.correct ? 1 : 0));
    const averageConfidence = probability.reduce((sum, value) => sum + value, 0) / probability.length;
    const observedAccuracy = outcomes.reduce((sum, value) => sum + value, 0) / outcomes.length;
    const brier = probability.reduce(
      (sum, value, index) => sum + (value - outcomes[index]) ** 2,
      0
    ) / probability.length;
    return {
      attempts: attempts.length,
      averageConfidence: Math.round(averageConfidence * 100),
      observedAccuracy: Math.round(observedAccuracy * 100),
      gap: Math.round(Math.abs(averageConfidence - observedAccuracy) * 100),
      brier: roundTo(brier, 3)
    };
  }

  function gamePanelFor(key) {
    const container = document.getElementById(DOMAIN_META[key].container);
    return container?.closest(".game-module") || container;
  }

  function gamePanelId(key) {
    const panel = gamePanelFor(key);
    if (!panel) return DOMAIN_META[key].container;
    if (!panel.id) panel.id = `${DOMAIN_META[key].container}-panel`;
    return panel.id;
  }

  function selectGame(domainKey, focusPanel = true) {
    if (!DOMAIN_ORDER.includes(domainKey)) return;
    activeDomain = domainKey;
    DOMAIN_ORDER.forEach((key) => {
      const panel = gamePanelFor(key);
      const tab = document.getElementById(`game-tab-${key}`);
      const selected = key === domainKey;
      if (panel) {
        panel.classList.add("game-tab-panel");
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", `game-tab-${key}`);
        panel.hidden = !selected;
        panel.setAttribute("aria-hidden", String(!selected));
      }
      if (tab) {
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
      }
    });
    if (focusPanel) {
      const panel = gamePanelFor(domainKey);
      const heading = panel?.querySelector(".game-title, .game-module-heading h3, h2, h3");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus();
      }
    }
  }

  function makeGameNavigation() {
    const nav = node("div", "game-nav");
    nav.setAttribute("role", "tablist");
    nav.setAttribute("aria-label", "Miniaplicaciones de aprendizaje");
    DOMAIN_ORDER.forEach((key) => {
      const tab = node("button", "game-tab", DOMAIN_META[key].short);
      tab.type = "button";
      tab.id = `game-tab-${key}`;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", gamePanelId(key));
      tab.setAttribute("aria-selected", String(key === activeDomain));
      tab.tabIndex = key === activeDomain ? 0 : -1;
      tab.addEventListener("click", () => selectGame(key));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const currentIndex = DOMAIN_ORDER.indexOf(key);
        let targetIndex = currentIndex;
        if (event.key === "ArrowLeft") targetIndex = (currentIndex - 1 + DOMAIN_ORDER.length) % DOMAIN_ORDER.length;
        if (event.key === "ArrowRight") targetIndex = (currentIndex + 1) % DOMAIN_ORDER.length;
        if (event.key === "Home") targetIndex = 0;
        if (event.key === "End") targetIndex = DOMAIN_ORDER.length - 1;
        const target = DOMAIN_ORDER[targetIndex];
        activeDomain = target;
        renderDashboard();
        document.getElementById(`game-tab-${target}`)?.focus();
      });
      nav.appendChild(tab);
    });
    return nav;
  }

  function makeMissionMap() {
    const section = node("section", "mission-section");
    appendTextBlock(section, "h3", "dashboard-subtitle", "Mapa de misiones");
    const map = node("div", "mission-map");
    DOMAIN_ORDER.forEach((key, index) => {
      const domain = state.domains[key];
      const mission = node("button", "mission-node");
      mission.type = "button";
      mission.dataset.state = domainStateLabel(key);
      mission.setAttribute("aria-label", `${DOMAIN_META[key].label}: ${domainStateLabel(key) === "complete" ? "dominio alcanzado" : domain.attempts ? "en práctica" : "sin iniciar"}`);
      appendTextBlock(mission, "span", "mission-index", String(index + 1).padStart(2, "0"));
      appendTextBlock(mission, "h3", "mission-name", DOMAIN_META[key].short);
      appendTextBlock(
        mission,
        "p",
        "mission-state",
        isMastered(domain) ? "Dominio ≥ 80%" : domain.attempts ? `${recentAccuracy(domain)}% reciente` : "Explorar"
      );
      mission.addEventListener("click", () => selectGame(key));
      map.appendChild(mission);
    });
    section.appendChild(map);
    return section;
  }

  function makeMasterySection() {
    const section = node("section", "mastery-section");
    appendTextBlock(section, "h3", "dashboard-subtitle", "Dominio por práctica reciente");
    appendTextBlock(
      section,
      "p",
      "dashboard-note",
      "El dominio usa los cinco intentos más recientes y se alcanza con al menos cinco intentos y 80% de aciertos."
    );
    const grid = node("div", "mastery-grid");
    DOMAIN_ORDER.forEach((key) => {
      const domain = state.domains[key];
      const score = recentAccuracy(domain);
      const card = node("article", "mastery-card");
      card.dataset.state = domainStateLabel(key);
      appendTextBlock(card, "h4", "mastery-title", DOMAIN_META[key].short);
      appendTextBlock(card, "strong", "mastery-score", score === null ? "—" : `${score}%`);
      appendTextBlock(
        card,
        "p",
        "mastery-comparison",
        `Primer intento: ${resultLabel(domain.firstResult)} · reciente: ${resultLabel(domain.lastResult)}`
      );
      appendTextBlock(card, "small", "mastery-count", `${domain.correct}/${domain.attempts} respuestas correctas acumuladas`);
      const independentScore = domain.independentAttempts
        ? Math.round((domain.independentCorrect / domain.independentAttempts) * 100)
        : null;
      appendTextBlock(
        card,
        "small",
        "mastery-independent",
        independentScore === null
          ? "Desempeño sin pista: sin evidencia"
          : `Sin pista: ${domain.independentCorrect}/${domain.independentAttempts} (${independentScore}%)`
      );
      const progress = node("div", "xp-track");
      progress.setAttribute("role", "progressbar");
      progress.setAttribute("aria-label", `Dominio reciente en ${DOMAIN_META[key].label}`);
      progress.setAttribute("aria-valuemin", "0");
      progress.setAttribute("aria-valuemax", "100");
      progress.setAttribute("aria-valuenow", String(score ?? 0));
      const fill = node("span", "mastery-fill");
      fill.style.width = `${score ?? 0}%`;
      progress.appendChild(fill);
      card.appendChild(progress);
      grid.appendChild(card);
    });
    section.appendChild(grid);
    return section;
  }

  function makeTrackSection() {
    const section = node("section", "track-section");
    appendTextBlock(section, "h3", "dashboard-subtitle", "Tres dimensiones del aprendizaje");
    const grid = node("div", "mastery-grid");
    LEARNING_TRACKS.forEach((track) => {
      const results = aggregateTrackWindow(track, "recentWindow");
      const score = accuracy(results);
      const card = node("article", "mastery-card");
      card.dataset.track = track.id;
      appendTextBlock(card, "h4", "mastery-title", track.label);
      appendTextBlock(card, "strong", "mastery-score", score === null ? "—" : `${score}%`);
      appendTextBlock(card, "p", "mastery-comparison", track.description);
      appendTextBlock(
        card,
        "small",
        "mastery-count",
        results.length
          ? `${results.length} respuesta${results.length === 1 ? "" : "s"} en la ventana reciente`
          : "Sin evidencia todavía"
      );
      grid.appendChild(card);
    });
    section.appendChild(grid);
    return section;
  }

  function makeDifferentialPanel() {
    const eligibleDomains = DOMAIN_ORDER.filter((key) => state.domains[key].attempts >= 10);
    const initialResults = eligibleDomains.flatMap((key) => state.domains[key].initialWindow);
    const recentResults = eligibleDomains.flatMap((key) => state.domains[key].recentWindow);
    const initial = accuracy(initialResults);
    const recent = accuracy(recentResults);
    const gain = initial !== null && recent !== null ? recent - initial : null;
    const panel = node("section", "differential-panel");
    appendTextBlock(panel, "h3", "dashboard-subtitle", "Aprendizaje diferencial");
    if (gain === null) {
      appendTextBlock(
        panel,
        "p",
        "differential-summary",
        "La comparación se activa al completar diez intentos en un dominio: los cinco primeros forman la línea base y los cinco más recientes una ventana no superpuesta."
      );
    } else {
      const sign = gain > 0 ? "+" : "";
      appendTextBlock(
        panel,
        "p",
        "differential-summary",
        `Ventana inicial: ${initial}% · ventana reciente: ${recent}% · cambio: ${sign}${gain} puntos porcentuales.`
      );
      const meter = node("div", "gain-meter");
      meter.setAttribute("role", "progressbar");
      meter.setAttribute("aria-label", "Acierto en la ventana reciente");
      meter.setAttribute("aria-valuemin", "0");
      meter.setAttribute("aria-valuemax", "100");
      meter.setAttribute("aria-valuenow", String(recent));
      meter.dataset.tone = gain > 0 ? "positive" : gain < 0 ? "review" : "steady";
      const fill = node("span", "gain-fill");
      fill.style.width = `${recent}%`;
      meter.appendChild(fill);
      panel.appendChild(meter);
      appendTextBlock(
        panel,
        "small",
        "dashboard-note",
        `Dominios comparables: ${eligibleDomains.length}. La ventana inicial reúne los cinco primeros intentos de cada dominio elegible (n = ${initialResults.length}); la reciente, sus cinco últimos (n = ${recentResults.length}). Las ventanas no comparten intentos. El cambio orienta la práctica y no constituye una calificación institucional.`
      );
    }
    const calibration = calibrationSummary();
    const calibrationBlock = node("div", "calibration-summary");
    appendTextBlock(calibrationBlock, "h4", "calibration-title", "Calibración de confianza");
    if (!calibration) {
      appendTextBlock(calibrationBlock, "p", "dashboard-note", "Indica tu confianza antes de responder para activar esta medida.");
    } else {
      appendTextBlock(
        calibrationBlock,
        "p",
        "calibration-metrics",
        `Confianza media ${calibration.averageConfidence}% · acierto observado ${calibration.observedAccuracy}% · brecha ${calibration.gap} pp · Brier ${formatNumber(calibration.brier, 3)}.`
      );
      appendTextBlock(
        calibrationBlock,
        "small",
        "dashboard-note",
        `El Brier promedia (confianza − resultado)² en ${calibration.attempts} intento${calibration.attempts === 1 ? "" : "s"}; 0 indica pronósticos perfectamente calibrados y acertados, y 1 el extremo opuesto.`
      );
    }
    panel.appendChild(calibrationBlock);
    return panel;
  }

  function makeBadgeGrid() {
    const grid = node("div", "badge-grid");
    BADGES.forEach((badge) => {
      const earned = Boolean(state.badges[badge.id]);
      const card = node("article", "badge-card");
      card.dataset.state = earned ? "earned" : "locked";
      appendTextBlock(card, "span", "badge-icon", badge.icon).setAttribute("aria-hidden", "true");
      appendTextBlock(card, "strong", "badge-name", badge.label);
      appendTextBlock(card, "small", "badge-description", badge.description);
      if (earned) {
        appendTextBlock(
          card,
          "time",
          "badge-date",
          new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(state.badges[badge.id]))
        ).dateTime = state.badges[badge.id];
      }
      grid.appendChild(card);
    });
    return grid;
  }

  function makeBadgeSection() {
    const section = node("section", "badge-section");
    appendTextBlock(section, "h3", "dashboard-subtitle", "Insignias de aprendizaje");
    const grid = makeBadgeGrid();
    section.appendChild(grid);
    return section;
  }

  function exportState(status) {
    const variants = Array.from(new Set(state.history.map((entry) => entry.variant).filter(Boolean)));
    const seeds = Array.from(new Set(state.history.map((entry) => entry.seed).filter(Number.isInteger)));
    const payload = {
      schema: "dk-lss-arcade-export",
      schemaVersion: STATE_VERSION,
      exportedAt: new Date().toISOString(),
      notice: "Registro formativo local; no equivale a certificación ni calificación institucional.",
      traceability: {
        variants,
        numericSeeds: seeds,
        note: "Cada semilla numérica reconstruye su problema; la selección aleatoria completa de la sesión no se reproduce."
      },
      state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `progreso-arcade-six-sigma-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    if (status) status.textContent = "Progreso exportado en formato JSON.";
  }

  function showResetControls(actions, status) {
    actions.replaceChildren();
    appendTextBlock(actions, "span", "reset-question", "¿Eliminar el progreso guardado en este navegador?");
    const confirmButton = node("button", "dashboard-button is-danger", "Sí, reiniciar");
    confirmButton.type = "button";
    const cancelButton = node("button", "dashboard-button", "Conservar progreso");
    cancelButton.type = "button";
    confirmButton.addEventListener("click", () => {
      resetProgress();
    });
    cancelButton.addEventListener("click", () => renderDashboard());
    actions.append(confirmButton, cancelButton);
    status.textContent = "El reinicio elimina XP, respuestas e insignias de este navegador. Puedes exportar antes de continuar.";
    confirmButton.focus();
  }

  function resetProgress() {
    state = createInitialState();
    saveState();
    DOMAIN_ORDER.forEach((key) => delete currentItems[key]);
    initializeDmaicGame();
    initializeWasteGame();
    initializeEvidenceGame();
    initializeNumbersGame();
    initializeControlGame();
    renderDashboard();
    selectGame(activeDomain, false);
    const dashboardStatus = document.getElementById("dashboard-status");
    if (dashboardStatus) dashboardStatus.textContent = "El progreso se reinició y el primer intento comenzará de nuevo.";
    const externalStatus = document.querySelector("[data-games-status]");
    if (externalStatus) externalStatus.textContent = "El progreso local se reinició.";
  }

  function bindExternalControls() {
    const status = document.querySelector("[data-games-status]");
    if (status) setLiveRegion(status);
    const exportButton = document.querySelector("[data-export-games]");
    if (exportButton) {
      exportButton.onclick = () => exportState(status || document.getElementById("dashboard-status"));
    }
    const resetButton = document.querySelector("[data-reset-games]");
    if (resetButton) {
      resetButton.dataset.confirm = "false";
      resetButton.textContent = "Reiniciar centro";
      resetButton.onclick = () => {
        if (resetButton.dataset.confirm === "true") {
          resetProgress();
          return;
        }
        resetButton.dataset.confirm = "true";
        resetButton.textContent = "Confirmar reinicio local";
        if (status) status.textContent = "Pulsa de nuevo para eliminar XP, respuestas e insignias; exporta antes si deseas conservar una copia.";
      };
    }
  }

  function renderSupplementalPanels() {
    const measurement = document.getElementById("game-measurement");
    if (measurement) {
      measurement.replaceChildren(makeDifferentialPanel(), makeTrackSection(), makeMasterySection());
    }
    const badges = document.getElementById("badges");
    if (badges) {
      const grid = makeBadgeGrid();
      badges.replaceChildren(...Array.from(grid.children));
    }
    bindExternalControls();
  }

  function syncStaticMissionMap() {
    DOMAIN_ORDER.forEach((key) => {
      document.querySelectorAll(`[data-mission="${key}"]`).forEach((mission) => {
        const status = domainStateLabel(key);
        mission.dataset.state = status;
        mission.classList.toggle("is-complete", status === "complete");
        mission.classList.toggle("is-active", status === "active");
        mission.setAttribute(
          "aria-label",
          `${DOMAIN_META[key].label}: ${status === "complete" ? "dominio alcanzado" : status === "active" ? "en práctica" : "sin iniciar"}`
        );
      });
    });
  }

  function domainFromHash(hash) {
    return DOMAIN_ORDER.find((key) => hash === `#${DOMAIN_META[key].container}`) || null;
  }

  function bindHostNavigation() {
    DOMAIN_ORDER.forEach((key) => {
      const selector = `a[href="#${DOMAIN_META[key].container}"]`;
      document.querySelectorAll(selector).forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          selectGame(key, false);
          window.history.pushState(null, "", `#${DOMAIN_META[key].container}`);
          gamePanelFor(key)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      });
    });
    window.addEventListener("popstate", () => {
      const key = domainFromHash(window.location.hash);
      if (key) selectGame(key, false);
    });
  }

  function renderDashboard() {
    const container = document.getElementById("dashboard");
    if (!container) return;
    container.replaceChildren();
    container.classList.add("player-dashboard");
    const heading = node("div", "dashboard-heading");
    appendTextBlock(heading, "p", "game-kicker", "Tablero formativo local");
    appendTextBlock(heading, "h2", "dashboard-title", "Arcade Lean Six Sigma");
    appendTextBlock(
      heading,
      "p",
      "dashboard-note",
      "La experiencia y las insignias representan práctica en esta página; no acreditan un cinturón ni una certificación profesional."
    );

    const level = levelFromXp(state.xp);
    const levelFloor = (level - 1) * XP_PER_LEVEL;
    const inLevel = state.xp - levelFloor;
    const stats = node("div", "player-dashboard-inner dashboard-stats");
    const levelCard = addStatCard(stats, "Nivel", `${level} · ${levelTitle(level)}`, `${state.xp} XP acumulados`);
    const xpTrack = node("div", "xp-track");
    xpTrack.setAttribute("role", "progressbar");
    xpTrack.setAttribute("aria-label", `Progreso al nivel ${level + 1}`);
    xpTrack.setAttribute("aria-valuemin", "0");
    xpTrack.setAttribute("aria-valuemax", String(XP_PER_LEVEL));
    xpTrack.setAttribute("aria-valuenow", String(inLevel));
    const xpFill = node("span", "xp-fill");
    xpFill.style.width = `${(inLevel / XP_PER_LEVEL) * 100}%`;
    xpTrack.appendChild(xpFill);
    levelCard.appendChild(xpTrack);
    addStatCard(stats, "Racha actual", String(state.streak), `Mejor racha: ${state.bestStreak}`);
    addStatCard(stats, "Desafíos", String(totalAttempts()), "Sin presión temporal");
    addStatCard(
      stats,
      "Dominios",
      `${DOMAIN_ORDER.filter((key) => isMastered(state.domains[key])).length}/5`,
      "Meta: 80% reciente"
    );

    const status = node("p", "dashboard-status", "El avance se conserva únicamente en este navegador.");
    status.id = "dashboard-status";
    setLiveRegion(status);
    const actions = node("div", "dashboard-actions");
    const exportButton = node("button", "dashboard-button", "Exportar progreso JSON");
    exportButton.type = "button";
    exportButton.addEventListener("click", () => exportState(status));
    const resetButton = node("button", "dashboard-button", "Reiniciar progreso");
    resetButton.type = "button";
    resetButton.addEventListener("click", () => showResetControls(actions, status));
    actions.append(exportButton, resetButton);

    if (!container.closest(".dashboard-section")) container.appendChild(heading);
    const navHost = document.getElementById("game-nav-host");
    if (navHost) {
      navHost.replaceChildren(makeGameNavigation());
      container.appendChild(stats);
    } else {
      const navDock = node("div", "game-hub-dock");
      navDock.appendChild(makeGameNavigation());
      container.append(stats, navDock);
    }
    if (!document.getElementById("mapa")) container.appendChild(makeMissionMap());
    if (!document.getElementById("game-measurement")) {
      container.append(makeDifferentialPanel(), makeTrackSection(), makeMasterySection());
    }
    if (!document.getElementById("badges")) container.appendChild(makeBadgeSection());
    container.append(actions, status);
    selectGame(activeDomain, false);
    syncStaticMissionMap();
    renderSupplementalPanels();
  }

  function initialize() {
    const availableDomains = DOMAIN_ORDER.filter((key) => document.getElementById(DOMAIN_META[key].container));
    if (!availableDomains.length && !document.getElementById("dashboard")) return;
    const hashDomain = domainFromHash(window.location.hash);
    activeDomain = hashDomain && availableDomains.includes(hashDomain)
      ? hashDomain
      : availableDomains.includes(activeDomain) ? activeDomain : availableDomains[0] || "dmaic";
    initializeDmaicGame();
    initializeWasteGame();
    initializeEvidenceGame();
    initializeNumbersGame();
    initializeControlGame();
    awardBadges();
    saveState();
    renderDashboard();
    bindHostNavigation();
  }

  window.SixSigmaGames = Object.freeze({
    version: STATE_VERSION,
    storageKey: STORAGE_KEY,
    getState() {
      return JSON.parse(JSON.stringify(state));
    },
    selectGame(domainKey) {
      selectGame(domainKey);
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();

/*
DOM CONTRACT
============
Required host nodes before this deferred script runs:
  #dashboard
  #game-dmaic
  #game-waste
  #game-evidence
  #game-numbers
  #game-control
The script replaces their children. A game container may sit inside an
optional `.game-module`; that wrapper becomes the ARIA tab panel. Without the
wrapper, the game container itself becomes the panel. Missing nodes are ignored.

Optional host integration:
  #game-measurement       receives differential, track and mastery panels
  #badges                 receives badge cards
  [data-export-games]     click downloads the versioned JSON record
  [data-reset-games]      two clicks confirm local reset
  [data-games-status]     polite live status for those external controls
  [data-mission="dmaic|waste|evidence|numbers|control"] receives state
  a[href="#game-{domain}"] selects and scrolls to that game

Generated dashboard selectors include `.player-dashboard-inner`, `.stat-card`,
`.xp-track`, `.game-nav`, `.game-tab[role="tab"][aria-selected]`,
`.mission-map`, `.mission-node[data-state="new|active|complete"]`,
`.badge-grid`, `.badge-card[data-state="earned|locked"]`, `.mastery-grid`,
`.mastery-card[data-track]`, `.differential-panel`, and `.gain-meter`.

Each game generates `.challenge-card`, `.game-stage`, `.choice-grid`,
`.choice-button` and the answer states `.is-selected`, `.is-correct`,
`.is-incorrect`; `.confidence-scale`; `.game-hint`; polite-live
`.game-feedback[data-tone="neutral|correct|incorrect"]`; and `.game-actions`.
The control game creates `.game-chart > svg.control-chart` without HTML string
injection. Interactions use native click, submit, input and keydown listeners;
no custom event is required or emitted.

State schema 1 is stored under `dk-lss-arcade-v1`. Exported attempts contain
variant, seed, confidence and hint-use fields. `window.SixSigmaGames` exposes
`version`, `storageKey`, cloned `getState()`, and `selectGame(domainKey)`.
*/

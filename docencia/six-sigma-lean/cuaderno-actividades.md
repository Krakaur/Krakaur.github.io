# Cuaderno de actividades · Lean Six Sigma

Este cuaderno articula diez productos en un solo expediente DMAIC. Las marcas **[H]** identifican el antecedente de la consigna histórica de Seis Sigma LEM-1205; las marcas **[A]** indican la adaptación didáctica propuesta para Lean Six Sigma LEG-2503. No sustituye las instrucciones oficiales que emita una institución.

Trabaja con un proceso real sólo cuando exista autorización y puedas anonimizar personas, clientes y datos. Si no, utiliza el conjunto simulado `datos/tiempos-picking.csv`. Distingue siempre dato observado, estimación, simulación y meta.

## Registro general

| Campo | Respuesta |
|---|---|
| Proceso y propietario | |
| Cliente o usuario | |
| Resultado Y | |
| Unidad y regla de cálculo | |
| Periodo de observación | |
| Fuente de datos y versión | |
| Restricciones y datos excluidos | |
| Integrantes y responsabilidades | |

## Actividad 1. Project Charter [H+A]

**Propósito.** Delimitar una brecha medible sin convertir una causa supuesta o una solución favorita en el problema.

### Acta

| Elemento | Desarrollo |
|---|---|
| Caso de negocio | |
| Enunciado del problema: qué, dónde, cuándo, magnitud y efecto | |
| Cliente y CTQ operacional | |
| Línea base, unidad, fórmula, fuente y fecha | |
| Objetivo SMART y restricción de protección | |
| Alcance y fuera de alcance | |
| Patrocinio, equipo y funciones | |
| Hitos | |
| Riesgos y supuestos iniciales | |

### Auditoría de coherencia

- [ ] La misma fórmula, unidad y población aparecen en línea base y meta.
- [ ] Las cifras del texto coinciden con las tablas.
- [ ] La fecha objetivo y el periodo de línea base son explícitos.
- [ ] El problema no culpa a una persona ni incluye una solución.
- [ ] Se puede decidir si el proyecto merece recursos.

**Reflexión.** ¿Qué evidencia obligaría a reformular el problema?

## Actividad 2. SIPOC y frontera [H+A]

**Propósito.** Representar el proceso donde se produce Y en cinco a siete macroetapas.

| Proveedor | Entrada y requisito | Proceso | Salida y requisito | Cliente |
|---|---|---|---|---|
| | | 1. | | |
| | | 2. | | |
| | | 3. | | |
| | | 4. | | |
| | | 5. | | |
| | | 6. | | |
| | | 7. | | |

Inicio del proceso: ____________________

Fin del proceso: ____________________

Propietario: ____________________

Puntos de medición: ____________________

- [ ] Cada salida se vincula con un cliente y un requisito.
- [ ] Los clientes son receptores concretos, no segmentos vagos de mercado.
- [ ] El mapa no mezcla sin justificación captación, operación y postventa.
- [ ] La Y y la frontera coinciden con el Charter.

**Reflexión.** ¿Qué actor quedó fuera y cómo cambiaría el mapa si se incorporara su perspectiva?

## Actividad 3. Medición, causas candidatas y AMEF [H+A]

**Propósito.** Construir datos confiables antes de estimar capacidad o afirmar causas.

### Diccionario y plan de datos

| Variable | Definición operacional | Tipo/escala | Unidad | Fuente/instrumento | Muestreo | Responsable | Regla de faltantes |
|---|---|---|---|---|---|---|---|
| Y | | | | | | | |
| X1 | | | | | | | |
| X2 | | | | | | | |
| X3 | | | | | | | |

### Validez de la medición

Elige según el dato: Gage R&R con diseño operador × pieza × réplica; concordancia o kappa para atributos; auditoría de completitud, duplicados, reglas y marcas de tiempo para registros digitales.

| Riesgo de medición | Comprobación | Resultado | Decisión y límite |
|---|---|---|---|
| | | | |

### Hipótesis causales

| Causa candidata | Evidencia de proceso | Dato que podría refutarla | Método | Estado |
|---|---|---|---|---|
| | | | | Candidata / respaldada / descartada |

### AMEF inicial

| Paso | Modo de falla | Efecto | Causa | Control actual | S | O | D | Acción y responsable |
|---|---|---|---|---|---:|---:|---:|---|
| | | | | | | | | |

- [ ] Las especificaciones provienen de cliente, diseño o regulación documentada.
- [ ] La estabilidad se examina antes de Cp/Cpk.
- [ ] La variación entre piezas no se confunde con error del instrumento.
- [ ] La puntuación de una matriz o del AMEF no se presenta como prueba causal.

**Reflexión.** ¿Qué parte de la “causa raíz” sigue siendo una conjetura?

## Actividad 4. Ensayo de inferencia [H+A]

**Tesis:** ____________________

**Contraargumento:** ____________________

**Aplicación al proyecto:** ____________________

El texto debe distinguir parámetro y estimador; explicar intervalo, nivel de confianza, α, errores I/II, potencia y tamaño del efecto; y corregir dos formulaciones: una muestra mayor de 30 no resuelve cualquier supuesto y “no rechazar H₀” no significa “aceptar H₀”.

- [ ] Tesis debatible.
- [ ] Dos fuentes metodológicas identificables y una aplicación.
- [ ] Argumento y contraargumento.
- [ ] Conclusión proporcional a la evidencia.
- [ ] Referencias con URL verificable.

**Reflexión.** ¿Qué conclusión sería distinta con menor potencia o mayor incertidumbre?

## Actividad 5. Problemario de validación causal [H+A]

| Pregunta | Tipo de dato/diseño | Método | Supuestos | Efecto e intervalo | Resultado | Decisión | Límite |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |
| 4 | | | | | | | |
| 5 | | | | | | | |

Incluye Pareto o estratificación, una gráfica temporal, una relación bivariada, una prueba o ANOVA y una decisión experimental. Usa t cuando la desviación poblacional sea desconocida y la comparación lo requiera; verifica que α se conserve; reporta efecto e incertidumbre además de p.

### Si propones un experimento

| Elemento | Definición |
|---|---|
| Respuesta y unidad | |
| Factores y niveles | |
| Unidad experimental | |
| Réplicas | |
| Aleatorización | |
| Bloqueo | |
| Criterio de éxito | |

**Reflexión.** ¿Qué análisis no debió realizarse y por qué?

## Actividad 6. Capacidad, control y desempeño [H+A]

**Propósito.** Separar comportamiento temporal, requisitos y desempeño.

| Ejercicio | Gráfica/índice | Razón de elección | Cálculo verificable | Interpretación y acción |
|---|---|---|---|---|
| X̄–R | | | | |
| I–MR | | | | |
| p o np | | | | |
| c o u | | | | |
| Cp/Cpk o alternativa | | | | |

- [ ] Una gráfica p usa el tamaño de cada muestra, no el total acumulado.
- [ ] Los límites de control se calculan con el proceso; las especificaciones se documentan por separado.
- [ ] Cp/Cpk usan variación de corto plazo; Pp/Ppk, variación global.
- [ ] Cpk usa la distancia al límite de especificación más cercano.
- [ ] Si faltan estabilidad o especificaciones justificadas, no se fuerza un índice de capacidad.
- [ ] DPMO se expresa por millón de oportunidades; 3.4 DPMO no equivale a 3.4%.

**Reflexión.** ¿Puede un proceso ser estable e incapaz, o parecer capaz mientras es inestable?

## Actividad 7. Plan de mejora y piloto [H+A]

### Alternativas

| Alternativa | Causa respaldada | Efecto previsto | Costo | Tiempo | Riesgo | Reversibilidad | Indicador de protección |
|---|---|---|---:|---|---|---|---|
| A | | | | | | | |
| B | | | | | | | |
| C | | | | | | | |

### Protocolo de verificación

| Campo | Definición previa al piloto |
|---|---|
| Diseño y comparación | |
| Muestra, duración y asignación | |
| Métrica primaria | |
| Indicadores de protección | |
| Criterio de éxito | |
| Regla de detención | |
| Análisis previsto | |

Clasifica cada resultado como **observado**, **estimado** o **simulado**. Una comparación de tecnologías sin réplica, aleatorización o bloqueo no se denomina DOE. Actualiza el AMEF y redacta el 5W2H.

**Reflexión.** ¿Qué cambio concurrente podría explicar el resultado?

## Actividad 8. Ensayo de regresión y decisión [H+A]

| Aspecto | Desarrollo |
|---|---|
| Y, X, unidades y población | |
| Objetivo: explicar, predecir u optimizar | |
| Modelo y justificación | |
| Pendientes en unidades reales | |
| Diagnóstico de residuos | |
| Validación o límite de generalización | |
| Decisión apoyada y riesgo | |

- [ ] Una pendiente 0.31 se interpreta en unidades Y por unidad X; no es 31% salvo transformación pertinente.
- [ ] La normalidad, cuando importe, se revisa en residuos y no sólo en variables.
- [ ] Se examinan independencia, heterocedasticidad, influencia y extrapolación.
- [ ] Significancia estadística no se convierte en causalidad.

**Reflexión.** ¿Qué dato nuevo distinguiría asociación útil de explicación causal?

## Actividad 9. Problemario de regresión [H+A]

Resuelve cuatro problemas: regresión simple, múltiple, selección de predictores y relación curva. Para cada uno conserva datos y código o fórmulas.

| Problema | Ecuación | R² / R² ajustada | IC/IP | Diagnóstico | Error de validación | Decisión |
|---|---|---|---|---|---|---|
| 1 | | | | | | |
| 2 | | | | | | |
| 3 | | | | | | |
| 4 | | | | | | |

Si empleas selección *stepwise*, documenta múltiples pruebas, inestabilidad y riesgo de sobreajuste. Compara con un modelo simple y reserva datos cuando sea viable.

**Reflexión.** ¿Qué modelo más simple conservaría la decisión?

## Actividad 10. Control y proyecto final [H+A]

### Comparación final

| Métrica | Línea base | Resultado | Diferencia | Incertidumbre | Tipo: observado/estimado/simulado |
|---|---:|---:|---:|---|---|
| | | | | | |

No declares éxito antes de medir el estado posterior. Los límites I–MR no sustituyen límites de especificación ni producen por sí mismos Cp.

### Plan de control

| CTQ/variable | Especificación o meta | Fuente/método | Muestra y frecuencia | Responsable | Gráfica/alerta | Reacción y escalamiento | Registro |
|---|---|---|---|---|---|---|---|
| | | | | | | | |

### SOP

1. Propósito y alcance.
2. Funciones con un responsable nominal por rol; evita “todo el personal”.
3. Insumos y condiciones previas.
4. Secuencia ejecutable.
5. Excepciones, detención y escalamiento.
6. Registros y control de versión.
7. Revisión y mejora del estándar.

### Paquete final

- [ ] Fuente editable y control de versiones.
- [ ] Informe final en PDF.
- [ ] Datos anonimizados, diccionario y análisis reproducible.
- [ ] SOP y plan de control.
- [ ] AMEF actualizado.
- [ ] Presentación de siete láminas: problema, flujo, método, causas, piloto, control y decisión.
- [ ] Limitaciones y resultados no favorables.

**Reflexión.** ¿Qué aprendiste que pueda mejorar el siguiente proyecto aunque la meta no se haya alcanzado?

## Registro de aprendizaje diferencial

| Indicador | Diagnóstico | Salida | Diferencia |
|---|---:|---:|---:|
| Conceptual (%) | | | |
| Procedimental (%) | | | |
| Caso de transferencia (%) | | | |
| Confianza media (0–100) | | | |
| Error de calibración confianza–acierto | | | |

Ganancia absoluta = salida − diagnóstico.

Ganancia normalizada = (salida − diagnóstico) / (100 − diagnóstico), sólo cuando diagnóstico &lt; 100.

### Reflexión afirmación–evidencia–razonamiento

**Afirmación sobre lo aprendido:** ____________________

**Evidencia específica:** ____________________

**Razonamiento que conecta ambas:** ____________________

**Límite o pregunta abierta:** ____________________

## Defensa individual

Cada integrante debe explicar un cálculo, una decisión metodológica y una relación causal. El historial de versiones respalda la autoría, pero no sustituye la comprensión conceptual.

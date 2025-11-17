// src/App.tsx
import { useState } from "react";
import "./index.css";
import type { TipoOperacion, ParametrosEntrada } from "./logic/calc";
import { calcular } from "./logic/calc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function clampInt(v: number) {
  return Math.max(1, Math.floor(v));
}

function App() {
  // --- estados numéricos (para la lógica) ---
  const [ciclos, setCiclos] = useState<number>(3);
  const [operaciones, setOperaciones] = useState<number>(3);

  const [FVpercent, setFVpercent] = useState<number>(75);
  const [supManualPercent, setSupManualPercent] = useState<number>(50);
  const [supMQPercent, setSupMQPercent] = useState<number>(30);

  // --- estados string (para edición libre: permite "") ---
  const [ciclosStr, setCiclosStr] = useState<string>(String(ciclos));
  const [operacionesStr, setOperacionesStr] = useState<string>(String(operaciones));
  const [FVpercentStr, setFVpercentStr] = useState<string>(String(FVpercent));
  const [supManualPercentStr, setSupManualPercentStr] = useState<string>(String(supManualPercent));
  const [supMQPercentStr, setSupMQPercentStr] = useState<string>(String(supMQPercent));

  // Paso 2: tipos por operación (tamaño depende de `operaciones`)
  const [tipos, setTipos] = useState<TipoOperacion[]>(
    Array(operaciones).fill("MQ")
  );

  // Paso 3: tiempos (string[][] para permitir vacío). Inicializamos "0" visible.
  const [tiempos, setTiempos] = useState<string[][]>(
    Array.from({ length: operaciones }, () => Array(ciclos).fill("0"))
  );

  // Resultado
  const [resultado, setResultado] = useState<any>(null);

  // --- syncSizes: redimensiona arrays según números válidos ---
  function syncSizes(newOper: number, newCic: number) {
    const ops = clampInt(newOper);
    const cic = clampInt(newCic);

    setTipos((prev) => {
      const arr = prev.slice(0, ops);
      while (arr.length < ops) arr.push("MQ");
      return arr;
    });

    setTiempos((prev) => {
      const arr = prev.slice(0, ops).map((r) => r.slice(0, cic));

      while (arr.length < ops) arr.push(Array(cic).fill("0"));

      for (let i = 0; i < arr.length; i++) {
        while (arr[i].length < cic) arr[i].push("0");
      }

      return arr;
    });
  }

  // --- manejadores para cuando el usuario escribe en los inputs generales ---
  function handleCiclosChange(str: string) {
    setCiclosStr(str);
    const n = Number(str);
    if (Number.isFinite(n)) {
      const val = clampInt(n);
      setCiclos(val);
      syncSizes(operaciones, val);
    }
  }

  function handleOperacionesChange(str: string) {
    setOperacionesStr(str);
    const n = Number(str);
    if (Number.isFinite(n)) {
      const val = clampInt(n);
      setOperaciones(val);
      syncSizes(val, ciclos);
    }
  }

  function handleFVChange(str: string) {
    setFVpercentStr(str);
    const n = Number(str);
    if (Number.isFinite(n)) setFVpercent(n);
  }

  function handleSupManualChange(str: string) {
    setSupManualPercentStr(str);
    const n = Number(str);
    if (Number.isFinite(n)) setSupManualPercent(n);
  }

  function handleSupMQChange(str: string) {
    setSupMQPercentStr(str);
    const n = Number(str);
    if (Number.isFinite(n)) setSupMQPercent(n);
  }

  function handleTipoChange(idx: number, value: TipoOperacion) {
    setTipos((prev) => {
      const copy = prev.slice();
      copy[idx] = value;
      return copy;
    });
  }

  function handleTiempoChange(op: number, cic: number, value: string) {
    setTiempos((prev) => {
      const copy = prev.map((r) => r.slice());
      copy[op][cic] = value;
      return copy;
    });
  }

  function onCalcular() {
    const ops = clampInt(operaciones);
    const cic = clampInt(ciclos);

    const FV = FVpercent / 100;
    const supManual = supManualPercent / 100;
    const supMQ = supMQPercent / 100;

    const tiemposConvertidos = tiempos.slice(0, ops).map((fila) =>
      fila.slice(0, cic).map((v) => {
        const n = Number(v);
        if (!Number.isFinite(n) || v.trim() === "") return 0;
        return n > 1 ? n / 100 : n;
      })
    );

    const params: ParametrosEntrada = {
      ciclos: cic,
      operaciones: ops,
      tipos: tipos.slice(0, ops) as TipoOperacion[],
      tiempos: tiemposConvertidos,
      FV,
      supManual,
      supMQ,
    };

    const res = calcular(params);
    setResultado(res);
  }

  return (
    <div className="container">
      <h1>Analizador de Tiempos y Productividad</h1>

      {/* ----- 1: PARÁMETROS GENERALES ----- */}
      <section className="card">
        <h2>1) Parámetros generales</h2>
        <div className="row">
          <label>
            Ciclos:
            <input
              type="number"
              min={1}
              step="1"
              value={ciclosStr}
              onFocus={() => setCiclosStr("")}
              onChange={(e) => handleCiclosChange(e.target.value)}
              onBlur={() => setCiclosStr(String(ciclos))}
            />
          </label>

          <label>
            Operaciones:
            <input
              type="number"
              min={1}
              step="1"
              value={operacionesStr}
              onFocus={() => setOperacionesStr("")}
              onChange={(e) => handleOperacionesChange(e.target.value)}
              onBlur={() => setOperacionesStr(String(operaciones))}
            />
          </label>
        </div>

        <div className="row">
          <label>
            Valoración del operario (%):
            <input
              type="number"
              min={0}
              step="1"
              value={FVpercentStr}
              onFocus={() => setFVpercentStr("")}
              onChange={(e) => handleFVChange(e.target.value)}
              onBlur={() => setFVpercentStr(String(FVpercent))}
            />
          </label>

          <label>
            Suplemento manual (%):
            <input
              type="number"
              min={0}
              step="1"
              value={supManualPercentStr}
              onFocus={() => setSupManualPercentStr("")}
              onChange={(e) => handleSupManualChange(e.target.value)}
              onBlur={() => setSupManualPercentStr(String(supManualPercent))}
            />
          </label>

          <label>
            Suplemento MQ (%):
            <input
              type="number"
              min={0}
              step="1"
              value={supMQPercentStr}
              onFocus={() => setSupMQPercentStr("")}
              onChange={(e) => handleSupMQChange(e.target.value)}
              onBlur={() => setSupMQPercentStr(String(supMQPercent))}
            />
          </label>
        </div>
      </section>

      {/* ----- 2: TIPOS POR OPERACIÓN ----- */}
      <section className="card">
        <h2>2) Tipos por operación</h2>
        <div>
          {Array.from({ length: operaciones }).map((_, i) => (
            <div key={i} className="row small">
              <div className="op-label">
                Operación {String.fromCharCode(65 + i)}
              </div>
              <select
                value={tipos[i] ?? "MQ"}
                onChange={(e) =>
                  handleTipoChange(i, e.target.value as TipoOperacion)
                }
              >
                <option value="MQP">MQP</option>
                <option value="MQM">MQM</option>
                <option value="MQ">MQ</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* ----- 3: INGRESO DE TIEMPOS ----- */}
      <section className="card">
        <h2>3) Ingreso de tiempos observados</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Operación / Ciclo</th>
                {Array.from({ length: ciclos }).map((_, c) => (
                  <th key={c}>C{c + 1}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {Array.from({ length: operaciones }).map((_, o) => (
                <tr key={o}>
                  <td>{String.fromCharCode(65 + o)}</td>

                  {Array.from({ length: ciclos }).map((_, c) => (
                    <td key={c}>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={tiempos[o][c]}
                        onFocus={() => {
                          if (tiempos[o][c] !== "") {
                            handleTiempoChange(o, c, "");
                          }
                        }}
                        onChange={(e) => handleTiempoChange(o, c, e.target.value)}
                        placeholder="0"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onCalcular}>Calcular</button>
        <button className="secondary" onClick={() => setResultado(null)}>
          Limpiar resultado
        </button>
      </div>

      {/* ----- RESULTADOS CON CARDS COLORIDAS ----- */}
      <section className="card">
        <h2>Resultados</h2>

        {!resultado ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
            Presiona "Calcular" para ver los resultados.
          </div>
        ) : (
          <>
            {/* Grid de resultados principales */}
            <div className="formula-grid" style={{ marginBottom: "24px" }}>
              {/* Card Azul - Tiempo Estándar */}
              <div className="info-box positive">
                <h3>Tiempo estándar total (TScp)</h3>
                <p className="value">{resultado.TScp.toFixed(6)}</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                  minutos/pieza
                </p>
              </div>

              {/* Card Verde - Producción Estándar */}
              <div className="info-box" style={{ borderLeftColor: "var(--header-green)", background: "var(--pastel-green)" }}>
                <h3>Producción estándar</h3>
                <p className="value" style={{ color: "var(--text-green)" }}>
                  {resultado.PS.toFixed(6)}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                  unidades/minuto
                </p>
              </div>

              {/* Card Morada - Producción Diaria */}
              <div className="info-box negative">
                <h3>Producción diaria (8 horas)</h3>
                <p className="value">{resultado.PSD.toFixed(3)}</p>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                  unidades/día
                </p>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "32px 0" }} />

            {/* GRÁFICA DE BARRAS */}
            <div className="card" style={{ padding: "24px", marginBottom: "32px" }}>
              <h3 style={{ marginBottom: "20px", fontSize: "1.1rem" }}>Comparación de Tiempos por Operación</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={resultado.porOperacion.map((p: any, i: number) => ({
                  operacion: String.fromCharCode(65 + i),
                  TME: parseFloat(p.TME.toFixed(6)),
                  TNE: parseFloat(p.TNE.toFixed(6)),
                  TSE: parseFloat(p.TSE.toFixed(6))
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="operacion" stroke="#5a6c7d" />
                  <YAxis stroke="#5a6c7d" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #d0dae5',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="TME" fill="#4a9eff" name="TME" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="TNE" fill="#ffa94d" name="TNE" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="TSE" fill="#6bcf7f" name="TSE" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "32px 0" }} />

            {/* Tabla de resultados por operación */}
            <h3 style={{ marginBottom: "16px" }}>Detalle por operación</h3>
            <div className="table-scroll">
              <table className="result-table">
                <thead>
                  <tr>
                    <th>Op</th>
                    <th>Tipo</th>
                    <th>TME</th>
                    <th>TNE</th>
                    <th>TTOL</th>
                    <th>TSE</th>
                  </tr>
                </thead>

                <tbody>
                  {resultado.porOperacion.map((p: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700 }}>
                        {String.fromCharCode(65 + i)}
                      </td>
                      <td>
                        <span className="badge badge-blue">{tipos[i] ?? "MQ"}</span>
                      </td>
                      <td>{p.TME.toFixed(6)}</td>
                      <td>{p.TNE.toFixed(6)}</td>
                      <td>{p.TTOL.toFixed(6)}</td>
                      <td style={{ fontWeight: 700, color: "var(--text-blue)" }}>
                        {p.TSE.toFixed(6)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default App;
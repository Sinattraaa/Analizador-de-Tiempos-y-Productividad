// src/logic/calc.ts
export type TipoOperacion = "MQP" | "MQM" | "MQ";

export function convertirAminutos(x: number): number {
  return x > 1.0 ? x / 100.0 : x;
}

export interface ParametrosEntrada {
  ciclos: number;
  operaciones: number;
  tipos: TipoOperacion[];
  tiempos: number[][]; // tiempos[operacion][ciclo]
  FV: number; // (0.75 por ejemplo)
  supManual: number;
  supMQ: number;
}

export interface ResultadosOperacion {
  TME: number;
  TNE: number;
  TTOL: number;
  TSE: number;
}

export interface ResultadoFinal {
  porOperacion: ResultadosOperacion[];
  sumTSE_MQP: number;
  sumTSE_MQM: number;
  sumTSE_MQ: number;
  TScp: number;
  PS: number;
  PSD: number;
}

export function calcular(params: ParametrosEntrada): ResultadoFinal {
  const { ciclos, operaciones, tipos, tiempos, FV, supManual, supMQ } = params;

  const TME = Array(operaciones).fill(0);
  const TNE = Array(operaciones).fill(0);
  const TTOL = Array(operaciones).fill(0);
  const TSE = Array(operaciones).fill(0);

  for (let o = 0; o < operaciones; o++) {
    let suma = 0;
    for (let c = 0; c < ciclos; c++) {
      const t = typeof tiempos[o]?.[c] === "number" ? tiempos[o][c] : 0;
      suma += t;
    }

    TME[o] = suma / ciclos;

    if (tipos[o] === "MQP" || tipos[o] === "MQM") {
      TNE[o] = TME[o] * FV;
    } else {
      TNE[o] = TME[o];
    }

    if (tipos[o] === "MQ") {
      TTOL[o] = TNE[o] * supMQ;
    } else {
      TTOL[o] = TNE[o] * supManual;
    }

    TSE[o] = TNE[o] + TTOL[o];
  }

  let sumTSE_MQP = 0,
    sumTSE_MQM = 0,
    sumTSE_MQ = 0;

  let sumTope_MQP = 0,
    sumTope_MQM = 0,
    sumTope_MQ = 0;

  for (let o = 0; o < operaciones; o++) {
    if (tipos[o] === "MQP") {
      sumTSE_MQP += TSE[o];
      sumTope_MQP += TME[o];
    } else if (tipos[o] === "MQM") {
      sumTSE_MQM += TSE[o];
      sumTope_MQM += TME[o];
    } else {
      sumTSE_MQ += TSE[o];
      sumTope_MQ += TME[o];
    }
  }

  let TScp = 0;

  if (sumTSE_MQ >= sumTSE_MQM) TScp = sumTSE_MQP + sumTSE_MQ;
  else TScp = sumTSE_MQP + sumTSE_MQM;

  const PS = 1 / TScp;
  const PSD = PS * 480;

  return {
    porOperacion: TSE.map((_, i) => ({
      TME: TME[i],
      TNE: TNE[i],
      TTOL: TTOL[i],
      TSE: TSE[i],
    })),
    sumTSE_MQP,
    sumTSE_MQM,
    sumTSE_MQ,
    TScp,
    PS,
    PSD,
  };
}

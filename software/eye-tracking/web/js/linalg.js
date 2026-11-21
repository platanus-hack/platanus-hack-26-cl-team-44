/**
 * Álgebra lineal mínima para calibración (sin dependencias).
 * Todo es puro: nunca muta las entradas.
 */

/**
 * Resuelve A·x = b por eliminación gaussiana con pivoteo parcial.
 * @param {number[][]} A matriz n×n
 * @param {number[]} b vector n
 * @returns {number[]} x
 */
export function solveLinear(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) throw new Error("Sistema singular: datos de calibración insuficientes");
    [M[col], M[pivot]] = [M[pivot], M[col]];
    for (let r = col + 1; r < n; r++) {
      const f = M[r][col] / M[col][col];
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let c = r + 1; c < n; c++) s -= M[r][c] * x[c];
    x[r] = s / M[r][r];
  }
  return x;
}

/**
 * Regresión ridge con estandarización de columnas e intercepto sin penalizar.
 * @param {number[][]} rows filas de features (sin columna de 1s)
 * @param {number[]} ys objetivos
 * @param {number} lambda penalización (sobre features estandarizadas)
 * @param {number[]} [weights] peso por muestra (opcional; se normaliza a media 1)
 * @returns {{mean:number[], std:number[], w:number[]}} modelo inmutable
 */
export function ridgeFit(rows, ys, lambda, weights) {
  if (rows.length === 0 || rows.length !== ys.length) throw new Error("ridgeFit: datos vacíos o desalineados");
  if (weights && weights.length !== rows.length) throw new Error("ridgeFit: pesos desalineados");
  const k = rows[0].length;
  const n = rows.length;
  let total = 0;
  if (weights) for (const v of weights) total += v;
  const scale = weights && total > 0 ? n / total : 1;
  const wt = (i) => (weights ? weights[i] * scale : 1);

  const mean = new Array(k).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) mean[j] += (wt(i) * rows[i][j]) / n;
  const std = new Array(k).fill(0);
  for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) std[j] += (wt(i) * (rows[i][j] - mean[j]) ** 2) / n;
  for (let j = 0; j < k; j++) {
    const s = Math.sqrt(std[j]);
    // columna (casi) constante → no escalar, para no amplificar ruido de redondeo
    std[j] = s > 1e-9 * (1 + Math.abs(mean[j])) ? s : 1;
  }

  const p = k + 1; // + intercepto
  const XtX = Array.from({ length: p }, () => new Array(p).fill(0));
  const Xty = new Array(p).fill(0);
  const z = new Array(p);
  for (let i = 0; i < n; i++) {
    const w = wt(i);
    z[0] = 1;
    for (let j = 0; j < k; j++) z[j + 1] = (rows[i][j] - mean[j]) / std[j];
    for (let a = 0; a < p; a++) {
      Xty[a] += w * z[a] * ys[i];
      for (let b = a; b < p; b++) XtX[a][b] += w * z[a] * z[b];
    }
  }
  for (let a = 0; a < p; a++) for (let b = 0; b < a; b++) XtX[a][b] = XtX[b][a];
  for (let a = 1; a < p; a++) XtX[a][a] += lambda * n;
  return Object.freeze({ mean, std, w: solveLinear(XtX, Xty) });
}

/**
 * @param {{mean:number[], std:number[], w:number[]}} m
 * @param {number[]} row
 */
export function ridgePredict(m, row) {
  let y = m.w[0];
  for (let j = 0; j < row.length; j++) y += m.w[j + 1] * ((row[j] - m.mean[j]) / m.std[j]);
  return y;
}

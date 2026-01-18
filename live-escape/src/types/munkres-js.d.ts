declare module 'munkres-js' {
  interface MunkresStatic {
    (costMatrix: number[][]): [number, number][];
    version: string;
    format_matrix: (matrix: number[][]) => string;
    make_cost_matrix: (profitMatrix: number[][], costFunction?: (value: number) => number) => number[][];
    Munkres: new() => {
      compute(costMatrix: number[][]): [number, number][];
    };
  }

  const munkres: MunkresStatic;
  export = munkres;
}

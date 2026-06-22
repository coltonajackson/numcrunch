# NumCrunch

**Simple But Yet Complex Calculator** — an Apple Calculator-inspired dark-theme web app designed for programmers and scientists.

## Features

### Three Modes

| Mode | Description |
|---|---|
| **Basic** | Standard four-function calculator with `%` and `±` |
| **Scientific** | Full scientific calculator with 2nd-function mode, degree/radian toggle, memory (MC/M+/M−/MR), trigonometry, hyperbolic functions, logarithms, exponentials, powers, roots, and random |
| **Programmer** | Hex/Dec/Oct/Bin multi-base display, interactive bit viewer, 8/16/32/64-bit width selector, bitwise (AND/OR/XOR/NOT/NAND/NOR) and shift (LSH/RSH) operations, two's-complement negation, and modulo |

### Scientific Functions

`sin cos tan` · `sin⁻¹ cos⁻¹ tan⁻¹` (2nd mode) · `sinh cosh tanh` · `sinh⁻¹ cosh⁻¹ tanh⁻¹` (2nd)  
`x² x³ xʸ` · `√x ∛x` · `eˣ 10ˣ 2ˣ` · `ln log₁₀ log₂` · `x! 1/x` · `π e` · `EE` · `Rand`  
Memory: `mc m+ m− mr` · Angle: `DEG / RAD` toggle

### Programmer Features

- **Multi-base display** — see the same value simultaneously in HEX, DEC, OCT, and BIN
- **Interactive bit viewer** — click any individual bit to toggle it; supports 8 / 16 / 32 / 64-bit widths
- **Bitwise ops** — AND, OR, XOR, NOT, NAND, NOR
- **Shift ops** — LSH (`<<`), RSH (`>>`)
- **Utilities** — two's-complement negate, double-zero (`00`), modulo

### UX

- Apple Calculator-inspired dark theme (pure-black background, orange operators)
- Adaptive display text size — shrinks as numbers get longer
- Orange operator highlight stays active while waiting for second operand
- Full keyboard support: digits, `+ - * /`, `Enter`/`=`, `Esc` (clear), `Backspace`
- Smooth press animations on every button

## Stack

| Tool | Purpose |
|---|---|
| [Vite 6](https://vitejs.dev) | Build tool & dev server |
| [React 19](https://react.dev) | UI framework |
| [TypeScript 5](https://typescriptlang.org) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-class styling |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

```bash
npm run build   # production build → dist/
npm run preview # preview the production build
```

import { Calculator } from "@/components/calculator";

export default function Home() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Numcrunch</p>
        <h1>Simple inputs, serious calculations.</h1>
        <p className="hero-copy">
          Crunch quick arithmetic, layered expressions, powers, percentages, constants, and square roots from one
          focused interface.
        </p>
      </section>

      <Calculator />
    </main>
  );
}

import { SavingsGoals } from "@/components/SavingsGoals";

export default function Savings() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Épargne & Tontine Digitale</h1>
        <p className="text-muted-foreground text-lg">
          Créez des cagnottes pour vos projets et épargnez régulièrement
        </p>
      </div>

      <SavingsGoals />
    </div>
  );
}

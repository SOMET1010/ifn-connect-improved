import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Delete, X } from 'lucide-react';

interface NumericKeypadProps {
  onNumberClick: (num: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  displayValue: string;
}

export default function NumericKeypad({
  onNumberClick,
  onClear,
  onBackspace,
  displayValue,
}: NumericKeypadProps) {
  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];

  return (
    <Card className="p-6">
      <div className="mb-4 bg-gray-100 rounded-lg p-4 text-right">
        <p className="text-3xl font-bold min-h-[3rem] flex items-center justify-end">
          {displayValue || '0'}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {numbers.map((num) => (
          <Button
            key={num}
            onClick={() => onNumberClick(num)}
            className="h-16 text-2xl font-bold"
            variant="outline"
          >
            {num}
          </Button>
        ))}

        <Button
          onClick={onBackspace}
          className="h-16 bg-yellow-500 hover:bg-yellow-600 text-white"
          variant="default"
        >
          <Delete className="h-6 w-6" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <Button
          onClick={onClear}
          className="h-14 text-lg"
          variant="destructive"
        >
          <X className="h-5 w-5 mr-2" />
          Effacer
        </Button>
      </div>
    </Card>
  );
}

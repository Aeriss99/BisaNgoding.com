import { Construction } from 'lucide-react';

export default function Playground() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Construction className="w-16 h-16 text-gray-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Code Playground</h1>
      <p className="text-gray-500">Fitur ini sedang dalam pengembangan.</p>
    </div>
  );
}

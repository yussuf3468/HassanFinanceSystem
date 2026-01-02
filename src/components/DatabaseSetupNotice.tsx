export default function DatabaseSetupNotice({ message }: { message: string }) {
  return (
    <div className="mb-6 rounded-2xl border border-amber-300/70 shadow-amber-100/50 bg-amber-50 p-4 text-amber-800">
      <div className="font-semibold mb-1">Database setup required</div>
      <div className="text-sm">{message}</div>
    </div>
  );
}




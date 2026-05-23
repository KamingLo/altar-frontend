interface AuthAlertProps {
  message: string | null;
  type: 'error' | 'success';
}

export const AuthAlert = ({ message, type }: AuthAlertProps) => {
  if (!message) return null;
  
  const styles = type === 'error' 
    ? 'bg-red-500/10 border-red-500/20 text-red-400' 
    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';

  return (
    <div className={`mb-6 p-4 border rounded-2xl text-sm font-bold text-center animate-in fade-in slide-in-from-top-2 ${styles}`}>
      {message}
    </div>
  );
};

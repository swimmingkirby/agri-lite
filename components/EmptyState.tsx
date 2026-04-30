type Props = {
  title: string;
  message?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ title, message, action }: Props) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      {message && (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

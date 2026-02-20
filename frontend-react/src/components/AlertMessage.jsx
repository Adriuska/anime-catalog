export default function AlertMessage({ message, type = 'info' }) {
  if (!message) return null;
  return <div className={`alert alert-${type}`} role="alert">{message}</div>;
}

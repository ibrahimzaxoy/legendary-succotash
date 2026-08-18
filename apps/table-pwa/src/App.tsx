import { Routes, Route } from 'react-router-dom';
import { TableEntry } from './pages/TableEntry';
import { ErrorScreen } from './components/ErrorScreen';

export function App() {
  return (
    <Routes>
      <Route path="/t/:tableId" element={<TableEntry />} />
      {/* Installed PWA icon launches here with no route params - TableEntry
          falls back to the last table scanned via localStorage. */}
      <Route path="/" element={<TableEntry />} />
      <Route path="*" element={<ErrorScreen message="Scan the QR code on your table to start ordering." />} />
    </Routes>
  );
}

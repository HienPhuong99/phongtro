import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { PublicInvoicePage } from './components/PublicInvoicePage.tsx';

// Link hóa đơn gửi người thuê qua Zalo: ?hd=<mã ngẫu nhiên>
const invoiceToken = new URLSearchParams(window.location.search).get('hd');
// Người thuê không có nút ngày/đêm: theo cài đặt của máy
if (invoiceToken && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.documentElement.classList.add('dark');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>{invoiceToken ? <PublicInvoicePage token={invoiceToken} /> : <App />}</StrictMode>
);

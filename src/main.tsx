import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { PublicInvoicePage } from './components/PublicInvoicePage.tsx';

// Link hóa đơn gửi người thuê qua Zalo: ?hd=<mã ngẫu nhiên>
const invoiceToken = new URLSearchParams(window.location.search).get('hd');

createRoot(document.getElementById('root')!).render(
  <StrictMode>{invoiceToken ? <PublicInvoicePage token={invoiceToken} /> : <App />}</StrictMode>
);

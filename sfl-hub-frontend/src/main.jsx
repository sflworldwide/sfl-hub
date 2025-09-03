import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { RegisterProvider } from "./views/RegisterContext";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();
const theme = createTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
    <RegisterProvider>
    <ThemeProvider theme={theme}>
    <App />
    </ThemeProvider>
    </RegisterProvider>
  </QueryClientProvider>
  </StrictMode>,
)

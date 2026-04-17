import { Outlet } from 'react-router';
import SupportChatWidget from './components/support-chat/SupportChatWidget';

function App() {
  return (
    <>
      <Outlet />
      <SupportChatWidget />
    </>
  );
}

export default App;

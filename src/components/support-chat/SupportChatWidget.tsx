import { useSupportChat } from '@/features/support-chat/hooks/useSupportChat';
import SupportChatLauncherButton from './SupportChatLauncherButton';
import SupportChatPanel from './SupportChatPanel';

function SupportChatWidget() {
  const { panelProps, launcherProps } = useSupportChat();

  return (
    <>
      <SupportChatPanel {...panelProps} />
      <SupportChatLauncherButton {...launcherProps} />
    </>
  );
}

export default SupportChatWidget;

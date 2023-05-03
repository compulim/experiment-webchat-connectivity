// import { DirectLineStreaming } from 'botframework-directlinejs';
import { DirectLineStreaming } from '../external/botframework-directlinejs/src/directLineStreaming';
import { useCallback, useEffect, useMemo, useState } from 'react';
import ReactWebChat, { createStore } from 'botframework-webchat';

// @ts-expect-error 7016
import ScrollToBottom from 'react-scroll-to-bottom';

const TOKEN_URL = 'https://webchat-mockbot3.azurewebsites.net/api/token/directlinease';

const Chat = () => {
  const [log, setLog] = useState<string[]>([]);
  const [token, setToken] = useState<string>();
  const directLine = useMemo(
    () =>
      token &&
      new DirectLineStreaming({
        domain: 'https://webchat-mockbot3.azurewebsites.net/.bot/v3/directline',
        token
      }),
    [token]
  );

  const appendLog = useCallback<(message: string) => void>(message => setLog(log => [...log, message]), [setLog]);

  // const handleReconnectClick = useCallback<() => void>(() => {
  //   if (directLine && token) {
  //     // @ts-ignore
  //     const { conversationId } = directLine;

  //     console.log('UI: Reconnect clicked', { conversationId });

  //     directLine.reconnect({ conversationId, token });
  //   }
  // }, [directLine, token]);

  const store = useMemo(() => {
    return createStore({}, () => (next: any) => (action: any) => {
      appendLog(`ACT: ${action.type}`);

      return next(action);
    });
  }, [appendLog, directLine]);

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    (async function () {
      const res = await fetch(TOKEN_URL, {
        method: 'POST',
        signal
      });

      if (!res.ok) {
        return console.log('Cannot fetch token');
      }

      const { token } = await res.json();

      signal.aborted || setToken(token);
    })();
  }, [setToken]);

  useEffect(() => {
    if (directLine) {
      const subscription = directLine.connectionStatus$.subscribe(value => appendLog(`CS$: ${value}`));

      return () => subscription.unsubscribe();
    }
  }, [appendLog, directLine]);

  return (
    <main>
      <div className="log">
        {/* <button onClick={handleReconnectClick} type="button">
          Reconnect
        </button> */}
        <ScrollToBottom className="log log__log-scroll">
          {log.map((message, index) => (
            <div key={index}>
              <code>{message}</code>
            </div>
          ))}
        </ScrollToBottom>
      </div>
      {directLine && <ReactWebChat className="webchat" directLine={directLine} store={store} />}
    </main>
  );
};

export default Chat;

import '../styles/globals.css';
import { useState, useEffect } from 'react';
import { Web3Provider } from '../blockchain/web3Context';

function MyApp({ Component, pageProps }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <Web3Provider>
      {isClient ? <Component {...pageProps} /> : null}
    </Web3Provider>
  );
}

export default MyApp; 
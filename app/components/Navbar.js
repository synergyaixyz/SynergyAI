import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWeb3 } from '../blockchain/web3Context';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { account, connectWallet } = useWeb3();

  // Check if we've scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Navigation links
  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Compute', href: '/compute' },
    { name: 'Data', href: '/data' },
    { name: 'Tokens', href: '/tokens' },
    { name: 'About', href: '/about' },
  ];

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white shadow-md' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/">
                <span className="text-xl font-bold text-indigo-600 cursor-pointer">SynergyAI</span>
              </Link>
            </div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navLinks.map((link) => (
                  <Link key={link.name} href={link.href}>
                    <span className={`px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                      router.pathname === link.href
                        ? 'text-indigo-600 bg-indigo-50'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}>
                      {link.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              {account ? (
                <div className="flex items-center">
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md mr-2">
                    {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                  </span>
                  <Link href="/dashboard">
                    <span className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium cursor-pointer">
                      Dashboard
                    </span>
                  </Link>
                </div>
              ) : (
                <button
                  onClick={connectWallet}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Connect Wallet
                </button>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on state */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
          {navLinks.map((link) => (
            <Link key={link.name} href={link.href}>
              <span className={`block px-3 py-2 rounded-md text-base font-medium cursor-pointer ${
                router.pathname === link.href
                  ? 'text-indigo-600 bg-indigo-50'
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}>
                {link.name}
              </span>
            </Link>
          ))}
          <div className="pt-4 pb-3 border-t border-gray-200">
            {account ? (
              <div className="flex flex-col space-y-2">
                <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md inline-block w-fit">
                  {`${account.substring(0, 6)}...${account.substring(account.length - 4)}`}
                </span>
                <Link href="/dashboard">
                  <span className="bg-indigo-600 text-white px-3 py-2 rounded-md text-base font-medium block w-full text-center cursor-pointer">
                    Dashboard
                  </span>
                </Link>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="w-full bg-indigo-600 text-white px-3 py-2 rounded-md text-base font-medium"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

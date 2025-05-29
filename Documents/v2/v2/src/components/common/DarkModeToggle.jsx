
const DarkModeToggle = ({ darkMode, setDarkMode }) => {
  return (
    <button
      type="button"
      onClick={() => setDarkMode(!darkMode)}
      className={`p-2 rounded-lg transition-colors ${
        darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-200'
      }`}
      aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
    >
      {darkMode ? ( /* Sun icon */ <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm0 15a1 1 0 01-1-1v-1a1 1 0 112 0v1a1 1 0 01-1 1zm6.646-11.646a1 1 0 01.708 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM2.95 15.05a1 1 0 010 1.414l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 10a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1zM2 10a1 1 0 01-1 1H1a1 1 0 110-2h1a1 1 0 011 1zm12.293-6.293a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM4.95 3.657a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 7a3 3 0 100 6 3 3 0 000-6z"></path></svg>
      ) : ( /* Moon icon */ <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>
      )}
    </button>
  );
};

export default DarkModeToggle;

// Or manage darkMode via a separate ThemeContext or local state if preferred
// For this example, let's assume darkMode might be a prop passed down or from a theme context

const Section = ({ title, children, className = '', darkMode }) => {
  // If darkMode is not passed as prop, you might get it from a context
  // const { siteSettings } = useSomeThemeContext();
  // const darkMode = siteSettings.darkMode;

  return (
    <div className={`shadow-md rounded-lg p-6 space-y-4 transition-colors ${
      darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
    } ${className}`}>
      {title && <h2 className={`text-xl font-semibold border-b pb-2 mb-4 ${
        darkMode ? 'text-gray-200 border-gray-700' : 'text-gray-700 border-gray-200'
      }`}>{title}</h2>}
      {children}
    </div>
  );
};

export default Section;
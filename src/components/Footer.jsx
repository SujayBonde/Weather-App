const Footer = () => {
  return (
    <footer className="text-center py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-md shadow-lg w-screen">
      <p className="text-sm sm:text-base">
        © {new Date().getFullYear()} Weather App | Made with <span className="text-red-500">♥</span> by <span className="font-semibold">Sujay</span>
      </p>
    </footer>
  );
};

export default Footer;
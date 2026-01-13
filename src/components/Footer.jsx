const Footer = () => {
    return (
      <footer className="w-full text-center mt-8 text-white/50 text-sm">
        <p>
          © {new Date().getFullYear()} Weather App | Designed with <span className="text-red-400">♥</span> by <span className="font-semibold text-white/80">Sujay</span>
        </p>
      </footer>
    );
  };
  
  export default Footer;
export default function Footer({ companyName, year }) {
  return (
    <footer className="mt-6 rounded-[28px] border border-amber-200/60 bg-white/80 p-4 text-center text-sm text-slate-600 shadow-[0_18px_50px_rgba(120,53,15,0.08)] backdrop-blur">
      {year} {companyName}. React SPA + Express REST API for your Web project.
    </footer>
  );
}

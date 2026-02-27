import GuideNav from '../../components/GuideNav';

export default function GuidesLayout({ children }) {
  return (
    <div className="content-page">
      <nav><a href="/">← Back to Decant</a></nav>
      <GuideNav />
      {children}
    </div>
  );
}

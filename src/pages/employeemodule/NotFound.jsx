import { Link } from "react-router-dom";
import MainLayout from "./MainLayout";

export default function NotFound() {
  return (
    <MainLayout>
      <div className="page">
        <section className="page-hero">
          <div>
            <h2>Page Not Found</h2>
            <p>The page you are looking for is not available.</p>
          </div>
          <Link className="btn hero-btn" to="/employee/dashboard">
            Go to Dashboard
          </Link>
        </section>
      </div>
    </MainLayout>
  );
}

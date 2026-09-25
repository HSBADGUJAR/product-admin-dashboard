import ProtectedRoute from "@/components/ProtectedRoute";

export default function ProductsLayout({ children }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}
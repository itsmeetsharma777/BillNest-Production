import { BrowserRouter, Routes } from "react-router-dom";

import { ProtectedRoutes } from "./protected-routes";
import { PublicRoutes } from "./public-routes";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {PublicRoutes()}
        {ProtectedRoutes()}
      </Routes>
    </BrowserRouter>
  );
}
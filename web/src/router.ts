import { createBrowserRouter } from "react-router-dom";
import Home from "@/pages/Home";
import Game from "@/pages/Game";
import Settings from "@/pages/Settings";

import { createElement } from "react";

export const router = createBrowserRouter([
  {
    path: "/",
    element: createElement(Home),
  },
  {
    path: "/play",
    element: createElement(Game),
  },
  {
    path: "/settings",
    element: createElement(Settings),
  },
]);
